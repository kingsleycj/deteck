import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getSiteDocument,
	SITE_DOCUMENTS,
	type SiteDocumentKey
} from '@deteck/core/server/site-documents.ts';
import { getObject } from '@deteck/core/server/storage.ts';
import { requireUser } from '#lib/server/guards.ts';

/** Files DETECK publishes. The blank agreement is public: manufacturers sign it before registering. */
export const GET: RequestHandler = async (event) => {
	const key = event.params.key as SiteDocumentKey;
	if (!(key in SITE_DOCUMENTS)) error(404, 'Not found.');
	if (key !== 'agreement_template') requireUser(event);
	const doc = await getSiteDocument(key);
	if (!doc) error(404, 'DETECK has not published this file yet.');
	const body = await getObject(doc.fileKey);
	return new Response(new Uint8Array(body), {
		headers: {
			'content-type': doc.contentType,
			'content-disposition': `attachment; filename="${doc.fileName.replace(/[^A-Za-z0-9._-]/g, '_')}"`,
			'cache-control': 'private, no-store'
		}
	});
};
