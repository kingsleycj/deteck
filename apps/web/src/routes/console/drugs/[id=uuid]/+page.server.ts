import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	CatalogueError,
	productDetail,
	setBatchStatus,
	PRODUCT_CHOICES,
	setProductStatus
} from '@deteck/core/server/catalogue.ts';
import { eq } from 'drizzle-orm';
import { ctx } from '@deteck/core/server/context.ts';
import { product } from '@deteck/core/server/db/schema.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const detail = await productDetail(event.params.id);
	if (!detail) error(404, 'Drug not found.');
	return { detail };
};

export const actions: Actions = {
	productStatus: async (event) => {
		const { actor, role } = requireStaff(event);
		const d = await event.request.formData();
		const status = String(d.get('status')) as 'active' | 'flagged' | 'deactivated';
		if (!PRODUCT_CHOICES.includes(status)) return fail(400, { message: 'Choose a status.' });
		// Reviewers decide new drugs and flag; stopping (or restarting) Valid results for every
		// serial of a live drug is an admin's call, like a batch recall.
		const [current] = await ctx()
			.db.select({ status: product.status })
			.from(product)
			.where(eq(product.id, event.params.id));
		if (
			role !== 'admin' &&
			current?.status !== 'pending_review' &&
			(status === 'deactivated' || current?.status === 'deactivated')
		)
			return fail(403, { message: 'Only a DETECK admin can deactivate or reactivate a drug.' });
		try {
			await setProductStatus(actor, event.params.id, status, String(d.get('reason') ?? ''));
		} catch (err) {
			if (err instanceof CatalogueError) return fail(400, { message: err.message });
			throw err;
		}
		return {
			done:
				status !== 'deactivated'
					? current?.status === 'pending_review' && status === 'active'
						? 'Approved. People can check its serials now.'
						: 'Saved.'
					: current?.status === 'pending_review'
						? 'Rejected. The drug stays hidden from the public.'
						: 'Deactivated. Checks now show "can\'t be confirmed right now".'
		};
	},
	batchStatus: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		try {
			await setBatchStatus(actor, String(d.get('batchId')), {
				status: String(d.get('status')) as 'active' | 'recalled' | 'withdrawn',
				reason: String(d.get('reason') ?? ''),
				source: String(d.get('source') ?? ''),
				effectiveAt: String(d.get('effectiveAt') ?? '')
			});
		} catch (err) {
			if (err instanceof CatalogueError) return fail(400, { message: err.message });
			throw err;
		}
		return { done: 'Batch status saved.' };
	}
};
