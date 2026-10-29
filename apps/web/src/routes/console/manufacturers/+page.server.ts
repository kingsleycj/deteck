import type { PageServerLoad } from './$types';
import { listManufacturers, statusCounts } from '@deteck/core/server/console/manufacturers.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const status = event.url.searchParams.get('status') ?? undefined;
	const q = event.url.searchParams.get('q') ?? undefined;
	const [rows, counts] = await Promise.all([listManufacturers({ status, q }), statusCounts()]);
	return { rows, counts, status: status ?? '', q: q ?? '' };
};
