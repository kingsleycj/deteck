import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { messages } from '@deteck/core/messages/i18n.ts';
import { requester } from '#lib/server/requester.ts';
import { startScan } from '@deteck/core/server/scan/session.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { loadResult } from '@deteck/core/server/verify/check.ts';

export const load: PageServerLoad = async (event) => {
	const from = event.url.searchParams.get('from') ?? '';
	const result = await loadResult(from);
	if (!result) redirect(303, '/scan');
	const enabled = requester(event).packagingEnabled;
	if (result.code !== 'VALID' || !result.packagingAvailable || !enabled)
		redirect(303, `/r/${from}`);
	return {
		from,
		product: `${result.product!.brandName} ${result.product!.strength}`,
		serial: result.serialDisplay,
		lot: result.batch!.lot
	};
};

export const actions: Actions = {
	default: async (event) => {
		const from = event.url.searchParams.get('from') ?? '';
		const data = await event.request.formData();
		const outcome = await startScan(
			requester(event),
			from,
			{
				front: await readFile(data.get('front')),
				back: await readFile(data.get('back')),
				label: await readFile(data.get('label'))
			},
			data.get('retain') === 'on',
			messages(event.locals.lang)
		);
		if (!outcome.ok)
			return fail(outcome.status, { side: outcome.side ?? null, message: outcome.message });
		redirect(303, `/scan/${outcome.id}`);
	}
};
