/**
 * Reports of suspected fakes. Anyone can send one from a warning result (or any result), with
 * up to three photos and where they bought the pack. DETECK follows up, refers cases to NAFDAC and
 * the manufacturer, and closes them. Contact details are optional and never leave DETECK.
 */
import { and, desc, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm';
import { NIGERIAN_STATES, toNigerianState } from '../nigeria.ts';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import { deviceDayHash } from './crypto.ts';
import { manufacturer, product, report, user } from './db/schema.ts';
import { sendEmail } from './email/index.ts';
import { emailTemplates } from './email/templates.ts';
import { notifyStaff } from './manufacturers/register.ts';
import { consume, ipKey } from './rate-limit.ts';
import { checkPhoto, normalisePhoto } from './scan/quality.ts';
import { deleteObject, putObject } from './storage.ts';
import type { UploadedFile } from './uploads.ts';
import { loadResult } from './verify/check.ts';
import { emitEvent } from './webhooks.ts';

export type ReportErrorCode =
	| 'limit'
	| 'missing_drug'
	| 'missing_place'
	| 'bad_state'
	| 'bad_email'
	| 'photo_too_large'
	| 'photo_unreadable';

/** `code` (with `name` for a photo) lets the public page show the message in any language. */
export class ReportError extends Error {
	readonly code?: ReportErrorCode;
	readonly params: Record<string, string>;
	constructor(message: string, code?: ReportErrorCode, params: Record<string, string> = {}) {
		super(message);
		this.code = code;
		this.params = params;
	}
}

export const REPORT_STATUS = {
	new: 'New',
	investigating: 'Investigating',
	referred: 'Referred to NAFDAC',
	closed: 'Closed'
} as const;
export type ReportStatus = keyof typeof REPORT_STATUS;

export const MAX_REPORT_PHOTOS = 3;
const MAX_PHOTO_BYTES = 12 * 1024 * 1024;

export interface ReportInput {
	verificationId?: string;
	productDescription?: string;
	placeName?: string;
	state?: string;
	town?: string;
	boughtOn?: string;
	details?: string;
	contactName?: string;
	contactEmail?: string;
	contactPhone?: string;
	shareConsent?: boolean;
}

const text = (v: string | undefined, max: number) => v?.trim().slice(0, max) || null;

/** Creates a report. Limited to 5 a day per device. */
export async function createReport(
	who: { deviceId: string; ip: string },
	input: ReportInput,
	photos: UploadedFile[]
) {
	const result = input.verificationId ? await loadResult(input.verificationId) : null;
	const description = text(input.productDescription, 200);
	if (!result?.product && !description)
		throw new ReportError(
			'Say which medicine this is, for example the name and strength on the pack.',
			'missing_drug'
		);
	const placeName = text(input.placeName, 200);
	if (!placeName)
		throw new ReportError(
			'Say where you bought it, for example the pharmacy name.',
			'missing_place'
		);
	const state = input.state ? toNigerianState(input.state) : null;
	if (input.state && !state) throw new ReportError('Choose a state.', 'bad_state');
	const email = text(input.contactEmail, 200)?.toLowerCase() ?? null;
	if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
		throw new ReportError(
			'That email address is missing something, like .com or .ng.',
			'bad_email'
		);
	const boughtOn =
		input.boughtOn && /^\d{4}-\d{2}-\d{2}$/.test(input.boughtOn) ? input.boughtOn : null;
	const files = photos.filter((p) => p.bytes.length > 0).slice(0, MAX_REPORT_PHOTOS);
	for (const photo of files)
		if (photo.bytes.length > MAX_PHOTO_BYTES)
			throw new ReportError('Each photo must be under 12 MB.', 'photo_too_large');

	// Counted once the form itself is complete (fixing a typo costs nothing), but before any photo
	// is opened, since opening photos is the expensive part.
	const limited = await consume([
		{ key: `report:d:${who.deviceId}:day`, windowSeconds: 86_400, max: 5 },
		{ key: `report:ip:${ipKey(who.ip)}:day`, windowSeconds: 86_400, max: 40 }
	]);
	if (!limited.ok)
		throw new ReportError("You've sent several reports today. Try again tomorrow.", 'limit');
	for (const photo of files) {
		const check = await checkPhoto(photo.bytes, 200);
		if (check.problem === 'unreadable')
			throw new ReportError(`${photo.name} isn't a photo we can open.`, 'photo_unreadable', {
				name: photo.name
			});
	}

	const id = crypto.randomUUID();
	const photoKeys: string[] = [];
	for (const [i, photo] of files.entries()) {
		const key = `report-photos/${id}/${i + 1}.jpg`;
		await putObject(key, await normalisePhoto(photo.bytes, 1600), 'image/jpeg');
		photoKeys.push(key);
	}
	const resultCode = result
		? result.flags.length
			? `${result.code}:${result.flags.join('+')}`
			: result.code
		: 'NO_CHECK';
	await ctx()
		.db.insert(report)
		.values({
			id,
			resultCode,
			manufacturerId: result?.manufacturer?.id ?? null,
			productId: result?.product?.id ?? null,
			batchId: result?.batch?.id ?? null,
			serialKeyHmac: result?.serialKey ? Buffer.from(result.serialKey, 'hex') : null,
			productDescription:
				description ??
				(result?.product ? `${result.product.brandName} ${result.product.strength}` : null),
			placeName,
			state,
			town: text(input.town, 100),
			boughtOn,
			details: text(input.details, 2000),
			contactName: text(input.contactName, 120),
			contactEmail: email,
			contactPhone: text(input.contactPhone, 30),
			shareConsent: Boolean(input.shareConsent),
			photoKeys,
			deviceDayHash: deviceDayHash(who.deviceId)
		});

	const drug =
		description ??
		(result?.product ? `${result.product.brandName} ${result.product.strength}` : 'a medicine');
	await notifyStaff(
		`New report: suspected fake ${drug}`,
		`Someone reported ${drug}, bought at ${placeName}${state ? `, ${state}` : ''}.\n\nReview it: ${ctx().config.origin}/console/reports/${id}`
	).catch((e) => console.error('[email] report', e));
	if (result?.manufacturer && input.shareConsent) {
		await emitEvent(result.manufacturer.id, 'report.received', {
			reportId: id,
			drug,
			gtin: null,
			lot: result.batch?.lot ?? null,
			resultCode,
			state
		});
		const [m] = await ctx()
			.db.select({ email: manufacturer.contactEmail })
			.from(manufacturer)
			.where(eq(manufacturer.id, result.manufacturer.id));
		if (m)
			await sendEmail(
				emailTemplates.reportReceived({
					to: m.email,
					drug,
					url: `${ctx().config.origin}/workspace/reports`
				})
			).catch((e) => console.error('[email] report to manufacturer', e));
	}
	return { id };
}

export async function listReports(filter: { status?: string; manufacturerId?: string } = {}) {
	const conditions = [
		filter.status && filter.status in REPORT_STATUS
			? eq(report.status, filter.status as ReportStatus)
			: undefined,
		filter.manufacturerId
			? and(eq(report.manufacturerId, filter.manufacturerId), eq(report.shareConsent, true))
			: undefined
	].filter(Boolean);
	return ctx()
		.db.select({
			id: report.id,
			createdAt: report.createdAt,
			status: report.status,
			resultCode: report.resultCode,
			productDescription: report.productDescription,
			placeName: report.placeName,
			state: report.state,
			town: report.town,
			photos: sql<number>`jsonb_array_length(${report.photoKeys})::int`,
			manufacturerName: manufacturer.companyName
		})
		.from(report)
		.leftJoin(manufacturer, eq(manufacturer.id, report.manufacturerId))
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(desc(report.createdAt))
		.limit(200);
}

export async function reportCounts() {
	const rows = await ctx()
		.db.select({ status: report.status, n: sql<number>`count(*)::int` })
		.from(report)
		.groupBy(report.status);
	return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Partial<
		Record<ReportStatus, number>
	>;
}

/** Everything about one report, for DETECK staff. */
export async function reportDetail(id: string) {
	if (!/^[0-9a-f-]{36}$/.test(id)) return null;
	const [row] = await ctx()
		.db.select({
			report,
			manufacturerName: manufacturer.companyName,
			productName: sql<string | null>`${product.brandName} || ' ' || ${product.strength}`,
			assignee: user.name
		})
		.from(report)
		.leftJoin(manufacturer, eq(manufacturer.id, report.manufacturerId))
		.leftJoin(product, eq(product.id, report.productId))
		.leftJoin(user, eq(user.id, report.assignedTo))
		.where(eq(report.id, id));
	if (!row) return null;
	const sameSerial = row.report.serialKeyHmac
		? await ctx()
				.db.select({ n: sql<number>`count(*)::int` })
				.from(report)
				.where(and(eq(report.serialKeyHmac, row.report.serialKeyHmac), sql`${report.id} <> ${id}`))
		: [{ n: 0 }];
	return { ...row, otherReportsOfSerial: sameSerial[0].n };
}

/** The manufacturer's view: only reports the person agreed to share, never their contact details. */
export async function reportForManufacturer(id: string, manufacturerId: string) {
	const detail = await reportDetail(id);
	if (!detail || detail.report.manufacturerId !== manufacturerId || !detail.report.shareConsent)
		return null;
	const {
		contactName: _n,
		contactEmail: _e,
		contactPhone: _p,
		deviceDayHash: _d,
		...safe
	} = detail.report;
	return { ...detail, report: safe };
}

export async function updateReport(
	actor: Actor,
	id: string,
	input: { status: string; resolution?: string; assignToMe?: boolean }
) {
	const detail = await reportDetail(id);
	if (!detail) throw new ReportError('Report not found.');
	if (!(input.status in REPORT_STATUS)) throw new ReportError('Choose a status.');
	const status = input.status as ReportStatus;
	const resolution = input.resolution?.trim().slice(0, 2000) || null;
	if (status === 'closed' && !resolution)
		throw new ReportError('Say what was found before closing the report.');
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(report)
			.set({
				status,
				resolution: resolution ?? detail.report.resolution,
				assignedTo: input.assignToMe ? actor.userId : detail.report.assignedTo,
				closedAt: status === 'closed' ? new Date() : null
			})
			.where(eq(report.id, id));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'report_update',
				itemType: 'report',
				itemId: id,
				manufacturerId: detail.report.manufacturerId,
				summary: `Marked the report about ${detail.report.productDescription ?? 'a medicine'} as ${REPORT_STATUS[status]}`,
				before: { status: detail.report.status },
				after: { status, resolution }
			},
			tx
		);
	});
}

/** Photo storage key, if this report has that photo. */
export async function reportPhotoKey(id: string, index: number) {
	const detail = await reportDetail(id);
	return detail?.report.photoKeys[index] ?? null;
}

/**
 * Closed reports keep their findings, but photos and contact details are deleted 12 months after
 * closing (privacy notice).
 */
export async function purgeClosedReports(now = new Date()) {
	const cutoff = new Date(now.getTime() - 365 * 86_400_000);
	const due = await ctx()
		.db.select({ id: report.id, photoKeys: report.photoKeys })
		.from(report)
		.where(and(isNotNull(report.closedAt), lt(report.closedAt, cutoff)));
	for (const r of due) {
		for (const key of r.photoKeys) await deleteObject(key).catch(() => undefined);
	}
	if (due.length)
		await ctx()
			.db.update(report)
			.set({ photoKeys: [], contactName: null, contactEmail: null, contactPhone: null })
			.where(
				inArray(
					report.id,
					due.map((r) => r.id)
				)
			);
	return due.length;
}

export { NIGERIAN_STATES };
