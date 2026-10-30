/**
 * Regression tests for the problems found in the October 2026 audit: each test names the
 * behaviour that was wrong and checks the fixed one.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import './job-definitions.ts';
import { ctx } from './context.ts';
import {
	batch,
	custodyEvent,
	document,
	importJob,
	manufacturer,
	product,
	recallAlert,
	user
} from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import { SYSTEM_ACTOR } from './audit.ts';
import { CatalogueError, setBatchStatus } from './catalogue.ts';
import { confirmAlert, subscribeToRecalls } from './alerts.ts';
import { ApiKeyError, createApiKey } from './api-keys.ts';
import { createEndpoint, WebhookError } from './webhooks.ts';
import { voidCustodyRecord } from './corrections.ts';
import { loadJob, markCommitting, readProblemRows, runImport } from './imports/engine.ts';
import { getObject } from './storage.ts';
import { buildJourney } from './journey/build.ts';
import { goLiveChecklist } from './manufacturers/summary.ts';
import { sharedSerialCount, spotCheck, submitForReview } from './manufacturers/golive.ts';
import { cancelStaffInvite, getStaffInvite, inviteStaff, listStaff } from './team.ts';
import { apiCheck } from './verify/check.ts';
import { clearCoverageCache, lookup, parseCheckInput } from './verify/lookup.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import {
	makeBatch,
	makeCustodyEvent,
	makeLivePack,
	makeManufacturer,
	makePack,
	makeParty,
	makeProduct,
	nextGtin
} from '../../tests/helpers/fixtures.ts';
import { importFile, withAgreement } from '../../tests/helpers/imports.ts';

async function check(raw: string) {
	const input = parseCheckInput(raw);
	if (!input.ok) throw new Error(`format problem: ${input.problem}`);
	return lookup(input, { packagingEnabled: false });
}

async function journeyOf(raw: string) {
	return buildJourney(await check(raw));
}

beforeEach(async () => {
	await resetDb();
	clearCoverageCache();
	sentEmails.length = 0;
});

describe('checking a serial', () => {
	it('finds the pack when the "SN" label on the pack is typed too', async () => {
		const live = await makeLivePack('7K4M9QX2TB8D');
		for (const typed of ['SN 7K4M9QX2TB8D', 'S/N: 7K4M-9QX2-TB8D', 'Serial No. 7K4M9QX2TB8D'])
			expect(await check(typed)).toMatchObject({ code: 'VALID', serialDisplay: '…TB8D' });
		// A serial that really starts with SN is still matched as typed.
		await makePack({
			productId: live.product.id,
			gtin: live.product.gtin,
			batchId: live.batch.id,
			serial: 'SN12345678'
		});
		expect(await check('SN12345678')).toMatchObject({ code: 'VALID', serialDisplay: '…5678' });
	});

	it('reads a GS1 Digital Link (the web address form of the code)', async () => {
		const live = await makeLivePack('7K4M9QX2TB8D');
		const link = `https://id.example.com/01/${live.product.gtin}/10/NB-2611/21/7K4M9QX2TB8D?17=280430`;
		expect(await check(link)).toMatchObject({ code: 'VALID', input: 'scanned', flags: [] });
	});

	it('answers the API batch question in one request, and refuses a batch that matches nothing', async () => {
		const live = await makeLivePack('SHARED000001');
		const other = await makeProduct(live.manufacturer.id, { brandName: 'Malarex' });
		const otherBatch = await makeBatch(other.id, { lot: 'ML-1111' });
		await makePack({
			productId: other.id,
			gtin: other.gtin,
			batchId: otherBatch.id,
			serial: 'SHARED000001'
		});
		const asked = await apiCheck('SHARED000001');
		expect(asked.ok && asked.result.code).toBe('NEEDS_BATCH');
		const answered = await apiCheck('SHARED000001', { lot: 'ml-1111' });
		expect(answered.ok && answered.result).toMatchObject({
			code: 'VALID',
			product: { brandName: 'Malarex' }
		});
		expect(await apiCheck('SHARED000001', { lot: 'NOPE-1' })).toEqual({
			ok: false,
			problem: 'batch_not_matched'
		});
	});

	it("doesn't offer a journey when the only supply chain record was cancelled", async () => {
		const live = await makeLivePack('7K4M9QX2TB8D');
		const distributor = await makeParty();
		const shipped = await makeCustodyEvent({
			manufacturerId: live.manufacturer.id,
			level: 'pack',
			packId: live.pack.id,
			batchId: live.batch.id,
			toPartyId: distributor.id,
			eventDate: '2026-09-01'
		});
		expect((await check('7K4M9QX2TB8D')).journeyAvailable).toBe(true);
		await voidCustodyRecord(SYSTEM_ACTOR, live.batch.id, shipped.id, 'Entered in error');
		expect((await check('7K4M9QX2TB8D')).journeyAvailable).toBe(false);
	});
});

describe('journeys', () => {
	it('shows one confirmed step when the shipment is imported after the pharmacy confirmed it', async () => {
		const live = await makeLivePack('7K4M9QX2TB8D');
		const pharmacy = await makeParty({
			name: 'Riverside Pharmacy',
			role: 'pharmacy',
			verifiedAt: new Date()
		});
		// The pharmacy confirms first; the manufacturer's shipment record arrives later, same day.
		await ctx().db.insert(custodyEvent).values({
			manufacturerId: live.manufacturer.id,
			level: 'pack',
			packId: live.pack.id,
			batchId: live.batch.id,
			toPartyId: pharmacy.id,
			eventType: 'received',
			eventDate: '2026-10-01',
			source: 'business_receipt'
		});
		await makeCustodyEvent({
			manufacturerId: live.manufacturer.id,
			level: 'pack',
			packId: live.pack.id,
			batchId: live.batch.id,
			toPartyId: pharmacy.id,
			eventDate: '2026-10-01'
		});
		const j = await journeyOf('7K4M9QX2TB8D');
		expect(j.steps.map((s) => (s.kind === 'party' ? s.name : s.kind))).toEqual([
			'manufacturer',
			'Riverside Pharmacy'
		]);
		expect(j.steps[1]).toMatchObject({ confirmed: true });
	});

	it("treats a sender with the manufacturer's own name as the manufacturer", async () => {
		const live = await makeLivePack('7K4M9QX2TB8D');
		// The file named the manufacturer itself as the sender: DETECK recorded it as a business.
		const itself = await makeParty({ name: 'NORTHBRIDGE PHARMA', role: 'distributor' });
		const distributor = await makeParty();
		await makeCustodyEvent({
			manufacturerId: live.manufacturer.id,
			level: 'pack',
			packId: live.pack.id,
			batchId: live.batch.id,
			fromPartyId: itself.id,
			toPartyId: distributor.id,
			eventDate: '2026-09-01'
		});
		const j = await journeyOf('7K4M9QX2TB8D');
		expect(j.steps.map((s) => (s.kind === 'party' ? s.name : s.kind))).toEqual([
			'manufacturer',
			'Lakeside Medical Supply'
		]);
	});
});

describe('imports', () => {
	let manufacturerId: string;
	let gtin: string;
	const products = (g: string) => [
		['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
		[g, 'Curavyn', 'Paracetamol', '500 mg', 'Tablets', '20', 'A4-0000']
	];

	beforeEach(async () => {
		const m = await makeManufacturer({ status: 'approved' });
		manufacturerId = m.id;
		gtin = nextGtin();
		await withAgreement(m.id);
		await importFile(m.id, 'products', products(gtin));
	});

	it('refuses supply chain rows whose serial is in another batch, or shipped before the batch was made', async () => {
		await importFile(manufacturerId, 'batches_serials', [
			['GTIN', 'Batch number', 'Mfg date', 'Expiry date', 'Serial number'],
			[gtin, 'NB-2611', '2026-03-01', '2028-04-30', 'SERIALAAAA01'],
			[gtin, 'NB-2612', '2026-03-01', '2028-04-30', 'SERIALBBBB02']
		]);
		const header = [
			'GTIN',
			'Batch number',
			'Serial number',
			'Customer',
			'Customer type',
			'State',
			'Date shipped'
		];
		const done = await importFile(manufacturerId, 'distribution', [
			header,
			[
				gtin,
				'NB-2612',
				'SERIALAAAA01',
				'Lakeside Medical Supply',
				'Distributor',
				'Lagos',
				'2026-04-01'
			],
			[
				gtin,
				'NB-2612',
				'SERIALBBBB02',
				'Lakeside Medical Supply',
				'Distributor',
				'Lagos',
				'2026-01-15'
			],
			[
				gtin,
				'NB-2612',
				'SERIALBBBB02',
				'Lakeside Medical Supply',
				'Distributor',
				'Lagos',
				'2026-04-01'
			]
		]);
		expect(done.counts).toMatchObject({ problems: 2, ready: 1 });
		const reasons = (await readProblemRows(done)).map((p) => p.problem);
		expect(reasons[0]).toContain('recorded in a different batch');
		expect(reasons[1]).toContain('before batch NB-2612 was made');
	});

	it('keeps only one problem file per import (they can hold serials)', async () => {
		const rows = [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtin, 'NB-2611', '2028-04-30', 'GOODSERIAL01'],
			[gtin, 'NB-2611', '2028-04-30', 'HAS SPACE 02']
		];
		const checked = await importFile(manufacturerId, 'batches_serials', rows, false);
		const first = checked.problemsKey!;
		await getObject(first);
		await markCommitting(checked);
		await runImport(checked.id, 'commit', SYSTEM_ACTOR);
		const done = (await loadJob(checked.id))!;
		expect(done.problemsKey).not.toBe(first);
		await getObject(done.problemsKey!);
		await expect(getObject(first)).rejects.toThrow();
	});

	it('refuses a serial another manufacturer uses, without leaving its new batch behind', async () => {
		const other = await makeLivePack('00012345');
		expect(other.manufacturer.id).not.toBe(manufacturerId);
		const done = await importFile(manufacturerId, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtin, 'NB-0001', '2028-04-01', '00012345'],
			[gtin, 'NB-0002', '2028-05-01', '00012346'],
			[gtin, 'NB-0003', '2028-06-01', '12347']
		]);
		expect(done.counts).toMatchObject({
			serialsAdded: 2,
			problems: 1,
			batchesCreated: 2,
			shortNumericSerials: 1
		});
		expect(done.counts?.sharedSerials).toBeUndefined();
		const [reason] = (await readProblemRows(done)).map((p) => p.problem);
		expect(reason).toContain('Another manufacturer on DETECK already uses this serial');
		// NB-0001 had no other row, so it isn't left empty on DETECK.
		const lots = await ctx()
			.db.select({ lot: batch.lot })
			.from(batch)
			.innerJoin(product, eq(product.id, batch.productId))
			.where(eq(product.manufacturerId, manufacturerId));
		expect(lots.map((l) => l.lot)).not.toContain('NB-0001');
		expect(await sharedSerialCount(manufacturerId)).toBe(0);
		// Once this company is live too, the other company's pack still checks Valid.
		await ctx()
			.db.update(manufacturer)
			.set({ status: 'live' })
			.where(eq(manufacturer.id, manufacturerId));
		clearCoverageCache();
		expect((await check('00012345')).code).toBe('VALID');
	});
});

describe('go-live review', () => {
	let manufacturerId: string;
	let gtin: string;

	beforeEach(async () => {
		const m = await makeManufacturer({ status: 'approved' });
		manufacturerId = m.id;
		gtin = nextGtin();
		await withAgreement(m.id);
		await ctx().db.insert(document).values({
			manufacturerId: m.id,
			kind: 'nafdac_certificate',
			fileKey: 'x',
			fileName: 'certificate.pdf',
			contentType: 'application/pdf',
			sizeBytes: 1
		});
		await importFile(m.id, 'products', [
			['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
			[gtin, 'Curavyn', 'Paracetamol', '500 mg', 'Tablets', '20', 'A4-0000']
		]);
	});

	it('spot-checks only the rows the import accepted, and says when the file is gone', async () => {
		await importFile(manufacturerId, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtin, 'NB-2611', '2028-04-30', 'GOODSERIAL01'],
			[gtin, 'NB-2611', '2028-04-30', 'GOODSERIAL02'],
			[gtin, 'NB-2611', '2028-04-30', 'HAS SPACE 03'],
			[nextGtin(), 'NB-2611', '2028-04-30', 'OTHERDRUG004'],
			[gtin, 'NB-2611', '2028-04-30', 'GOODSERIAL05']
		]);
		expect(await spotCheck(manufacturerId)).toMatchObject({ sampled: 3, found: 3 });
		await ctx()
			.db.update(importJob)
			.set({ fileDeletedAt: new Date() })
			.where(eq(importJob.kind, 'batches_serials'));
		expect(await spotCheck(manufacturerId)).toMatchObject({ sampled: 0, fileDeleted: true });
	});

	it('blocks going live while an import is checked but not saved, and tells staff on submission', async () => {
		await importFile(manufacturerId, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtin, 'NB-2611', '2028-04-30', 'GOODSERIAL01']
		]);
		expect((await goLiveChecklist(manufacturerId)).blocking).toBe(false);
		const waiting = await importFile(
			manufacturerId,
			'batches_serials',
			[
				['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
				[gtin, 'NB-2611', '2028-04-30', 'GOODSERIAL02']
			],
			false
		);
		expect(waiting.status).toBe('ready');
		const blocked = await goLiveChecklist(manufacturerId);
		expect(blocked.blocking).toBe(true);
		expect(blocked.items.find((i) => i.key === 'imports')).toMatchObject({ state: 'bad' });
		await ctx()
			.db.update(importJob)
			.set({ status: 'cancelled' })
			.where(eq(importJob.id, waiting.id));

		await ctx().db.insert(user).values({
			id: 'staff-1',
			name: 'Akuabata',
			email: 'staff@deteck.example',
			platformRole: 'admin'
		});
		await submitForReview(SYSTEM_ACTOR, manufacturerId);
		expect(
			sentEmails.find(
				(e) => e.to === 'staff@deteck.example' && e.subject.includes('go-live review')
			)
		).toBeTruthy();
	});
});

describe('recalls', () => {
	it('refuses a recall dated in the future (the public would read it as already done)', async () => {
		const live = await makeLivePack();
		await expect(
			setBatchStatus(SYSTEM_ACTOR, live.batch.id, {
				status: 'recalled',
				reason: 'Contamination',
				source: 'NAFDAC',
				effectiveAt: '2099-01-01'
			})
		).rejects.toBeInstanceOf(CatalogueError);
	});

	it('tells email subscribers when a recall is lifted, and alerts them again on a new recall', async () => {
		const live = await makeLivePack('ALERTPACK001');
		const checked = await apiCheck('ALERTPACK001');
		if (!checked.ok) throw new Error('setup failed');
		await subscribeToRecalls({
			verificationId: checked.id,
			channel: 'email',
			address: 'ada@example.com'
		});
		const confirm = /\/alerts\/confirm\/(\S+)/.exec(sentEmails.at(-1)!.text)![1];
		await confirmAlert(confirm);
		const status = (s: 'recalled' | 'active') =>
			setBatchStatus(SYSTEM_ACTOR, live.batch.id, {
				status: s,
				reason: s === 'active' ? 'Retesting passed' : 'Failed dissolution testing',
				source: s === 'active' ? '' : 'NAFDAC'
			});

		sentEmails.length = 0;
		await status('recalled');
		expect(sentEmails.map((e) => e.subject)).toEqual([
			expect.stringContaining('has been recalled')
		]);
		expect(sentEmails[0].text).toContain('one more email');

		await status('active');
		expect(sentEmails.at(-1)!.subject).toContain('no longer recalled');
		expect((await ctx().db.select().from(recallAlert))[0].sentAt).toBeNull();

		await status('recalled');
		expect(sentEmails.filter((e) => e.subject.includes('has been recalled'))).toHaveLength(2);
	});
});

describe('companies that are not active', () => {
	it('keeps keys and webhooks open from approval on, including during the go-live review', async () => {
		for (const status of ['approved', 'in_review', 'changes_requested', 'live'] as const) {
			const m = await makeManufacturer({ status });
			await createApiKey(
				SYSTEM_ACTOR,
				{ type: 'manufacturer', manufacturerId: m.id },
				{ name: 'ERP system', scopes: ['check'] }
			);
		}
	});

	it('cannot be given API keys or webhooks', async () => {
		const pending = await makeManufacturer({ status: 'pending' });
		await expect(
			createApiKey(
				SYSTEM_ACTOR,
				{ type: 'manufacturer', manufacturerId: pending.id },
				{ name: 'ERP system', scopes: ['check'] }
			)
		).rejects.toBeInstanceOf(ApiKeyError);
		await expect(
			createEndpoint(
				SYSTEM_ACTOR,
				{ manufacturerId: pending.id },
				{ url: 'https://example.com/hook', events: ['import.completed'] }
			)
		).rejects.toBeInstanceOf(WebhookError);
	});
});

describe('DETECK team invites', () => {
	it('can be cancelled before they are accepted', async () => {
		const { id } = await inviteStaff(SYSTEM_ACTOR, {
			email: 'new.reviewer@deteck.example',
			name: 'New Reviewer',
			role: 'reviewer'
		});
		await cancelStaffInvite(SYSTEM_ACTOR, 'New.Reviewer@deteck.example');
		expect((await getStaffInvite(id)).state).toBe('used');
		expect((await listStaff()).invites).toHaveLength(0);
		await expect(cancelStaffInvite(SYSTEM_ACTOR, 'new.reviewer@deteck.example')).rejects.toThrow(
			'no longer exists'
		);
	});
});
