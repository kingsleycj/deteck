/**
 * Accounts for pharmacies, hospitals, distributors and wholesalers. They register like
 * manufacturers, DETECK checks their PCN premises licence, and once approved they can check a
 * whole delivery at once and confirm what they received. A confirmed receipt becomes part of the
 * pack's journey, labelled as the business's own record (this extends decision D-03).
 */
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { normaliseBusinessName, sameKind } from '../imports/values.ts';
import { NIGERIAN_STATES } from '../nigeria.ts';
import type { VerificationResult } from '../verify/types.ts';
import { audit, type Actor } from './audit.ts';
import { consume } from './rate-limit.ts';
import { today } from './time.ts';
import type { Auth } from './auth-factory.ts';
import { ctx } from './context.ts';
import { deviceDayHash, randomId, serialKeyHmac } from './crypto.ts';
import type { Tx } from './db/client.ts';
import {
	batch,
	businessAccount,
	custodyEvent,
	document,
	member,
	organization,
	party,
	product,
	user
} from './db/schema.ts';
import { notSuperseded } from './db/current.ts';
import { sendEmail } from './email/index.ts';
import { emailTemplates } from './email/templates.ts';
import { notifyStaff } from './manufacturers/register.ts';
import { putObject, storageKey } from './storage.ts';
import { documentProblem, documentType, type UploadedFile } from './uploads.ts';
import { recordCheckEvent } from './verify/check.ts';
import { lookup, parseCheckInput } from './verify/lookup.ts';
import { emitEvent } from './webhooks.ts';

export class BusinessError extends Error {}

export const BUSINESS_ROLES = {
	pharmacy: 'Pharmacy',
	hospital: 'Hospital or clinic',
	distributor: 'Distributor',
	wholesaler: 'Wholesaler'
} as const;
export type BusinessRole = keyof typeof BUSINESS_ROLES;

export const BUSINESS_STATUS = {
	pending: { label: 'Waiting for review', chip: 'chip-progress' },
	info_requested: { label: 'Information requested', chip: 'chip-warn' },
	rejected: { label: 'Rejected', chip: 'chip-bad' },
	approved: { label: 'Approved', chip: 'chip-live' },
	suspended: { label: 'Suspended', chip: 'chip-bad' }
} as const;

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform((v) => (v === '' ? undefined : v))
		.optional();

export const businessRegistrationSchema = z.object({
	name: z.string().trim().min(2, 'Enter the business name.').max(160),
	role: z.enum(Object.keys(BUSINESS_ROLES) as [BusinessRole, ...BusinessRole[]], {
		error: 'Choose what kind of business this is.'
	}),
	address: z.string().trim().min(5, 'Enter the address.').max(300),
	state: z.enum(NIGERIAN_STATES, { error: 'Choose a state.' }),
	town: optionalText(80),
	pcnLicence: z.string().trim().min(3, 'Copy the number from your PCN premises licence.').max(60),
	cacRc: optionalText(30),
	gln: z
		.string()
		.trim()
		.regex(/^(\d{13})?$/, 'A GLN has 13 digits.')
		.transform((v) => v || undefined)
		.optional(),
	contactName: z.string().trim().min(2, 'Enter your full name.').max(120),
	contactEmail: z
		.email('This email is missing something, like .com or .ng.')
		.max(200)
		.toLowerCase(),
	contactPhone: optionalText(30),
	password: z
		.string()
		.min(10, 'Use at least 10 characters.')
		.max(128)
		.refine(
			(p) => /\d/.test(p) && /[^A-Za-z0-9]/.test(p),
			'Include at least one number and one symbol.'
		)
});

export type BusinessRow = typeof businessAccount.$inferSelect;

export async function registerBusiness(
	auth: Auth,
	raw: Record<string, unknown>,
	files: { pcnLicence: UploadedFile | null },
	meta: Pick<Actor, 'ip' | 'userAgent'>
): Promise<{ ok: true; businessId: string } | { ok: false; errors: Record<string, string> }> {
	const parsed = businessRegistrationSchema.safeParse(raw);
	const errors: Record<string, string> = {};
	if (!parsed.success)
		for (const issue of parsed.error.issues)
			errors[String(issue.path[0] ?? 'form')] ??= issue.message;
	if (!files.pcnLicence) errors.pcnLicenceFile = 'Upload your PCN premises licence.';
	const problem = documentProblem(files.pcnLicence, 'The licence');
	if (problem) errors.pcnLicenceFile = problem;
	if (!parsed.success || Object.keys(errors).length) return { ok: false, errors };
	const input = parsed.data;
	const { db } = ctx();

	const [duplicate] = await db
		.select({ id: businessAccount.id })
		.from(businessAccount)
		.where(sql`upper(${businessAccount.pcnLicence}) = upper(${input.pcnLicence})`)
		.limit(1);
	if (duplicate)
		return {
			ok: false,
			errors: {
				pcnLicence: 'A business with this PCN licence is already registered. Sign in instead.'
			}
		};
	const [existingUser] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, input.contactEmail))
		.limit(1);
	if (existingUser)
		return {
			ok: false,
			errors: { contactEmail: 'An account with this email already exists. Sign in instead.' }
		};

	const created = await auth.api.signUpEmail({
		body: { name: input.contactName, email: input.contactEmail, password: input.password }
	});
	const userId = created.user.id;
	try {
		const businessId = await db.transaction(async (tx) => {
			const orgId = randomId(16);
			await tx.insert(organization).values({
				id: orgId,
				name: input.name,
				slug: `${input.name
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, '-')
					.slice(0, 40)}-${randomId(3).toLowerCase()}`,
				createdAt: new Date()
			});
			await tx.insert(member).values({
				id: randomId(16),
				organizationId: orgId,
				userId,
				role: 'admin',
				createdAt: new Date()
			});
			const [b] = await tx
				.insert(businessAccount)
				.values({
					organizationId: orgId,
					name: input.name,
					role: input.role,
					address: input.address,
					state: input.state,
					town: input.town,
					pcnLicence: input.pcnLicence,
					cacRc: input.cacRc,
					gln: input.gln,
					contactName: input.contactName,
					contactEmail: input.contactEmail,
					contactPhone: input.contactPhone
				})
				.returning({ id: businessAccount.id });
			const file = files.pcnLicence!;
			const key = storageKey('documents', b.id, file.name, randomId(8));
			await putObject(key, file.bytes, documentType(file)!);
			await tx.insert(document).values({
				businessId: b.id,
				kind: 'pcn_premises_licence',
				fileKey: key,
				fileName: file.name,
				contentType: documentType(file)!,
				sizeBytes: file.bytes.length,
				uploadedBy: userId
			});
			await audit(
				{ userId, label: input.contactName, role: 'Business admin', ...meta },
				{
					area: 'Business accounts',
					action: 'business_register',
					itemType: 'business',
					itemId: b.id,
					summary: `Registered ${input.name} (${BUSINESS_ROLES[input.role]}, pending DETECK approval)`
				},
				tx
			);
			return b.id;
		});
		await Promise.allSettled([
			sendEmail(
				emailTemplates.applicationReceived({ to: input.contactEmail, company: input.name })
			),
			notifyStaff(
				`New business application: ${input.name}`,
				`${input.name} (${BUSINESS_ROLES[input.role]}) registered on DETECK and is waiting for review.\n\nOpen it: ${ctx().config.origin}/console/business-accounts/${businessId}`
			)
		]);
		return { ok: true, businessId };
	} catch (error) {
		await db.delete(user).where(eq(user.id, userId));
		throw error;
	}
}

export async function getBusiness(id: string) {
	if (!/^[0-9a-f-]{36}$/.test(id)) return null;
	const [row] = await ctx().db.select().from(businessAccount).where(eq(businessAccount.id, id));
	return row ?? null;
}

export async function listBusinesses(status?: string) {
	return ctx()
		.db.select()
		.from(businessAccount)
		.where(
			status && status in BUSINESS_STATUS
				? eq(businessAccount.status, status as keyof typeof BUSINESS_STATUS)
				: undefined
		)
		.orderBy(desc(businessAccount.createdAt))
		.limit(300);
}

export async function businessDocuments(businessId: string) {
	return ctx()
		.db.select()
		.from(document)
		.where(eq(document.businessId, businessId))
		.orderBy(desc(document.createdAt));
}

/**
 * Links an approved business to its supply chain record: the existing one if the licence, GLN, CAC
 * number or name and state match, otherwise a new one. Either way it becomes "Verified by DETECK".
 */
async function linkParty(tx: Tx, b: BusinessRow, actor: Actor): Promise<string> {
	const normalised = normaliseBusinessName(b.name);
	const [found] = await tx
		.select({ id: party.id, mergedIntoId: party.mergedIntoId })
		.from(party)
		.where(
			sql`(upper(${party.pcnLicence}) = upper(${b.pcnLicence}) ${b.gln ? sql`or ${party.gln} = ${b.gln}` : sql``}
				${b.cacRc ? sql`or upper(${party.cacRc}) = upper(${b.cacRc})` : sql``}
				or (${party.normalisedName} = ${normalised} and ${party.state} = ${b.state}
					-- "Ibadan" and "Bodija, Ibadan" are the same place; "Ibadan" and "Ikeja" aren't.
					and (${party.city} is null or strpos(lower(${party.city}), lower(${b.town})) > 0
						or strpos(lower(${b.town}), lower(${party.city})) > 0)
					and ${party.role} in ${sql.raw(`('${sameKind(b.role).join("','")}')`)}
					and (${party.pcnLicence} is null or upper(${party.pcnLicence}) = upper(${b.pcnLicence}))))
				and not exists (select 1 from ${businessAccount} a where a.party_id = coalesce(${party}.merged_into_id, ${party}.id) and a.id <> ${b.id})`
		)
		.orderBy(sql`${party.mergedIntoId} is not null`, party.createdAt)
		.limit(1);
	const values = {
		pcnLicence: b.pcnLicence,
		cacRc: b.cacRc,
		gln: b.gln,
		verifiedAt: new Date(),
		verifiedBy: actor.userId
	};
	if (found) {
		const id = found.mergedIntoId ?? found.id;
		await tx.update(party).set(values).where(eq(party.id, id));
		return id;
	}
	const [created] = await tx
		.insert(party)
		.values({
			name: b.name,
			normalisedName: normalised,
			role: b.role,
			state: b.state,
			city: b.town,
			...values
		})
		.returning({ id: party.id });
	return created.id;
}

/** DETECK's decision on a business application, always with a reason. */
export async function decideBusiness(
	actor: Actor,
	id: string,
	decision: 'approve' | 'request_info' | 'reject',
	reason: string
) {
	const why = reason.trim();
	if (why.length < 3) throw new BusinessError('A reason is required.');
	const b = await getBusiness(id);
	if (!b) throw new BusinessError('Business not found.');
	if (!['pending', 'info_requested', 'rejected'].includes(b.status))
		throw new BusinessError(
			`This business is ${b.status.replace('_', ' ')}, so it can't be decided now.`
		);
	const status =
		decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'info_requested';
	await ctx().db.transaction(async (tx) => {
		const partyId = decision === 'approve' ? await linkParty(tx, b, actor) : b.partyId;
		const updated = await tx
			.update(businessAccount)
			.set({ status, statusReason: why, partyId })
			.where(and(eq(businessAccount.id, id), eq(businessAccount.status, b.status)))
			.returning({ id: businessAccount.id });
		if (updated.length === 0)
			throw new BusinessError('Someone else decided this a moment ago. Reload the page.');
		await audit(
			actor,
			{
				area: 'Console',
				action: `business_${decision}`,
				itemType: 'business',
				itemId: id,
				summary: `${decision === 'approve' ? 'Approved' : decision === 'reject' ? 'Rejected' : 'Requested more information from'} ${b.name}`,
				before: { status: b.status },
				after: { status, reason: why }
			},
			tx
		);
	});
	await sendEmail(
		emailTemplates.businessDecision({
			to: b.contactEmail,
			business: b.name,
			decision:
				status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'info_requested',
			reason: why,
			url: `${ctx().config.origin}/portal`
		})
	).catch((e) => console.error('[email] business decision', e));
}

export async function resubmitBusiness(actor: Actor, id: string, note: string) {
	const b = await getBusiness(id);
	if (!b || b.status !== 'info_requested')
		throw new BusinessError('There is no information request to answer.');
	await ctx()
		.db.update(businessAccount)
		.set({ status: 'pending', reviewNote: note.trim().slice(0, 1000) || null })
		.where(eq(businessAccount.id, id));
	await audit(actor, {
		area: 'Business accounts',
		action: 'business_resubmit',
		itemType: 'business',
		itemId: id,
		summary: `${b.name} answered the information request`
	});
	await notifyStaff(
		`${b.name} answered your information request`,
		`Review it: ${ctx().config.origin}/console/business-accounts/${id}`
	).catch(() => undefined);
}

export async function setBusinessSuspended(
	actor: Actor,
	id: string,
	suspended: boolean,
	reason: string
) {
	const b = await getBusiness(id);
	if (!b) throw new BusinessError('Business not found.');
	if (reason.trim().length < 3) throw new BusinessError('A reason is required.');
	if (suspended ? b.status !== 'approved' : b.status !== 'suspended')
		throw new BusinessError(
			suspended ? 'Only approved businesses can be suspended.' : 'This business is not suspended.'
		);
	const status = suspended ? 'suspended' : 'approved';
	await ctx()
		.db.update(businessAccount)
		.set({ status, statusReason: reason.trim() })
		.where(eq(businessAccount.id, id));
	await audit(actor, {
		area: 'Console',
		action: suspended ? 'business_suspend' : 'business_reinstate',
		itemType: 'business',
		itemId: id,
		summary: `${suspended ? 'Suspended' : 'Reinstated'} ${b.name}: ${reason.trim()}`
	});
	await sendEmail(
		emailTemplates.businessDecision({
			to: b.contactEmail,
			business: b.name,
			decision: suspended ? 'suspended' : 'reinstated',
			reason: reason.trim(),
			url: `${ctx().config.origin}/portal`
		})
	).catch((e) => console.error('[email] business suspension', e));
}

// ---------------------------------------------------------------- checking deliveries

export const MAX_BATCH_CHECK = 500;

/** Why a business can't check or confirm deliveries right now. */
function notApproved(b: BusinessRow) {
	return b.status === 'suspended'
		? "Your business account is paused, so deliveries can't be checked or confirmed for now."
		: 'Your business needs DETECK approval first.';
}

/** "1 minute", "5 minutes", "3 hours". */
function minutes(seconds: number) {
	const m = Math.max(1, Math.ceil(seconds / 60));
	if (m >= 90) return `${Math.ceil(m / 60)} hours`;
	return m === 1 ? '1 minute' : `${m} minutes`;
}

export interface DeliveryLine {
	input: string;
	ok: boolean;
	problem?: string;
	result?: VerificationResult;
	/** Another pharmacy or hospital already recorded with this pack, e.g. "Riverside Pharmacy". */
	heldElsewhere?: string;
}

/** Splits pasted text or a CSV column into codes: one per line, comma or semicolon. */
export function splitCodes(text: string): string[] {
	return text
		.split(/[\r\n;,]+/)
		.map((s) => s.trim())
		.filter(Boolean)
		.slice(0, MAX_BATCH_CHECK);
}

/** Checks many serials or scanned codes at once, for an approved business. */
export async function checkDelivery(b: BusinessRow, codes: string[]): Promise<DeliveryLine[]> {
	if (b.status !== 'approved') throw new BusinessError(notApproved(b));
	// Generous for real deliveries, but stops an account (or a leaked key) sweeping serial ranges.
	const wanted = Math.min(codes.length, MAX_BATCH_CHECK);
	const limited = await consume(
		[
			{ key: `delivery:b:${b.id}:m`, windowSeconds: 60, max: 2_000 },
			{ key: `delivery:b:${b.id}:day`, windowSeconds: 86_400, max: 20_000 }
		],
		undefined,
		wanted
	);
	if (!limited.ok)
		throw new BusinessError(
			`You've checked a lot of codes in a short time. Try again in ${minutes(limited.retryAfterSeconds)}, or ask DETECK to raise your limit.`
		);
	const lines: DeliveryLine[] = [];
	for (const code of codes.slice(0, MAX_BATCH_CHECK)) {
		const input = parseCheckInput(code);
		if (!input.ok) {
			lines.push({ input: code, ok: false, problem: input.problem });
			continue;
		}
		const result = await lookup(input, { packagingEnabled: false });
		const serial = input.kind === 'typed' ? input.key : input.serial;
		void recordCheckEvent({
			kind: 'business',
			result: result.flags.includes('EXPIRED') ? `${result.code}:EXPIRED` : result.code,
			productId: result.product?.id,
			batchId: result.batch?.id,
			serialKeyHmac: serial ? serialKeyHmac(serial) : null,
			deviceDayHash: deviceDayHash(`business:${b.id}`),
			state: b.state
		});
		lines.push({ input: code, ok: true, result });
	}
	await markHeldElsewhere(b, lines);
	return lines;
}

/**
 * A pack that another pharmacy or hospital already has on record shouldn't arrive here: it may be
 * a copied code, or stock that was passed on. Distributors are normal earlier holders.
 */
async function markHeldElsewhere(b: BusinessRow, lines: DeliveryLine[]) {
	const packIds = [
		...new Set(
			lines.flatMap((l) => (l.result?.code === 'VALID' && l.result.packId ? [l.result.packId] : []))
		)
	];
	if (packIds.length === 0) return;
	const survivor = alias(party, 'survivor');
	const holders = await ctx()
		.db.selectDistinctOn([custodyEvent.packId], {
			packId: custodyEvent.packId,
			partyId: sql<string>`coalesce(${survivor.id}, ${party.id})`,
			name: sql<string>`coalesce(${survivor.name}, ${party.name})`,
			role: sql<string>`coalesce(${survivor.role}, ${party.role})`
		})
		.from(custodyEvent)
		.innerJoin(party, eq(party.id, custodyEvent.toPartyId))
		.leftJoin(survivor, eq(survivor.id, party.mergedIntoId))
		.where(
			and(
				inArray(custodyEvent.packId, packIds),
				sql`${custodyEvent.eventType} <> 'voided'`,
				notSuperseded
			)
		)
		.orderBy(custodyEvent.packId, desc(custodyEvent.eventDate), desc(custodyEvent.id));
	const elsewhere = new Map(
		holders
			.filter((h) => h.partyId !== b.partyId && sameKind('pharmacy').includes(h.role as 'pharmacy'))
			.map((h) => [h.packId, h.name])
	);
	for (const l of lines) {
		const name = l.result?.packId ? elsewhere.get(l.result.packId) : undefined;
		if (name) l.heldElsewhere = name;
	}
}

/**
 * Records that the business received these packs. Only packs that check as Valid (including
 * expired) are recorded; each pack is recorded once per business.
 */
export async function recordReceipts(
	actor: Actor,
	b: BusinessRow,
	codes: string[],
	options: { receivedOn?: string; supplierName?: string } = {}
) {
	if (b.status !== 'approved' || !b.partyId) throw new BusinessError(notApproved(b));
	const receivedOn =
		options.receivedOn && /^\d{4}-\d{2}-\d{2}$/.test(options.receivedOn)
			? options.receivedOn
			: today();
	if (receivedOn > today()) throw new BusinessError("The date received can't be in the future.");
	const { db } = ctx();
	const supplierName = options.supplierName?.trim();
	let supplierId: string | null = null;
	if (supplierName) {
		const normalised = normaliseBusinessName(supplierName);
		const [found] = await db
			.select({ id: party.id, mergedIntoId: party.mergedIntoId })
			.from(party)
			.where(eq(party.normalisedName, normalised))
			.orderBy(sql`${party.verifiedAt} is null`, party.createdAt)
			.limit(1);
		supplierId = found ? (found.mergedIntoId ?? found.id) : null;
	}
	const lines = await checkDelivery(b, codes);
	const recorded: string[] = [];
	const skipped: { input: string; why: string }[] = [];
	const perManufacturer = new Map<string, { drug: string; lot: string; count: number }[]>();
	for (const line of lines) {
		const r = line.result;
		if (!r || r.code !== 'VALID' || !r.packId || !r.batch || !r.manufacturer) {
			skipped.push({
				input: line.input,
				why: r?.code === 'RECALLED' ? 'Recalled batch' : 'Not on record'
			});
			continue;
		}
		// A scanned code whose batch or expiry differs from the record may be a copied code: never
		// put "Receipt confirmed" on the real pack's journey because of it.
		if (r.flags.includes('LOT_MISMATCH') || r.flags.includes('EXPIRY_MISMATCH')) {
			skipped.push({ input: line.input, why: "The pack doesn't match the record" });
			continue;
		}
		const inserted = await db.transaction(async (tx) => {
			// One receipt per pack and business, even if the form is sent twice at once.
			await tx.execute(
				sql`select pg_advisory_xact_lock(4244, hashtext(${`${b.partyId}:${r.packId}`}))`
			);
			const [already] = await tx
				.select({ id: custodyEvent.id })
				.from(custodyEvent)
				.where(
					and(
						eq(custodyEvent.packId, r.packId!),
						eq(custodyEvent.toPartyId, b.partyId!),
						eq(custodyEvent.eventType, 'received'),
						// A receipt DETECK cancelled can be recorded again.
						notSuperseded
					)
				)
				.limit(1);
			if (already) return false;
			await tx.insert(custodyEvent).values({
				manufacturerId: r.manufacturer!.id,
				level: 'pack',
				packId: r.packId!,
				batchId: r.batch!.id,
				fromPartyId: supplierId,
				toPartyId: b.partyId!,
				eventType: 'received',
				eventDate: receivedOn,
				source: 'business_receipt'
			});
			return true;
		});
		if (!inserted) {
			skipped.push({ input: line.input, why: 'Already recorded' });
			continue;
		}
		recorded.push(line.input);
		const list = perManufacturer.get(r.manufacturer.id) ?? [];
		const drug = r.product ? `${r.product.brandName} ${r.product.strength}` : '';
		const entry = list.find((x) => x.drug === drug && x.lot === r.batch!.lot);
		if (entry) entry.count++;
		else list.push({ drug, lot: r.batch.lot, count: 1 });
		perManufacturer.set(r.manufacturer.id, list);
	}
	if (recorded.length) {
		await audit(actor, {
			area: 'Business accounts',
			action: 'receipt_record',
			itemType: 'business',
			itemId: b.id,
			summary: `${b.name} confirmed receiving ${recorded.length} pack${recorded.length === 1 ? '' : 's'} on ${receivedOn}`
		});
		for (const [manufacturerId, items] of perManufacturer)
			await emitEvent(manufacturerId, 'receipt.recorded', {
				business: { name: b.name, role: b.role, state: b.state, town: b.town },
				receivedOn,
				items
			});
	}
	return { recorded: recorded.length, skipped };
}

/** The business's own receipts, newest first. */
export async function listReceipts(b: BusinessRow, limit = 200) {
	if (!b.partyId) return [];
	return ctx()
		.db.select({
			id: custodyEvent.id,
			eventDate: custodyEvent.eventDate,
			createdAt: custodyEvent.createdAt,
			drug: sql<string>`${product.brandName} || ' ' || ${product.strength}`,
			lot: batch.lot,
			expiryDate: batch.expiryDate,
			batchStatus: batch.status
		})
		.from(custodyEvent)
		.innerJoin(batch, eq(batch.id, custodyEvent.batchId))
		.innerJoin(product, eq(product.id, batch.productId))
		.where(
			and(
				eq(custodyEvent.toPartyId, b.partyId),
				// The business's own receipts, and DETECK's corrections of them (a corrected receipt
				// stays "received" only while it names the same business).
				eq(custodyEvent.eventType, 'received'),
				// Receipts DETECK cancelled or corrected aren't this business's any more.
				notSuperseded
			)
		)
		.orderBy(desc(custodyEvent.createdAt))
		.limit(limit);
}

/** Batches this business received that have since been recalled or withdrawn. */
export async function recalledStock(b: BusinessRow) {
	if (!b.partyId) return [];
	return ctx()
		.db.selectDistinct({
			drug: sql<string>`${product.brandName} || ' ' || ${product.strength}`,
			lot: batch.lot,
			status: batch.status,
			reason: batch.statusReason,
			source: batch.statusSource
		})
		.from(custodyEvent)
		.innerJoin(batch, eq(batch.id, custodyEvent.batchId))
		.innerJoin(product, eq(product.id, batch.productId))
		.where(
			and(
				// Deliveries recorded against a duplicate of this business that DETECK merged into it
				// count too: missing a recall warning is the costly mistake.
				sql`${custodyEvent.toPartyId} in (select ${b.partyId}::uuid union select ${party.id} from ${party} where ${party.mergedIntoId} = ${b.partyId})`,
				inArray(batch.status, ['recalled', 'withdrawn']),
				sql`${custodyEvent.eventType} <> 'voided'`,
				notSuperseded
			)
		);
}
