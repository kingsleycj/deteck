import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { audit } from '@deteck/core/server/audit.ts';
import { IMPORT_FIELDS, missingRequired } from '@deteck/core/imports/fields.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { importJob } from '@deteck/core/server/db/schema.ts';
import { assertCanEditData, requireManufacturer } from '#lib/server/guards.ts';
import {
	IMPORT_JOB,
	ImportError,
	loadJob,
	markCommitting,
	saveMapping
} from '@deteck/core/server/imports/engine.ts';
import { enqueue } from '@deteck/core/server/jobs.ts';
import { getObject } from '@deteck/core/server/storage.ts';
import { parse } from 'csv-parse/sync';

const PROBLEM_PREVIEW = 20;

/** The first problem rows with their reasons, so people can see what to fix without a download. */
async function problemPreview(key: string | null) {
	if (!key) return [];
	try {
		const rows = parse((await getObject(key)).toString('utf8'), {
			bom: true,
			relax_column_count: true,
			to: PROBLEM_PREVIEW + 1
		}) as string[][];
		return rows
			.slice(1)
			.map(([row, problem, ...values]) => ({
				row,
				problem,
				values: values.filter(Boolean).slice(0, 4).join(' · ')
			}))
			.sort((a, b) => Number(a.row) - Number(b.row));
	} catch {
		return [];
	}
}

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const job = await loadJob(event.params.id, m.id);
	if (!job) error(404, 'Import not found.');
	return {
		job: {
			id: job.id,
			kind: job.kind,
			fileName: job.fileName,
			status: job.status,
			headers: job.headers ?? [],
			sample: job.sampleRows ?? [],
			mapping: job.mapping ?? {},
			counts: job.counts ?? {},
			hasProblems: Boolean(job.problemsKey),
			problems:
				job.status === 'ready' || job.status === 'committed'
					? await problemPreview(job.problemsKey)
					: [],
			error: job.error,
			createdAt: job.createdAt,
			committedAt: job.committedAt
		},
		again: event.url.searchParams.has('again'),
		fields: IMPORT_FIELDS[job.kind],
		missing: missingRequired(job.kind, job.mapping ?? {}).map((f) => f.label)
	};
};

export const actions: Actions = {
	map: async (event) => {
		const access = await requireManufacturer(event);
		assertCanEditData(access);
		const job = await loadJob(event.params.id, access.manufacturer.id);
		if (!job) error(404, 'Import not found.');
		const data = await event.request.formData();
		const mapping: Record<string, string> = {};
		for (const f of IMPORT_FIELDS[job.kind]) {
			const value = String(data.get(`field:${f.key}`) ?? '');
			if (value) mapping[f.key] = value;
		}
		try {
			await saveMapping(job, mapping);
		} catch (err) {
			if (err instanceof ImportError) return fail(400, { message: err.message });
			throw err;
		}
		// Audited so work done on a company's behalf counts towards the two-person rule.
		await audit(access.actor, {
			area: 'Manufacturer board',
			action: 'import_mapping',
			itemType: 'import',
			itemId: job.id,
			manufacturerId: access.manufacturer.id,
			summary: `Matched the columns of ${job.fileName}`
		});
		await enqueue('import.check', { jobId: job.id }, IMPORT_JOB);
		redirect(303, `/workspace/import/${job.id}`);
	},
	commit: async (event) => {
		const access = await requireManufacturer(event);
		assertCanEditData(access);
		const job = await loadJob(event.params.id, access.manufacturer.id);
		if (!job) error(404, 'Import not found.');
		try {
			await markCommitting(job);
		} catch (err) {
			if (err instanceof ImportError) return fail(400, { message: err.message });
			throw err;
		}
		await enqueue('import.commit', { jobId: job.id, actor: access.actor }, IMPORT_JOB);
		redirect(303, `/workspace/import/${job.id}`);
	},
	cancel: async (event) => {
		const access = await requireManufacturer(event);
		const job = await loadJob(event.params.id, access.manufacturer.id);
		if (!job) error(404, 'Import not found.');
		if (['uploaded', 'ready', 'failed'].includes(job.status)) {
			await ctx().db.update(importJob).set({ status: 'cancelled' }).where(eq(importJob.id, job.id));
		}
		redirect(303, '/workspace/import');
	}
};
