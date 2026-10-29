import {
	BusinessError,
	getBusiness,
	MAX_BATCH_CHECK,
	recordReceipts
} from '@deteck/core/server/business.ts';
import { ApiProblem, body, caller, handler, json } from '#lib/server/api.ts';

/**
 * POST /api/v1/business/receipts
 * { "codes": ["…"], "receivedOn": "2026-10-26", "supplier": "Lakeside Medical Supply" }
 * Records the Valid packs as received by your business.
 */
export const POST = handler(async (event) => {
	const { key, actor } = await caller(event, 'business:receive');
	const b = await getBusiness(key!.businessId!);
	if (!b) throw new ApiProblem(404, 'not_found', 'Business not found.');
	const input = await body<{ codes?: unknown; receivedOn?: string; supplier?: string }>(event);
	if (!Array.isArray(input.codes) || input.codes.length === 0)
		throw new ApiProblem(400, 'missing_codes', 'Send { "codes": ["…"] }.');
	if (input.codes.length > MAX_BATCH_CHECK)
		throw new ApiProblem(400, 'too_many', `Send at most ${MAX_BATCH_CHECK} codes at a time.`);
	try {
		return json(
			await recordReceipts(actor, b, input.codes.map(String), {
				receivedOn: input.receivedOn,
				supplierName: input.supplier
			})
		);
	} catch (error) {
		if (error instanceof BusinessError) throw new ApiProblem(400, 'invalid_request', error.message);
		throw error;
	}
});
