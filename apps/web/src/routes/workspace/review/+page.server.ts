import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
import { submitForReview } from '@deteck/core/server/manufacturers/golive.ts';
import { ReviewError } from '@deteck/core/server/manufacturers/review.ts';
import { goLiveChecklist } from '@deteck/core/server/manufacturers/summary.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	return { checklist: await goLiveChecklist(m.id) };
};

export const actions: Actions = {
	submit: async (event) => {
		const access = await requireManufacturer(event);
		if (!access.isAdmin)
			return fail(403, { message: 'Only company admins can submit for review.' });
		try {
			await submitForReview(access.actor, access.manufacturer.id);
		} catch (error) {
			if (error instanceof ReviewError) return fail(400, { message: error.message });
			throw error;
		}
		return { submitted: true };
	}
};
