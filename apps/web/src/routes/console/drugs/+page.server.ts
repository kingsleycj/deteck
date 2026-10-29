import type { PageServerLoad } from './$types';
import { searchProducts } from '@deteck/core/server/catalogue.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const q = event.url.searchParams.get('q') ?? '';
	const [rows, waiting] = await Promise.all([
		searchProducts(q),
		searchProducts('', 100, 'pending_review')
	]);
	return { q, rows: [...rows], waiting: [...waiting] };
};
