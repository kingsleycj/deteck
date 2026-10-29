import { coverage } from '@deteck/core/server/verify/lookup.ts';
import { caller, handler, json, OPTIONS } from '#lib/server/api.ts';

/** GET /api/v1/coverage: how many live manufacturers and drugs DETECK has records for. */
export const GET = handler(async (event) => {
	await caller(event);
	return json(await coverage());
});

export { OPTIONS };
