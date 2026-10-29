import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { assertCanEditData, requireManufacturer } from '#lib/server/guards.ts';
import { createImportJob, ImportError } from '@deteck/core/server/imports/engine.ts';
import { recentImports } from '@deteck/core/server/manufacturers/summary.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import type { ImportKind } from '@deteck/core/imports/fields.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	return { imports: await recentImports(m.id, 30) };
};

export const actions: Actions = {
	upload: async (event) => {
		const access = await requireManufacturer(event);
		assertCanEditData(access);
		const data = await event.request.formData();
		const kind = String(data.get('kind') ?? '') as ImportKind;
		if (!['products', 'batches_serials', 'distribution'].includes(kind))
			return fail(400, { message: "Choose what's in this file." });
		const file = await readFile(data.get('file'));
		if (!file) return fail(400, { message: 'Choose a file to upload.' });
		let created: Awaited<ReturnType<typeof createImportJob>>;
		try {
			created = await createImportJob(access.actor, access.manufacturer.id, kind, file);
		} catch (error) {
			if (error instanceof ImportError) return fail(400, { message: error.message });
			throw error;
		}
		// The same file was uploaded before: open that import and say so.
		redirect(303, `/workspace/import/${created.job.id}${created.existing ? '?again=1' : ''}`);
	}
};
