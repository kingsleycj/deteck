import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from '../context.ts';
import { party } from '../db/schema.ts';
import { parseCheckInput, lookup, clearCoverageCache } from '../verify/lookup.ts';
import { buildJourney } from './build.ts';
import { resetDb } from '../../../tests/helpers/db.ts';
import { makeCustodyEvent, makeLivePack, makeParty } from '../../../tests/helpers/fixtures.ts';

async function journeyFor(serial: string) {
	const input = parseCheckInput(serial);
	if (!input.ok) throw new Error('bad input');
	return buildJourney(await lookup(input, { packagingEnabled: false }));
}

describe('journey rules (F-03, D-08)', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
	});

	it('shows only the manufacturer when no distribution is recorded', async () => {
		await makeLivePack('NOJOURNEY001');
		const j = await journeyFor('NOJOURNEY001');
		expect(j.state).toBe('NONE');
		expect(j.steps).toHaveLength(1);
		expect(j.steps[0]).toMatchObject({ kind: 'manufacturer', lot: 'NB-2611' });
	});

	it('ends with "records end here" when the last holder is a distributor', async () => {
		const { manufacturer: m, batch: b, pack: k } = await makeLivePack('ENDSDIST0001');
		const d = await makeParty({ name: 'Lakeside Medical Supply', role: 'distributor' });
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: d.id,
			eventDate: '2026-03-28'
		});
		const j = await journeyFor('ENDSDIST0001');
		expect(j.state).toBe('ENDS_BEFORE_RETAIL');
		expect(j.lastHolder).toMatchObject({ name: 'Lakeside Medical Supply', date: '2026-03-28' });
	});

	it('reaches retail, orders steps oldest first and marks unverified businesses', async () => {
		const { manufacturer: m, batch: b, pack: k } = await makeLivePack('RETAIL000001');
		const d = await makeParty({
			name: 'Lakeside Medical Supply',
			role: 'distributor',
			verifiedAt: new Date()
		});
		const p = await makeParty({
			name: 'Riverside Pharmacy',
			role: 'pharmacy',
			city: 'Bodija',
			state: 'Oyo'
		});
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			fromPartyId: d.id,
			toPartyId: p.id,
			eventDate: '2026-04-09'
		});
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: d.id,
			eventDate: '2026-03-28'
		});
		const j = await journeyFor('RETAIL000001');
		expect(j.state).toBe('TO_RETAIL');
		expect(j.steps.map((s) => s.kind)).toEqual(['manufacturer', 'party', 'party']);
		expect(j.steps[1]).toMatchObject({ name: 'Lakeside Medical Supply', verified: true });
		expect(j.steps[2]).toMatchObject({
			name: 'Riverside Pharmacy',
			verified: false,
			place: 'Bodija, Oyo'
		});
	});

	it('shows the next sender as its own step, without marking anything as missing', async () => {
		const { manufacturer: m, batch: b, pack: k } = await makeLivePack('GAPGAP000001');
		const d = await makeParty({ name: 'Lakeside Medical Supply', role: 'distributor' });
		const w = await makeParty({
			name: 'Kano Wholesale',
			role: 'wholesaler',
			city: 'Kano',
			state: 'Kano'
		});
		const p = await makeParty({ name: 'Riverside Pharmacy', role: 'pharmacy' });
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: d.id,
			eventDate: '2026-03-28'
		});
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			fromPartyId: w.id,
			toPartyId: p.id,
			eventDate: '2026-04-09'
		});
		const j = await journeyFor('GAPGAP000001');
		// Only what's recorded: the sender named in the second record is a step of its own, and
		// nothing marks the hand-off between the two businesses as missing.
		expect(j.steps.map((s) => (s.kind === 'party' ? s.name : s.kind))).toEqual([
			'manufacturer',
			'Lakeside Medical Supply',
			'Kano Wholesale',
			'Riverside Pharmacy'
		]);
	});

	it('lists businesses for batch-level records instead of a chain', async () => {
		const { manufacturer: m, batch: b } = await makeLivePack('BATCHLVL0001');
		const d1 = await makeParty({ name: 'Lakeside Medical Supply' });
		const d2 = await makeParty({ name: 'Northern Distributors', city: 'Kano', state: 'Kano' });
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'batch',
			batchId: b.id,
			toPartyId: d2.id,
			eventDate: '2026-03-30'
		});
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'batch',
			batchId: b.id,
			toPartyId: d1.id,
			eventDate: '2026-03-28'
		});
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'batch',
			batchId: b.id,
			toPartyId: d1.id,
			eventDate: '2026-04-02'
		});
		const j = await journeyFor('BATCHLVL0001');
		expect(j.state).toBe('BATCH_LEVEL');
		expect(j.steps.slice(1).map((s) => s.kind === 'party' && s.name)).toEqual([
			'Lakeside Medical Supply',
			'Northern Distributors'
		]);
	});

	it('follows merged businesses and ignores superseded events', async () => {
		const { manufacturer: m, batch: b, pack: k } = await makeLivePack('MERGED000001');
		const keep = await makeParty({ name: 'Lakeside Medical Supply Ltd' });
		const dup = await makeParty({ name: 'Lakeside Med. Supply' });
		await ctx().db.update(party).set({ mergedIntoId: keep.id }).where(eq(party.id, dup.id));
		const wrong = await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: dup.id,
			eventDate: '2026-01-01'
		});
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: dup.id,
			eventDate: '2026-03-28',
			supersedesId: wrong.id
		});
		const j = await journeyFor('MERGED000001');
		expect(j.steps).toHaveLength(2);
		expect(j.steps[1]).toMatchObject({ name: 'Lakeside Medical Supply Ltd', date: '2026-03-28' });
	});

	it('never exposes fields outside the allow-list', async () => {
		const { manufacturer: m, batch: b, pack: k } = await makeLivePack('PRIVACY00001');
		const d = await makeParty({ name: 'Lakeside', cacRc: 'RC-123', pcnLicence: 'PCN-9' });
		await makeCustodyEvent({
			manufacturerId: m.id,
			level: 'pack',
			packId: k.id,
			batchId: b.id,
			toPartyId: d.id,
			eventDate: '2026-03-28'
		});
		const text = JSON.stringify(await journeyFor('PRIVACY00001'));
		expect(text).not.toContain('RC-123');
		expect(text).not.toContain('PCN-9');
		expect(text).not.toContain(d.id);
	});
});
