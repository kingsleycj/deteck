/**
 * Reviewing the AI's packaging answers (D-10). People can agree to let DETECK keep their scan
 * photos for 90 days; staff look at those and say whether the answer was right. The labels give
 * a real accuracy number, and the error counts show when the AI service is failing.
 */
import { and, desc, eq, gt, isNotNull, isNull, sql } from 'drizzle-orm';
import { audit, type Actor } from '../audit.ts';
import { ctx } from '../context.ts';
import { product, scanSession, user } from '../db/schema.ts';

export class ScanReviewError extends Error {}

export const REVIEW_LABELS = {
	agree: 'The answer was right',
	false_alarm: 'It flagged a difference that isn’t there',
	missed: 'It missed a visible difference',
	should_be_cant_tell: 'It should have said it can’t tell',
	bad_photos: 'The photos are too poor to judge'
} as const;
export type ReviewLabel = keyof typeof REVIEW_LABELS;

export const OUTCOME_LABEL: Record<string, string> = {
	NO_VISIBLE_INCONSISTENCIES: 'No visible differences',
	INCONSISTENCIES_FOUND: 'Differences found',
	CANT_TELL: 'Can’t tell'
};

/** Why an answer was "can't tell" for a reason other than the photos themselves. */
export const ERROR_REASONS: Record<string, string> = {
	error: 'AI service error',
	timeout: 'AI service too slow',
	refused: 'AI declined to answer',
	not_configured: 'AI not set up',
	inconsistent_output: 'Answer didn’t make sense',
	low_confidence: 'Low confidence',
	unclear_photos: 'Photos unclear'
};

/** Finished scans whose photos the person agreed to share, newest first. */
export async function scansForReview(filter: { unlabelled?: boolean } = {}, limit = 60) {
	return ctx()
		.db.select({
			id: scanSession.id,
			createdAt: scanSession.createdAt,
			outcome: scanSession.outcome,
			categories: scanSession.categories,
			confidence: scanSession.confidence,
			model: scanSession.model,
			error: scanSession.error,
			photoSides: sql<string[]>`array(select jsonb_object_keys(${scanSession.photoKeys}))`,
			reviewLabel: scanSession.reviewLabel,
			reviewNote: scanSession.reviewNote,
			reviewedAt: scanSession.reviewedAt,
			reviewer: user.name,
			drug: sql<string | null>`${product.brandName} || ' ' || ${product.strength}`
		})
		.from(scanSession)
		.leftJoin(product, eq(product.id, scanSession.productId))
		.leftJoin(user, eq(user.id, scanSession.reviewedBy))
		.where(
			and(
				eq(scanSession.retainConsent, true),
				isNull(scanSession.photosDeletedAt),
				eq(scanSession.status, 'done'),
				filter.unlabelled ? isNull(scanSession.reviewLabel) : undefined
			)
		)
		.orderBy(desc(scanSession.createdAt))
		.limit(limit);
}

/** The stored photo of one side of a reviewable scan, or null. */
export async function reviewPhotoKey(id: string, side: string) {
	if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
	const [row] = await ctx()
		.db.select({ keys: scanSession.photoKeys })
		.from(scanSession)
		.where(
			and(
				eq(scanSession.id, id),
				eq(scanSession.retainConsent, true),
				isNull(scanSession.photosDeletedAt)
			)
		);
	return row?.keys[side] ?? null;
}

export async function labelScan(actor: Actor, id: string, label: string, note: string) {
	if (!(label in REVIEW_LABELS)) throw new ScanReviewError('Choose a verdict.');
	const [row] = await ctx()
		.db.select({ outcome: scanSession.outcome, before: scanSession.reviewLabel })
		.from(scanSession)
		.where(
			and(
				eq(scanSession.id, id),
				eq(scanSession.retainConsent, true),
				isNull(scanSession.photosDeletedAt)
			)
		);
	if (!row) throw new ScanReviewError('Scan not found, or its photos have been deleted.');
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(scanSession)
			.set({
				reviewLabel: label,
				reviewNote: note.trim().slice(0, 1000) || null,
				reviewedBy: actor.userId,
				reviewedAt: new Date()
			})
			.where(eq(scanSession.id, id));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'scan_review',
				itemType: 'scan_session',
				itemId: id,
				summary: `Reviewed a packaging scan ("${OUTCOME_LABEL[row.outcome ?? ''] ?? row.outcome}"): ${REVIEW_LABELS[label as ReviewLabel]}`,
				before: { label: row.before },
				after: { label }
			},
			tx
		);
	});
}

/**
 * Packaging scans over the last `days`: answers by outcome, AI failures by reason, and how often
 * reviewers agreed with the AI. Counts survive photo deletion until the session itself is purged.
 */
export async function scanAccuracy(days = 30) {
	const since = new Date(Date.now() - days * 86_400_000);
	const db = ctx().db;
	const [outcomes, reasons, labels, [waiting]] = await Promise.all([
		db
			.select({ outcome: scanSession.outcome, n: sql<number>`count(*)::int` })
			.from(scanSession)
			.where(and(eq(scanSession.status, 'done'), gt(scanSession.createdAt, since)))
			.groupBy(scanSession.outcome),
		db
			.select({ reason: scanSession.error, n: sql<number>`count(*)::int` })
			.from(scanSession)
			.where(
				and(
					eq(scanSession.status, 'done'),
					isNotNull(scanSession.error),
					gt(scanSession.createdAt, since)
				)
			)
			.groupBy(scanSession.error),
		db
			.select({ label: scanSession.reviewLabel, n: sql<number>`count(*)::int` })
			.from(scanSession)
			.where(and(isNotNull(scanSession.reviewLabel), gt(scanSession.createdAt, since)))
			.groupBy(scanSession.reviewLabel),
		db
			.select({ n: sql<number>`count(*)::int` })
			.from(scanSession)
			.where(
				and(
					eq(scanSession.retainConsent, true),
					isNull(scanSession.photosDeletedAt),
					eq(scanSession.status, 'done'),
					isNull(scanSession.reviewLabel)
				)
			)
	]);
	const total = outcomes.reduce((a, o) => a + o.n, 0);
	const serviceErrors = reasons
		// "AI not set up" is a setting, not the service failing.
		.filter((r) => ['error', 'timeout', 'refused'].includes(r.reason ?? ''))
		.reduce((a, r) => a + r.n, 0);
	const labelled = labels.reduce((a, l) => a + l.n, 0);
	const judged = labels.filter((l) => l.label !== 'bad_photos').reduce((a, l) => a + l.n, 0);
	const agreed = labels.find((l) => l.label === 'agree')?.n ?? 0;
	return {
		days,
		total,
		outcomes: Object.fromEntries(outcomes.map((o) => [o.outcome ?? 'unknown', o.n])),
		reasons: reasons.map((r) => ({ reason: r.reason ?? '', n: r.n })),
		serviceErrors,
		labels: Object.fromEntries(labels.map((l) => [l.label ?? '', l.n])),
		labelled,
		/** Share of judged scans where reviewers agreed with the AI, or null with fewer than 10. */
		agreement: judged >= 10 ? agreed / judged : null,
		waitingForReview: waiting.n
	};
}
