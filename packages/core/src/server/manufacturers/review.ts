import { and, eq, inArray } from 'drizzle-orm';
import { audit, type Actor } from '../audit.ts';
import { ctx } from '../context.ts';
import { manufacturer, member, user } from '../db/schema.ts';
import { sendEmail } from '../email/index.ts';
import { emailTemplates } from '../email/templates.ts';
import { clearCoverageCache } from '../verify/lookup.ts';
import { notifyStaff } from './register.ts';

type Manufacturer = typeof manufacturer.$inferSelect;
type Status = Manufacturer['status'];

export type Decision = 'approve' | 'reject' | 'request_info';

export class ReviewError extends Error {}

const DECISION_STATUS: Record<Decision, Status> = {
	approve: 'approved',
	reject: 'rejected',
	request_info: 'info_requested'
};

async function load(id: string): Promise<Manufacturer> {
	const [m] = await ctx().db.select().from(manufacturer).where(eq(manufacturer.id, id)).limit(1);
	if (!m) throw new ReviewError('Manufacturer not found.');
	return m;
}

/** Contact plus every admin member, deduplicated. */
/** Who hears DETECK's decisions about a company: its contact and every admin of its team. */
export async function recipients(m: Manufacturer): Promise<string[]> {
	const admins = await ctx()
		.db.select({ email: user.email })
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(
			and(eq(member.organizationId, m.organizationId), inArray(member.role, ['admin', 'owner']))
		);
	return [...new Set([m.contactEmail, ...admins.map((a) => a.email)])];
}

async function notify(
	m: Manufacturer,
	decision: Parameters<typeof emailTemplates.applicationDecision>[0]['decision'],
	reason: string
) {
	const to = await recipients(m);
	const url = `${ctx().config.origin}/workspace`;
	await Promise.allSettled(
		to.map((email) =>
			sendEmail(
				emailTemplates.applicationDecision({
					to: email,
					company: m.companyName,
					decision,
					reason,
					url
				})
			)
		)
	);
}

function requireReason(reason: string) {
	const r = reason.trim();
	if (r.length < 3) throw new ReviewError('A reason is required.');
	return r.slice(0, 1000);
}

/** US-06.1: approve, reject or request more information, each with a required reason. */
export async function decideApplication(
	actor: Actor,
	id: string,
	decision: Decision,
	reason: string
) {
	const why = requireReason(reason);
	const m = await load(id);
	// A rejected application can be reopened, for example when the company contacts DETECK.
	if (!['pending', 'info_requested', 'rejected'].includes(m.status)) {
		throw new ReviewError(
			`This application is ${m.status.replace('_', ' ')}, so it can't be decided now.`
		);
	}
	const status = DECISION_STATUS[decision];
	await ctx().db.transaction(async (tx) => {
		const updated = await tx
			.update(manufacturer)
			.set({ status, statusReason: why })
			// Only if nobody else decided in the meantime.
			.where(and(eq(manufacturer.id, id), eq(manufacturer.status, m.status)))
			.returning({ id: manufacturer.id });
		if (updated.length === 0)
			throw new ReviewError('Someone else decided this application a moment ago. Reload the page.');
		await audit(
			actor,
			{
				area: 'Console',
				action: `application_${decision}`,
				itemType: 'manufacturer',
				itemId: id,
				manufacturerId: id,
				summary: `${decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Requested more information from'} ${m.companyName}`,
				before: { status: m.status },
				after: { status, reason: why }
			},
			tx
		);
	});
	await notify(
		m,
		status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'info_requested',
		why
	);
}

/** The manufacturer answers an information request; the application returns to the queue. */
export async function resubmitApplication(actor: Actor, id: string, note: string) {
	const m = await load(id);
	if (m.status !== 'info_requested')
		throw new ReviewError('There is no information request to answer.');
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(manufacturer)
			.set({ status: 'pending', reviewNote: note.trim().slice(0, 1000) || null })
			.where(eq(manufacturer.id, id));
		await audit(
			actor,
			{
				area: 'Manufacturer board',
				action: 'application_resubmit',
				itemType: 'manufacturer',
				itemId: id,
				manufacturerId: id,
				summary: `${m.companyName} answered the information request`,
				before: { status: m.status },
				after: { status: 'pending', note }
			},
			tx
		);
	});
	// Tell the reviewers, as a new registration does.
	await notifyStaff(
		`${m.companyName} answered your information request`,
		`${m.companyName} sent its application back${note.trim() ? ` with this note: "${note.trim()}"` : ''}.\n\nReview it: ${ctx().config.origin}/console/applications/${id}`
	).catch((error) => console.error('[email] resubmission', error));
}

/** US-06.1: suspension stops Valid results ("can't be confirmed right now", G-07). Admins only. */
export async function suspendManufacturer(actor: Actor, id: string, reason: string) {
	const why = requireReason(reason);
	const m = await load(id);
	if (m.status === 'suspended') throw new ReviewError('This manufacturer is already suspended.');
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(manufacturer)
			.set({
				status: 'suspended',
				statusBeforeSuspension: m.status,
				reasonBeforeSuspension: m.statusReason,
				statusReason: why
			})
			.where(eq(manufacturer.id, id));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'manufacturer_suspend',
				itemType: 'manufacturer',
				itemId: id,
				manufacturerId: id,
				summary: `Suspended ${m.companyName}`,
				before: { status: m.status },
				after: { status: 'suspended', reason: why }
			},
			tx
		);
	});
	clearCoverageCache();
	await notify(m, 'suspended', why);
}

export async function reinstateManufacturer(actor: Actor, id: string, reason: string) {
	const why = requireReason(reason);
	const m = await load(id);
	if (m.status !== 'suspended') throw new ReviewError('This manufacturer is not suspended.');
	const status = m.statusBeforeSuspension ?? 'approved';
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(manufacturer)
			// The note they had before (for example, why their data was sent back) comes back too; the
			// reinstatement reason is kept in the audit trail and the email.
			.set({
				status,
				statusBeforeSuspension: null,
				statusReason: m.reasonBeforeSuspension,
				reasonBeforeSuspension: null
			})
			.where(eq(manufacturer.id, id));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'manufacturer_reinstate',
				itemType: 'manufacturer',
				itemId: id,
				manufacturerId: id,
				summary: `Reinstated ${m.companyName}`,
				before: { status: 'suspended' },
				after: { status, reason: why }
			},
			tx
		);
	});
	clearCoverageCache();
	await notify(m, 'reinstated', why);
}

const DETAIL_FIELDS = [
	['companyName', 'Company name', 3, 200],
	['address', 'Address', 5, 300],
	['state', 'State', 2, 40],
	['factoryTown', 'Factory town', 0, 100],
	['nafdacCompanyReg', 'NAFDAC company reg. no.', 3, 60],
	['cacRc', 'CAC reg. no.', 0, 30],
	['contactName', 'Contact name', 2, 120],
	['contactPhone', 'Contact phone', 0, 30]
] as const;
export type DetailField = (typeof DETAIL_FIELDS)[number][0];
export const COMPANY_DETAIL_FIELDS = DETAIL_FIELDS.map(([key, label]) => ({ key, label }));

/**
 * DETECK corrects a manufacturer's registered details (for example after an information request),
 * with a reason. Manufacturers can't edit these themselves because they are checked against the
 * NAFDAC certificate. The contact email is the admin's sign-in, so it isn't changed here.
 */
export async function updateCompanyDetails(
	actor: Actor,
	id: string,
	input: Partial<Record<DetailField, string>>,
	reason: string
) {
	const why = requireReason(reason);
	const m = await load(id);
	const changes: Partial<Record<DetailField, string | null>> = {};
	for (const [key, label, min, max] of DETAIL_FIELDS) {
		const value = (input[key] ?? '').trim();
		if (value.length < min) throw new ReviewError(`${label} is too short.`);
		if (value.length > max) throw new ReviewError(`${label} is too long.`);
		const next = value || null;
		if ((m[key] ?? null) !== next) changes[key] = next;
	}
	const keys = Object.keys(changes) as DetailField[];
	if (keys.length === 0) return false;
	await ctx().db.transaction(async (tx) => {
		await tx
			.update(manufacturer)
			.set(changes as Partial<typeof manufacturer.$inferInsert>)
			.where(eq(manufacturer.id, id));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'company_details',
				itemType: 'manufacturer',
				itemId: id,
				manufacturerId: id,
				summary: `Corrected ${m.companyName}'s ${keys.join(', ')}: ${why}`,
				before: Object.fromEntries(keys.map((k) => [k, m[k]])),
				after: changes
			},
			tx
		);
	});
	return true;
}
