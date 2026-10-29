import type { PageServerLoad } from './$types';
import { listReports, reportCounts } from '@deteck/core/server/reports.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const status = event.url.searchParams.get('status') ?? 'open';
	const rows = await listReports(status === 'open' || status === 'all' ? {} : { status });
	return {
		status,
		counts: await reportCounts(),
		rows: status === 'open' ? rows.filter((r) => r.status !== 'closed') : rows
	};
};
