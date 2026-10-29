import type { PageServerLoad } from './$types';
import { listBusinesses } from '@deteck/core/server/business.ts';
import { listManufacturers } from '@deteck/core/server/console/manufacturers.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const [pending, infoRequested, inReview, rejected, businessPending] = await Promise.all([
		listManufacturers({ status: 'pending' }),
		listManufacturers({ status: 'info_requested' }),
		listManufacturers({ status: 'in_review' }),
		listManufacturers({ status: 'rejected' }),
		listBusinesses('pending')
	]);
	return { pending, infoRequested, inReview, rejected, businessPending };
};
