import { beforeEach, describe, expect, it } from 'vitest';
import { listParties } from './parties.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeCustodyEvent, makeLivePack, makeParty } from '../../tests/helpers/fixtures.ts';

describe('supply chain businesses', () => {
	beforeEach(async () => {
		await resetDb();
	});

	it("shows a manufacturer only its own records, never another manufacturer's", async () => {
		const a = await makeLivePack('PARTYPACK001');
		const b = await makeLivePack('PARTYPACK002');
		const pharmacy = await makeParty();
		for (const x of [a, a, b])
			await makeCustodyEvent({
				manufacturerId: x.manufacturer.id,
				level: 'pack',
				packId: x.pack.id,
				batchId: x.batch.id,
				toPartyId: pharmacy.id,
				eventDate: '2026-03-28'
			});

		const [mine] = await listParties({ manufacturerId: b.manufacturer.id });
		expect(mine).toMatchObject({ id: pharmacy.id, events: 1, manufacturers: 1, created_by: null });
		const [all] = await listParties();
		expect(all).toMatchObject({ id: pharmacy.id, events: 3, manufacturers: 2 });
	});
});
