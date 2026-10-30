import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { runCheck, type Requester } from '@deteck/core/server/verify/check.ts';
import { turnstileSiteKey, verifyTurnstile } from '@deteck/core/server/turnstile.ts';
import { grantHumanPass, requester } from '#lib/server/requester.ts';

const TIMEOUT_MS = 8000;

export const load: PageServerLoad = () => ({});

/** Runs a check, but gives up after 8 seconds so the person isn't left waiting (P1). */
async function check(serial: string, who: Requester) {
	const timeout = new Promise<'timeout'>((resolve) =>
		setTimeout(() => resolve('timeout'), TIMEOUT_MS)
	);
	const outcome = await Promise.race([runCheck(serial, who), timeout]);
	if (outcome === 'timeout') return fail(503, { serial, slow: true });
	if (!outcome.ok) {
		if (outcome.kind === 'format') return fail(400, { serial, problem: outcome.problem });
		// After a limit, offer the "are you human?" check (if Turnstile is set up) to carry on.
		return fail(429, {
			serial,
			retryAfter: outcome.retryAfterSeconds,
			turnstile: turnstileSiteKey()
		});
	}
	redirect(303, `/r/${outcome.id}`);
}

// Named, not "default": SvelteKit doesn't allow a default action next to named ones.
export const actions: Actions = {
	check: async (event) => {
		const data = await event.request.formData();
		return check(String(data.get('serial') ?? '').slice(0, 200), requester(event));
	},
	/** The "are you human?" check passed: remember it for today and run the check. */
	human: async (event) => {
		const data = await event.request.formData();
		const serial = String(data.get('serial') ?? '').slice(0, 200);
		const who = requester(event);
		// No Turnstile set up: there's nothing to pass, so no pass is given (the limits stand).
		if (
			!turnstileSiteKey() ||
			!(await verifyTurnstile(String(data.get('cf-turnstile-response') ?? ''), who.ip))
		)
			return fail(400, { serial, retryAfter: 60, turnstile: turnstileSiteKey() });
		grantHumanPass(event);
		return check(serial, { ...who, human: true });
	}
};
