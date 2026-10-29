/** Packaging scan sessions (F-02, D-10): photos in, a closed-set packaging result out. */
import { and, eq, isNotNull, isNull, lt, or } from 'drizzle-orm';
import { en, type Messages } from '../../messages/dict/en.ts';
import type { VerificationResult } from '../../verify/types.ts';
import { ctx } from '../context.ts';
import { deviceDayHash, randomId } from '../crypto.ts';
import { scanSession } from '../db/schema.ts';
import { enqueue } from '../jobs.ts';
import { referenceForBatch } from '../packaging.ts';
import { consume } from '../rate-limit.ts';
import { deleteObject, getObject, putObject } from '../storage.ts';
import type { UploadedFile } from '../uploads.ts';
import { loadResult, recordCheckEvent, type Requester } from '../verify/check.ts';
import {
	anthropicComparer,
	COMPARED_REFERENCE_SIDES,
	SIDES,
	stubComparer,
	type PackagingComparer,
	type ScanSide
} from './provider.ts';
import { checkPhoto, normalisePhoto, QUALITY } from './quality.ts';

const SESSION_TTL_MS = 24 * 3600 * 1000;
export const RETAIN_DAYS = 90;

let override: PackagingComparer | undefined;
/** Lets tests and the evaluation script plug in a comparer. */
export function setComparer(comparer: PackagingComparer | undefined) {
	override = comparer;
}

function comparer(): PackagingComparer {
	if (override) return override;
	const { anthropicApiKey, scanModel } = ctx().config;
	return anthropicApiKey
		? anthropicComparer({ apiKey: anthropicApiKey, model: scanModel })
		: stubComparer;
}

export type StartScanResult =
	{ ok: true; id: string } | { ok: false; side?: ScanSide; message: string; status: number };

/** Validates the three photos, stores them and queues the comparison. */
export async function startScan(
	requester: Requester,
	verificationId: string,
	photos: Partial<Record<ScanSide, UploadedFile | null>>,
	retainConsent: boolean,
	/** The visitor's language, for the messages. */
	t: Messages = en
): Promise<StartScanResult> {
	const p = t.packaging;
	if (!requester.packagingEnabled) return { ok: false, status: 403, message: p.notAvailableYet };
	const result = await loadResult(verificationId);
	if (!result || result.code !== 'VALID' || !result.product || !result.batch) {
		return {
			ok: false,
			status: 400,
			message: p.checkSerialFirst
		};
	}
	const reference = await referenceForBatch(result.product.id, result.batch.manufactureDate);
	if (!reference) return { ok: false, status: 400, message: p.notAvailable };

	for (const side of SIDES) {
		const photo = photos[side];
		if (!photo)
			return {
				ok: false,
				status: 400,
				side,
				message: p.addPhoto[side]
			};
		const check = await checkPhoto(photo.bytes, QUALITY.minScanShortSide);
		if (!check.ok)
			return { ok: false, status: 400, side, message: p.photoProblems[check.problem!] };
	}

	// Per device, and per IP so clearing cookies doesn't buy unlimited AI calls.
	const limits = ctx().config.rateLimits;
	const limited = await consume([
		{
			key: `scan:d:${requester.deviceId}:day`,
			windowSeconds: 86400,
			max: limits.scansPerDevicePerDay
		},
		{ key: `scan:ip:${requester.ip}:day`, windowSeconds: 86400, max: limits.scansPerIpPerDay }
	]);
	if (!limited.ok)
		return {
			ok: false,
			status: 429,
			message: p.dailyLimit
		};

	const id = randomId(12);
	const keys: Record<string, string> = {};
	for (const side of SIDES) {
		const key = `scan-photos/${id}/${side}.jpg`;
		await putObject(key, await normalisePhoto(photos[side]!.bytes, 1280), 'image/jpeg');
		keys[side] = key;
	}
	await ctx()
		.db.insert(scanSession)
		.values({
			id,
			expiresAt: new Date(Date.now() + SESSION_TTL_MS),
			deviceDayHash: deviceDayHash(requester.deviceId),
			verificationId,
			productId: result.product.id,
			batchId: result.batch.id,
			referenceId: reference.ref.id,
			status: 'queued',
			photoKeys: keys,
			retainConsent
		});
	await enqueue('scan.compare', { sessionId: id, state: requester.state });
	return { ok: true, id };
}

/** Deletes a session's photos. If any delete fails, the session stays due and the hourly job retries. */
async function deletePhotos(session: typeof scanSession.$inferSelect) {
	try {
		for (const key of Object.values(session.photoKeys ?? {})) await deleteObject(key);
	} catch (error) {
		console.error('[scan] photo delete failed, will retry', session.id, error);
		return;
	}
	await ctx()
		.db.update(scanSession)
		.set({ photosDeletedAt: new Date() })
		.where(eq(scanSession.id, session.id));
}

/** Runs the comparison. Any failure ends in "Can't tell", never a guess (TRD 5.2). */
export async function runScanComparison(sessionId: string, state: string | null = null) {
	const { db } = ctx();
	const [session] = await db.select().from(scanSession).where(eq(scanSession.id, sessionId));
	if (!session || !['queued', 'processing'].includes(session.status)) return;
	await db.update(scanSession).set({ status: 'processing' }).where(eq(scanSession.id, sessionId));

	const result = session.verificationId ? await loadResult(session.verificationId) : null;
	const reference =
		session.referenceId && result?.product
			? await referenceForBatch(result.product.id, result.batch?.manufactureDate ?? null)
			: null;
	let outcome: Awaited<ReturnType<PackagingComparer['compare']>>;
	if (!result?.product || !reference) {
		outcome = {
			outcome: 'CANT_TELL',
			categories: [],
			confidence: 0,
			model: 'none',
			reason: 'error'
		};
	} else {
		try {
			const referenceImages = [];
			for (const side of COMPARED_REFERENCE_SIDES) {
				const image = reference.images.find((i) => i.side === side && i.passed);
				if (image) referenceImages.push({ side, data: await getObject(image.fileKey) });
			}
			const photos = [];
			for (const side of SIDES)
				photos.push({ side, data: await getObject(session.photoKeys[side]) });
			outcome = await comparer().compare({
				product: {
					brandName: result.product.brandName,
					strength: result.product.strength,
					dosageForm: result.product.dosageForm,
					manufacturer: result.manufacturer?.name ?? ''
				},
				reference: referenceImages,
				photos
			});
		} catch (err) {
			console.error('scan.compare failed', err);
			outcome = {
				outcome: 'CANT_TELL',
				categories: [],
				confidence: 0,
				model: 'none',
				reason: 'error'
			};
		}
	}

	await db
		.update(scanSession)
		.set({
			status: 'done',
			outcome: outcome.outcome,
			categories: outcome.categories.map((c) => ({
				category: c.category,
				detail: `${c.side}: ${c.note}`.slice(0, 300)
			})),
			confidence: outcome.confidence,
			model: outcome.model,
			error: outcome.reason ?? null,
			completedAt: new Date()
		})
		.where(eq(scanSession.id, sessionId));
	void recordCheckEvent({
		kind: 'packaging',
		result: outcome.outcome,
		productId: session.productId,
		batchId: session.batchId,
		deviceDayHash: session.deviceDayHash,
		state
	});
	if (!session.retainConsent) await deletePhotos(session);
}

/** A scan page lives as long as the result it belongs to (30 minutes); after that it has expired. */
export async function loadScan(sessionId: string) {
	if (!/^[A-Za-z0-9_-]{8,40}$/.test(sessionId)) return null;
	const [session] = await ctx().db.select().from(scanSession).where(eq(scanSession.id, sessionId));
	if (!session) return null;
	const result: VerificationResult | null = session.verificationId
		? await loadResult(session.verificationId)
		: null;
	return { session, result };
}

/** Retention (G-10): unconsented photos go within 24 hours; consented ones after 90 days. */
export async function purgeScanPhotos(now = new Date()) {
	const { db } = ctx();
	const due = await db
		.select()
		.from(scanSession)
		.where(
			and(
				isNull(scanSession.photosDeletedAt),
				or(
					and(
						eq(scanSession.retainConsent, false),
						// 23 hours, so the hourly run deletes them within 24 hours as the privacy notice says.
						lt(scanSession.createdAt, new Date(now.getTime() - 23 * 3600 * 1000))
					),
					lt(scanSession.createdAt, new Date(now.getTime() - RETAIN_DAYS * 86400000))
				)
			)
		)
		.limit(500);
	for (const s of due) await deletePhotos(s);
	return due.length;
}

/** Scan sessions (outcome, model notes, device hash) go once their photo window has passed. */
export async function purgeScanSessions(now = new Date()) {
	await ctx()
		.db.delete(scanSession)
		.where(
			and(
				isNotNull(scanSession.photosDeletedAt),
				lt(scanSession.createdAt, new Date(now.getTime() - (RETAIN_DAYS + 1) * 86400000))
			)
		);
}
