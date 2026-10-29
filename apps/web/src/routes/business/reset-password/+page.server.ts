import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';

export const load: PageServerLoad = ({ url }) => ({ token: url.searchParams.get('token') ?? '' });

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const token = String(data.get('token') ?? '');
		const password = String(data.get('password') ?? '');
		const confirm = String(data.get('confirm') ?? '');
		if (password.length < 10) return fail(400, { token, message: 'Use at least 10 characters.' });
		if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
			return fail(400, { token, message: 'Include at least one number and one symbol.' });
		}
		if (password !== confirm)
			return fail(400, { token, message: "The two passwords don't match." });
		try {
			await auth.api.resetPassword({ body: { newPassword: password, token } });
		} catch (error) {
			if (!(error instanceof APIError)) throw error;
			return fail(400, {
				token,
				expired: true,
				message: 'This reset link has expired. Links work once, for 30 minutes.'
			});
		}
		redirect(303, '/business/sign-in?notice=password-updated');
	}
};
