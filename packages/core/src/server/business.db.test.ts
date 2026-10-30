import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import './job-definitions.ts';
import { ctx } from './context.ts';
import { createAuth } from './auth-factory.ts';
import { auditLog, businessAccount, custodyEvent, document, party, user } from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import { SYSTEM_ACTOR, type Actor } from './audit.ts';
import { setBatchStatus } from './catalogue.ts';
import { buildJourney } from './journey/build.ts';
import { clearCoverageCache, lookup, parseCheckInput } from './verify/lookup.ts';
import {
	BusinessError,
	checkDelivery,
	decideBusiness,
	getBusiness,
	listReceipts,
	MAX_BATCH_CHECK,
	recalledStock,
	recordReceipts,
	registerBusiness,
	setBusinessSuspended,
	splitCodes
} from './business.ts';
import { replaceCustodyRecord, voidCustodyRecord } from './corrections.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import {
	makeBatch,
	makeCustodyEvent,
	makeLivePack,
	makePack,
	makeParty
} from '../../tests/helpers/fixtures.ts';

const auth = () =>
	createAuth({ db: ctx().db, baseURL: 'http://localhost:5173', secret: ctx().config.authSecret });

const pdf = {
	name: 'pcn-licence.pdf',
	type: 'application/pdf',
	bytes: new TextEncoder().encode('%PDF-1.4 test')
};

const form = {
	name: 'Riverside Pharmacy Ltd',
	role: 'pharmacy',
	address: '4 Bodija Market Road',
	state: 'Oyo',
	town: 'Ibadan',
	pcnLicence: 'PCN-OY-0042',
	contactName: 'Ada Obi',
	contactEmail: 'Ada@Riverside.example',
	password: 'correct horse battery 9!'
};

const meta = { ip: '127.0.0.1', userAgent: 'vitest' };
const OWNER: Actor = { userId: null, label: 'Ada Obi', role: 'Business admin' };

async function register(overrides: Record<string, string> = {}) {
	const r = await registerBusiness(auth(), { ...form, ...overrides }, { pcnLicence: pdf }, meta);
	if (!r.ok) throw new Error(`registration failed: ${JSON.stringify(r.errors)}`);
	return r.businessId;
}

async function approved(overrides: Record<string, string> = {}) {
	const id = await register(overrides);
	await decideBusiness(SYSTEM_ACTOR, id, 'approve', 'PCN licence checked');
	return (await getBusiness(id))!;
}

async function journeyFor(serial: string) {
	const input = parseCheckInput(serial);
	if (!input.ok) throw new Error('bad input');
	return buildJourney(await lookup(input, { packagingEnabled: false }));
}

describe('business accounts', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		sentEmails.length = 0;
	});

	it('registers a pending business with its licence and validates the form', async () => {
		const bad = await registerBusiness(
			auth(),
			{ ...form, role: 'spaceport', gln: '123', password: 'short' },
			{ pcnLicence: null },
			meta
		);
		expect(bad.ok).toBe(false);
		if (bad.ok) return;
		expect(Object.keys(bad.errors).sort()).toEqual(['gln', 'password', 'pcnLicenceFile', 'role']);

		const id = await register();
		const b = (await getBusiness(id))!;
		expect(b).toMatchObject({
			status: 'pending',
			contactEmail: 'ada@riverside.example',
			partyId: null
		});
		expect(await ctx().db.$count(document, eq(document.businessId, id))).toBe(1);
		expect(sentEmails.some((e) => e.subject === 'We received your DETECK application')).toBe(true);

		const again = await registerBusiness(
			auth(),
			{ ...form, pcnLicence: 'pcn-oy-0042', contactEmail: 'other@riverside.example' },
			{ pcnLicence: pdf },
			meta
		);
		expect(!again.ok && again.errors.pcnLicence).toBeTruthy();
		expect(await ctx().db.$count(user)).toBe(1);
	});

	it('approval creates a verified supply chain record, or links the matching one', async () => {
		const fresh = await approved();
		const [p] = await ctx().db.select().from(party).where(eq(party.id, fresh.partyId!));
		expect(p).toMatchObject({
			name: 'Riverside Pharmacy Ltd',
			role: 'pharmacy',
			pcnLicence: 'PCN-OY-0042'
		});
		expect(p.verifiedAt).toBeInstanceOf(Date);
		expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'business_approve'))).toBe(1);
		await expect(
			decideBusiness(SYSTEM_ACTOR, fresh.id, 'reject', 'Changed my mind')
		).rejects.toBeInstanceOf(BusinessError);

		// A manufacturer already named this pharmacy in its records.
		const known = await makeParty({
			name: 'MedPlus Pharmacy',
			normalisedName: 'medplus pharmacy',
			role: 'pharmacy',
			state: 'Lagos'
		});
		// The same name in the same state but another town is another branch: never linked.
		const branch = await approved({
			name: 'MedPlus Pharmacy',
			state: 'Lagos',
			town: 'Lekki',
			pcnLicence: 'PCN-LA-0099',
			contactEmail: 'lekki@medplus.example'
		});
		expect(branch.partyId).not.toBe(known.id);
		const linked = await approved({
			name: 'MedPlus Pharmacy Limited',
			state: 'Lagos',
			town: 'Ikeja',
			pcnLicence: 'PCN-LA-0007',
			contactEmail: 'admin@medplus.example'
		});
		expect(linked.partyId).toBe(known.id);
		const [k] = await ctx().db.select().from(party).where(eq(party.id, known.id));
		expect(k).toMatchObject({ pcnLicence: 'PCN-LA-0007' });
		expect(k.verifiedAt).toBeInstanceOf(Date);
		expect(await ctx().db.$count(party)).toBe(3);

		await expect(decideBusiness(SYSTEM_ACTOR, linked.id, 'approve', ' ')).rejects.toThrow(
			'A reason is required.'
		);
	});

	describe('deliveries and receipts', () => {
		let live: Awaited<ReturnType<typeof makeLivePack>>;

		beforeEach(async () => {
			live = await makeLivePack('BIZPACK00001');
			await makePack({
				productId: live.product.id,
				gtin: live.product.gtin,
				batchId: live.batch.id,
				serial: 'BIZPACK00002'
			});
		});

		it('records receipts of Valid packs once, and shows the business as a confirmed step', async () => {
			const b = await approved();
			const r = await recordReceipts(OWNER, b, ['BIZPACK00001', 'BIZPACK00002', 'NOSUCHPACK01'], {
				receivedOn: '2026-10-20'
			});
			expect(r).toEqual({
				recorded: 2,
				skipped: [{ input: 'NOSUCHPACK01', why: 'Not on record' }]
			});
			const again = await recordReceipts(OWNER, b, ['BIZPACK00001']);
			expect(again).toEqual({
				recorded: 0,
				skipped: [{ input: 'BIZPACK00001', why: 'Already recorded' }]
			});
			const events = await ctx().db.select().from(custodyEvent);
			expect(events).toHaveLength(2);
			expect(events[0]).toMatchObject({
				eventType: 'received',
				source: 'business_receipt',
				toPartyId: b.partyId,
				eventDate: '2026-10-20'
			});
			expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'receipt_record'))).toBe(1);

			const j = await journeyFor('BIZPACK00001');
			expect(j.state).toBe('TO_RETAIL');
			expect(j.steps.at(-1)).toMatchObject({
				kind: 'party',
				name: 'Riverside Pharmacy Ltd',
				verified: true,
				confirmed: true,
				date: '2026-10-20'
			});

			await expect(
				recordReceipts(OWNER, b, ['BIZPACK00001'], { receivedOn: '2099-01-01' })
			).rejects.toThrow("can't be in the future");
		});

		it('marks a recorded hand-off as confirmed instead of repeating it', async () => {
			const b = await approved();
			const distributor = await makeParty({ name: 'Lakeside Medical Supply', role: 'distributor' });
			await makeCustodyEvent({
				manufacturerId: live.manufacturer.id,
				level: 'pack',
				packId: live.pack.id,
				batchId: live.batch.id,
				toPartyId: distributor.id,
				eventDate: '2026-09-01'
			});
			await makeCustodyEvent({
				manufacturerId: live.manufacturer.id,
				level: 'pack',
				packId: live.pack.id,
				batchId: live.batch.id,
				fromPartyId: distributor.id,
				toPartyId: b.partyId!,
				eventDate: '2026-10-01'
			});
			await recordReceipts(OWNER, b, ['BIZPACK00001'], {
				receivedOn: '2026-10-03',
				supplierName: 'Lakeside Medical Supply'
			});
			const j = await journeyFor('BIZPACK00001');
			expect(j.steps.map((s) => (s.kind === 'party' ? s.name : s.kind))).toEqual([
				'manufacturer',
				'Lakeside Medical Supply',
				'Riverside Pharmacy Ltd'
			]);
			expect(j.steps[2]).toMatchObject({ confirmed: true, date: '2026-10-01' });

			// Batch-level shipments: the confirming business is added to the batch list.
			const batchDistributor = await makeParty({ name: 'Northgate Wholesale', role: 'wholesaler' });
			await makeCustodyEvent({
				manufacturerId: live.manufacturer.id,
				level: 'batch',
				batchId: live.batch.id,
				toPartyId: batchDistributor.id,
				eventDate: '2026-08-15'
			});
			await recordReceipts(OWNER, b, ['BIZPACK00002'], { receivedOn: '2026-10-05' });
			const batchJourney = await journeyFor('BIZPACK00002');
			expect(batchJourney.state).toBe('BATCH_LEVEL');
			expect(batchJourney.steps.at(-1)).toMatchObject({
				name: 'Riverside Pharmacy Ltd',
				confirmed: true
			});
		});

		it('flags unknown, malformed and recalled codes when checking a delivery', async () => {
			const b = await approved();
			const recalled = await makeBatch(live.product.id, { lot: 'NB-9000' });
			await makePack({
				productId: live.product.id,
				gtin: live.product.gtin,
				batchId: recalled.id,
				serial: 'RECALLED0001'
			});
			await setBatchStatus(SYSTEM_ACTOR, recalled.id, {
				status: 'recalled',
				reason: 'Contamination',
				source: 'NAFDAC'
			});
			const lines = await checkDelivery(b, ['BIZPACK00001', 'NOSUCHPACK01', '!!', 'RECALLED0001']);
			expect(lines.map((l) => (l.ok ? l.result!.code : l.problem))).toEqual([
				'VALID',
				'UNRECOGNISED',
				expect.any(String),
				'RECALLED'
			]);
			expect(lines[2].ok).toBe(false);
			const r = await recordReceipts(OWNER, b, ['RECALLED0001']);
			expect(r).toEqual({
				recorded: 0,
				skipped: [{ input: 'RECALLED0001', why: 'Recalled batch' }]
			});
		});

		it("never confirms a pack that doesn't match its record, and flags packs another pharmacy has", async () => {
			const b = await approved();
			const copied = `(01)${live.product.gtin}(10)WRONG-LOT(21)BIZPACK00001`;
			expect(await recordReceipts(OWNER, b, [copied])).toEqual({
				recorded: 0,
				skipped: [{ input: copied, why: "The pack doesn't match the record" }]
			});

			const other = await approved({
				name: 'Bisi Pharmacy',
				town: 'Ibadan',
				pcnLicence: 'PCN-OY-0100',
				contactEmail: 'bisi@pharmacy.example'
			});
			await recordReceipts(OWNER, other, ['BIZPACK00002']);
			const lines = await checkDelivery(b, ['BIZPACK00001', 'BIZPACK00002']);
			expect(lines.map((l) => l.heldElsewhere ?? null)).toEqual([null, 'Bisi Pharmacy']);
			// Its own receipt isn't "another pharmacy".
			expect((await checkDelivery(other, ['BIZPACK00002']))[0].heldElsewhere).toBeUndefined();
		});

		it('drops "Verified by DETECK" while a pharmacy is suspended, and emails it', async () => {
			const b = await approved();
			await recordReceipts(OWNER, b, ['BIZPACK00001'], { receivedOn: '2026-10-20' });
			sentEmails.length = 0;
			await setBusinessSuspended(SYSTEM_ACTOR, b.id, true, 'PCN licence lapsed');
			expect((await journeyFor('BIZPACK00001')).steps.at(-1)).toMatchObject({
				name: 'Riverside Pharmacy Ltd',
				verified: false
			});
			expect(sentEmails.at(-1)).toMatchObject({ to: b.contactEmail });
			expect(sentEmails.at(-1)!.subject).toContain('paused');
			expect(sentEmails.at(-1)!.text).toContain('PCN licence lapsed');

			await setBusinessSuspended(SYSTEM_ACTOR, b.id, false, 'Licence renewed');
			expect((await journeyFor('BIZPACK00001')).steps.at(-1)).toMatchObject({ verified: true });
			expect(sentEmails.at(-1)!.subject).toContain('active again');
		});

		it('warns about recalled stock delivered to a merged duplicate, not about cancelled records', async () => {
			const b = await approved();
			const duplicate = await makeParty({
				name: 'Riverside Pharmacy',
				role: 'pharmacy',
				state: 'Oyo',
				city: 'Ibadan',
				mergedIntoId: b.partyId
			});
			const shipped = await makeCustodyEvent({
				manufacturerId: live.manufacturer.id,
				level: 'pack',
				packId: live.pack.id,
				batchId: live.batch.id,
				toPartyId: duplicate.id,
				eventDate: '2026-09-01'
			});
			await setBatchStatus(SYSTEM_ACTOR, live.batch.id, {
				status: 'recalled',
				reason: 'Contamination',
				source: 'NAFDAC'
			});
			expect(await recalledStock(b)).toEqual([
				expect.objectContaining({ lot: 'NB-2611', status: 'recalled' })
			]);
			await voidCustodyRecord(SYSTEM_ACTOR, live.batch.id, shipped.id, 'Sent to the wrong branch');
			expect(await recalledStock(b)).toEqual([]);
		});

		it('takes the "receipt confirmed" mark away when DETECK moves a receipt to another business', async () => {
			const b = await approved();
			await recordReceipts(OWNER, b, ['BIZPACK00001'], { receivedOn: '2026-10-20' });
			const [receipt] = await ctx().db.select().from(custodyEvent);
			const elsewhere = await makeParty({ name: 'Lakeside Pharmacy', role: 'pharmacy' });
			sentEmails.length = 0;
			await replaceCustodyRecord(
				SYSTEM_ACTOR,
				live.batch.id,
				receipt.id,
				{ fromPartyId: '', toPartyId: elsewhere.id, eventDate: '2026-10-20' },
				'Recorded by the wrong pharmacy'
			);
			const last = (await journeyFor('BIZPACK00001')).steps.at(-1);
			expect(last).toMatchObject({ name: 'Lakeside Pharmacy' });
			expect(last).not.toHaveProperty('confirmed');
			expect(await listReceipts(b)).toHaveLength(0);
			const told = sentEmails.find((e) => e.to === b.contactEmail);
			expect(told?.text).toContain('moved a receipt your business confirmed');

			// A date fix keeps the receipt the business's own.
			await recordReceipts(OWNER, b, ['BIZPACK00002'], { receivedOn: '2026-10-20' });
			const [second] = await listReceipts(b);
			await replaceCustodyRecord(
				SYSTEM_ACTOR,
				live.batch.id,
				second.id,
				{ fromPartyId: '', toPartyId: b.partyId!, eventDate: '2026-10-21' },
				'Typed the wrong date'
			);
			expect(await listReceipts(b)).toEqual([expect.objectContaining({ eventDate: '2026-10-21' })]);
		});

		it('lets a business record a pack again after DETECK cancelled its receipt', async () => {
			const b = await approved();
			await recordReceipts(OWNER, b, ['BIZPACK00001'], { receivedOn: '2026-10-20' });
			const [receipt] = await listReceipts(b);
			await voidCustodyRecord(SYSTEM_ACTOR, live.batch.id, receipt.id, 'Wrong pack scanned');
			expect(await listReceipts(b)).toHaveLength(0);
			expect(await recordReceipts(OWNER, b, ['BIZPACK00001'])).toEqual({
				recorded: 1,
				skipped: []
			});
		});

		it(`checks at most ${MAX_BATCH_CHECK} codes at once`, async () => {
			const b = await approved();
			const codes = Array.from({ length: MAX_BATCH_CHECK + 1 }, () => '!');
			expect(await checkDelivery(b, codes)).toHaveLength(MAX_BATCH_CHECK);
			expect(splitCodes(codes.join('\n'))).toHaveLength(MAX_BATCH_CHECK);
			expect(splitCodes('A1;B2, C3\r\n\nD4')).toEqual(['A1', 'B2', 'C3', 'D4']);
		});

		it('blocks pending and suspended businesses', async () => {
			const pending = (await getBusiness(await register()))!;
			await expect(checkDelivery(pending, ['BIZPACK00001'])).rejects.toBeInstanceOf(BusinessError);
			await expect(recordReceipts(OWNER, pending, ['BIZPACK00001'])).rejects.toBeInstanceOf(
				BusinessError
			);

			const b = await approved({
				name: 'Other Pharmacy',
				pcnLicence: 'PCN-OY-0099',
				contactEmail: 'other@pharmacy.example'
			});
			await setBusinessSuspended(SYSTEM_ACTOR, b.id, true, 'Licence expired');
			const suspended = (await getBusiness(b.id))!;
			expect(suspended.status).toBe('suspended');
			await expect(checkDelivery(suspended, ['BIZPACK00001'])).rejects.toThrow('is paused');
			await expect(recordReceipts(OWNER, suspended, ['BIZPACK00001'])).rejects.toBeInstanceOf(
				BusinessError
			);
			expect(await ctx().db.$count(custodyEvent)).toBe(0);

			await setBusinessSuspended(SYSTEM_ACTOR, b.id, false, 'Licence renewed');
			const back = (await getBusiness(b.id))!;
			expect((await checkDelivery(back, ['BIZPACK00001']))[0].result?.code).toBe('VALID');
			expect(
				(await ctx().db.select().from(businessAccount).where(eq(businessAccount.id, b.id)))[0]
					.statusReason
			).toBe('Licence renewed');
		});
	});
});
