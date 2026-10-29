/** An uploaded file read from a multipart form. */
export interface UploadedFile {
	name: string;
	type: string;
	bytes: Uint8Array;
}

export const DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

/** Reads a File field; returns null when the field is empty. */
export async function readFile(value: FormDataEntryValue | null): Promise<UploadedFile | null> {
	if (!value || typeof value === 'string' || value.size === 0) return null;
	return {
		name: value.name || 'upload',
		type: value.type || 'application/octet-stream',
		bytes: new Uint8Array(await value.arrayBuffer())
	};
}

/**
 * A document's real type, from its first bytes. The type the browser reports is just a label the
 * uploader controls, so it's never trusted (an HTML file labelled "PDF" must not be served as one).
 */
export function documentType(file: UploadedFile): string | null {
	const b = file.bytes;
	if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46 && b[4] === 0x2d)
		return 'application/pdf';
	if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
	if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
	return null;
}

export function documentProblem(file: UploadedFile | null, label: string): string | null {
	if (!file) return null;
	const type = documentType(file);
	if (!type || !DOCUMENT_TYPES.includes(type))
		return `${file.name} couldn't be uploaded. Use a PDF, JPG or PNG.`;
	if (file.bytes.length > MAX_DOCUMENT_BYTES) return `${label} must be under 10 MB.`;
	return null;
}
