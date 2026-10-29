import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { checkEvent, importJob, webhookDelivery, webhookEndpoint } from './db/schema.ts';
import { SYSTEM_ACTOR } from './audit.ts';
import { serialKeyHmac } from './crypto.ts';
import { defineJob } from './jobs.ts';
import { createImportJob, purgeOldImportFiles } from './imports/engine.ts';
import { notifyUnusualChecks } from './insights.ts';
import { getObject } from './storage.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeLivePack, makeManufacturer, nextGtin } from '../../tests/helpers/fixtures.ts';
import { csv } from '../../tests/helpers/imports.ts';

defineJob('webhook.deliver', async () => undefined);

const DAY = 86_400_000;
type ImportStatus = (typeof importJob.$inferSelect)['status'];

describe('import file retention', () => {
	let manufacturerId: string;

	beforeEach(async () => {
		await resetDb();
		manufacturerId = (await makeManufacturer({ status: 'approved' })).id;
	});

	async function job(status: ImportStatus, ageDays: number) {
		const { job } = await createImportJob(
			SYSTEM_ACTOR,
			manufacturerId,
			'products',
			csv(
				[
					['GTIN', 'Brand name'],
					[nextGtin(), status]
				],
				`${status}.csv`
			)
		);
		await ctx()
			.db.update(importJob)
			.set({ status, createdAt: new Date(Date.now() - ageDays * DAY) })
			.where(eq(importJob.id, job.id));
		return job;
	}

	const load = async (id: string) =>
		(await ctx().db.select().from(importJob).where(eq(importJob.id, id)))[0];

	it('deletes files older than 90 days and cancels imports still waiting', async () => {
		const uploaded = await job('uploaded', 91);
		const ready = await job('ready', 120);
		const committed = await job('committed', 91);
		const failed = await job('failed', 91);
		const validating = await job('validating', 91);
		const committing = await job('committing', 91);
		const recent = await job('ready', 89);
		const now = new Date();

		expect(await purgeOldImportFiles(now)).toBe(4);
		for (const j of [uploaded, ready]) {
			const row = await load(j.id);
			expect(row).toMatchObject({ status: 'cancelled', fileDeletedAt: now });
			expect(row.error).toContain('Not committed within 90 days');
			await expect(getObject(j.fileKey)).rejects.toThrow();
		}
		expect(await load(committed.id)).toMatchObject({
			status: 'committed',
			fileDeletedAt: now,
			error: null
		});
		expect(await load(failed.id)).toMatchObject({ status: 'failed', fileDeletedAt: now });
		await expect(getObject(committed.fileKey)).rejects.toThrow();
		for (const [j, status] of [
			[validating, 'validating'],
			[committing, 'committing'],
			[recent, 'ready']
		] as const) {
			expect(await load(j.id)).toMatchObject({ status, fileDeletedAt: null });
			await expect(getObject(j.fileKey)).resolves.toBeInstanceOf(Buffer);
		}

		expect(await purgeOldImportFiles(now)).toBe(0);
	});
});

describe('unusual check signals', () => {
	let live: Awaited<ReturnType<typeof makeLivePack>>;
	const now = new Date('2026-10-26T12:00:00Z');

	beforeEach(async () => {
		await resetDb();
		live = await makeLivePack('UNUSUAL00001');
		await ctx()
			.db.insert(webhookEndpoint)
			.values({
				manufacturerId: live.manufacturer.id,
				url: 'https://hooks.example.com/a',
				secret: 'whsec_test',
				events: ['check.unusual']
			});
	});

	/** One check event per device (or state), `hoursAgo` before `now`. */
	async function checks(
		serial: string,
		n: number,
		options: {
			states?: string[];
			hoursAgo?: number;
			kind?: 'serial' | 'api';
			sameDevice?: boolean;
		} = {}
	) {
		const at = new Date(now.getTime() - (options.hoursAgo ?? 1) * 3_600_000);
		await ctx()
			.db.insert(checkEvent)
			.values(
				Array.from({ length: n }, (_, i) => ({
					createdAt: at,
					kind: options.kind ?? ('serial' as const),
					result: 'VALID',
					productId: live.product.id,
					batchId: live.batch.id,
					serialKeyHmac: serialKeyHmac(serial),
					deviceDayHash: Buffer.from(options.sameDevice ? 'device-x' : `device-${serial}-${i}`),
					state: options.states?.[i % options.states.length] ?? 'Lagos'
				}))
			);
	}

	const signals = async () =>
		(await ctx().db.select().from(webhookDelivery)).map(
			(d) => (d.payload as { data: Record<string, unknown> }).data
		);

	// Regression: dates in raw SQL must be sent as text.
	it('sends check.unusual for many devices or states, once per serial per day', async () => {
		await checks('MANYDEVICES1', 8);
		await checks('MANYSTATES01', 3, { states: ['Lagos', 'Kano', 'Rivers'], sameDevice: true });
		await checks('QUIET0000001', 7, { states: ['Lagos', 'Kano'] });
		await checks('OLDCHECKS001', 8, { hoursAgo: 25 });
		await checks('APICHECKS001', 8, { kind: 'api' });

		expect(await notifyUnusualChecks(now)).toBe(2);
		const sent = await signals();
		expect(sent).toHaveLength(2);
		expect(sent).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					gtin: live.product.gtin,
					drug: 'Curavyn 500 mg',
					lot: 'NB-2611',
					last24Hours: { checks: 8, devices: 8, states: 1 }
				}),
				expect.objectContaining({ last24Hours: { checks: 3, devices: 1, states: 3 } })
			])
		);
		expect(JSON.stringify(sent)).not.toContain('MANYDEVICES1');

		expect(await notifyUnusualChecks(new Date(now.getTime() + 6 * 3_600_000))).toBe(0);
		expect(await notifyUnusualChecks(new Date('2026-10-27T06:00:00Z'))).toBe(2);
		expect(await ctx().db.$count(webhookDelivery)).toBe(4);
	});
});
