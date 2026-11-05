import type { RequestHandler } from './$types';

/**
 * What crawlers may fetch (B-85). The signed-in areas and the API are off limits. Results, alerts
 * and sign-in steps aren't blocked here on purpose: links to them get shared, and a crawler has to
 * be able to fetch them to read their noindex header (hooks.server.ts) and drop them.
 */
export const GET: RequestHandler = ({ url }) =>
	new Response(
		[
			'User-agent: *',
			'Disallow: /console',
			'Disallow: /workspace',
			'Disallow: /portal',
			'Disallow: /files/',
			'Disallow: /api/',
			'Allow: /',
			'',
			`Sitemap: ${url.origin}/sitemap.xml`,
			''
		].join('\n'),
		{
			headers: {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'public, max-age=3600'
			}
		}
	);
