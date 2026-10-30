import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import { productDetail } from '@deteck/core/server/catalogue.ts';
import { assertCanEditData, requireManufacturer } from '#lib/server/guards.ts';
import {
	addReferenceImage,
	draftReference,
	PackagingError,
	REFERENCE_SIDES,
	referencesFor,
	submitReference,
	type ReferenceSide
} from '@deteck/core/server/packaging.ts';
import { readFile } from '@deteck/core/server/uploads.ts';

const MAX_PHOTO_BYTES = 20 * 1024 * 1024;

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const detail = await productDetail(event.params.productId, m.id);
	if (!detail) error(404, 'Drug not found.');
	const references = await referencesFor(detail.id);
	return {
		product: { id: detail.id, name: `${detail.brandName} ${detail.strength}`, gtin: detail.gtin },
		references: references.map((r) => ({
			id: r.id,
			version: r.version,
			effectiveFrom: r.effectiveFrom,
			status: r.status,
			rejectionReason: r.rejectionReason,
			images: r.images.map((i) => ({
				id: i.id,
				side: i.side,
				passed: i.passed,
				failReason: i.failReason,
				width: i.width,
				height: i.height
			}))
		}))
	};
};

async function guard(event: RequestEvent) {
	const access = await requireManufacturer(event);
	assertCanEditData(access);
	return access;
}

function packagingFailure(err: unknown) {
	if (err instanceof PackagingError) return fail(400, { message: err.message });
	throw err;
}

export const actions: Actions = {
	newVersion: async (event) => {
		const access = await guard(event);
		const d = await event.request.formData();
		try {
			await draftReference(
				access.actor,
				event.params.productId,
				access.manufacturer.id,
				String(d.get('effectiveFrom') ?? '') || undefined
			);
		} catch (err) {
			return packagingFailure(err);
		}
		return { done: 'Version started. Upload a photo for each side.' };
	},
	upload: async (event) => {
		const access = await guard(event);
		const d = await event.request.formData();
		const side = String(d.get('side')) as ReferenceSide;
		if (!REFERENCE_SIDES.includes(side))
			return fail(400, { message: 'Choose which side this photo shows.' });
		const file = await readFile(d.get('photo'));
		if (!file) return fail(400, { side, message: 'Choose a photo to upload.' });
		if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
			return fail(400, {
				side,
				message: `${file.name} couldn't be uploaded. Use a JPG, PNG or WebP photo.`
			});
		if (file.bytes.length > MAX_PHOTO_BYTES)
			return fail(400, { side, message: 'Photos must be under 20 MB.' });
		try {
			const result = await addReferenceImage(
				access.actor,
				String(d.get('referenceId')),
				access.manufacturer.id,
				side,
				file
			);
			return result.passed
				? { done: 'Photo added.' }
				: fail(400, {
						side,
						message: `${result.failReason ?? 'This photo did not pass the quality check.'}${result.kept ? ' Your earlier photo is kept.' : ''}`
					});
		} catch (err) {
			return packagingFailure(err);
		}
	},
	submit: async (event) => {
		const access = await guard(event);
		const d = await event.request.formData();
		try {
			await submitReference(access.actor, String(d.get('referenceId')), access.manufacturer.id);
		} catch (err) {
			return packagingFailure(err);
		}
		return { done: 'Submitted. DETECK is checking the photos. This usually takes under a minute.' };
	}
};
