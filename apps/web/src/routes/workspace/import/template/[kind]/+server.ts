import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { templateHeaders, type ImportKind } from '@deteck/core/imports/fields.ts';
import { requireManufacturer } from '#lib/server/guards.ts';

const NAMES: Record<ImportKind, string> = {
	products: 'DETECK drugs template.csv',
	batches_serials: 'DETECK batches and serials template.csv',
	distribution: 'DETECK supply chain template.csv'
};

export const GET: RequestHandler = async (event) => {
	await requireManufacturer(event);
	const kind = event.params.kind as ImportKind;
	if (!(kind in NAMES)) error(404, 'Template not found.');
	const body = `\ufeff${templateHeaders(kind).join(',')}\r\n`;
	return new Response(body, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${NAMES[kind]}"`
		}
	});
};
