import type { PageServerLoad } from './$types';
import { statusCounts } from '@deteck/core/server/console/manufacturers.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { requireStaff } from '#lib/server/guards.ts';
import { auditPage, insights, rangeFromDays, signals } from '@deteck/core/server/insights.ts';
import { sql } from 'drizzle-orm';
import { scanAccuracy } from '@deteck/core/server/scan/review.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const days = [1, 7, 30, 90].includes(Number(event.url.searchParams.get('days')))
		? Number(event.url.searchParams.get('days'))
		: 30;
	const range = rangeFromDays(days);
	const [data, counts, recent, flagged, catalogue, scans] = await Promise.all([
		insights(range),
		statusCounts(),
		auditPage({}, 1, 6),
		signals({ days: 7 }),
		ctx().db.execute<{ products: number; serials: number; with_packaging: number }>(sql`
			select (select count(*)::int from product) as products,
				(select count(*)::int from pack) as serials,
				(select count(distinct product_id)::int from packaging_reference where status = 'ready') as with_packaging`),
		scanAccuracy(days)
	]);
	return {
		days,
		insights: data,
		counts,
		recent: recent.rows,
		signals: flagged.length,
		catalogue: catalogue[0],
		scans
	};
};
