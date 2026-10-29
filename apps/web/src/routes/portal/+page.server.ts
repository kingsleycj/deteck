import type { PageServerLoad } from './$types';
import { listReceipts, recalledStock } from '@deteck/core/server/business.ts';
import { requireBusiness } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { business: b } = await requireBusiness(event);
	const [receipts, recalled] = await Promise.all([listReceipts(b, 5), recalledStock(b)]);
	return { receipts, recalled };
};
