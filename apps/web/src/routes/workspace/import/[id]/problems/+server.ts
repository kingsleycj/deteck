import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
import { loadJob } from '@deteck/core/server/imports/engine.ts';
import { getObject } from '@deteck/core/server/storage.ts';

export const GET: RequestHandler = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const job = await loadJob(event.params.id, m.id);
	if (!job?.problemsKey) error(404, 'No problem rows for this import.');
	const body = await getObject(job.problemsKey);
	const name = `${job.fileName.replace(/\.[^.]+$/, '')} - problem rows.csv`.replace(
		/[^A-Za-z0-9 ._-]/g,
		'_'
	);
	return new Response(new Uint8Array(Buffer.concat([Buffer.from('﻿'), body])), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="${name}"`,
			'cache-control': 'private, no-store'
		}
	});
};
