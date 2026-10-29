import type { RequestHandler } from './$types';
import { buildJourney } from '@deteck/core/server/journey/build.ts';
import { loadResult } from '@deteck/core/server/verify/check.ts';
import { ApiProblem, caller, handler, json, OPTIONS } from '#lib/server/api.ts';

/** GET /api/v1/checks/{id}/journey: the recorded journey of a Valid pack. */
export const GET: RequestHandler = handler(async (event) => {
	await caller(event);
	const result = await loadResult(String(event.params.id));
	if (!result) throw new ApiProblem(404, 'not_found', 'This check has expired or does not exist.');
	if (result.code !== 'VALID')
		throw new ApiProblem(409, 'no_journey', 'Only Valid results have a journey.');
	return json({ id: String(event.params.id), journey: await buildJourney(result) });
});

export { OPTIONS };
