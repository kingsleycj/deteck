/**
 * Recall alerts: someone who checked a pack can ask to be told if its batch is recalled or
 * withdrawn later, by email (confirmed by a link first) or WhatsApp. Addresses are kept only for
 * this and deleted 30 days after the batch expires, or as soon as the person unsubscribes.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm';
import { ctx } from './context.ts';
import { sha256Hex } from './crypto.ts';
import { batch, manufacturer, product, recallAlert } from './db/schema.ts';
import { sendEmail } from './email/index.ts';
import type { EmailMessage } from './email/index.ts';
import { fmt, isLocale, messages, type Messages } from '../messages/i18n.ts';
import { enqueue } from './jobs.ts';
import { consume } from './rate-limit.ts';
import { loadResult } from './verify/check.ts';
import { normalisePhone, sendTemplate, whatsappEnabled } from './whatsapp.ts';

export type AlertChannel = 'email' | 'whatsapp';

export type AlertErrorCode = keyof Messages['alerts']['errors'];

/** `code` lets public pages show the message in the visitor's language. */
export class AlertError extends Error {
	readonly code?: AlertErrorCode;
	constructor(message: string, code?: AlertErrorCode) {
		super(message);
		this.code = code;
	}
}

const dictFor = (locale: string | null | undefined) => messages(isLocale(locale) ? locale : 'en');

function confirmEmail(
	t: Messages,
	p: { to: string; drug: string; lot: string; confirmUrl: string; stopUrl: string }
): EmailMessage {
	const e = t.alerts.emails;
	return {
		to: p.to,
		subject: fmt(e.confirmSubject, p),
		text: `${fmt(e.confirmBody, p)}\n\n${e.signature}`
	};
}

function recallEmail(
	t: Messages,
	p: {
		to: string;
		drug: string;
		lot: string;
		withdrawn: boolean;
		source: string | null;
		reason: string | null;
		stopUrl: string;
	}
): EmailMessage {
	const e = t.alerts.emails;
	const by = p.source ? fmt(e.by, { source: p.source }) : '';
	const params = { drug: p.drug, lot: p.lot, by };
	return {
		to: p.to,
		subject: fmt(p.withdrawn ? e.recallSubjectWithdrawn : e.recallSubjectRecalled, params),
		text: [
			fmt(p.withdrawn ? e.recallBodyWithdrawn : e.recallBodyRecalled, params),
			...(p.reason ? [fmt(e.reason, { reason: p.reason })] : []),
			e.advice,
			fmt(e.stop, { stopUrl: p.stopUrl }),
			e.signature
		].join('\n\n')
	};
}

const DAY = 86_400_000;

/** Link tokens are "<id>.<signature>", so nothing secret needs storing. */
function token(purpose: 'confirm' | 'stop', id: string): string {
	const sig = createHmac('sha256', ctx().config.deviceHashSecret)
		.update(`alert:${purpose}:${id}`)
		.digest('base64url')
		.slice(0, 32);
	return `${id}.${sig}`;
}

function readToken(purpose: 'confirm' | 'stop', value: string): string | null {
	const [id] = value.split('.');
	if (!id || !/^[0-9a-f-]{36}$/.test(id)) return null;
	const expected = Buffer.from(token(purpose, id));
	const given = Buffer.from(value);
	return expected.length === given.length && timingSafeEqual(expected, given) ? id : null;
}

/** Whether a stop link is one DETECK made (its signature only: nothing is looked up or changed). */
export function isStopToken(value: string): boolean {
	return readToken('stop', value) !== null;
}

export function stopUrl(id: string) {
	return `${ctx().config.origin}/alerts/stop/${token('stop', id)}`;
}

/** Signs up for alerts on the batch of a Valid result. */
export async function subscribeToRecalls(input: {
	verificationId: string;
	channel: AlertChannel;
	address: string;
	locale?: string;
}): Promise<{ channel: AlertChannel; alreadySubscribed: boolean }> {
	const result = await loadResult(input.verificationId);
	// The batch was recalled after this check: there's nothing to wait for, so say so.
	if (result?.code === 'RECALLED')
		throw new AlertError(
			'This batch has already been recalled or withdrawn. Check the serial again to see what to do.',
			'already_recalled'
		);
	if (!result || result.code !== 'VALID' || !result.batch || !result.product)
		throw new AlertError(
			'This result has expired. Check the serial again, then sign up.',
			'expired'
		);
	let address: string;
	if (input.channel === 'email') {
		address = input.address.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address))
			throw new AlertError(
				'That email address is missing something, like .com or .ng.',
				'bad_email'
			);
	} else {
		if (!whatsappEnabled())
			throw new AlertError('WhatsApp alerts are not available yet.', 'whatsapp_off');
		const phone = normalisePhone(input.address);
		if (!phone)
			throw new AlertError('Enter your WhatsApp number, like 0803 123 4567.', 'bad_phone');
		address = phone;
	}
	const { db } = ctx();
	const expiresAt = new Date(new Date(result.batch.expiryDate).getTime() + 30 * DAY);
	const id = crypto.randomUUID();
	const [created] = await db
		.insert(recallAlert)
		.values({
			id,
			batchId: result.batch.id,
			channel: input.channel,
			address,
			locale: isLocale(input.locale) ? input.locale : 'en',
			confirmTokenHash: sha256Hex(token('confirm', id)),
			unsubscribeTokenHash: sha256Hex(token('stop', id)),
			// Both channels wait for the person: a link for email, a "YES" reply on WhatsApp. Nobody
			// can sign someone else up just by typing their address.
			confirmedAt: null,
			expiresAt
		})
		.onConflictDoNothing()
		.returning();
	const drug = `${result.product.brandName} ${result.product.strength}`;
	/** At most two sign-up messages a day to one address, however many times it's typed in. */
	async function mayMessage() {
		const limited = await consume([
			{ key: `alert:to:${sha256Hex(address)}:day`, windowSeconds: 86_400, max: 2 }
		]);
		if (limited.ok) return;
		if (created) await db.delete(recallAlert).where(eq(recallAlert.id, created.id));
		throw new AlertError(
			"We've already sent sign-up messages to this address today. Check your inbox (and spam), or try again tomorrow.",
			'too_many'
		);
	}
	if (!created) {
		const [existing] = await db
			.select()
			.from(recallAlert)
			.where(
				and(
					eq(recallAlert.batchId, result.batch.id),
					eq(recallAlert.channel, input.channel),
					eq(recallAlert.address, address)
				)
			);
		if (existing?.confirmedAt) return { channel: input.channel, alreadySubscribed: true };
		if (existing) await mayMessage();
		if (existing && input.channel === 'email')
			await sendEmail(
				confirmEmail(dictFor(existing.locale), {
					to: address,
					drug,
					lot: result.batch.lot,
					confirmUrl: `${ctx().config.origin}/alerts/confirm/${token('confirm', existing.id)}`,
					stopUrl: stopUrl(existing.id)
				})
			);
		return { channel: input.channel, alreadySubscribed: false };
	}
	await mayMessage();
	if (input.channel === 'email') {
		await sendEmail(
			confirmEmail(dictFor(input.locale), {
				to: address,
				drug,
				lot: result.batch.lot,
				confirmUrl: `${ctx().config.origin}/alerts/confirm/${token('confirm', id)}`,
				stopUrl: stopUrl(id)
			})
		);
	} else {
		const wa = ctx().config.whatsapp!;
		await sendTemplate(address, wa.templates.subscribed, [drug, result.batch.lot]).catch(
			async (error) => {
				await db.delete(recallAlert).where(eq(recallAlert.id, id));
				console.error('[alerts] WhatsApp sign-up failed', error);
				throw new AlertError(
					"We couldn't send a WhatsApp message to that number.",
					'whatsapp_failed'
				);
			}
		);
	}
	return { channel: input.channel, alreadySubscribed: false };
}

async function alertDetails(id: string) {
	const [row] = await ctx()
		.db.select({
			alert: recallAlert,
			drug: product.brandName,
			strength: product.strength,
			lot: batch.lot,
			batchStatus: batch.status
		})
		.from(recallAlert)
		.innerJoin(batch, eq(batch.id, recallAlert.batchId))
		.innerJoin(product, eq(product.id, batch.productId))
		.where(eq(recallAlert.id, id));
	return row;
}

/** The link in the confirmation email. */
export async function confirmAlert(value: string) {
	const id = readToken('confirm', value);
	if (!id) return null;
	const row = await alertDetails(id);
	if (!row) return null;
	if (!row.alert.confirmedAt) {
		await ctx()
			.db.update(recallAlert)
			.set({ confirmedAt: new Date() })
			.where(eq(recallAlert.id, id));
		// Recalled while the email waited to be confirmed: send the alert now.
		if (row.batchStatus !== 'active') await queueRecallAlerts(row.alert.batchId);
	}
	return { drug: `${row.drug} ${row.strength}`, lot: row.lot };
}

/** What a confirmation link is for, without confirming it (the page asks first). */
export async function previewAlert(value: string) {
	const id = readToken('confirm', value);
	if (!id) return null;
	const row = await alertDetails(id);
	if (!row) return null;
	return {
		drug: `${row.drug} ${row.strength}`,
		lot: row.lot,
		confirmed: Boolean(row.alert.confirmedAt)
	};
}

/** Someone replied YES on WhatsApp: confirm that number's pending sign-ups. */
export async function confirmWhatsApp(phone: string) {
	const n = normalisePhone(phone);
	if (!n) return 0;
	const confirmed = await ctx()
		.db.update(recallAlert)
		.set({ confirmedAt: new Date() })
		.where(
			and(
				eq(recallAlert.channel, 'whatsapp'),
				eq(recallAlert.address, n),
				isNull(recallAlert.confirmedAt)
			)
		)
		.returning({ batchId: recallAlert.batchId });
	for (const batchId of new Set(confirmed.map((c) => c.batchId))) {
		const [b] = await ctx()
			.db.select({ status: batch.status })
			.from(batch)
			.where(eq(batch.id, batchId));
		if (b && b.status !== 'active') await queueRecallAlerts(batchId);
	}
	return confirmed.length;
}

/** Queues the alerts for a recalled batch, retrying for a while if a provider is down. */
export async function queueRecallAlerts(batchId: string) {
	// Never let a send problem undo the recall itself: the hourly sweep tries again.
	await enqueue(
		'alerts.recall',
		{ batchId },
		{ retryLimit: 6, retryDelay: 60, retryBackoff: true }
	).catch((error) => console.error('[alerts] will retry', batchId, error));
}

/**
 * The hourly safety net: confirmed alerts for recalled batches that were never sent (a provider
 * outage outlasted the retries, or the job was lost) are queued again.
 */
export async function sweepUnsentAlerts() {
	const due = await ctx()
		.db.selectDistinct({ batchId: recallAlert.batchId })
		.from(recallAlert)
		.innerJoin(batch, eq(batch.id, recallAlert.batchId))
		.where(
			and(
				isNotNull(recallAlert.confirmedAt),
				isNull(recallAlert.sentAt),
				sql`${batch.status} <> 'active'`
			)
		);
	for (const d of due) await queueRecallAlerts(d.batchId);
	return due.length;
}

/** The "stop" link in every alert email. */
export async function unsubscribeAlert(value: string) {
	const id = readToken('stop', value);
	if (!id) return null;
	const row = await alertDetails(id);
	if (!row) return { drug: null, lot: null };
	await ctx().db.delete(recallAlert).where(eq(recallAlert.id, id));
	return { drug: `${row.drug} ${row.strength}`, lot: row.lot };
}

/** Someone replied STOP on WhatsApp: remove every alert for that number. */
export async function unsubscribeWhatsApp(phone: string) {
	const n = normalisePhone(phone);
	if (!n) return 0;
	const removed = await ctx()
		.db.delete(recallAlert)
		.where(and(eq(recallAlert.channel, 'whatsapp'), eq(recallAlert.address, n)))
		.returning({ id: recallAlert.id });
	return removed.length;
}

/** The worker's job when a batch is recalled or withdrawn. */
export async function sendRecallAlerts(batchId: string) {
	const { db } = ctx();
	const [b] = await db
		.select({
			batch,
			drug: product.brandName,
			strength: product.strength,
			maker: manufacturer.companyName
		})
		.from(batch)
		.innerJoin(product, eq(product.id, batch.productId))
		.innerJoin(manufacturer, eq(manufacturer.id, product.manufacturerId))
		.where(eq(batch.id, batchId));
	if (!b || b.batch.status === 'active') return 0;
	const due = await db
		.select()
		.from(recallAlert)
		.where(
			and(
				eq(recallAlert.batchId, batchId),
				isNotNull(recallAlert.confirmedAt),
				isNull(recallAlert.sentAt)
			)
		);
	const drug = `${b.drug} ${b.strength}`;
	const verb = b.batch.status === 'withdrawn' ? 'withdrawn' : 'recalled';
	let sent = 0;
	let failed = 0;
	for (const alert of due) {
		try {
			if (alert.channel === 'email') {
				await sendEmail(
					recallEmail(dictFor(alert.locale), {
						to: alert.address,
						drug,
						lot: b.batch.lot,
						withdrawn: verb === 'withdrawn',
						source: b.batch.statusSource,
						reason: b.batch.statusReason,
						stopUrl: stopUrl(alert.id)
					})
				);
			} else {
				const wa = ctx().config.whatsapp;
				if (!wa) continue;
				await sendTemplate(alert.address, wa.templates.recall, [
					drug,
					b.batch.lot,
					verb,
					b.batch.statusReason ?? 'No reason given'
				]);
			}
			await db.update(recallAlert).set({ sentAt: new Date() }).where(eq(recallAlert.id, alert.id));
			sent++;
		} catch (error) {
			failed++;
			console.error('[alerts] could not send', alert.id, error);
		}
	}
	// Failing the job makes the queue try again later; alerts already sent are marked, so nobody
	// gets one twice.
	if (failed)
		throw new Error(`${failed} recall alert(s) for batch ${batchId} couldn't be sent yet`);
	return sent;
}

/** Queues the "no longer recalled" emails after DETECK or the manufacturer lifts a recall. */
export async function queueRecallLifted(batchId: string) {
	await enqueue(
		'alerts.lifted',
		{ batchId },
		{ retryLimit: 6, retryDelay: 60, retryBackoff: true }
	).catch((error) => console.error('[alerts] lifted notice will not be sent', batchId, error));
}

/**
 * The batch is active again: everyone who was told about the recall by email is told it's lifted,
 * and every alert is reset, so a later recall alerts them again. WhatsApp only has approved
 * templates for sign-up and recall, so WhatsApp subscribers are reset without a message.
 */
export async function sendRecallLiftedAlerts(batchId: string) {
	const { db } = ctx();
	const [b] = await db
		.select({ batch, drug: product.brandName, strength: product.strength })
		.from(batch)
		.innerJoin(product, eq(product.id, batch.productId))
		.where(eq(batch.id, batchId));
	if (!b || b.batch.status !== 'active') return 0;
	const told = await db
		.select()
		.from(recallAlert)
		.where(and(eq(recallAlert.batchId, batchId), isNotNull(recallAlert.sentAt)));
	const drug = `${b.drug} ${b.strength}`;
	let sent = 0;
	let failed = 0;
	for (const alert of told) {
		try {
			if (alert.channel === 'email') {
				const e = dictFor(alert.locale).alerts.emails;
				const params = { drug, lot: b.batch.lot };
				await sendEmail({
					to: alert.address,
					subject: fmt(e.liftedSubject, params),
					text: [
						fmt(e.liftedBody, params),
						fmt(e.liftedStop, { stopUrl: stopUrl(alert.id) }),
						e.signature
					].join('\n\n')
				});
				sent++;
			}
			await db.update(recallAlert).set({ sentAt: null }).where(eq(recallAlert.id, alert.id));
		} catch (error) {
			failed++;
			console.error('[alerts] could not send lifted notice', alert.id, error);
		}
	}
	if (failed)
		throw new Error(
			`${failed} "recall lifted" notice(s) for batch ${batchId} couldn't be sent yet`
		);
	return sent;
}

/** Deletes alerts past their batch's expiry, and email sign-ups never confirmed within 7 days. */
export async function purgeAlerts(now = new Date()) {
	await ctx()
		.db.delete(recallAlert)
		.where(
			or(
				lt(recallAlert.expiresAt, now),
				and(
					isNull(recallAlert.confirmedAt),
					lt(recallAlert.createdAt, new Date(now.getTime() - 7 * DAY))
				)
			)
		);
}
