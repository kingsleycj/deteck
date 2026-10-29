import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireStaff } from '#lib/server/guards.ts';
import { reviewPhotoKey } from '@deteck/core/server/scan/review.ts';
import { getObject } from '@deteck/core/server/storage.ts';

/** A scan photo the person agreed to share, for DETECK reviewers only. */
export const GET: RequestHandler = async (event) => {
	requireStaff(event);
	const key = await reviewPhotoKey(event.params.id, event.params.side);
	if (!key) error(404, 'Photo not found.');
	const body = await getObject(key).catch(() => error(404, 'Photo not found.'));
	return new Response(new Uint8Array(body), {
		headers: {
			'content-type': 'image/jpeg',
			'cache-control': 'private, max-age=300',
			'x-content-type-options': 'nosniff'
		}
	});
};
