import type { PageServerLoad } from './$types';
import { listBusinesses } from '@deteck/core/server/business.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const status = event.url.searchParams.get('status') ?? '';
	return { status, rows: await listBusinesses(status || undefined) };
};
