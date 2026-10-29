import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';
import { audit } from '@deteck/core/server/audit.ts';
import { safeNext } from '@deteck/core/server/next-url.ts';
import {
	clearCounter,
	consume,
	ipKey,
	isLocked,
	recentCount,
	setLock
} from '@deteck/core/server/rate-limit.ts';

const LOCK_WINDOW = 30 * 60;
const MAX_TRIES = 5;

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user?.twoFactorEnabled) redirect(303, safeNext(url.searchParams.get('next')));
	return { next: url.searchParams.get('next') ?? '', notice: url.searchParams.get('notice') ?? '' };
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase()
			.slice(0, 200);
		const password = String(data.get('password') ?? '').slice(0, 200);
		const next = safeNext(data.get('next'));
		let address = 'unknown';
		try {
			address = ipKey(event.getClientAddress());
		} catch {
			// Not available in some test set-ups.
		}
		// Failures count per account *and* network: someone elsewhere can't lock you out by typing
		// wrong passwords for your email. A password alone never opens an account anyway (the
		// authenticator code is always needed), and each network gets a few dozen tries an hour.
		const failuresKey = `signin:${email}:${address}`;
		const lockKey = `signin-lock:${email}:${address}`;

		if (await isLocked(lockKey, LOCK_WINDOW)) {
			return fail(429, { email, locked: true, message: '' });
		}
		const throttled = await consume([
			{ key: `signin:ip:${address}:h`, windowSeconds: 3600, max: 50 }
		]);
		if (!throttled.ok)
			return fail(429, {
				email,
				locked: false,
				message: 'Too many sign-in attempts from your network. Try again in a little while.'
			});

		let needsCode: boolean;
		try {
			const result = await auth.api.signInEmail({
				body: { email, password, rememberMe: data.get('remember') === 'on' },
				headers: event.request.headers
			});
			needsCode = 'twoFactorRedirect' in result && Boolean(result.twoFactorRedirect);
		} catch (error) {
			if (!(error instanceof APIError)) throw error;
			await consume([{ key: failuresKey, windowSeconds: LOCK_WINDOW, max: MAX_TRIES }]);
			const used = await recentCount(failuresKey, LOCK_WINDOW);
			if (used >= MAX_TRIES) {
				// The lock runs a full 30 minutes from now, and the failures start again from zero.
				await setLock(lockKey);
				await clearCounter(failuresKey);
				await audit(
					{
						userId: null,
						label: email,
						role: 'Unknown',
						ip: event.getClientAddress(),
						userAgent: event.request.headers.get('user-agent')
					},
					{
						area: 'Team and sign-in',
						action: 'signin_locked',
						itemType: 'account',
						itemId: email,
						summary: `Account ${email} locked for 30 minutes after ${MAX_TRIES} failed sign-ins`
					}
				);
				return fail(429, { email, locked: true, message: '' });
			}
			const left = MAX_TRIES - used;
			return fail(400, {
				email,
				locked: false,
				message: `That email and password don't match. You have ${left} ${left === 1 ? 'try' : 'tries'} left before sign-in is paused for 30 minutes on this network.`
			});
		}

		await clearCounter(failuresKey);
		redirect(303, needsCode ? `/business/sign-in/code?next=${encodeURIComponent(next)}` : next);
	}
};
