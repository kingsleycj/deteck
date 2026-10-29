import type { PageServerLoad } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
import {
	checksOfProducts,
	goLiveChecklist,
	manufacturerCounts,
	productRows,
	recentImports
} from '@deteck/core/server/manufacturers/summary.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const [counts, products, imports, checklist, checks] = await Promise.all([
		manufacturerCounts(m.id),
		productRows(m.id),
		recentImports(m.id),
		goLiveChecklist(m.id),
		checksOfProducts(m.id)
	]);
	return {
		counts,
		products,
		imports,
		checklist,
		checks,
		reviewNote: m.reviewNote,
		wentLiveAt: m.wentLiveAt
	};
};
