/**
 * Files DETECK publishes to business users, such as the data-sharing agreement template that
 * manufacturers download, sign and upload back (audit decision 5).
 */
import { eq } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import { randomId } from './crypto.ts';
import { siteDocument } from './db/schema.ts';
import { putObject, storageKey } from './storage.ts';
import { documentProblem, documentType, type UploadedFile } from './uploads.ts';

export const SITE_DOCUMENTS = {
	agreement_template: 'Data-sharing agreement template'
} as const;
export type SiteDocumentKey = keyof typeof SITE_DOCUMENTS;

export async function getSiteDocument(key: SiteDocumentKey) {
	const [row] = await ctx().db.select().from(siteDocument).where(eq(siteDocument.key, key));
	return row ?? null;
}

export async function setSiteDocument(
	actor: Actor,
	key: SiteDocumentKey,
	file: UploadedFile | null
) {
	if (!file) return { ok: false as const, message: 'Choose a file to upload.' };
	const problem = documentProblem(file, SITE_DOCUMENTS[key]);
	if (problem) return { ok: false as const, message: problem };
	const fileKey = storageKey('site', 'detect', file.name, randomId(8));
	await putObject(fileKey, file.bytes, documentType(file)!);
	const values = {
		fileKey,
		fileName: file.name,
		contentType: documentType(file)!,
		sizeBytes: file.bytes.length,
		uploadedBy: actor.userId,
		uploadedAt: new Date()
	};
	await ctx()
		.db.insert(siteDocument)
		.values({ key, ...values })
		.onConflictDoUpdate({ target: siteDocument.key, set: values });
	await audit(actor, {
		area: 'Console',
		action: 'site_document',
		itemType: 'site_document',
		itemId: key,
		summary: `Published a new ${SITE_DOCUMENTS[key].toLowerCase()} (${file.name})`
	});
	return { ok: true as const };
}
