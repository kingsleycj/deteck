import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { auth } from '#lib/server/app.ts';
import { consume, ipKey } from '@deteck/core/server/rate-limit.ts';

export const load: PageServerLoad = () => ({ turnstile: turnstileSiteKey() });

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const email = String(data.get('email') ?? '')
			.trim()
			.toLowerCase()
			.slice(0, 200);
		if (!email.includes('@')) return fail(400, { email, message: 'Enter your work email.' });
		if (
			!(await verifyTurnstile(
				String(data.get('cf-turnstile-response') ?? ''),
				event.getClientAddress()
			))
		)
			return fail(400, { email, message: 'Please complete the "are you human?" check.' });
		// Per address, and per network so one sender can't mail every inbox it knows.
		const limited = await consume([
			{ key: `reset:${email}`, windowSeconds: 3600, max: 5 },
			{ key: `reset:ip:${ipKey(event.getClientAddress())}:h`, windowSeconds: 3600, max: 20 }
		]);
		// Always the same answer, so the page never reveals whether an account exists.
		if (limited.ok) {
			await auth.api
				.requestPasswordReset({ body: { email, redirectTo: '/business/reset-password' } })
				.catch((error) => console.error('[reset] request failed', error));
		}
		return { sent: true, email };
	}
};
