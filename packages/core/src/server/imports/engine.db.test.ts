import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from '../context.ts';
import {
	batch,
	custodyEvent,
	document,
	importJob,
	manufacturer,
	pack,
	party,
	product
} from '../db/schema.ts';
import { SYSTEM_ACTOR } from '../audit.ts';
import {
	createImportJob,
	ImportError,
	loadJob,
	markCommitting,
	runImport,
	saveMapping
} from './engine.ts';
import { getObject } from '../storage.ts';
import { lookup, parseCheckInput, clearCoverageCache } from '../verify/lookup.ts';
import { buildJourney } from '../journey/build.ts';
import { resetDb } from '../../../tests/helpers/db.ts';
import { makeManufacturer, nextGtin } from '../../../tests/helpers/fixtures.ts';

const csv = (rows: string[][]) => ({
	name: 'data.csv',
	type: 'text/csv',
	bytes: new TextEncoder().encode(rows.map((r) => r.join(',')).join('\n'))
});

async function withAgreement(manufacturerId: string) {
	await ctx().db.insert(document).values({
		manufacturerId,
		kind: 'data_sharing_agreement',
		fileKey: 'x',
		fileName: 'agreement.pdf',
		contentType: 'application/pdf',
		sizeBytes: 1
	});
}

/** Upload, keep the auto-matched columns, check, and optionally import. */
async function importFile(
	manufacturerId: string,
	kind: 'products' | 'batches_serials' | 'distribution',
	rows: string[][],
	commit = true
) {
	const { job } = await createImportJob(SYSTEM_ACTOR, manufacturerId, kind, csv(rows));
	await saveMapping(job, job.mapping ?? {});
	await runImport(job.id, 'dry_run');
	const checked = (await loadJob(job.id))!;
	if (!commit) return checked;
	await markCommitting(checked);
	await runImport(job.id, 'commit', SYSTEM_ACTOR);
	return (await loadJob(job.id))!;
}

describe('imports (F-05, US-05.2 and US-05.3)', () => {
	let m: Awaited<ReturnType<typeof makeManufacturer>>;
	let gtinA: string;
	let gtinB: string;

	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		// Approved, not yet live: the onboarding order, so new drugs are active straight away.
		m = await makeManufacturer({ companyName: 'Northbridge Pharma Ltd', status: 'approved' });
		await withAgreement(m.id);
		gtinA = nextGtin();
		gtinB = nextGtin();
	});

	/** DETECK approves the data to go live, so checks can see it. */
	const goLive = async () => {
		await ctx().db.update(manufacturer).set({ status: 'live' }).where(eq(manufacturer.id, m.id));
		clearCoverageCache();
	};

	const products = () =>
		importFile(m.id, 'products', [
			['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
			[gtinA, 'Curavyn', 'Paracetamol', '500 mg', 'Tablets', '20', 'A4-0000'],
			[gtinB, 'Malarex-AL', 'Artemether/Lumefantrine', '80/480 mg', 'Tablets', '6', 'A4-0001'],
			[gtinA, 'Curavyn', 'Paracetamol', '500 mg', 'Tablets', '20', 'A4-0000'],
			['12345', 'Bad', 'Bad', '1 mg', 'Tablets', '1', 'X']
		]);

	it('checks products without saving anything, then imports the good rows', async () => {
		const { job } = await createImportJob(
			SYSTEM_ACTOR,
			m.id,
			'products',
			csv([
				['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
				[gtinA, 'Curavyn', 'Paracetamol', '500 mg', 'Tablets', '20', 'A4-0000']
			])
		);
		await saveMapping(job, job.mapping ?? {});
		await runImport(job.id, 'dry_run');
		expect(await ctx().db.$count(product)).toBe(0);
		expect((await loadJob(job.id))?.status).toBe('ready');

		const done = await products();
		expect(done.status).toBe('committed');
		expect(done.counts).toMatchObject({ rows: 4, ready: 2, problems: 2, created: 2 });
		const problemCsv = (await getObject(done.problemsKey!)).toString();
		expect(problemCsv).toContain('more than once in this file');
		expect(problemCsv).toContain('check digit');
	});

	it('imports batches and serials, rejecting duplicates and serials already on DETECK', async () => {
		await products();
		const first = await importFile(m.id, 'batches_serials', [
			['Product Code', 'Lot No', 'Pack Date', 'Exp', 'Serial'],
			[gtinA, 'NB-2611', '12/03/2026', '04/2028', '7K4M9QX2TB8D'],
			[gtinA, 'NB-2611', '12/03/2026', '04/2028', 'H2R5W8C1N6PZ'],
			[gtinA, 'NB-2611', '12/03/2026', '04/2028', 'H2R5W8C1N6PZ'],
			[gtinB, 'ML-2604', '2026-04-02', '2028-03-31', 'Q9T3V6B2M8KD'],
			[gtinA, 'NB-2611', '12/03/2026', '05/2028', 'ZZZZ00000001'],
			['09506000134352', 'X-1', '', '2028-01-01', 'NOPRODUCT001'],
			[gtinA, 'NB-2612', '', 'someday', 'BADDATE00001']
		]);
		expect(first.counts).toMatchObject({
			rows: 7,
			ready: 3,
			problems: 4,
			serialsAdded: 3,
			batchesCreated: 2
		});
		expect(await ctx().db.$count(pack)).toBe(3);
		const [b] = await ctx().db.select().from(batch).where(eq(batch.lot, 'NB-2611'));
		expect(b).toMatchObject({ manufactureDate: '2026-03-12', expiryDate: '2028-04-30' });

		const again = await importFile(
			m.id,
			'batches_serials',
			[
				['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
				[gtinA, 'NB-2611', '2028-04-30', '7K4M9QX2TB8D']
			],
			false
		);
		expect(again.counts).toMatchObject({ ready: 0, problems: 1 });
		await expect(markCommitting(again)).rejects.toBeInstanceOf(ImportError);
		const text = (await getObject(again.problemsKey!)).toString();
		expect(text).toContain('already on DETECK');

		await goLive();
		const input = parseCheckInput('7K4M 9QX2 TB8D');
		if (!input.ok) throw new Error();
		expect((await lookup(input, { packagingEnabled: false })).code).toBe('VALID');
	});

	it('returns the existing job when the same file is uploaded twice', async () => {
		const file = csv([
			['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
			[gtinA, 'A', 'B', 'C', 'D', 'E', 'F']
		]);
		const one = await createImportJob(SYSTEM_ACTOR, m.id, 'products', file);
		const two = await createImportJob(SYSTEM_ACTOR, m.id, 'products', file);
		expect(two.existing).toBe(true);
		expect(two.job.id).toBe(one.job.id);
		expect(await ctx().db.$count(importJob)).toBe(1);
	});

	it('requires the data-sharing agreement before serials or supply chain imports', async () => {
		const other = await makeManufacturer({ companyName: 'No Agreement Ltd' });
		await expect(
			createImportJob(SYSTEM_ACTOR, other.id, 'batches_serials', csv([['GTIN'], ['1']]))
		).rejects.toBeInstanceOf(ImportError);
	});

	it('imports pack-level and batch-level supply chain records and matches businesses', async () => {
		await products();
		await importFile(m.id, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtinA, 'NB-2611', '2028-04-30', '7K4M9QX2TB8D'],
			[gtinB, 'ML-2604', '2028-03-31', 'Q9T3V6B2M8KD']
		]);
		const done = await importFile(m.id, 'distribution', [
			[
				'GTIN',
				'Batch number',
				'Serial number',
				'Customer',
				'Customer type',
				'State',
				'City',
				'Date shipped',
				'PCN licence'
			],
			[
				gtinA,
				'NB-2611',
				'7K4M9QX2TB8D',
				'Lakeside Medical Supply Ltd',
				'Distributor',
				'Lagos',
				'Ikeja',
				'28/03/2026',
				''
			],
			[
				gtinA,
				'NB-2611',
				'7K4M9QX2TB8D',
				'Lakeside Medical Supply Ltd',
				'Distributor',
				'Lagos',
				'Ikeja',
				'28/03/2026',
				''
			],
			[
				gtinB,
				'ML-2604',
				'',
				'LAKESIDE MEDICAL SUPPLY LIMITED',
				'Key distributor',
				'Lagos State',
				'',
				'2026-04-15',
				''
			],
			[
				gtinB,
				'ML-2604',
				'',
				'Riverside Pharmacy',
				'Retail pharmacy',
				'Oyo',
				'Ibadan',
				'2026-04-20',
				'PCN-123'
			],
			[gtinA, 'NB-9999', '', 'Somebody', 'Pharmacy', 'Lagos', '', '2026-04-20', ''],
			[gtinA, 'NB-2611', '', 'Somebody', 'Spaceport', 'Lagos', '', '2026-04-20', ''],
			[gtinA, 'NB-2611', '', 'Somebody', 'Pharmacy', 'Atlantis', '', '2026-04-20', '']
		]);
		expect(done.status).toBe('committed');
		expect(done.counts).toMatchObject({
			rows: 7,
			ready: 4,
			problems: 3,
			packEvents: 1,
			batchEvents: 2,
			newBusinesses: 2,
			duplicatesSkipped: 1
		});
		expect(await ctx().db.$count(party)).toBe(2);
		expect(await ctx().db.$count(custodyEvent)).toBe(3);

		await goLive();
		const input = parseCheckInput('7K4M9QX2TB8D');
		if (!input.ok) throw new Error();
		const journey = await buildJourney(await lookup(input, { packagingEnabled: false }));
		expect(journey.state).toBe('ENDS_BEFORE_RETAIL');
		expect(journey.lastHolder?.name).toBe('Lakeside Medical Supply Ltd');
	});

	it('holds back serials that Excel damaged, without leaving their batch behind', async () => {
		await products();
		const done = await importFile(m.id, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtinA, 'NB-0001', '2028-01-31', '1.23457E+15'],
			[gtinA, 'NB-0002', '2028-01-31', 'GOODSERIAL01']
		]);
		expect(done.counts).toMatchObject({ problems: 1, serialsAdded: 1, batchesCreated: 1 });
		const lots = (await ctx().db.select({ lot: batch.lot }).from(batch)).map((b) => b.lot);
		expect(lots).toEqual(['NB-0002']);
	});

	it('matches a sending business to the one already recorded, and keeps licensed branches apart', async () => {
		await products();
		await importFile(m.id, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtinA, 'NB-2611', '2028-04-30', 'PACKONE00001'],
			[gtinA, 'NB-2611', '2028-04-30', 'PACKTWO00002']
		]);
		const header = [
			'GTIN',
			'Batch number',
			'Serial number',
			'Customer',
			'Customer type',
			'State',
			'City',
			'Date shipped',
			'PCN licence',
			'Shipped from'
		];
		await importFile(m.id, 'distribution', [
			header,
			[
				gtinA,
				'NB-2611',
				'PACKONE00001',
				'Lakeside Medical Supply',
				'Distributor',
				'Lagos',
				'Ikeja',
				'2026-03-01',
				'',
				''
			],
			[
				gtinA,
				'NB-2611',
				'PACKONE00001',
				'MedPlus Pharmacy',
				'Pharmacy',
				'Lagos',
				'Ikeja',
				'2026-03-10',
				'PCN-111',
				'Lakeside Medical Supply'
			],
			[
				gtinA,
				'NB-2611',
				'PACKTWO00002',
				'MedPlus Pharmacy',
				'Pharmacy',
				'Lagos',
				'Lekki',
				'2026-03-10',
				'PCN-222',
				''
			]
		]);
		const parties = await ctx().db.select({ name: party.name, city: party.city }).from(party);
		// One Lakeside (the sender row re-used it), and two MedPlus branches.
		expect(parties.filter((p) => p.name.startsWith('Lakeside'))).toHaveLength(1);
		expect(
			parties
				.filter((p) => p.name === 'MedPlus Pharmacy')
				.map((p) => p.city)
				.sort()
		).toEqual(['Ikeja', 'Lekki']);
		await goLive();
		const input = parseCheckInput('PACKONE00001');
		if (!input.ok) throw new Error();
		const journey = await buildJourney(await lookup(input, { packagingEnabled: false }));
		expect(journey.state).not.toBe('NONE');
	});

	it('saves nothing when an import fails part-way', async () => {
		await products();
		const { job } = await createImportJob(
			SYSTEM_ACTOR,
			m.id,
			'batches_serials',
			csv([
				['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
				[gtinA, 'NB-2611', '2028-04-30', 'AAAA00000001']
			])
		);
		await saveMapping(job, job.mapping ?? {});
		await runImport(job.id, 'dry_run');
		await markCommitting((await loadJob(job.id))!);
		// Simulate the file disappearing mid-import.
		await ctx()
			.db.update(importJob)
			.set({ fileKey: 'imports/missing/file.csv' })
			.where(eq(importJob.id, job.id));
		await runImport(job.id, 'commit', SYSTEM_ACTOR);
		const failed = (await loadJob(job.id))!;
		expect(failed.status).toBe('failed');
		expect(failed.error).toContain('nothing saved');
		expect(await ctx().db.$count(pack)).toBe(0);
	});
});
