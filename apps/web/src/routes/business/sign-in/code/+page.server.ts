import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';
import { audit } from '@deteck/core/server/audit.ts';
import { safeNext } from '@deteck/core/server/next-url.ts';
import { roleLabelFor } from '#lib/server/guards.ts';

export const load: PageServerLoad = ({ url }) => ({ next: url.searchParams.get('next') ?? '' });

type Method = 'totp' | 'backup';

async function verify(event: Parameters<Actions[string]>[0], method: Method) {
	const data = await event.request.formData();
	const code = String(data.get('code') ?? '')
		.replace(/\s+/g, '')
		.slice(0, 40);
	const trustDevice = data.get('trust') === 'on';
	const next = safeNext(data.get('next'));
	const headers = event.request.headers;
	let signedIn: { id: string; name: string } | undefined;
	try {
		const body = { code, trustDevice };
		const result =
			method === 'totp'
				? await auth.api.verifyTOTP({ body, headers })
				: await auth.api.verifyBackupCode({ body, headers });
		signedIn = (result as { user?: { id: string; name: string } }).user;
	} catch (error) {
		if (!(error instanceof APIError)) throw error;
		const expired = /expired|not found|invalid two factor cookie/i.test(error.message);
		return fail(400, {
			method,
			// Kept for the next try: posting to ?/totp replaces the page's own ?next=.
			next: String(data.get('next') ?? ''),
			message: expired
				? 'Your sign-in has timed out. Sign in again with your email and password.'
				: method === 'backup'
					? "That backup code doesn't match, or it has already been used."
					: "That code doesn't match. Check the latest code and try again."
		});
	}
	if (signedIn) {
		await audit(
			{
				userId: signedIn.id,
				label: signedIn.name,
				role: await roleLabelFor(signedIn.id),
				ip: event.getClientAddress(),
				userAgent: headers.get('user-agent')
			},
			{
				area: 'Team and sign-in',
				action: 'signin',
				itemType: 'user',
				itemId: signedIn.id,
				summary: `Signed in (${method === 'totp' ? 'authenticator code' : 'backup code'})`
			}
		);
	}
	redirect(303, next);
}

export const actions: Actions = {
	totp: (event) => verify(event, 'totp'),
	backup: (event) => verify(event, 'backup')
};
