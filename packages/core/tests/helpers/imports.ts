import { ctx } from '../../src/server/context.ts';
import { document } from '../../src/server/db/schema.ts';
import { SYSTEM_ACTOR } from '../../src/server/audit.ts';
import {
	createImportJob,
	loadJob,
	markCommitting,
	runImport,
	saveMapping
} from '../../src/server/imports/engine.ts';

export const csv = (rows: string[][], name = 'data.csv') => ({
	name,
	type: 'text/csv',
	bytes: new TextEncoder().encode(rows.map((r) => r.join(',')).join('\n'))
});

/** The signed data-sharing agreement, needed before serial and supply chain imports. */
export async function withAgreement(manufacturerId: string) {
	await ctx().db.insert(document).values({
		manufacturerId,
		kind: 'data_sharing_agreement',
		fileKey: 'x',
		fileName: 'agreement.pdf',
		contentType: 'application/pdf',
		sizeBytes: 1
	});
}

/** Upload, keep the auto-matched columns, check, and optionally import. */
export async function importFile(
	manufacturerId: string,
	kind: 'products' | 'batches_serials' | 'distribution',
	rows: string[][],
	commit = true
) {
	const { job } = await createImportJob(SYSTEM_ACTOR, manufacturerId, kind, csv(rows));
	await saveMapping(job, job.mapping ?? {});
	await runImport(job.id, 'dry_run');
	const checked = (await loadJob(job.id))!;
	if (!commit) return checked;
	await markCommitting(checked);
	await runImport(job.id, 'commit', SYSTEM_ACTOR);
	return (await loadJob(job.id))!;
}
