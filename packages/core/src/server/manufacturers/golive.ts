import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { toGtin14 } from '../../gs1/gtin.ts';
import { audit, type Actor } from '../audit.ts';
import { ctx, reportDb } from '../context.ts';
import { serialExactHmac } from '../crypto.ts';
import { auditLog, importJob, manufacturer, pack, packVoid, product } from '../db/schema.ts';
import { sendEmail } from '../email/index.ts';
import { emailTemplates } from '../email/templates.ts';
import { fileKind, readRows } from '../imports/read.ts';
import { getObject } from '../storage.ts';
import { clearCoverageCache } from '../verify/lookup.ts';
import { notifyStaff } from './register.ts';
import { ReviewError } from './review.ts';
import { goLiveChecklist } from './summary.ts';
import { emitEvent } from '../webhooks.ts';

/** MF6: the manufacturer submits its data for a DETECK go-live review. */
export async function submitForReview(actor: Actor, manufacturerId: string) {
	const [m] = await ctx().db.select().from(manufacturer).where(eq(manufacturer.id, manufacturerId));
	if (!m) throw new ReviewError('Manufacturer not found.');
	if (!['approved', 'changes_requested'].includes(m.status))
		throw new ReviewError('Your data can be submitted once DETECK has approved your company.');
	const checklist = await goLiveChecklist(manufacturerId);
	if (checklist.blocking) throw new ReviewError('Fix the items marked in red first.');
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(manufacturer)
			.set({
				status: 'in_review',
				submittedForReviewAt: new Date(),
				submittedForReviewBy: actor.userId
			})
			.where(eq(manufacturer.id, manufacturerId));
		await audit(
			actor,
			{
				area: 'Manufacturer board',
				action: 'golive_submit',
				itemType: 'manufacturer',
				itemId: manufacturerId,
				manufacturerId,
				summary: `Submitted ${m.companyName} for go-live review`,
				before: { status: m.status },
				after: { status: 'in_review' }
			},
			tx
		);
	});
	await notifyStaff(
		`${m.companyName} is ready for a go-live review`,
		`Review it: ${ctx().config.origin}/console/manufacturers/${manufacturerId}/review`
	).catch(() => undefined);
}

export interface SpotCheck {
	fileName: string | null;
	sampled: number;
	found: number;
	/** The file was deleted after the retention period, so nothing could be re-read. */
	fileDeleted?: boolean;
}

/** Row numbers the import held back as problems (from its problem report), if it still exists. */
async function problemRowNumbers(problemsKey: string | null): Promise<Set<number>> {
	const rows = new Set<number>();
	if (!problemsKey) return rows;
	try {
		const { parse } = await import('csv-parse/sync');
		const text = (await getObject(problemsKey)).toString('utf8');
		const records = parse(text, { relax_column_count: true });
		for (const r of (records as string[][]).slice(1)) rows.add(Number(r[0]));
	} catch {
		// No report to read: every row is sampled, and the console explains a shortfall.
	}
	return rows;
}

/**
 * Re-reads 20 random rows from the latest serial import and checks they are on record. Rows the
 * import held back as problems, and rows for other companies' drugs, are left out.
 */
export async function spotCheck(manufacturerId: string, sampleSize = 20): Promise<SpotCheck> {
	const { db } = ctx();
	const [job] = await db
		.select()
		.from(importJob)
		.where(
			and(
				eq(importJob.manufacturerId, manufacturerId),
				eq(importJob.kind, 'batches_serials'),
				eq(importJob.status, 'committed')
			)
		)
		.orderBy(desc(importJob.committedAt))
		.limit(1);
	if (!job) return { fileName: null, sampled: 0, found: 0 };
	if (job.fileDeletedAt) return { fileName: job.fileName, sampled: 0, found: 0, fileDeleted: true };
	const kind = fileKind(job.fileName, '');
	const headers = job.headers ?? [];
	const gtinIdx = headers.indexOf(job.mapping?.gtin ?? '\0');
	const serialIdx = headers.indexOf(job.mapping?.serial ?? '\0');
	if (!kind || gtinIdx < 0 || serialIdx < 0)
		return { fileName: job.fileName, sampled: 0, found: 0 };
	const own = new Set(
		(
			await db
				.select({ gtin: product.gtin })
				.from(product)
				.where(eq(product.manufacturerId, manufacturerId))
		).map((p) => p.gtin)
	);
	const problems = await problemRowNumbers(job.problemsKey);
	// The file can be gone from storage before it's marked deleted (removed by hand, or a storage
	// problem): say it can't be re-read rather than failing the review page.
	const body = await getObject(job.fileKey).catch(() => null);
	if (!body) return { fileName: job.fileName, sampled: 0, found: 0, fileDeleted: true };

	// Reservoir sampling over distinct serials keeps memory flat for large files.
	const sample: { gtin: string; serial: string }[] = [];
	const picked = new Set<string>();
	let seen = 0;
	let first = true;
	let rowNumber = 1;
	for await (const row of readRows(body, kind)) {
		if (first) {
			first = false;
			continue;
		}
		rowNumber++;
		if (problems.has(rowNumber)) continue;
		const gtin = toGtin14(row[gtinIdx] ?? '');
		const serial = (row[serialIdx] ?? '').trim();
		if (!gtin || !own.has(gtin) || !serial || picked.has(`${gtin}|${serial}`)) continue;
		seen++;
		if (sample.length < sampleSize) {
			sample.push({ gtin, serial });
			picked.add(`${gtin}|${serial}`);
		} else {
			const j = Math.floor(Math.random() * seen);
			if (j < sampleSize) {
				picked.delete(`${sample[j].gtin}|${sample[j].serial}`);
				sample[j] = { gtin, serial };
				picked.add(`${gtin}|${serial}`);
			}
		}
	}
	if (sample.length === 0) return { fileName: job.fileName, sampled: 0, found: 0 };
	const found = await db
		.select({ n: sql<number>`count(*)::int` })
		.from(pack)
		.innerJoin(product, eq(product.id, pack.productId))
		.where(
			and(
				eq(product.manufacturerId, manufacturerId),
				inArray(
					pack.serialExactHmac,
					sample.map((s) => serialExactHmac(s.gtin, s.serial))
				),
				sql`not exists (select 1 from ${packVoid} v where v.pack_id = ${pack}.id)`
			)
		);
	return { fileName: job.fileName, sampled: sample.length, found: found[0].n };
}

/**
 * Serials of this manufacturer that another manufacturer also uses (typed the same way). Allowed,
 * but the reviewer should know: they could be copied from another company's file.
 */
export async function sharedSerialCount(manufacturerId: string): Promise<number> {
	const [row] = await reportDb().execute<{ n: number }>(sql`
		select count(*)::int as n from ${pack} k
		join ${product} p on p.id = k.product_id
		where p.manufacturer_id = ${manufacturerId}
			and exists (
				select 1 from ${pack} o join ${product} op on op.id = o.product_id
				where o.serial_key_hmac = k.serial_key_hmac and op.manufacturer_id <> ${manufacturerId})`);
	return row.n;
}

/** Whether this staff member imported or edited data on the manufacturer's behalf. */
async function actedOnBehalf(userId: string, manufacturerId: string) {
	const [row] = await ctx()
		.db.select({ n: sql<number>`count(*)::int` })
		.from(auditLog)
		.where(
			and(
				eq(auditLog.actorUserId, userId),
				eq(auditLog.manufacturerId, manufacturerId),
				eq(auditLog.onBehalf, true)
			)
		);
	return row.n > 0;
}

/** MF6/MF7: approve and go live, or send back with a note. A different person from the preparer must decide. */
export async function decideGoLive(
	actor: Actor,
	manufacturerId: string,
	decision: 'approve' | 'send_back',
	note: string
) {
	const [m] = await ctx().db.select().from(manufacturer).where(eq(manufacturer.id, manufacturerId));
	if (!m) throw new ReviewError('Manufacturer not found.');
	if (m.status !== 'in_review')
		throw new ReviewError('This manufacturer is not waiting for a go-live review.');
	if (decision === 'send_back' && note.trim().length < 3)
		throw new ReviewError('Add a note saying what needs to change.');
	if (
		actor.userId &&
		(actor.userId === m.submittedForReviewBy || (await actedOnBehalf(actor.userId, manufacturerId)))
	) {
		throw new ReviewError(
			'Only a different person from the one who prepared the data can approve it.'
		);
	}
	// The approve button is disabled when the checklist blocks; check again here, on the server.
	if (decision === 'approve' && (await goLiveChecklist(manufacturerId)).blocking)
		throw new ReviewError(
			"The checklist still has a blocking item, so this data can't go live yet."
		);
	const spot = decision === 'approve' ? await spotCheck(manufacturerId) : null;
	const status = decision === 'approve' ? 'live' : 'changes_requested';
	await ctx().db.transaction(async (tx) => {
		const updated = await tx
			.update(manufacturer)
			.set({
				status,
				statusReason: note.trim() || null,
				wentLiveAt: decision === 'approve' ? new Date() : m.wentLiveAt
			})
			// Only if nobody else decided in the meantime.
			.where(and(eq(manufacturer.id, manufacturerId), eq(manufacturer.status, 'in_review')))
			.returning({ id: manufacturer.id });
		if (updated.length === 0)
			throw new ReviewError('Someone else decided this review a moment ago. Reload the page.');
		await audit(
			actor,
			{
				area: 'Console',
				action: decision === 'approve' ? 'golive_approve' : 'golive_send_back',
				itemType: 'manufacturer',
				itemId: manufacturerId,
				manufacturerId,
				summary:
					decision === 'approve'
						? `Approved ${m.companyName} to go live`
						: `Sent ${m.companyName} back with changes requested`,
				before: { status: m.status },
				after: { status, note, spotCheck: spot }
			},
			tx
		);
	});
	clearCoverageCache();
	await emitEvent(manufacturerId, 'golive.decided', {
		decision: decision === 'approve' ? 'live' : 'changes_requested',
		note: note.trim() || null
	});
	await sendEmail(
		emailTemplates.goLiveDecision({
			to: m.contactEmail,
			company: m.companyName,
			approved: decision === 'approve',
			note: note.trim(),
			url: `${ctx().config.origin}/workspace`
		})
	).catch((error) => console.error('[email] go-live decision', error));
}
