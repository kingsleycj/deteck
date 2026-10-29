import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { reportPhotoKey } from '@deteck/core/server/reports.ts';
import { getObject } from '@deteck/core/server/storage.ts';
import { requireStaff } from '#lib/server/guards.ts';

/** Report photos, for DETECK staff only. */
export const GET: RequestHandler = async (event) => {
	requireStaff(event);
	const key = await reportPhotoKey(event.params.id, Number(event.params.n));
	if (!key) error(404, 'Photo not found.');
	const body = await getObject(key).catch(() => error(404, 'Photo not found.'));
	return new Response(new Uint8Array(body), {
		headers: {
			'content-type': 'image/jpeg',
			'cache-control': 'private, no-store',
			'x-content-type-options': 'nosniff'
		}
	});
};
