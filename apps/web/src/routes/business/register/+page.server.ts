import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSiteDocument } from '@deteck/core/server/site-documents.ts';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { auth } from '#lib/server/app.ts';
import { registerManufacturer } from '@deteck/core/server/manufacturers/register.ts';
import { readFile } from '@deteck/core/server/uploads.ts';

const FIELDS = [
	'companyName',
	'address',
	'state',
	'factoryTown',
	'nafdacCompanyReg',
	'cacRc',
	'contactName',
	'contactEmail',
	'contactPhone'
] as const;

export const load: PageServerLoad = async () => ({
	turnstile: turnstileSiteKey(),
	agreementTemplate: Boolean(await getSiteDocument('agreement_template'))
});

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		if (
			!(await verifyTurnstile(
				String(data.get('cf-turnstile-response') ?? ''),
				event.getClientAddress()
			))
		)
			return fail(400, {
				values: {} as Record<string, string>,
				errors: { form: 'Please complete the "are you human?" check.' } as Record<string, string>
			});
		const values = {
			...(Object.fromEntries(FIELDS.map((f) => [f, String(data.get(f) ?? '')])) as Record<
				(typeof FIELDS)[number],
				string
			>),
			// Kept ticked when the form comes back with something to fix.
			consent: data.get('consent') === 'on' ? 'on' : ''
		};
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');
		if (password !== confirm) {
			return fail(400, {
				values,
				errors: { confirm: "The two passwords don't match." } as Record<string, string>
			});
		}
		if (data.get('consent') !== 'on') {
			return fail(400, {
				values,
				errors: {
					consent: 'Please confirm you are authorised to register this company.'
				} as Record<string, string>
			});
		}
		const { consent: _consent, ...fields } = values;
		const result = await registerManufacturer(
			auth,
			{ ...fields, password },
			{
				nafdacCertificate: await readFile(data.get('nafdacCertificate')),
				agreement: await readFile(data.get('agreement'))
			},
			{ ip: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') }
		);
		if (!result.ok) return fail(400, { values, errors: result.errors });
		redirect(303, '/business/sign-in?notice=registered');
	}
};
