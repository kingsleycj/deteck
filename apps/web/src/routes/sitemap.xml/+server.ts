import type { RequestHandler } from './$types';
import { serverContext } from '#lib/server/app.ts';
import { localizedUrl } from '#lib/seo.ts';

/**
 * The public pages for search engines (B-85). Pages in several languages list each version (?lang=)
 * and their plain address (the x-default, which follows the visitor's language), with links between
 * them. Signed-in areas, results and sign-in steps aren't listed (and send noindex).
 */
const PAGES: { path: string; multilingual: boolean }[] = [
	{ path: '/', multilingual: true },
	{ path: '/check', multilingual: true },
	{ path: '/scan', multilingual: true },
	{ path: '/contact', multilingual: true },
	{ path: '/developers', multilingual: false },
	{ path: '/business', multilingual: false },
	{ path: '/business/register', multilingual: false },
	{ path: '/business/register/pharmacy', multilingual: false },
	{ path: '/privacy', multilingual: false },
	{ path: '/terms', multilingual: false }
];

const escape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: RequestHandler = ({ url }) => {
	const languages = serverContext.config.languages;
	const entries: string[] = [];
	for (const { path, multilingual } of PAGES) {
		if (!multilingual || languages.length < 2) {
			entries.push(`<url><loc>${escape(localizedUrl(url.origin, path, null))}</loc></url>`);
			continue;
		}
		const link = (hreflang: string, lang: (typeof languages)[number] | null) =>
			`<xhtml:link rel="alternate" hreflang="${hreflang}" href="${escape(localizedUrl(url.origin, path, lang))}"/>`;
		const alternates = languages.map((lang) => link(lang, lang)).join('') + link('x-default', null);
		for (const lang of [null, ...languages])
			entries.push(
				`<url><loc>${escape(localizedUrl(url.origin, path, lang))}</loc>${alternates}</url>`
			);
	}
	const xml =
		'<?xml version="1.0" encoding="UTF-8"?>\n' +
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
		entries.join('\n') +
		'\n</urlset>\n';
	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=3600'
		}
	});
};
