import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from '../context.ts';
import { batch, manufacturer } from '../db/schema.ts';
import { clearCoverageCache, lookup, parseCheckInput } from './lookup.ts';
import { loadResult, runBatchChoice, runCheck, type Requester } from './check.ts';
import { resetDb } from '../../../tests/helpers/db.ts';
import {
	makeBatch,
	makeCustodyEvent,
	makeLivePack,
	makeManufacturer,
	makePack,
	makeParty,
	makeProduct
} from '../../../tests/helpers/fixtures.ts';

const options = { packagingEnabled: false };

async function check(raw: string) {
	const input = parseCheckInput(raw);
	if (!input.ok) throw new Error(`format problem: ${input.problem}`);
	return lookup(input, options);
}

const requester: Requester = {
	deviceId: 'device-1',
	ip: '10.0.0.1',
	state: 'Lagos',
	packagingEnabled: false
};

describe('serial lookup (F-01)', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
	});

	it('returns Valid with product, manufacturer, batch and expiry', async () => {
		await makeLivePack('7K4M9QX2TB8D');
		const r = await check('7K4M9QX2TB8D');
		expect(r.code).toBe('VALID');
		expect(r.flags).toEqual([]);
		expect(r.manufacturer?.name).toBe('Northbridge Pharma Ltd');
		expect(r.product).toMatchObject({ brandName: 'Curavyn', strength: '500 mg' });
		expect(r.batch).toMatchObject({ lot: 'NB-2611', expiryDate: '2028-04-30' });
		expect(r.serialDisplay).toBe('…TB8D');
	});

	it('ignores spaces, dashes and case in typed serials', async () => {
		await makeLivePack('7K4M9QX2TB8D');
		expect((await check(' 7k4m-9qx2 tb8d ')).code).toBe('VALID');
	});

	it('returns Unrecognised with coverage counts when nothing matches', async () => {
		await makeLivePack('7K4M9QX2TB8D');
		const r = await check('ZZZZ9999ZZZZ');
		expect(r.code).toBe('UNRECOGNISED');
		expect(r.reason).toBe('not_found');
		expect(r.coverage).toEqual({ manufacturers: 1, products: 1 });
		expect(r.product).toBeUndefined();
	});

	it('flags an expired batch but keeps it Valid', async () => {
		await makeLivePack('EXPIRED00001', { expiryDate: '2025-04-30' });
		const r = await check('EXPIRED00001');
		expect(r.code).toBe('VALID');
		expect(r.flags).toContain('EXPIRED');
	});

	it('returns Recalled for a recalled batch, overriding Valid', async () => {
		const { batch: b } = await makeLivePack('RECALL000001');
		await ctx()
			.db.update(batch)
			.set({ status: 'recalled', statusReason: 'Failed quality test', statusSource: 'NAFDAC' })
			.where(eq(batch.id, b.id));
		const r = await check('RECALL000001');
		expect(r.code).toBe('RECALLED');
		expect(r.batch?.statusSource).toBe('NAFDAC');
		expect(r.journeyAvailable).toBe(false);
	});

	it("returns Can't confirm for a suspended manufacturer, without product details", async () => {
		const { manufacturer: m } = await makeLivePack('SUSPEND00001');
		await ctx()
			.db.update(manufacturer)
			.set({ status: 'suspended', statusBeforeSuspension: 'live' })
			.where(eq(manufacturer.id, m.id));
		const r = await check('SUSPEND00001');
		expect(r.code).toBe('CANT_CONFIRM');
		expect(r.reason).toBe('manufacturer_suspended');
		expect(r.product).toBeUndefined();
	});

	it('keeps a manufacturer suspended before it went live invisible', async () => {
		const m = await makeManufacturer({ status: 'suspended' });
		await ctx()
			.db.update(manufacturer)
			.set({ statusBeforeSuspension: 'in_review' })
			.where(eq(manufacturer.id, m.id));
		const p = await makeProduct(m.id);
		const b = await makeBatch(p.id);
		await makePack({ productId: p.id, gtin: p.gtin, batchId: b.id, serial: 'NEVERLIVE001' });
		expect((await check('NEVERLIVE001')).code).toBe('UNRECOGNISED');
	});

	it('ignores records from manufacturers that are not live yet', async () => {
		const m = await makeManufacturer({ status: 'approved' });
		const p = await makeProduct(m.id);
		const b = await makeBatch(p.id);
		await makePack({ productId: p.id, gtin: p.gtin, batchId: b.id, serial: 'NOTLIVE00001' });
		expect((await check('NOTLIVE00001')).code).toBe('UNRECOGNISED');
	});

	it('asks for the batch when a typed serial matches two products, then resolves it', async () => {
		const m = await makeManufacturer();
		const p1 = await makeProduct(m.id);
		const p2 = await makeProduct(m.id, { brandName: 'Malarex-AL' });
		const b1 = await makeBatch(p1.id, { lot: 'AAA-1' });
		const b2 = await makeBatch(p2.id, { lot: 'BBB-2' });
		await makePack({ productId: p1.id, gtin: p1.gtin, batchId: b1.id, serial: 'SHARED000001' });
		await makePack({ productId: p2.id, gtin: p2.gtin, batchId: b2.id, serial: 'SHARED000001' });

		const first = await runCheck('SHARED000001', requester);
		expect(first.ok && first.result.code).toBe('NEEDS_BATCH');
		if (!first.ok) return;
		// A batch that matches neither product asks again instead of warning about a known serial.
		const typo = await runBatchChoice(first.id, 'CCC-3', requester);
		expect(typo).toEqual({ ok: false, kind: 'batch_not_matched' });
		const second = await runBatchChoice(first.id, 'bbb 2', requester);
		expect(second?.ok && second.result.code).toBe('VALID');
		expect(second?.ok && second.result.product?.brandName).toBe('Malarex-AL');
	});

	it('shows only the end of the serial', async () => {
		await makeLivePack('ABCD1234EFGH');
		expect((await check('ABCD1234EFGH')).serialDisplay).toBe('…EFGH');
	});

	it('reports whether a journey is available', async () => {
		const { manufacturer: m, batch: b, pack: k } = await makeLivePack('JOURNEY00001');
		expect((await check('JOURNEY00001')).journeyAvailable).toBe(false);
		const distributor = await makeParty();
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: distributor.id,
			eventDate: '2026-03-28'
		});
		expect((await check('JOURNEY00001')).journeyAvailable).toBe(true);
	});
});

describe('scanned GS1 codes', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
	});

	it('looks up GTIN + serial and flags a printed lot that differs from the record', async () => {
		const { product: p } = await makeLivePack('7K4M9QX2TB8D');
		const ok = await check(`(01)${p.gtin}(17)280430(10)NB-2611(21)7K4M9QX2TB8D`);
		expect(ok.code).toBe('VALID');
		expect(ok.flags).toEqual([]);
		const mismatch = await check(`(01)${p.gtin}(17)280430(10)XX-9999(21)7K4M9QX2TB8D`);
		expect(mismatch.flags).toContain('LOT_MISMATCH');
	});

	it('says the product is not covered when the GTIN is unknown', async () => {
		await makeLivePack();
		const r = await check('(01)09506000134352(21)7K4M9QX2TB8D');
		expect(r.code).toBe('NOT_COVERED');
	});

	it('uses the stronger reason when the product is covered but the serial is not', async () => {
		const { product: p } = await makeLivePack();
		const r = await check(`(01)${p.gtin}(21)UNKNOWN00001`);
		expect(r.code).toBe('UNRECOGNISED');
		expect(r.reason).toBe('not_found_for_covered_product');
	});
});

describe('runCheck', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
	});

	it('returns format problems without a lookup', async () => {
		expect(await runCheck('ab', requester)).toEqual({
			ok: false,
			kind: 'format',
			problem: 'too_short'
		});
		expect(await runCheck('A4-1234', requester)).toEqual({
			ok: false,
			kind: 'format',
			problem: 'nafdac_number'
		});
	});

	it('stores the result under an opaque id that does not contain the serial', async () => {
		await makeLivePack('7K4M9QX2TB8D');
		const outcome = await runCheck('7K4M9QX2TB8D', requester);
		expect(outcome.ok).toBe(true);
		if (!outcome.ok) return;
		expect(outcome.id).not.toContain('7K4M');
		expect((await loadResult(outcome.id))?.code).toBe('VALID');
		expect(JSON.stringify(await loadResult(outcome.id))).not.toContain('7K4M9QX2TB8D');
	});

	it('rate-limits a device after the per-minute limit', async () => {
		const limit = ctx().config.rateLimits.devicePerMinute;
		const r: Requester = { ...requester, deviceId: 'busy-device' };
		for (let i = 0; i < limit; i++) expect((await runCheck(`SERIAL${1000 + i}`, r)).ok).toBe(true);
		const blocked = await runCheck('SERIAL9999', r);
		expect(blocked.ok).toBe(false);
		expect(!blocked.ok && blocked.kind).toBe('rate_limited');
	});
});
