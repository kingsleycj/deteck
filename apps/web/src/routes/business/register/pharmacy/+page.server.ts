import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { registerBusiness } from '@deteck/core/server/business.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { auth } from '#lib/server/app.ts';

const FIELDS = [
	'name',
	'role',
	'address',
	'state',
	'town',
	'pcnLicence',
	'cacRc',
	'gln',
	'contactName',
	'contactEmail',
	'contactPhone'
] as const;

export const load: PageServerLoad = () => ({ turnstile: turnstileSiteKey() });

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
		if (password !== String(data.get('confirm') ?? ''))
			return fail(400, {
				values,
				errors: { confirm: "The two passwords don't match." } as Record<string, string>
			});
		if (data.get('consent') !== 'on')
			return fail(400, {
				values,
				errors: {
					consent: 'Please confirm you are authorised to register this business.'
				} as Record<string, string>
			});
		const { consent: _consent, ...fields } = values;
		const result = await registerBusiness(
			auth,
			{ ...fields, password },
			{ pcnLicence: await readFile(data.get('pcnLicenceFile')) },
			{ ip: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') }
		);
		if (!result.ok) return fail(400, { values, errors: result.errors });
		redirect(303, '/business/sign-in?notice=registered');
	}
};
