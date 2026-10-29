import type { PageServerLoad } from './$types';
import { listReports } from '@deteck/core/server/reports.ts';
import { requireManufacturer } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	return { rows: await listReports({ manufacturerId: m.id }) };
};
