import { dev } from '$app/env';

/** Remembers the visitor's language for a year. It holds nothing else. */
export const LANG_COOKIE = 'dtk_lang';
export const langCookieOptions = {
	path: '/',
	maxAge: 365 * 24 * 3600,
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: !dev
};
