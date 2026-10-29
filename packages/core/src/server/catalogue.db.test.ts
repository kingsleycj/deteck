import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { auditLog, product, user, webhookDelivery, webhookEndpoint } from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import type { Actor } from './audit.ts';
import { defineJob } from './jobs.ts';
import { CatalogueError, setProductStatus } from './catalogue.ts';
import { clearCoverageCache, coverage, lookup, parseCheckInput } from './verify/lookup.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeManufacturer, nextGtin } from '../../tests/helpers/fixtures.ts';
import { importFile, withAgreement } from '../../tests/helpers/imports.ts';

defineJob('webhook.deliver', async () => undefined);

const STAFF: Actor = { userId: null, label: 'Kemi (DETECK)', role: 'DETECK admin' };

async function check(raw: string) {
	const input = parseCheckInput(raw);
	if (!input.ok) throw new Error(`format problem: ${input.problem}`);
	return lookup(input, { packagingEnabled: false });
}

describe('new drugs from a live manufacturer wait for review', () => {
	let manufacturerId: string;
	let gtin: string;

	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		sentEmails.length = 0;
		await ctx().db.insert(user).values({
			id: 'staff-1',
			name: 'Kemi',
			email: 'kemi@deteck.example',
			platformRole: 'admin'
		});
		manufacturerId = (await makeManufacturer({ companyName: 'Northbridge Pharma Ltd' })).id;
		await withAgreement(manufacturerId);
		gtin = nextGtin();
		const job = await importFile(manufacturerId, 'products', [
			['GTIN', 'Brand name', 'Generic name', 'Strength', 'Dosage form', 'Pack size', 'NAFDAC no'],
			[gtin, 'Malarex-AL', 'Artemether/Lumefantrine', '80/480 mg', 'Tablets', '6', 'A4-0001']
		]);
		expect(job.counts).toMatchObject({ created: 1, pendingReview: 1 });
		await importFile(manufacturerId, 'batches_serials', [
			['GTIN', 'Batch number', 'Expiry date', 'Serial number'],
			[gtin, 'ML-2604', '2028-03-31', 'PENDING00001']
		]);
		clearCoverageCache();
	});

	const productId = async () =>
		(await ctx().db.select().from(product).where(eq(product.gtin, gtin)))[0].id;

	it('hides the drug from checks until DETECK approves it', async () => {
		const [p] = await ctx().db.select().from(product).where(eq(product.gtin, gtin));
		expect(p.status).toBe('pending_review');
		expect(sentEmails.some((e) => e.subject === '1 new drug to review')).toBe(true);

		// Genuine packs exist, so the public hears "not checkable yet", never "we couldn't find it".
		expect(await check('PENDING00001')).toMatchObject({
			code: 'NOT_COVERED',
			reason: 'drug_in_review'
		});
		expect(await check(`(01)${gtin}(21)PENDING00001`)).toMatchObject({
			code: 'NOT_COVERED',
			reason: 'drug_in_review'
		});
		expect((await check(`(01)${gtin}`)).code).toBe('NOT_COVERED');
		expect(await coverage()).toEqual({ manufacturers: 1, products: 0 });

		await setProductStatus(STAFF, p.id, 'active', 'Checked against the NAFDAC Green Book');
		const typed = await check('PENDING00001');
		expect(typed.code).toBe('VALID');
		expect(typed.product).toMatchObject({ brandName: 'Malarex-AL' });
		expect((await check(`(01)${gtin}(21)PENDING00001`)).code).toBe('VALID');
		expect(await coverage()).toEqual({ manufacturers: 1, products: 1 });

		const [entry] = await ctx()
			.db.select()
			.from(auditLog)
			.where(eq(auditLog.action, 'product_active'));
		expect(entry.summary).toContain('Approved the new drug');
		expect(entry.before).toEqual({ status: 'pending_review' });
	});

	it('tells the manufacturer the decision by webhook', async () => {
		const [endpoint] = await ctx()
			.db.insert(webhookEndpoint)
			.values({
				manufacturerId,
				url: 'https://hooks.example.com/a',
				secret: 'whsec_test',
				events: ['product.reviewed']
			})
			.returning();
		await setProductStatus(STAFF, await productId(), 'active', 'Checked');
		const [delivery] = await ctx().db.select().from(webhookDelivery);
		expect(delivery).toMatchObject({ endpointId: endpoint.id, event: 'product.reviewed' });
		expect(delivery.payload).toMatchObject({ data: { gtin, decision: 'approved' } });

		// Later status changes of an approved drug are not review decisions.
		await setProductStatus(STAFF, await productId(), 'flagged', 'Complaints under review');
		expect(await ctx().db.$count(webhookDelivery)).toBe(1);
	});

	it('requires a reason', async () => {
		await expect(setProductStatus(STAFF, await productId(), 'active', ' ')).rejects.toBeInstanceOf(
			CatalogueError
		);
		expect((await check('PENDING00001')).code).toBe('NOT_COVERED');
	});
});
