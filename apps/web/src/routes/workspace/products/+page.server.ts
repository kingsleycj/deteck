import type { PageServerLoad } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
import { productRows } from '@deteck/core/server/manufacturers/summary.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	return { products: await productRows(m.id) };
};
