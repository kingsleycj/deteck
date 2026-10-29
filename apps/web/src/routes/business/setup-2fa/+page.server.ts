import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import QRCode from 'qrcode';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';
import { audit } from '@deteck/core/server/audit.ts';
import { roleLabelFor } from '#lib/server/guards.ts';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.user) redirect(303, '/business/sign-in');
	if (locals.user.twoFactorEnabled) redirect(303, '/business/home');
	return { name: locals.user.name, email: locals.user.email };
};

async function qrFor(uri: string) {
	return QRCode.toString(uri, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}

function secretFrom(uri: string) {
	return new URL(uri).searchParams.get('secret') ?? '';
}

export const actions: Actions = {
	start: async (event) => {
		const data = await event.request.formData();
		const password = String(data.get('password') ?? '');
		try {
			const result = await auth.api.enableTwoFactor({
				body: { password },
				headers: event.request.headers
			});
			if (!('totpURI' in result))
				return fail(500, {
					step: 'password' as const,
					message: 'Could not start set-up. Try again.'
				});
			return {
				step: 'verify' as const,
				uri: result.totpURI,
				qr: await qrFor(result.totpURI),
				secret: secretFrom(result.totpURI),
				backupCodes: result.backupCodes
			};
		} catch (error) {
			if (!(error instanceof APIError)) throw error;
			return fail(400, { step: 'password' as const, message: "That password doesn't match." });
		}
	},
	verify: async (event) => {
		const data = await event.request.formData();
		const code = String(data.get('code') ?? '').replace(/\s+/g, '');
		const uri = String(data.get('uri') ?? '');
		const backupCodes = String(data.get('backup') ?? '')
			.split(',')
			.filter(Boolean);
		try {
			await auth.api.verifyTOTP({ body: { code }, headers: event.request.headers });
		} catch (error) {
			if (!(error instanceof APIError)) throw error;
			return fail(400, {
				step: 'verify' as const,
				uri,
				qr: uri.startsWith('otpauth://') ? await qrFor(uri) : '',
				secret: uri.startsWith('otpauth://') ? secretFrom(uri) : '',
				backupCodes,
				message: "That code doesn't match. Use the latest code from your app."
			});
		}
		const user = event.locals.user!;
		await audit(
			{
				userId: user.id,
				label: user.name,
				role: await roleLabelFor(user.id),
				ip: event.getClientAddress(),
				userAgent: event.request.headers.get('user-agent')
			},
			{
				area: 'Team and sign-in',
				action: 'two_factor_enabled',
				itemType: 'user',
				itemId: user.id,
				summary: 'Set up two-step sign-in'
			}
		);
		redirect(303, '/business/home');
	}
};
