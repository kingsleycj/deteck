import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { consume, ipKey } from '@deteck/core/server/rate-limit.ts';
import { businessRegistrationSchema, registerBusiness } from '@deteck/core/server/business.ts';
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

const ROLES = ['pharmacy', 'hospital', 'distributor', 'wholesaler'];

/** `?role=hospital` (from the landing page's links) picks the type of business in advance. */
export const load: PageServerLoad = ({ url }) => {
	const role = url.searchParams.get('role') ?? '';
	return { turnstile: turnstileSiteKey(), role: ROLES.includes(role) ? role : '' };
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const values = {
			...(Object.fromEntries(FIELDS.map((f) => [f, String(data.get(f) ?? '')])) as Record<
				(typeof FIELDS)[number],
				string
			>),
			// Kept ticked when the form comes back with something to fix.
			consent: data.get('consent') === 'on' ? 'on' : ''
		};
		if (
			!(await verifyTurnstile(
				String(data.get('cf-turnstile-response') ?? ''),
				event.getClientAddress()
			))
		)
			return fail(400, {
				values,
				errors: { form: 'Please complete the "are you human?" check.' } as Record<string, string>
			});
		const password = String(data.get('password') ?? '');
		const { consent: _consent, ...fields } = values;
		// Everything wrong at once, not one problem per try: the page's own checks, plus the
		// fields' (checked again, with the files, when the business is registered).
		const own: Record<string, string> = {};
		if (password !== String(data.get('confirm') ?? ''))
			own.confirm = "The two passwords don't match.";
		if (data.get('consent') !== 'on')
			own.consent = 'Please confirm you are authorised to register this business.';
		if (Object.keys(own).length) {
			const errors: Record<string, string> = {};
			const parsed = businessRegistrationSchema.safeParse({ ...fields, password });
			if (!parsed.success)
				for (const issue of parsed.error.issues)
					errors[String(issue.path[0] ?? 'form')] ??= issue.message;
			if (!(await readFile(data.get('pcnLicence'))))
				errors.pcnLicenceFile = 'Upload your PCN premises licence.';
			return fail(400, { values, errors: { ...errors, ...own } });
		}
		// Each registration creates an account and emails the applicant and the DETECK team: a
		// network gets a few a day, whether or not Turnstile is set up.
		const limited = await consume([
			{ key: `register:ip:${ipKey(event.getClientAddress())}:day`, windowSeconds: 86400, max: 10 }
		]);
		if (!limited.ok)
			return fail(429, {
				values,
				errors: {
					form: 'Too many registrations from this network today. Try again tomorrow, or contact DETECK.'
				} as Record<string, string>
			});
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
