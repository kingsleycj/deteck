import { and, eq, sql } from 'drizzle-orm';
import { toGtin14 } from '@deteck/core/gs1/gtin.ts';
import { CatalogueError, setBatchStatus } from '@deteck/core/server/catalogue.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { batch, product } from '@deteck/core/server/db/schema.ts';
import { ApiProblem, body, caller, handler, json } from '#lib/server/api.ts';

/**
 * POST /api/v1/manufacturer/batch-status
 * { "gtin": "…", "lot": "…", "status": "recalled" | "withdrawn", "reason": "…", "source": "NAFDAC" }
 * Only DETECK can reactivate a batch.
 */
export const POST = handler(async (event) => {
	const { key, actor } = await caller(event, 'manufacturer:write');
	const input = await body<Record<string, string>>(event);
	if (!['recalled', 'withdrawn'].includes(input.status))
		throw new ApiProblem(400, 'invalid_status', '"status" must be "recalled" or "withdrawn".');
	const gtin = toGtin14(String(input.gtin ?? ''));
	if (!gtin) throw new ApiProblem(400, 'invalid_gtin', 'Send a valid GTIN.');
	const [row] = await ctx()
		.db.select({ id: batch.id })
		.from(batch)
		.innerJoin(product, eq(product.id, batch.productId))
		.where(
			and(
				eq(product.gtin, gtin),
				eq(product.manufacturerId, key!.manufacturerId!),
				// Batch numbers match without regard to capitals, as everywhere else on DETECK.
				sql`upper(${batch.lot}) = upper(${String(input.lot ?? '').trim()})`
			)
		);
	if (!row) throw new ApiProblem(404, 'not_found', 'No batch with that GTIN and batch number.');
	try {
		await setBatchStatus(
			actor,
			row.id,
			{
				status: input.status as 'recalled' | 'withdrawn',
				reason: String(input.reason ?? ''),
				source: String(input.source ?? ''),
				effectiveAt: input.effectiveAt
			},
			key!.manufacturerId!
		);
	} catch (error) {
		if (error instanceof CatalogueError)
			throw new ApiProblem(400, 'invalid_request', error.message);
		throw error;
	}
	return json({ ok: true, status: input.status });
});
