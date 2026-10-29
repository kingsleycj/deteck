import { productRows } from '@deteck/core/server/manufacturers/summary.ts';
import { caller, handler, json } from '#lib/server/api.ts';

/** GET /api/v1/manufacturer/products: your drugs, with batch, serial and packaging counts. */
export const GET = handler(async (event) => {
	const { key } = await caller(event, 'manufacturer:read');
	return json({ products: await productRows(key!.manufacturerId!) });
});
