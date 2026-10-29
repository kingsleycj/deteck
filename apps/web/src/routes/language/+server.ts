import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isLocale } from '@deteck/core/messages/i18n.ts';
import { serverContext } from '#lib/server/app.ts';
import { LANG_COOKIE, langCookieOptions } from '#lib/server/lang.ts';

/** The language menu posts here (it works without JavaScript), then goes back to the page. */
export const POST: RequestHandler = async ({ request, cookies }) => {
	const data = await request.formData();
	const lang = data.get('lang');
	if (isLocale(lang) && serverContext.config.languages.includes(lang))
		cookies.set(LANG_COOKIE, lang, langCookieOptions);
	const next = String(data.get('next') ?? '/');
	// Only a path on this site, never another address.
	redirect(303, /^\/(?!\/)[^\s\\]*$/.test(next) ? next : '/');
};
