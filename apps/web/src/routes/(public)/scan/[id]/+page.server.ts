import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildJourney } from '@deteck/core/server/journey/build.ts';
import { loadScan } from '@deteck/core/server/scan/session.ts';
import { publicView } from '@deteck/core/server/verify/check.ts';

export const load: PageServerLoad = async ({ params, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const found = await loadScan(params.id);
	// The result behind the scan lasts 30 minutes; without it the page can't say what was checked.
	if (!found || !found.result) error(404, 'This scan has expired. Check the serial again.');
	const { session, result } = found;
	const journey =
		result && result.code === 'VALID' && result.journeyAvailable
			? await buildJourney(result)
			: null;
	// A job that hasn't finished in two minutes is reported as "Can't tell" rather than left spinning.
	const waiting = ['collecting', 'queued', 'processing'].includes(session.status);
	const stale = waiting && Date.now() - session.createdAt.getTime() > 120_000;
	return {
		status: stale ? 'done' : session.status,
		outcome: stale ? 'CANT_TELL' : session.outcome,
		categories: (session.categories ?? []).map((c) => ({
			category: c.category,
			side: c.detail.split(':')[0]
		})),
		verificationId: session.verificationId,
		result: result && publicView(result),
		journey
	};
};
