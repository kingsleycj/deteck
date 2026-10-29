import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { packagingImage, packagingReference, product } from '@deteck/core/server/db/schema.ts';
import { requireManufacturer } from '#lib/server/guards.ts';
import { getObject } from '@deteck/core/server/storage.ts';

/** Reference photos: members of the owning manufacturer, or staff working on its behalf. */
export const GET: RequestHandler = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	if (!/^[0-9a-f-]{36}$/.test(event.params.imageId)) error(404, 'Photo not found.');
	const [row] = await ctx()
		.db.select({ fileKey: packagingImage.fileKey, manufacturerId: product.manufacturerId })
		.from(packagingImage)
		.innerJoin(packagingReference, eq(packagingReference.id, packagingImage.referenceId))
		.innerJoin(product, eq(product.id, packagingReference.productId))
		.where(eq(packagingImage.id, event.params.imageId));
	if (!row || row.manufacturerId !== m.id) error(404, 'Photo not found.');
	const body = await getObject(row.fileKey).catch(() => error(404, 'Photo not found.'));
	return new Response(new Uint8Array(body), {
		headers: {
			'content-type': 'image/jpeg',
			'cache-control': 'private, max-age=300',
			'x-content-type-options': 'nosniff'
		}
	});
};
