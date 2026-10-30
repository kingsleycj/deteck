import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	CatalogueError,
	productDetail,
	setBatchStatus,
	updateProduct
} from '@deteck/core/server/catalogue.ts';
import { assertCanEditData, requireManufacturer } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const detail = await productDetail(event.params.id, m.id);
	if (!detail) error(404, 'Drug not found.');
	return { detail };
};

export const actions: Actions = {
	edit: async (event) => {
		const access = await requireManufacturer(event);
		assertCanEditData(access);
		const data = Object.fromEntries((await event.request.formData()).entries()) as Record<
			string,
			string
		>;
		try {
			const changed = await updateProduct(
				access.actor,
				event.params.id,
				access.manufacturer.id,
				data
			);
			return {
				done: changed ? 'Saved. The change is recorded in the audit trail.' : 'Nothing changed.'
			};
		} catch (err) {
			// What was typed stays in the form when something needs fixing.
			if (err instanceof CatalogueError) return fail(400, { message: err.message, values: data });
			throw err;
		}
	},
	batchStatus: async (event) => {
		const access = await requireManufacturer(event);
		if (!access.isAdmin)
			return fail(403, { message: 'Only company admins can recall or withdraw batches.' });
		// Staff working on behalf need the same admin role as in the console.
		if (access.onBehalf && access.staffRole !== 'admin')
			return fail(403, { message: 'Only DETECK admins can change batch status.' });
		const d = await event.request.formData();
		const status = String(d.get('status')) as 'active' | 'recalled' | 'withdrawn';
		// A recall may come from NAFDAC or DETECK, so only DETECK can lift one.
		if (status === 'active' && !access.onBehalf)
			return fail(403, {
				message: 'Only DETECK can reactivate a recalled or withdrawn batch. Contact DETECK.'
			});
		try {
			await setBatchStatus(
				access.actor,
				String(d.get('batchId')),
				{
					status,
					reason: String(d.get('reason') ?? ''),
					source: String(d.get('source') ?? ''),
					effectiveAt: String(d.get('effectiveAt') ?? '')
				},
				access.manufacturer.id
			);
		} catch (err) {
			if (err instanceof CatalogueError) return fail(400, { message: err.message });
			throw err;
		}
		return {
			done:
				status === 'active'
					? 'Batch reactivated.'
					: status === 'withdrawn'
						? 'Saved. Checks of this batch now show it was withdrawn.'
						: 'Saved. Checks of this batch now show the recall.'
		};
	}
};
