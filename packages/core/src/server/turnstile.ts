/**
 * Cloudflare Turnstile, the "are you human?" check. It appears only after a device or IP hits a
 * limit (and on sign-up forms), so ordinary people never see it. Off when the keys are empty.
 */
import { ctx } from './context.ts';

export function turnstileSiteKey(): string | null {
	return ctx().config.turnstile?.siteKey ?? null;
}

/** Checks a widget token with Cloudflare. With Turnstile off, everything passes. */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
	const turnstile = ctx().config.turnstile;
	if (!turnstile) return true;
	if (!token) return false;
	try {
		const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
			method: 'POST',
			signal: AbortSignal.timeout(8000),
			// Limits group IPv6 by network ("…::/64"); Cloudflare wants a single address or nothing.
			body: new URLSearchParams({
				secret: turnstile.secretKey,
				response: token,
				...(ip.includes('/') || ip === 'unknown' ? {} : { remoteip: ip })
			})
		});
		const result = (await response.json()) as { success?: boolean };
		return result.success === true;
	} catch (error) {
		console.error('[turnstile] verification failed', error);
		return false;
	}
}
