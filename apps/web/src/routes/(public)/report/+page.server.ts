import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { NIGERIAN_STATES } from '@deteck/core/nigeria.ts';
import { createReport, MAX_REPORT_PHOTOS, ReportError } from '@deteck/core/server/reports.ts';
import { readFile, type UploadedFile } from '@deteck/core/server/uploads.ts';
import { loadResult } from '@deteck/core/server/verify/check.ts';
import { fmt, messages } from '@deteck/core/messages/i18n.ts';
import { requester } from '#lib/server/requester.ts';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const from = url.searchParams.get('from') ?? '';
	const result = from ? await loadResult(from) : null;
	return {
		from: result ? from : '',
		drug: result?.product ? `${result.product.brandName} ${result.product.strength}` : null,
		maker: result?.manufacturer?.name ?? null,
		states: NIGERIAN_STATES,
		maxPhotos: MAX_REPORT_PHOTOS
	};
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const value = (k: string) => String(data.get(k) ?? '');
		const photos: UploadedFile[] = [];
		for (const entry of data.getAll('photos').slice(0, MAX_REPORT_PHOTOS)) {
			const file = await readFile(entry);
			if (file) photos.push(file);
		}
		const input = {
			verificationId: value('from') || undefined,
			productDescription: value('productDescription'),
			placeName: value('placeName'),
			state: value('state'),
			town: value('town'),
			boughtOn: value('boughtOn'),
			details: value('details'),
			contactName: value('contactName'),
			contactEmail: value('contactEmail'),
			contactPhone: value('contactPhone'),
			shareConsent: data.get('shareConsent') === 'on'
		};
		try {
			const who = requester(event);
			await createReport({ deviceId: who.deviceId, ip: who.ip }, input, photos);
		} catch (error) {
			if (error instanceof ReportError) {
				const t = messages(event.locals.lang);
				const message = error.code ? fmt(t.report.errors[error.code], error.params) : error.message;
				return fail(400, { message, values: { ...input, photos: undefined } });
			}
			throw error;
		}
		redirect(303, '/report/thanks');
	}
};
