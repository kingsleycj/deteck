import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSiteDocument, setSiteDocument } from '@deteck/core/server/site-documents.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event, ['admin']);
	return { agreement: await getSiteDocument('agreement_template') };
};

export const actions: Actions = {
	agreement: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		const result = await setSiteDocument(
			actor,
			'agreement_template',
			await readFile(d.get('file'))
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { done: 'Published. Manufacturers can download it from their company page.' };
	}
};
