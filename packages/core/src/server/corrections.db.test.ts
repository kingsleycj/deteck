import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { auditLog, batch, custodyEvent, webhookDelivery, webhookEndpoint } from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import type { Actor } from './audit.ts';
import { defineJob } from './jobs.ts';
import { buildJourney } from './journey/build.ts';
import { clearCoverageCache, lookup, parseCheckInput } from './verify/lookup.ts';
import {
	correctBatch,
	CorrectionError,
	custodyRecords,
	replaceCustodyRecord,
	restoreSerial,
	voidCustodyRecord,
	voidedSerials,
	voidSerial
} from './corrections.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import {
	makeBatch,
	makeCustodyEvent,
	makeLivePack,
	makeParty
} from '../../tests/helpers/fixtures.ts';

defineJob('webhook.deliver', async () => undefined);

const STAFF: Actor = { userId: null, label: 'Kemi (DETECK)', role: 'DETECK admin' };
const SERIAL = 'CORRECT00001';

async function check(serial = SERIAL) {
	const input = parseCheckInput(serial);
	if (!input.ok) throw new Error('bad input');
	return lookup(input, { packagingEnabled: false });
}

const journey = async () => buildJourney(await check());

const corrected = async () =>
	(await ctx().db.select().from(webhookDelivery))
		.filter((d) => d.event === 'record.corrected')
		.map((d) => (d.payload as { data: { kind: string } }).data);

describe('staff corrections', () => {
	let live: Awaited<ReturnType<typeof makeLivePack>>;
	let batchId: string;

	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		sentEmails.length = 0;
		live = await makeLivePack(SERIAL);
		batchId = live.batch.id;
		await ctx()
			.db.insert(webhookEndpoint)
			.values({
				manufacturerId: live.manufacturer.id,
				url: 'https://hooks.example.com/a',
				secret: 'whsec_test',
				events: ['record.corrected']
			});
	});

	describe('batch details', () => {
		const fix = {
			lot: 'NB-2611',
			manufactureDate: '2026-03-01',
			expiryDate: '2028-04-30',
			quantity: ''
		};

		it('changes the lot and dates, audits and tells the manufacturer', async () => {
			const changed = await correctBatch(
				STAFF,
				batchId,
				{
					lot: 'NB-2611A',
					manufactureDate: '2026-03-02',
					expiryDate: '2028-05-31',
					quantity: '1000'
				},
				'Lot was mistyped in the import'
			);
			expect(changed).toBe(true);
			const r = await check();
			expect(r.batch).toMatchObject({
				lot: 'NB-2611A',
				manufactureDate: '2026-03-02',
				expiryDate: '2028-05-31'
			});

			const [entry] = await ctx()
				.db.select()
				.from(auditLog)
				.where(eq(auditLog.action, 'batch_correct'));
			expect(entry).toMatchObject({
				manufacturerId: live.manufacturer.id,
				before: { lot: 'NB-2611', expiryDate: '2028-04-30', quantity: null },
				after: { lot: 'NB-2611A', expiryDate: '2028-05-31', quantity: 1000 }
			});
			expect(entry.summary).toContain('Lot was mistyped');
			const mail = sentEmails.find((e) => e.subject.startsWith('DETECK corrected a record'));
			expect(mail?.to).toBe('contact@example.com');
			expect(mail?.text).toContain('lot is now NB-2611A');
			expect(await corrected()).toEqual([expect.objectContaining({ kind: 'batch' })]);
		});

		it('returns false when nothing changed', async () => {
			expect(await correctBatch(STAFF, batchId, fix, 'No change really')).toBe(false);
			expect(await ctx().db.$count(auditLog)).toBe(0);
			expect(await corrected()).toEqual([]);
		});

		it('rejects a lot clash, impossible dates and missing reasons', async () => {
			await makeBatch(live.product.id, { lot: 'NB-2700' });
			await expect(
				correctBatch(STAFF, batchId, { ...fix, lot: 'NB-2700' }, 'Merge lots')
			).rejects.toThrow('This drug already has a batch NB-2700.');
			await expect(
				correctBatch(STAFF, batchId, { ...fix, manufactureDate: '2028-05-01' }, 'Dates swapped')
			).rejects.toThrow('The manufacture date must be before the expiry date.');
			await expect(
				correctBatch(STAFF, batchId, { ...fix, expiryDate: '04/2028' }, 'Bad date')
			).rejects.toThrow('Enter the expiry date.');
			await expect(
				correctBatch(STAFF, batchId, { ...fix, quantity: '12.5' }, 'Bad quantity')
			).rejects.toBeInstanceOf(CorrectionError);
			await expect(correctBatch(STAFF, batchId, { ...fix, lot: 'NB-9' }, ' ')).rejects.toThrow(
				'A reason is required.'
			);
			await expect(
				correctBatch(STAFF, '00000000-0000-0000-0000-000000000000', fix, 'Missing')
			).rejects.toThrow('Batch not found.');
			const [b] = await ctx().db.select().from(batch).where(eq(batch.id, batchId));
			expect(b).toMatchObject({ lot: 'NB-2611', expiryDate: '2028-04-30' });
			expect(await ctx().db.$count(auditLog)).toBe(0);
		});
	});

	describe('serials', () => {
		it('voids a serial so it checks as Unrecognised, and restores it', async () => {
			expect((await check()).code).toBe('VALID');
			await voidSerial(STAFF, batchId, 'CORR-ECT0-0001', 'Sent by mistake');
			expect((await check()).code).toBe('UNRECOGNISED');
			const voided = await voidedSerials(batchId);
			expect(voided).toEqual([
				expect.objectContaining({ packId: live.pack.id, reason: 'Sent by mistake' })
			]);
			await expect(voidSerial(STAFF, batchId, SERIAL, 'Again')).rejects.toThrow(
				'That serial is already voided.'
			);
			expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'serial_void'))).toBe(1);

			const other = await makeBatch(live.product.id, { lot: 'NB-2700' });
			await expect(restoreSerial(STAFF, other.id, live.pack.id, 'Wrong batch')).rejects.toThrow(
				'That serial is not voided.'
			);
			await restoreSerial(STAFF, batchId, live.pack.id, 'Was a real pack after all');
			expect((await check()).code).toBe('VALID');
			await expect(restoreSerial(STAFF, batchId, live.pack.id, 'Again')).rejects.toThrow(
				'That serial is not voided.'
			);
			expect((await corrected()).map((d) => d.kind)).toEqual(['serial', 'serial']);
		});

		it('only voids serials of the batch given', async () => {
			const other = await makeBatch(live.product.id, { lot: 'NB-2700' });
			await expect(voidSerial(STAFF, other.id, SERIAL, 'Wrong batch')).rejects.toThrow(
				"That serial isn't in this batch."
			);
			await expect(voidSerial(STAFF, batchId, '  ', 'Empty')).rejects.toThrow('Enter the serial.');
			expect((await check()).code).toBe('VALID');
		});
	});

	describe('supply chain records', () => {
		afterEach(() => {
			vi.useRealTimers();
		});

		let distributor: Awaited<ReturnType<typeof makeParty>>;
		let pharmacy: Awaited<ReturnType<typeof makeParty>>;
		let otherDistributor: Awaited<ReturnType<typeof makeParty>>;
		let shipped: number;
		let delivered: number;

		beforeEach(async () => {
			distributor = await makeParty({ name: 'Lakeside Medical Supply', role: 'distributor' });
			otherDistributor = await makeParty({ name: 'Northgate Wholesale', role: 'wholesaler' });
			pharmacy = await makeParty({ name: 'Riverside Pharmacy', role: 'pharmacy', state: 'Oyo' });
			const base = {
				manufacturerId: live.manufacturer.id,
				level: 'pack' as const,
				packId: live.pack.id,
				batchId
			};
			shipped = (
				await makeCustodyEvent({ ...base, toPartyId: distributor.id, eventDate: '2026-04-01' })
			).id;
			delivered = (
				await makeCustodyEvent({
					...base,
					fromPartyId: distributor.id,
					toPartyId: pharmacy.id,
					eventDate: '2026-04-10'
				})
			).id;
		});

		const names = async () =>
			(await journey()).steps.map((s) => (s.kind === 'manufacturer' ? 'maker' : s.name));

		it('cancels a record so the journey stops showing it, once', async () => {
			expect((await journey()).state).toBe('TO_RETAIL');
			await voidCustodyRecord(STAFF, batchId, delivered, 'Pharmacy never received it');
			const j = await journey();
			expect(j.state).toBe('ENDS_BEFORE_RETAIL');
			expect(await names()).toEqual(['maker', 'Lakeside Medical Supply']);

			await expect(voidCustodyRecord(STAFF, batchId, delivered, 'Again')).rejects.toThrow(
				'That record has already been corrected.'
			);
			const correction = (await custodyRecords(batchId)).find((r) => r.state === 'correction')!;
			await expect(voidCustodyRecord(STAFF, batchId, correction.id, 'Undo')).rejects.toThrow(
				'That record is itself a correction.'
			);
			expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'custody_void'))).toBe(1);
			expect((await corrected()).map((d) => d.kind)).toEqual(['custody']);
		});

		it('replaces a record with a corrected one, once', async () => {
			await replaceCustodyRecord(
				STAFF,
				batchId,
				shipped,
				{ fromPartyId: '', toPartyId: otherDistributor.id, eventDate: '2026-04-02' },
				'Shipped to the wholesaler, not Lakeside'
			);
			await replaceCustodyRecord(
				STAFF,
				batchId,
				delivered,
				{ fromPartyId: otherDistributor.id, toPartyId: pharmacy.id, eventDate: '2026-04-10' },
				'Sender follows the corrected record'
			);
			const j = await journey();
			expect(await names()).toEqual(['maker', 'Northgate Wholesale', 'Riverside Pharmacy']);
			expect(j.steps[1]).toMatchObject({ date: '2026-04-02' });

			await expect(
				replaceCustodyRecord(
					STAFF,
					batchId,
					shipped,
					{ fromPartyId: '', toPartyId: distributor.id, eventDate: '2026-04-01' },
					'Back again'
				)
			).rejects.toThrow('That record has already been corrected.');
			expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'custody_replace'))).toBe(2);
		});

		// Regression: "today" is the Lagos date, not UTC.
		it("accepts today's Lagos date just after midnight", async () => {
			vi.useFakeTimers({ toFake: ['Date'] });
			vi.setSystemTime(new Date('2026-10-26T23:30:00Z'));
			await expect(
				replaceCustodyRecord(
					STAFF,
					batchId,
					delivered,
					{ fromPartyId: distributor.id, toPartyId: pharmacy.id, eventDate: '2026-10-27' },
					'Delivered today'
				)
			).resolves.toBeUndefined();
		});

		it('validates replacements', async () => {
			const replace = (input: { fromPartyId: string; toPartyId: string; eventDate: string }) =>
				replaceCustodyRecord(STAFF, batchId, delivered, input, 'Fixing it');
			const same = { fromPartyId: distributor.id, toPartyId: pharmacy.id, eventDate: '2026-04-10' };
			await expect(replace(same)).rejects.toThrow('Nothing changed.');
			await expect(replace({ ...same, fromPartyId: pharmacy.id })).rejects.toThrow(
				'Sender and receiver must be different.'
			);
			await expect(
				replace({ ...same, toPartyId: '00000000-0000-0000-0000-000000000000' })
			).rejects.toThrow('Choose parties from the list.');
			await expect(replace({ ...same, eventDate: '2099-01-01' })).rejects.toThrow(
				"The date can't be in the future."
			);
			await expect(replace({ ...same, eventDate: '10/04/2026' })).rejects.toThrow(
				'Enter the date.'
			);
			const other = await makeBatch(live.product.id, { lot: 'NB-2700' });
			await expect(
				replaceCustodyRecord(
					STAFF,
					other.id,
					delivered,
					{ ...same, eventDate: '2026-04-11' },
					'Wrong'
				)
			).rejects.toThrow('Record not found.');
			expect(await ctx().db.$count(custodyEvent)).toBe(2);
		});

		it('marks every record current, replaced, cancelled or correction', async () => {
			await replaceCustodyRecord(
				STAFF,
				batchId,
				shipped,
				{ fromPartyId: '', toPartyId: otherDistributor.id, eventDate: '2026-04-02' },
				'Wrong receiver'
			);
			await voidCustodyRecord(STAFF, batchId, delivered, 'Never delivered');
			const records = await custodyRecords(batchId);
			const state = new Map(records.map((r) => [r.id, r.state]));
			expect(state.get(shipped)).toBe('replaced');
			expect(state.get(delivered)).toBe('cancelled');
			const corrections = records.filter((r) => r.supersedesId !== null);
			expect(corrections.map((r) => [r.supersedesId, r.state, r.source])).toEqual([
				[delivered, 'correction', 'staff_correction'],
				[shipped, 'current', 'staff_correction']
			]);
			expect(corrections[1]).toMatchObject({ toName: 'Northgate Wholesale', fromName: null });
		});
	});

	// Regression: cancelled records do not offer a journey.
	it('stops offering a journey once its only record is cancelled', async () => {
		const distributor = await makeParty({ name: 'Lakeside Medical Supply' });
		const only = await makeCustodyEvent({
			manufacturerId: live.manufacturer.id,
			level: 'pack',
			packId: live.pack.id,
			batchId,
			toPartyId: distributor.id,
			eventDate: '2026-04-01'
		});
		expect((await check()).journeyAvailable).toBe(true);
		await voidCustodyRecord(STAFF, batchId, only.id, 'Entered in error');
		expect((await journey()).state).toBe('NONE');
		expect((await check()).journeyAvailable).toBe(false);
	});
});
