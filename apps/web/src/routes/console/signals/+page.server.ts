import type { PageServerLoad } from './$types';
import { requireStaff } from '#lib/server/guards.ts';
import { signals } from '@deteck/core/server/insights.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const days = [1, 7, 30].includes(Number(event.url.searchParams.get('days')))
		? Number(event.url.searchParams.get('days'))
		: 7;
	return { days, rows: [...(await signals({ days }))] };
};
