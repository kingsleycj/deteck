import type { RequestHandler } from './$types';
import { loadResult, publicView } from '@deteck/core/server/verify/check.ts';
import { ApiProblem, caller, handler, json, OPTIONS } from '#lib/server/api.ts';

/** GET /api/v1/checks/{id}: a check result, for 30 minutes after the check. */
export const GET: RequestHandler = handler(async (event) => {
	await caller(event);
	const result = await loadResult(String(event.params.id));
	if (!result) throw new ApiProblem(404, 'not_found', 'This check has expired or does not exist.');
	return json({ id: String(event.params.id), result: publicView(result) });
});

export { OPTIONS };
