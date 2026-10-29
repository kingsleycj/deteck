import type { PageServerLoad } from './$types';
import { AUDIT_AREAS, auditFilterFromUrl } from '@deteck/core/server/audit-filter.ts';
import { requireStaff } from '#lib/server/guards.ts';
import { auditActors, auditPage } from '@deteck/core/server/insights.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const { filter, range, page } = auditFilterFromUrl(event.url);
	const [result, actors] = await Promise.all([auditPage(filter, page), auditActors()]);
	return {
		...result,
		actors: [...actors],
		areas: AUDIT_AREAS,
		range,
		query: event.url.searchParams.toString(),
		filter: {
			q: filter.q ?? '',
			area: filter.area ?? '',
			action: filter.action ?? '',
			actor: filter.actor ?? ''
		}
	};
};
