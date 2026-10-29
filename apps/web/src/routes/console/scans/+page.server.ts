import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaff } from '#lib/server/guards.ts';
import {
	ERROR_REASONS,
	labelScan,
	OUTCOME_LABEL,
	REVIEW_LABELS,
	ScanReviewError,
	scanAccuracy,
	scansForReview
} from '@deteck/core/server/scan/review.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const unlabelled = event.url.searchParams.get('show') !== 'all';
	const [scans, accuracy] = await Promise.all([scansForReview({ unlabelled }), scanAccuracy(30)]);
	return {
		unlabelled,
		scans,
		accuracy,
		labels: REVIEW_LABELS,
		outcomes: OUTCOME_LABEL,
		reasons: ERROR_REASONS
	};
};

export const actions: Actions = {
	label: async (event) => {
		const { actor } = requireStaff(event);
		const d = await event.request.formData();
		try {
			await labelScan(
				actor,
				String(d.get('id') ?? ''),
				String(d.get('label') ?? ''),
				String(d.get('note') ?? '')
			);
		} catch (err) {
			if (err instanceof ScanReviewError) return fail(400, { message: err.message });
			throw err;
		}
		return { done: 'Saved. Thanks, this goes into the accuracy figure.' };
	}
};
