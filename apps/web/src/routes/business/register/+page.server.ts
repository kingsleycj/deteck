import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getSiteDocument } from '@deteck/core/server/site-documents.ts';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { consume, ipKey } from '@deteck/core/server/rate-limit.ts';
import { auth } from '#lib/server/app.ts';
import {
	registerManufacturer,
	registrationSchema
} from '@deteck/core/server/manufacturers/register.ts';
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
		// fields' (checked again, with the files, when the company is registered).
		const own: Record<string, string> = {};
		if (password !== String(data.get('confirm') ?? ''))
			own.confirm = "The two passwords don't match.";
		if (data.get('consent') !== 'on')
			own.consent = 'Please confirm you are authorised to register this company.';
		if (Object.keys(own).length) {
			const errors: Record<string, string> = {};
			const parsed = registrationSchema.safeParse({ ...fields, password });
			if (!parsed.success)
				for (const issue of parsed.error.issues)
					errors[String(issue.path[0] ?? 'form')] ??= issue.message;
			if (!(await readFile(data.get('nafdacCertificate'))))
				errors.nafdacCertificate = 'Upload the NAFDAC certificate.';
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
