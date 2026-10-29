/**
 * Hourly housekeeping and retention (decisions-for-review R-13, pending legal
 * review OQ-06): expired results, old rate-limit windows, scan photos and sessions,
 * check events older than 13 months, import files older than 90 days, alerts and
 * closed reports. It also sends "serial checked unusually often" webhooks.
 */
import { lt, sql } from 'drizzle-orm';
import { ctx } from './context.ts';
import { checkEvent, verificationResult } from './db/schema.ts';
import { purgeRateLimits } from './rate-limit.ts';
import { purgeScanPhotos, purgeScanSessions } from './scan/session.ts';
import { purgeAlerts, sweepUnsentAlerts } from './alerts.ts';
import { purgeClosedReports } from './reports.ts';
import { purgeOldImportFiles, recoverInterruptedImports } from './imports/engine.ts';
import { notifyUnusualChecks } from './insights.ts';

export const CHECK_EVENT_RETENTION_MONTHS = 13;

export async function runMaintenance(now = new Date()) {
	const { db } = ctx();
	await db.delete(verificationResult).where(lt(verificationResult.expiresAt, now));
	await purgeRateLimits(now);
	const cutoff = new Date(now);
	cutoff.setMonth(cutoff.getMonth() - CHECK_EVENT_RETENTION_MONTHS);
	await db.transaction(async (tx) => {
		await tx.execute(sql`SET LOCAL deteck.allow_purge = 'on'`);
		await tx.delete(checkEvent).where(lt(checkEvent.createdAt, cutoff));
	});
	await purgeScanPhotos(now);
	await purgeScanSessions(now);
	await purgeAlerts(now);
	await purgeClosedReports(now);
	await purgeOldImportFiles(now);
	await notifyUnusualChecks(now);
	await sweepUnsentAlerts();
	// Imports stuck for two hours: their job is gone (the queue retries after an hour).
	await recoverInterruptedImports(120);
}
