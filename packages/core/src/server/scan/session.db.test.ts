import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import '../job-definitions.ts';
import { ctx } from '../context.ts';
import { SYSTEM_ACTOR } from '../audit.ts';
import { batch, checkEvent, packagingReference, scanSession } from '../db/schema.ts';
import {
	addReferenceImage,
	draftReference,
	PackagingError,
	referenceForBatch,
	REQUIRED_SIDES,
	submitReference
} from '../packaging.ts';
import { clearCoverageCache } from '../verify/lookup.ts';
import { runCheck, type Requester } from '../verify/check.ts';
import { getObject } from '../storage.ts';
import { loadScan, purgeScanPhotos, setComparer, startScan } from './session.ts';
import { resetDb } from '../../../tests/helpers/db.ts';
import { makeLivePack } from '../../../tests/helpers/fixtures.ts';
import { packPhoto } from '../../../tests/helpers/photos.ts';

const requester: Requester = {
	deviceId: 'scan-device',
	ip: '10.0.0.9',
	state: 'Lagos',
	packagingEnabled: true
};

async function readyReference(productId: string, manufacturerId: string, effectiveFrom?: string) {
	const refId = await draftReference(SYSTEM_ACTOR, productId, manufacturerId, effectiveFrom);
	const photo = await packPhoto({ width: 1400, height: 1100 });
	for (const side of REQUIRED_SIDES)
		await addReferenceImage(SYSTEM_ACTOR, refId, manufacturerId, side, photo);
	await submitReference(SYSTEM_ACTOR, refId, manufacturerId);
	return refId;
}

describe('genuine packaging references (US-05.4)', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
	});

	it('rejects small or blurry reference photos and requires every side', async () => {
		const { product: p, manufacturer: m } = await makeLivePack();
		const refId = await draftReference(SYSTEM_ACTOR, p.id, m.id);
		const small = await addReferenceImage(
			SYSTEM_ACTOR,
			refId,
			m.id,
			'front',
			await packPhoto({ width: 900, height: 820 })
		);
		expect(small).toMatchObject({ passed: false });
		expect(small.failReason).toContain('820 px');
		const blurry = await addReferenceImage(
			SYSTEM_ACTOR,
			refId,
			m.id,
			'back',
			await packPhoto({ width: 1400, height: 1100, blur: 6 })
		);
		expect(blurry.failReason).toContain('blurry');
		await expect(submitReference(SYSTEM_ACTOR, refId, m.id)).rejects.toBeInstanceOf(PackagingError);
	});

	it('keeps a passing photo when a replacement fails, and refuses a second submit', async () => {
		const pack = await makeLivePack('KEEPPHOTO001');
		const refId = await readyReference(pack.product.id, pack.manufacturer.id);
		await expect(submitReference(SYSTEM_ACTOR, refId, pack.manufacturer.id)).rejects.toBeInstanceOf(
			PackagingError
		);
		const draft = await draftReference(
			SYSTEM_ACTOR,
			pack.product.id,
			pack.manufacturer.id,
			'2026-06-01'
		);
		await addReferenceImage(
			SYSTEM_ACTOR,
			draft,
			pack.manufacturer.id,
			'front',
			await packPhoto({ width: 1400, height: 1100 })
		);
		const blurry = await addReferenceImage(
			SYSTEM_ACTOR,
			draft,
			pack.manufacturer.id,
			'front',
			await packPhoto({ width: 1400, height: 1100, blur: 8 })
		);
		expect(blurry).toMatchObject({ passed: false, kept: true });
	});

	it('becomes ready after processing and is chosen by manufacture date', async () => {
		const { product: p, manufacturer: m, batch: b } = await makeLivePack();
		const v1 = await readyReference(p.id, m.id);
		expect(
			(await ctx().db.select().from(packagingReference).where(eq(packagingReference.id, v1)))[0]
				.status
		).toBe('ready');
		const v2 = await readyReference(p.id, m.id, '2026-06-01');
		expect((await referenceForBatch(p.id, '2026-03-01'))?.ref.id).toBe(v1);
		expect((await referenceForBatch(p.id, '2026-07-01'))?.ref.id).toBe(v2);
		expect(b.manufactureDate).toBe('2026-03-01');
	});
});

describe('packaging scan (F-02)', () => {
	beforeEach(async () => {
		await resetDb();
		clearCoverageCache();
		setComparer(undefined);
	});

	async function validResult() {
		const pack = await makeLivePack('SCANPACK0001');
		await readyReference(pack.product.id, pack.manufacturer.id);
		const outcome = await runCheck('SCANPACK0001', requester);
		if (!outcome.ok) throw new Error('setup');
		expect(outcome.result.packagingAvailable).toBe(true);
		return { ...pack, verificationId: outcome.id };
	}

	const photos = async () => ({
		front: await packPhoto(),
		back: await packPhoto(),
		label: await packPhoto()
	});

	it('compares the photos, records a closed-set result and deletes the photos', async () => {
		setComparer({
			compare: async () => ({
				outcome: 'INCONSISTENCIES_FOUND',
				categories: [{ category: 'logo', side: 'front', note: 'The logo blue is lighter.' }],
				confidence: 0.82,
				model: 'fake'
			})
		});
		const { verificationId } = await validResult();
		const started = await startScan(requester, verificationId, await photos(), false);
		expect(started.ok).toBe(true);
		if (!started.ok) return;
		const loaded = await loadScan(started.id);
		expect(loaded?.session).toMatchObject({
			status: 'done',
			outcome: 'INCONSISTENCIES_FOUND',
			model: 'fake'
		});
		expect(loaded?.session.categories).toEqual([
			{ category: 'logo', detail: 'front: The logo blue is lighter.' }
		]);
		expect(loaded?.session.photosDeletedAt).not.toBeNull();
		await expect(getObject(loaded!.session.photoKeys.front)).rejects.toThrow();
		expect(await ctx().db.$count(checkEvent, eq(checkEvent.kind, 'packaging'))).toBe(1);
	});

	it('says "can\'t tell" when the comparison fails, instead of leaving the scan running', async () => {
		setComparer({
			compare: async () => {
				throw new Error('provider down');
			}
		});
		const { verificationId } = await validResult();
		const started = await startScan(requester, verificationId, await photos(), false);
		if (!started.ok) throw new Error(started.message);
		const loaded = await loadScan(started.id);
		expect(loaded?.session).toMatchObject({ status: 'done', outcome: 'CANT_TELL', error: 'error' });
	});

	it('says "can\'t tell" when no AI provider is configured', async () => {
		const { verificationId } = await validResult();
		const started = await startScan(requester, verificationId, await photos(), true);
		if (!started.ok) throw new Error(started.message);
		const loaded = await loadScan(started.id);
		expect(loaded?.session).toMatchObject({ outcome: 'CANT_TELL', error: 'not_configured' });
		expect(loaded?.session.photosDeletedAt).toBeNull();
		// Consented photos are kept for 90 days, then purged.
		await ctx()
			.db.update(scanSession)
			.set({ createdAt: new Date(Date.now() - 91 * 86400000) })
			.where(eq(scanSession.id, started.id));
		expect(await purgeScanPhotos()).toBe(1);
	});

	it('asks for a retake when a photo is blurry, before any result', async () => {
		const { verificationId } = await validResult();
		const r = await startScan(
			requester,
			verificationId,
			{ ...(await photos()), back: await packPhoto({ blur: 6 }) },
			false
		);
		expect(r).toMatchObject({ ok: false, side: 'back' });
		expect(await ctx().db.$count(scanSession)).toBe(0);
	});

	it('refuses packs whose serial is not on record, and limits scans per device per day', async () => {
		const { verificationId } = await validResult();
		await ctx()
			.db.update(batch)
			.set({ status: 'recalled', statusReason: 'x', statusSource: 'NAFDAC' });
		const recalled = await runCheck('SCANPACK0001', requester);
		if (!recalled.ok) throw new Error();
		expect((await startScan(requester, recalled.id, await photos(), false)).ok).toBe(false);
		// A result saved before the recall now shows the recall too, so it's refused as well.
		expect((await startScan(requester, verificationId, await photos(), false)).ok).toBe(false);
		await ctx().db.update(batch).set({ status: 'active', statusReason: null, statusSource: null });

		const limit = ctx().config.rateLimits.scansPerDevicePerDay;
		const busy: Requester = { ...requester, deviceId: 'busy-scanner' };
		for (let i = 0; i < limit; i++)
			expect((await startScan(busy, verificationId, await photos(), false)).ok).toBe(true);
		expect(await startScan(busy, verificationId, await photos(), false)).toMatchObject({
			ok: false,
			status: 429
		});
	});
});
