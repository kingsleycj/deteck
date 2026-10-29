import type { PageServerLoad } from './$types';
import { listReceipts } from '@deteck/core/server/business.ts';
import { requireBusiness } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { business: b } = await requireBusiness(event);
	return { rows: await listReceipts(b, 500) };
};
