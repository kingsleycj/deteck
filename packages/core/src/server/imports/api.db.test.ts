import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import '../job-definitions.ts';
import { ctx } from '../context.ts';
import { importJob, pack, product } from '../db/schema.ts';
import { SYSTEM_ACTOR } from '../audit.ts';
import { createApiImport, ImportError, loadJob, MAX_API_ROWS, readProblemRows } from './engine.ts';
import { resetDb } from '../../../tests/helpers/db.ts';
import { makeManufacturer, nextGtin } from '../../../tests/helpers/fixtures.ts';
import { withAgreement } from '../../../tests/helpers/imports.ts';

const drug = (gtin: string, brandName = 'Curavyn') => ({
	gtin,
	brandName,
	genericName: 'Paracetamol',
	strength: '500 mg',
	dosageForm: 'Tablets',
	packSize: '20',
	nafdacRegNo: 'A4-0000'
});

describe('manufacturer data API imports', () => {
	let manufacturerId: string;
	let gtinA: string;
	let gtinB: string;

	beforeEach(async () => {
		await resetDb();
		manufacturerId = (await makeManufacturer({ status: 'approved' })).id;
		await withAgreement(manufacturerId);
		gtinA = nextGtin();
		gtinB = nextGtin();
	});

	const send = (kind: 'products' | 'batches_serials', rows: unknown, commit = true) =>
		createApiImport(SYSTEM_ACTOR, manufacturerId, kind, rows, { commit });

	it('runs rows through the same checks as a file and keeps the problem rows', async () => {
		const { job, existing } = await send('products', [
			drug(gtinA, 'Curavyn, "Forte"'),
			drug(gtinB),
			drug(gtinA),
			{ ...drug('12345'), brandName: 'Bad' },
			{ gtin: gtinB.replace(/.$/, '0') }
		]);
		expect(existing).toBe(false);
		expect(job).toMatchObject({ status: 'committed', source: 'api' });
		expect(job.counts).toMatchObject({ rows: 5, ready: 2, problems: 3, created: 2 });
		const [stored] = await ctx().db.select().from(product).where(eq(product.gtin, gtinA));
		expect(stored.brandName).toBe('Curavyn, "Forte"');

		const problems = await readProblemRows(job);
		expect(problems.map((p) => p.row)).toEqual([4, 5, 6]);
		// Where each row is in the "rows" array sent, counting from 0.
		expect(problems.map((p) => p.index)).toEqual([2, 3, 4]);
		expect(problems[0].problem).toContain('more than once');
		expect(problems[1]).toMatchObject({ gtin: '12345', brandName: 'Bad' });
		expect(problems[1].problem).toContain('check digit');
		expect(await readProblemRows(job, 1)).toHaveLength(1);
	});

	it('checks serial rows like a file does', async () => {
		await send('products', [drug(gtinA)]);
		const { job } = await send('batches_serials', [
			{ gtin: gtinA, lot: 'NB-2611', expiryDate: '2028-04-30', serial: 'APISERIAL001' },
			{ gtin: gtinA, lot: 'NB-2611', expiryDate: '2028-04-30', serial: 'HAS SPACE' },
			{ gtin: gtinB, lot: 'NB-2611', expiryDate: '2028-04-30', serial: 'APISERIAL002' }
		]);
		expect(job.counts).toMatchObject({ ready: 1, problems: 2, serialsAdded: 1 });
		expect(await ctx().db.$count(pack)).toBe(1);
		const reasons = (await readProblemRows(job)).map((p) => p.problem);
		expect(reasons[0]).toContain('no spaces');
		expect(reasons[1]).toContain('not in your drug list');
	});

	it('returns the first import when the same rows are sent twice', async () => {
		const rows = [drug(gtinA)];
		const one = await send('products', rows);
		const two = await send('products', rows);
		expect(two.existing).toBe(true);
		expect(two.job.id).toBe(one.job.id);
		expect(await ctx().db.$count(importJob)).toBe(1);
		expect(await ctx().db.$count(product)).toBe(1);
	});

	it('only checks the rows with commit: false', async () => {
		const { job } = await send('products', [drug(gtinA), drug('12345')], false);
		expect(job.status).toBe('ready');
		expect(job.counts).toMatchObject({ ready: 1, problems: 1 });
		expect(await ctx().db.$count(product)).toBe(0);
		expect(await readProblemRows(job)).toHaveLength(1);
	});

	// Regression: re-sending checked rows with commit: true imports them.
	it('imports rows that were first sent with commit: false when they are sent again to commit', async () => {
		const rows = [drug(gtinA)];
		await send('products', rows, false);
		const { job } = await send('products', rows, true);
		expect((await loadJob(job.id))?.status).toBe('committed');
		expect(await ctx().db.$count(product)).toBe(1);
	});

	it('refuses empty, oversized and malformed requests', async () => {
		await expect(send('products', [])).rejects.toThrow('Send at least one row.');
		await expect(send('products', { rows: [] })).rejects.toBeInstanceOf(ImportError);
		await expect(send('products', [{ colour: 'red' }])).rejects.toThrow('Rows need these fields');
		await expect(send('products', [drug(gtinA), 'not a row'])).rejects.toThrow(
			'Every row must be an object.'
		);
		const tooMany = Array.from({ length: MAX_API_ROWS + 1 }, () => drug(gtinA));
		await expect(send('products', tooMany)).rejects.toThrow(
			`Send at most ${MAX_API_ROWS.toLocaleString('en-GB')} rows`
		);
		await expect(send('batches_serials', [drug(gtinA)])).rejects.toThrow(
			'Rows are missing these fields: lot (Batch number), expiryDate (Expiry date).'
		);
		expect(await ctx().db.$count(product)).toBe(0);
	});
});
