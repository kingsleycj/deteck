import { and, eq } from 'drizzle-orm';
import { audit, type Actor } from '../audit.ts';
import { ctx } from '../context.ts';
import { randomId } from '../crypto.ts';
import { document } from '../db/schema.ts';
import { putObject, storageKey } from '../storage.ts';
import { documentProblem, documentType, type UploadedFile } from '../uploads.ts';

export type DocumentKind =
	| 'nafdac_certificate'
	| 'data_sharing_agreement'
	| 'pcn_premises_licence'
	| 'cac_certificate'
	| 'other';

export const DOCUMENT_LABEL: Record<DocumentKind, string> = {
	nafdac_certificate: 'NAFDAC certificate',
	data_sharing_agreement: 'Signed data-sharing agreement',
	pcn_premises_licence: 'PCN premises licence',
	cac_certificate: 'CAC certificate',
	other: 'Other document'
};

/** Adds a document to a manufacturer, or to a business with `{ businessId }`. */
export async function addDocument(
	actor: Actor,
	owner: string | { businessId: string },
	kind: DocumentKind,
	file: UploadedFile | null
) {
	if (!file) return { ok: false as const, message: 'Choose a file to upload.' };
	const problem = documentProblem(file, DOCUMENT_LABEL[kind]);
	if (problem) return { ok: false as const, message: problem };
	const manufacturerId = typeof owner === 'string' ? owner : null;
	const businessId = typeof owner === 'string' ? null : owner.businessId;
	const key = storageKey('documents', manufacturerId ?? businessId!, file.name, randomId(8));
	await putObject(key, file.bytes, documentType(file)!);
	await ctx().db.transaction(async (tx) => {
		const [row] = await tx
			.insert(document)
			.values({
				manufacturerId,
				businessId,
				kind,
				fileKey: key,
				fileName: file.name,
				contentType: documentType(file)!,
				sizeBytes: file.bytes.length,
				uploadedBy: actor.userId
			})
			.returning({ id: document.id });
		await audit(
			actor,
			{
				area: businessId ? 'Business accounts' : 'Manufacturer board',
				action: 'document_upload',
				itemType: 'document',
				itemId: row.id,
				manufacturerId,
				summary: `Uploaded ${DOCUMENT_LABEL[kind]} (${file.name})`
			},
			tx
		);
	});
	return { ok: true as const };
}

/** Loads a document if it belongs to the given manufacturer (or any, for staff). */
export async function findDocument(id: string, manufacturerId?: string) {
	const where = manufacturerId
		? and(eq(document.id, id), eq(document.manufacturerId, manufacturerId))
		: eq(document.id, id);
	const [row] = await ctx().db.select().from(document).where(where).limit(1);
	return row ?? null;
}
