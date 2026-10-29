import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	businessDocuments,
	BusinessError,
	resubmitBusiness
} from '@deteck/core/server/business.ts';
import { addDocument, type DocumentKind } from '@deteck/core/server/manufacturers/documents.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { requireBusiness } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { business: b } = await requireBusiness(event);
	return {
		details: {
			address: b.address,
			pcnLicence: b.pcnLicence,
			cacRc: b.cacRc,
			gln: b.gln,
			contactName: b.contactName,
			contactEmail: b.contactEmail,
			contactPhone: b.contactPhone
		},
		documents: await businessDocuments(b.id)
	};
};

export const actions: Actions = {
	upload: async (event) => {
		const access = await requireBusiness(event);
		if (!access.isAdmin) return fail(403, { message: 'Only admins can upload documents.' });
		const data = await event.request.formData();
		const kind = String(data.get('kind') ?? 'other') as DocumentKind;
		const result = await addDocument(
			access.actor,
			{ businessId: access.business.id },
			['pcn_premises_licence', 'cac_certificate', 'other'].includes(kind) ? kind : 'other',
			await readFile(data.get('file'))
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { done: 'Document uploaded.' };
	},
	resubmit: async (event) => {
		const access = await requireBusiness(event);
		if (!access.isAdmin) return fail(403, { message: 'Only admins can answer DETECK.' });
		const data = await event.request.formData();
		try {
			await resubmitBusiness(access.actor, access.business.id, String(data.get('note') ?? ''));
		} catch (error) {
			if (error instanceof BusinessError) return fail(400, { message: error.message });
			throw error;
		}
		return { done: 'Sent back to DETECK. A reviewer will look at it again.' };
	}
};
