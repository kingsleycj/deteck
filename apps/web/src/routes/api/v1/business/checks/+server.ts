import {
	BusinessError,
	checkDelivery,
	getBusiness,
	MAX_BATCH_CHECK
} from '@deteck/core/server/business.ts';
import { publicView } from '@deteck/core/server/verify/check.ts';
import { ApiProblem, body, caller, handler, json } from '#lib/server/api.ts';

/** POST /api/v1/business/checks: { "codes": ["…", …] }, up to 500 serials or scanned codes. */
export const POST = handler(async (event) => {
	const { key } = await caller(event, 'business:verify');
	const b = await getBusiness(key!.businessId!);
	if (!b) throw new ApiProblem(404, 'not_found', 'Business not found.');
	const input = await body<{ codes?: unknown }>(event);
	if (!Array.isArray(input.codes) || input.codes.length === 0)
		throw new ApiProblem(400, 'missing_codes', 'Send { "codes": ["…"] }.');
	if (input.codes.length > MAX_BATCH_CHECK)
		throw new ApiProblem(400, 'too_many', `Send at most ${MAX_BATCH_CHECK} codes at a time.`);
	try {
		const lines = await checkDelivery(b, input.codes.map(String));
		return json({
			results: lines.map((l) => ({
				input: l.input,
				problem: l.problem ?? null,
				result: l.result ? publicView(l.result) : null,
				heldElsewhere: l.heldElsewhere ?? null
			}))
		});
	} catch (error) {
		if (error instanceof BusinessError) throw new ApiProblem(403, 'not_allowed_now', error.message);
		throw error;
	}
});
