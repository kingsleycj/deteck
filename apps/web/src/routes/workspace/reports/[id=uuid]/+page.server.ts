import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { reportForManufacturer } from '@deteck/core/server/reports.ts';
import { requireManufacturer } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const detail = await reportForManufacturer(event.params.id, m.id);
	if (!detail) error(404, 'Report not found.');
	const { serialKeyHmac: _s, ...report } = detail.report;
	return { report, productName: detail.productName };
};
