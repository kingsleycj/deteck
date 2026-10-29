import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
import { addDocument, type DocumentKind } from '@deteck/core/server/manufacturers/documents.ts';
import { resubmitApplication, ReviewError } from '@deteck/core/server/manufacturers/review.ts';
import { documentsFor } from '@deteck/core/server/manufacturers/summary.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { getSiteDocument } from '@deteck/core/server/site-documents.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	return {
		details: {
			companyName: m.companyName,
			address: m.address,
			state: m.state,
			factoryTown: m.factoryTown,
			nafdacCompanyReg: m.nafdacCompanyReg,
			cacRc: m.cacRc,
			contactName: m.contactName,
			contactEmail: m.contactEmail,
			contactPhone: m.contactPhone
		},
		documents: await documentsFor(m.id),
		agreementTemplate: Boolean(await getSiteDocument('agreement_template'))
	};
};

export const actions: Actions = {
	upload: async (event) => {
		const access = await requireManufacturer(event);
		if (!access.isAdmin) return fail(403, { message: 'Only company admins can upload documents.' });
		const data = await event.request.formData();
		const kind = String(data.get('kind') ?? 'other') as DocumentKind;
		const valid: DocumentKind[] = ['nafdac_certificate', 'data_sharing_agreement', 'other'];
		const result = await addDocument(
			access.actor,
			access.manufacturer.id,
			valid.includes(kind) ? kind : 'other',
			await readFile(data.get('file'))
		);
		if (!result.ok) return fail(400, { message: result.message });
		return { uploaded: true };
	},
	resubmit: async (event) => {
		const access = await requireManufacturer(event);
		if (!access.isAdmin)
			return fail(403, { message: 'Only company admins can send the application back.' });
		const data = await event.request.formData();
		try {
			await resubmitApplication(
				access.actor,
				access.manufacturer.id,
				String(data.get('note') ?? '')
			);
		} catch (error) {
			if (error instanceof ReviewError) return fail(400, { message: error.message });
			throw error;
		}
		return { resubmitted: true };
	}
};
