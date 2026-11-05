/**
 * Search and sharing (B-85): canonical addresses, the language versions of a page, and structured
 * data. A public page's plain address follows the visitor's language (their earlier choice, then
 * their browser's), so it's the x-default; each language has its own address with ?lang=, which
 * always shows that language.
 */
import type { Locale } from '@deteck/core/messages/i18n.ts';

export const SITE_NAME = 'DETECK';
/** 1200×630, for link previews (WhatsApp, X, LinkedIn, Facebook). */
export const SHARE_IMAGE = '/img/og/deteck-share.png';
/** A square logo for search results (Organization). */
export const LOGO = '/icons/icon-512.png';

const OG_LOCALE: Record<Locale, string> = {
	en: 'en_NG',
	pcm: 'pcm_NG',
	ha: 'ha_NG',
	yo: 'yo_NG',
	ig: 'ig_NG'
};
export const ogLocale = (lang: Locale) => OG_LOCALE[lang];

/** A page's address in one language (with ?lang=), or its plain address when `lang` is null. */
export function localizedUrl(origin: string, path: string, lang: Locale | null): string {
	const url = new URL(path, origin);
	if (lang) url.searchParams.set('lang', lang);
	else url.searchParams.delete('lang');
	return url.href;
}

/** Structured data, safe inside <script type="application/ld+json"> (no "</script>" can close it). */
export function jsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Removes the **bold** markers the dictionaries use, for plain-text places such as structured data. */
export const plainText = (text: string) => text.replace(/\*\*/g, '');
