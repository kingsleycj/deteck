import type { RequestHandler } from './$types';
import { loadJob, readProblemRows } from '@deteck/core/server/imports/engine.ts';
import { ApiProblem, caller, handler, json } from '#lib/server/api.ts';

/** GET /api/v1/manufacturer/imports/{id}: status, counts and the first 100 problem rows. */
export const GET: RequestHandler = handler(async (event) => {
	const { key } = await caller(event, 'manufacturer:read');
	const job = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		String(event.params.id)
	)
		? await loadJob(String(event.params.id), key!.manufacturerId!)
		: null;
	if (!job) throw new ApiProblem(404, 'not_found', 'Import not found.');
	return json({
		id: job.id,
		kind: job.kind,
		status: job.status,
		source: job.source,
		counts: job.counts ?? {},
		error: job.error,
		createdAt: job.createdAt,
		committedAt: job.committedAt,
		problems: await readProblemRows(job, 100)
	});
});
