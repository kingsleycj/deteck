/** Genuine packaging references (US-05.4, MF5), versioned by start date (G-09). */
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import { randomId } from './crypto.ts';
import { packagingImage, packagingReference, product } from './db/schema.ts';
import { enqueue } from './jobs.ts';
import {
	checkPhoto,
	normalisePhoto,
	PHOTO_PROBLEM_TEXT,
	QUALITY,
	MAX_REFERENCE_PIXELS
} from './scan/quality.ts';
import { getObject, putObject } from './storage.ts';
import type { UploadedFile } from './uploads.ts';
import { today } from './time.ts';

export const REFERENCE_SIDES = ['front', 'back', 'left', 'right', 'label', 'security'] as const;
export type ReferenceSide = (typeof REFERENCE_SIDES)[number];
/** The sides the packaging check compares; the side views are optional (audit decision 7). */
export const REQUIRED_SIDES: ReferenceSide[] = ['front', 'back', 'label'];
export const SIDE_LABEL: Record<ReferenceSide, string> = {
	front: 'Front',
	back: 'Back',
	left: 'Left side (optional)',
	right: 'Right side (optional)',
	label: 'Label',
	security: 'Security feature (optional)'
};

export class PackagingError extends Error {}

async function productFor(productId: string, manufacturerId: string) {
	const [p] = await ctx()
		.db.select()
		.from(product)
		.where(and(eq(product.id, productId), eq(product.manufacturerId, manufacturerId)));
	if (!p) throw new PackagingError('Drug not found.');
	return p;
}

export async function referencesFor(productId: string) {
	const { db } = ctx();
	const refs = await db
		.select()
		.from(packagingReference)
		.where(eq(packagingReference.productId, productId))
		.orderBy(desc(packagingReference.version));
	const images = refs.length
		? await db
				.select()
				.from(packagingImage)
				.where(sql`${packagingImage.referenceId} in ${refs.map((r) => r.id)}`)
		: [];
	return refs.map((r) => ({ ...r, images: images.filter((i) => i.referenceId === r.id) }));
}

/** Returns the open draft for a product, or starts a new version. */
export async function draftReference(
	actor: Actor,
	productId: string,
	manufacturerId: string,
	effectiveFrom?: string
) {
	const p = await productFor(productId, manufacturerId);
	const { db } = ctx();
	const [draft] = await db
		.select()
		.from(packagingReference)
		.where(
			and(
				eq(packagingReference.productId, productId),
				sql`${packagingReference.status} in ('draft', 'rejected')`
			)
		)
		.orderBy(desc(packagingReference.version))
		.limit(1);
	if (draft) {
		if (effectiveFrom && effectiveFrom !== draft.effectiveFrom) {
			await db
				.update(packagingReference)
				.set({ effectiveFrom })
				.where(eq(packagingReference.id, draft.id));
		}
		return draft.id;
	}
	const [{ max }] = await db
		.select({ max: sql<number>`coalesce(max(${packagingReference.version}), 0)::int` })
		.from(packagingReference)
		.where(eq(packagingReference.productId, productId));
	const version = max + 1;
	const start =
		effectiveFrom && /^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)
			? effectiveFrom
			: version === 1
				? '2000-01-01'
				: today();
	const [created] = await db
		.insert(packagingReference)
		.values({ productId, version, effectiveFrom: start, status: 'draft', createdBy: actor.userId })
		.returning({ id: packagingReference.id });
	await audit(actor, {
		area: 'Manufacturer board',
		action: 'packaging_version',
		itemType: 'packaging_reference',
		itemId: created.id,
		manufacturerId,
		summary: `Started packaging version ${version} for ${p.brandName} ${p.strength} (${start <= '2000-01-01' ? 'every batch' : `batches made from ${start}`})`
	});
	return created.id;
}

/** Adds or replaces one side's photo, with the quality rules from US-05.4. */
export async function addReferenceImage(
	actor: Actor,
	referenceId: string,
	manufacturerId: string,
	side: ReferenceSide,
	file: UploadedFile
) {
	const { db } = ctx();
	const [ref] = await db
		.select({
			ref: packagingReference,
			manufacturerId: product.manufacturerId,
			name: sql<string>`${product.brandName} || ' ' || ${product.strength}`
		})
		.from(packagingReference)
		.innerJoin(product, eq(product.id, packagingReference.productId))
		.where(eq(packagingReference.id, referenceId));
	if (!ref || ref.manufacturerId !== manufacturerId)
		throw new PackagingError('Packaging version not found.');
	if (!['draft', 'rejected'].includes(ref.ref.status))
		throw new PackagingError(
			'This version is already submitted. Start a new version to change photos.'
		);
	const check = await checkPhoto(file.bytes, QUALITY.minReferenceShortSide, MAX_REFERENCE_PIXELS);
	const passed = check.ok;
	const failReason = check.problem
		? check.problem === 'too_small'
			? `Too small (${Math.min(check.width, check.height)} px). Upload a photo at least 1,000 px on the short side.`
			: PHOTO_PROBLEM_TEXT[check.problem]
		: null;
	// A failing replacement never overwrites a photo that already passed.
	const [current] = await db
		.select({ passed: packagingImage.passed })
		.from(packagingImage)
		.where(and(eq(packagingImage.referenceId, referenceId), eq(packagingImage.side, side)));
	if (!passed && current?.passed) return { passed, failReason, kept: true };

	const key = `packaging/${referenceId}/${side}-${randomId(6)}.jpg`;
	if (check.problem !== 'unreadable')
		await putObject(
			key,
			await normalisePhoto(file.bytes, 2000, MAX_REFERENCE_PIXELS),
			'image/jpeg'
		);
	await db
		.insert(packagingImage)
		.values({
			referenceId,
			side,
			fileKey: key,
			width: check.width,
			height: check.height,
			passed,
			failReason
		})
		.onConflictDoUpdate({
			target: [packagingImage.referenceId, packagingImage.side],
			set: { fileKey: key, width: check.width, height: check.height, passed, failReason }
		});
	if (ref.ref.status === 'rejected')
		await db
			.update(packagingReference)
			.set({ status: 'draft', rejectionReason: null })
			.where(eq(packagingReference.id, referenceId));
	await audit(actor, {
		area: 'Manufacturer board',
		action: 'packaging_photo',
		itemType: 'packaging_reference',
		itemId: referenceId,
		manufacturerId,
		summary: `${passed ? 'Added' : 'Tried to add'} the ${SIDE_LABEL[side].toLowerCase()} photo for ${ref.name} packaging version ${ref.ref.version}${passed ? '' : ` (${failReason})`}`
	});
	return { passed, failReason, kept: false };
}

export async function submitReference(actor: Actor, referenceId: string, manufacturerId: string) {
	const { db } = ctx();
	const [ref] = await db
		.select({
			ref: packagingReference,
			manufacturerId: product.manufacturerId,
			name: sql<string>`${product.brandName} || ' ' || ${product.strength}`
		})
		.from(packagingReference)
		.innerJoin(product, eq(product.id, packagingReference.productId))
		.where(eq(packagingReference.id, referenceId));
	if (!ref || ref.manufacturerId !== manufacturerId)
		throw new PackagingError('Packaging version not found.');
	if (!['draft', 'rejected'].includes(ref.ref.status))
		throw new PackagingError('This version is already submitted.');
	const images = await db
		.select()
		.from(packagingImage)
		.where(eq(packagingImage.referenceId, referenceId));
	const missing = REQUIRED_SIDES.filter((s) => !images.some((i) => i.side === s && i.passed));
	if (missing.length)
		throw new PackagingError(
			`Add a passing photo for: ${missing.map((s) => SIDE_LABEL[s]).join(', ')}.`
		);
	await db.transaction(async (tx) => {
		await tx
			.update(packagingReference)
			.set({ status: 'processing' })
			.where(eq(packagingReference.id, referenceId));
		await audit(
			actor,
			{
				area: 'Manufacturer board',
				action: 'packaging_submit',
				itemType: 'packaging_reference',
				itemId: referenceId,
				manufacturerId,
				summary: `Submitted packaging version ${ref.ref.version} for ${ref.name}`
			},
			tx
		);
	});
	await enqueue('packaging.process', { referenceId });
}

/**
 * "Learning the genuine pack" (MF5b). The general-purpose model needs no
 * training: processing re-checks the stored photos, then marks the version ready.
 */
export async function processReference(referenceId: string) {
	const { db } = ctx();
	const images = await db
		.select()
		.from(packagingImage)
		.where(eq(packagingImage.referenceId, referenceId));
	const problems: string[] = [];
	for (const side of REQUIRED_SIDES) {
		const image = images.find((i) => i.side === side);
		if (!image?.passed) {
			problems.push(`${SIDE_LABEL[side]} photo is missing or failed the quality check.`);
			continue;
		}
		try {
			await getObject(image.fileKey);
		} catch {
			problems.push(`${SIDE_LABEL[side]} photo could not be read. Upload it again.`);
		}
	}
	await db
		.update(packagingReference)
		.set(
			problems.length
				? { status: 'rejected', rejectionReason: problems.join(' ') }
				: { status: 'ready', readyAt: new Date(), rejectionReason: null }
		)
		.where(eq(packagingReference.id, referenceId));
}

/** The reference version that applies to a batch, by manufacture date (G-09). */
export async function referenceForBatch(productId: string, manufactureDate: string | null) {
	const date = manufactureDate ?? today();
	const { db } = ctx();
	const [ref] = await db
		.select()
		.from(packagingReference)
		.where(
			and(
				eq(packagingReference.productId, productId),
				eq(packagingReference.status, 'ready'),
				lte(packagingReference.effectiveFrom, date)
			)
		)
		.orderBy(desc(packagingReference.effectiveFrom), desc(packagingReference.version))
		.limit(1);
	if (!ref) return null;
	const images = await db
		.select()
		.from(packagingImage)
		.where(eq(packagingImage.referenceId, ref.id));
	return { ref, images };
}
