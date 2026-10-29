import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from '../context.ts';
import { randomId } from '../crypto.ts';
import { auditLog, scanSession, user } from '../db/schema.ts';
import type { Actor } from '../audit.ts';
import { labelScan, scanAccuracy, ScanReviewError, scansForReview } from './review.ts';
import { resetDb } from '../../../tests/helpers/db.ts';

const REVIEWER: Actor = { userId: 'rev-1', label: 'Kemi (DETECK)', role: 'DETECK reviewer' };
const DAY = 86_400_000;

async function makeScan(values: Partial<typeof scanSession.$inferInsert> = {}) {
	const [row] = await ctx()
		.db.insert(scanSession)
		.values({
			id: randomId(12),
			expiresAt: new Date(Date.now() + DAY),
			status: 'done',
			retainConsent: true,
			outcome: 'NO_VISIBLE_INCONSISTENCIES',
			photoKeys: { front: 'scans/x/front.jpg', back: 'scans/x/back.jpg' },
			completedAt: new Date(),
			...values
		})
		.returning();
	return row;
}

describe('packaging scan review', () => {
	beforeEach(async () => {
		await resetDb();
		await ctx().db.insert(user).values({
			id: 'rev-1',
			name: 'Kemi',
			email: 'kemi@deteck.example',
			platformRole: 'reviewer'
		});
	});

	it('lists only finished scans whose photos the person agreed to keep', async () => {
		const shown = await makeScan();
		await makeScan({ retainConsent: false });
		await makeScan({ photosDeletedAt: new Date() });
		await makeScan({ status: 'processing', outcome: null });
		await makeScan({ status: 'failed' });
		const list = await scansForReview();
		expect(list.map((s) => s.id)).toEqual([shown.id]);
		expect(list[0].photoSides.sort()).toEqual(['back', 'front']);

		await labelScan(REVIEWER, shown.id, 'agree', '');
		expect(await scansForReview({ unlabelled: true })).toEqual([]);
		expect((await scansForReview())[0]).toMatchObject({ reviewLabel: 'agree', reviewer: 'Kemi' });
	});

	it('validates the label and audits each verdict', async () => {
		const scan = await makeScan({ outcome: 'INCONSISTENCIES_FOUND' });
		await expect(labelScan(REVIEWER, scan.id, 'maybe', '')).rejects.toThrow('Choose a verdict.');
		await expect(labelScan(REVIEWER, 'missing-scan-1', 'agree', '')).rejects.toBeInstanceOf(
			ScanReviewError
		);
		const private_ = await makeScan({ retainConsent: false });
		await expect(labelScan(REVIEWER, private_.id, 'agree', '')).rejects.toBeInstanceOf(
			ScanReviewError
		);

		await labelScan(REVIEWER, scan.id, 'false_alarm', '  Font is the same, lighting differs  ');
		await labelScan(REVIEWER, scan.id, 'agree', '');
		const [row] = await ctx().db.select().from(scanSession).where(eq(scanSession.id, scan.id));
		expect(row).toMatchObject({ reviewLabel: 'agree', reviewNote: null, reviewedBy: 'rev-1' });
		const entries = await ctx()
			.db.select()
			.from(auditLog)
			.where(eq(auditLog.action, 'scan_review'))
			.orderBy(auditLog.id);
		expect(entries.map((e) => [e.before, e.after])).toEqual([
			[{ label: null }, { label: 'false_alarm' }],
			[{ label: 'false_alarm' }, { label: 'agree' }]
		]);
		expect(entries[0].summary).toContain('Differences found');
	});

	// Regression: scans whose photos were deleted can no longer be labelled.
	it('refuses to label a scan whose photos have been deleted', async () => {
		const gone = await makeScan({ photosDeletedAt: new Date() });
		await expect(labelScan(REVIEWER, gone.id, 'agree', '')).rejects.toBeInstanceOf(ScanReviewError);
	});

	it('counts outcomes and service errors, and gives agreement from 10 judged labels', async () => {
		for (const error of ['error', 'timeout', 'refused', 'not_configured', 'low_confidence'])
			await makeScan({ outcome: 'CANT_TELL', error });
		await makeScan({ outcome: 'INCONSISTENCIES_FOUND' });
		await makeScan({ status: 'failed', outcome: null, error: 'error' });
		await makeScan({
			createdAt: new Date(Date.now() - 40 * DAY),
			outcome: 'CANT_TELL',
			error: 'timeout'
		});

		const labelled = async (label: string, n: number) => {
			for (let i = 0; i < n; i++) {
				const s = await makeScan();
				await labelScan(REVIEWER, s.id, label, '');
			}
		};
		await labelled('agree', 5);
		await labelled('missed', 4);
		await labelled('bad_photos', 3);
		await makeScan();

		let stats = await scanAccuracy(30);
		expect(stats.outcomes).toEqual({
			NO_VISIBLE_INCONSISTENCIES: 13,
			CANT_TELL: 5,
			INCONSISTENCIES_FOUND: 1
		});
		expect(stats.total).toBe(19);
		// "AI not set up" is a setting, not a service error.
		expect(stats.serviceErrors).toBe(3);
		expect(stats.reasons).toEqual(
			expect.arrayContaining([
				{ reason: 'low_confidence', n: 1 },
				{ reason: 'timeout', n: 1 }
			])
		);
		expect(stats.labelled).toBe(12);
		expect(stats.labels).toEqual({ agree: 5, missed: 4, bad_photos: 3 });
		expect(stats.agreement).toBeNull();
		expect(stats.waitingForReview).toBe(8);

		await labelled('agree', 1);
		stats = await scanAccuracy(30);
		expect(stats.agreement).toBeCloseTo(6 / 10);
	});
});
