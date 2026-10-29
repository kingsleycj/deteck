/**
 * DETECK staff corrections (audit decision 3). Packs and supply chain records are append-only, so
 * nothing is edited in place: a serial is voided with a separate record, and a supply chain record
 * is cancelled or replaced by a new one that points at it. Batch details (lot, dates, quantity)
 * are ordinary fields and are corrected directly. Every correction needs a reason, is recorded in
 * the audit trail, and is sent to the manufacturer by email and webhook.
 */
import { and, desc, eq, inArray, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import { serialExactHmac, serialKeyHmac } from './crypto.ts';
import {
	batch,
	businessAccount,
	custodyEvent,
	manufacturer,
	pack,
	packVoid,
	party,
	product,
	user
} from './db/schema.ts';
import { sendEmail } from './email/index.ts';
import { emailTemplates } from './email/templates.ts';
import { emitEvent } from './webhooks.ts';
import { today as lagosToday } from './time.ts';

export class CorrectionError extends Error {}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function reasonOf(raw: string) {
	const reason = raw.trim().slice(0, 1000);
	if (reason.length < 3) throw new CorrectionError('A reason is required.');
	return reason;
}

/** The batch with its drug and manufacturer, or a clear error. */
export async function batchContext(batchId: string) {
	if (!/^[0-9a-f-]{36}$/.test(batchId)) throw new CorrectionError('Batch not found.');
	const [row] = await ctx()
		.db.select({
			batch,
			productId: product.id,
			gtin: product.gtin,
			drug: sql<string>`${product.brandName} || ' ' || ${product.strength}`,
			manufacturerId: manufacturer.id,
			manufacturerEmail: manufacturer.contactEmail
		})
		.from(batch)
		.innerJoin(product, eq(product.id, batch.productId))
		.innerJoin(manufacturer, eq(manufacturer.id, product.manufacturerId))
		.where(eq(batch.id, batchId));
	if (!row) throw new CorrectionError('Batch not found.');
	return row;
}

/** Tells the manufacturer what DETECK changed, by email and webhook. Never blocks the correction. */
async function tellManufacturer(
	row: Awaited<ReturnType<typeof batchContext>>,
	what: string,
	reason: string,
	kind: 'batch' | 'serial' | 'custody'
) {
	await emitEvent(row.manufacturerId, 'record.corrected', {
		kind,
		gtin: row.gtin,
		drug: row.drug,
		lot: row.batch.lot,
		what,
		reason
	});
	await sendEmail(
		emailTemplates.recordCorrected({
			to: row.manufacturerEmail,
			drug: row.drug,
			lot: row.batch.lot,
			what,
			reason
		})
	).catch((e) => console.error('[email] correction', e));
}

// ---------------------------------------------------------------- batch details

export interface BatchFix {
	lot: string;
	manufactureDate: string;
	expiryDate: string;
	quantity: string;
}

/** Corrects a batch's lot, dates or quantity. Checks see the new details straight away. */
export async function correctBatch(
	actor: Actor,
	batchId: string,
	input: BatchFix,
	rawReason: string
) {
	const reason = reasonOf(rawReason);
	const row = await batchContext(batchId);
	const lot = input.lot.trim();
	if (!lot || lot.length > 20)
		throw new CorrectionError('Enter the lot as printed (up to 20 characters).');
	if (!ISO_DATE.test(input.expiryDate)) throw new CorrectionError('Enter the expiry date.');
	const manufactureDate = input.manufactureDate.trim() || null;
	if (manufactureDate && !ISO_DATE.test(manufactureDate))
		throw new CorrectionError('Enter the manufacture date as a date, or leave it empty.');
	if (manufactureDate && manufactureDate > input.expiryDate)
		throw new CorrectionError('The manufacture date must be before the expiry date.');
	const quantity = input.quantity.trim() ? Number(input.quantity) : null;
	if (quantity !== null && (!Number.isInteger(quantity) || quantity < 0))
		throw new CorrectionError('Quantity must be a whole number, or empty.');

	const before = {
		lot: row.batch.lot,
		manufactureDate: row.batch.manufactureDate,
		expiryDate: row.batch.expiryDate,
		quantity: row.batch.quantity
	};
	const after = { lot, manufactureDate, expiryDate: input.expiryDate, quantity };
	const changed = (Object.keys(after) as (keyof typeof after)[]).filter(
		(k) => (before[k] ?? null) !== (after[k] ?? null)
	);
	if (!changed.length) return false;
	if (lot.toUpperCase() !== row.batch.lot.toUpperCase()) {
		const [clash] = await ctx()
			.db.select({ id: batch.id })
			.from(batch)
			// Imports match lots ignoring case, so a clash is too.
			.where(
				and(
					eq(batch.productId, row.productId),
					sql`upper(${batch.lot}) = upper(${lot})`,
					sql`${batch.id} <> ${batchId}`
				)
			);
		if (clash) throw new CorrectionError(`This drug already has a batch ${lot}.`);
	}
	await ctx().db.transaction(async (tx) => {
		await tx.update(batch).set(after).where(eq(batch.id, batchId));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'batch_correct',
				itemType: 'batch',
				itemId: batchId,
				manufacturerId: row.manufacturerId,
				summary: `Corrected ${row.drug} batch ${row.batch.lot}: ${changed.join(', ')}. Reason: ${reason}`,
				before,
				after
			},
			tx
		);
	});
	const labels: Record<string, string> = {
		lot: 'lot',
		manufactureDate: 'manufacture date',
		expiryDate: 'expiry date',
		quantity: 'quantity'
	};
	await tellManufacturer(
		row,
		`Corrected the batch's ${changed.map((k) => labels[k]).join(', ')}${lot !== row.batch.lot ? ` (lot is now ${lot})` : ''}.`,
		reason,
		'batch'
	);
	return true;
}

// ---------------------------------------------------------------- serials

/** Finds one pack of this batch by its serial as printed (or typed without spaces). */
async function findPack(row: Awaited<ReturnType<typeof batchContext>>, serial: string) {
	const s = serial.trim();
	if (!s) throw new CorrectionError('Enter the serial.');
	const matches = await ctx()
		.db.select({ id: pack.id })
		.from(pack)
		.where(
			and(
				eq(pack.batchId, row.batch.id),
				or(
					eq(pack.serialExactHmac, serialExactHmac(row.gtin, s)),
					eq(pack.serialKeyHmac, serialKeyHmac(s))
				)
			)
		)
		.limit(2);
	if (!matches.length) throw new CorrectionError("That serial isn't in this batch.");
	if (matches.length > 1)
		throw new CorrectionError('More than one pack matches. Enter the serial exactly as printed.');
	return matches[0].id;
}

/**
 * Voids a serial recorded in error. Checks of it then show "Unrecognised", exactly as if it had
 * never been sent. Voiding can be undone.
 */
export async function voidSerial(actor: Actor, batchId: string, serial: string, rawReason: string) {
	const reason = reasonOf(rawReason);
	const row = await batchContext(batchId);
	const packId = await findPack(row, serial);
	const ending = serial.trim().slice(-4);
	await ctx().db.transaction(async (tx) => {
		const inserted = await tx
			.insert(packVoid)
			.values({ packId, reason, voidedBy: actor.userId })
			.onConflictDoNothing()
			.returning({ packId: packVoid.packId });
		if (!inserted.length) throw new CorrectionError('That serial is already voided.');
		await audit(
			actor,
			{
				area: 'Console',
				action: 'serial_void',
				itemType: 'pack',
				itemId: String(packId),
				manufacturerId: row.manufacturerId,
				summary: `Voided serial …${ending} of ${row.drug} batch ${row.batch.lot}. Reason: ${reason}`
			},
			tx
		);
	});
	await tellManufacturer(
		row,
		`Voided serial …${ending}. Checks of it now show "Unrecognised".`,
		reason,
		'serial'
	);
}

/** Undoes a void: the serial checks normally again. */
export async function restoreSerial(
	actor: Actor,
	batchId: string,
	packId: number,
	rawReason: string
) {
	const reason = reasonOf(rawReason);
	const row = await batchContext(batchId);
	await ctx().db.transaction(async (tx) => {
		const removed = await tx
			.delete(packVoid)
			.where(
				and(
					eq(packVoid.packId, packId),
					inArray(
						packVoid.packId,
						tx.select({ id: pack.id }).from(pack).where(eq(pack.batchId, batchId))
					)
				)
			)
			.returning({ voidedAt: packVoid.voidedAt, reason: packVoid.reason });
		if (!removed.length) throw new CorrectionError('That serial is not voided.');
		await audit(
			actor,
			{
				area: 'Console',
				action: 'serial_restore',
				itemType: 'pack',
				itemId: String(packId),
				manufacturerId: row.manufacturerId,
				summary: `Restored a voided serial of ${row.drug} batch ${row.batch.lot}. Reason: ${reason}`,
				before: { voidReason: removed[0].reason }
			},
			tx
		);
	});
	await tellManufacturer(row, 'Restored a serial that had been voided.', reason, 'serial');
}

/** Voided serials in a batch. Serials are only stored as hashes, so they show by date and reason. */
export async function voidedSerials(batchId: string) {
	return ctx()
		.db.select({
			packId: packVoid.packId,
			reason: packVoid.reason,
			voidedAt: packVoid.voidedAt,
			by: user.name
		})
		.from(packVoid)
		.innerJoin(pack, eq(pack.id, packVoid.packId))
		.leftJoin(user, eq(user.id, packVoid.voidedBy))
		.where(eq(pack.batchId, batchId))
		.orderBy(desc(packVoid.voidedAt));
}

// ---------------------------------------------------------------- supply chain records

/** Every supply chain record of a batch, newest first, marked current, replaced or cancelled. */
export async function custodyRecords(batchId: string) {
	const sender = alias(party, 'sender');
	const rows = await ctx()
		.db.select({
			id: custodyEvent.id,
			level: custodyEvent.level,
			packId: custodyEvent.packId,
			eventType: custodyEvent.eventType,
			eventDate: custodyEvent.eventDate,
			source: custodyEvent.source,
			supersedesId: custodyEvent.supersedesId,
			createdAt: custodyEvent.createdAt,
			fromPartyId: custodyEvent.fromPartyId,
			toPartyId: custodyEvent.toPartyId,
			fromName: sender.name,
			toName: party.name
		})
		.from(custodyEvent)
		.innerJoin(party, eq(party.id, custodyEvent.toPartyId))
		.leftJoin(sender, eq(sender.id, custodyEvent.fromPartyId))
		.where(eq(custodyEvent.batchId, batchId))
		.orderBy(desc(custodyEvent.id))
		.limit(500);
	const replacedBy = new Map<number, { id: number; voided: boolean }>();
	for (const r of rows)
		if (r.supersedesId)
			replacedBy.set(r.supersedesId, { id: r.id, voided: r.eventType === 'voided' });
	return rows.map((r) => {
		const later = replacedBy.get(r.id);
		return {
			...r,
			state:
				r.eventType === 'voided'
					? ('correction' as const)
					: later
						? later.voided
							? ('cancelled' as const)
							: ('replaced' as const)
						: ('current' as const)
		};
	});
}

/** Two people correcting the same record at once: the database lets only the first through. */
function alreadyCorrected(error: unknown): never {
	const code = (e: unknown) => (e as { code?: string } | undefined)?.code;
	if (code(error) === '23505' || code((error as { cause?: unknown })?.cause) === '23505')
		throw new CorrectionError('That record has already been corrected.');
	throw error;
}

async function custodyContext(batchId: string, eventId: number) {
	const row = await batchContext(batchId);
	const [event] = await ctx()
		.db.select()
		.from(custodyEvent)
		.where(and(eq(custodyEvent.id, eventId), eq(custodyEvent.batchId, batchId)));
	if (!event) throw new CorrectionError('Record not found.');
	if (event.eventType === 'voided')
		throw new CorrectionError('That record is itself a correction.');
	const [later] = await ctx()
		.db.select({ id: custodyEvent.id })
		.from(custodyEvent)
		.where(eq(custodyEvent.supersedesId, eventId))
		.limit(1);
	if (later) throw new CorrectionError('That record has already been corrected.');
	return { row, event };
}

/** Cancels a supply chain record entered in error. Journeys stop showing it. */
export async function voidCustodyRecord(
	actor: Actor,
	batchId: string,
	eventId: number,
	rawReason: string
) {
	const reason = reasonOf(rawReason);
	const { row, event } = await custodyContext(batchId, eventId);
	await ctx()
		.db.transaction(async (tx) => {
			const { id: _id, createdAt: _c, importJobId: _j, ...copy } = event;
			const [created] = await tx
				.insert(custodyEvent)
				.values({
					...copy,
					eventType: 'voided',
					source: 'staff_correction',
					supersedesId: event.id
				})
				.returning({ id: custodyEvent.id });
			await audit(
				actor,
				{
					area: 'Console',
					action: 'custody_void',
					itemType: 'custody_event',
					itemId: String(created.id),
					manufacturerId: row.manufacturerId,
					summary: `Cancelled a supply chain record of ${row.drug} batch ${row.batch.lot} (record ${event.id}). Reason: ${reason}`,
					before: { recordId: event.id }
				},
				tx
			);
		})
		.catch(alreadyCorrected);
	await tellManufacturer(row, `Cancelled supply chain record ${event.id}.`, reason, 'custody');
	if (event.eventType === 'received')
		await tellBusiness(
			row,
			event.toPartyId,
			"DETECK cancelled a receipt your business confirmed. It no longer shows on the pack's journey or on your receipts.",
			reason
		);
}

/**
 * Replaces a supply chain record with a corrected one (who sent it, who received it, or the date).
 * Parties are chosen by id from the parties already known to DETECK.
 */
export async function replaceCustodyRecord(
	actor: Actor,
	batchId: string,
	eventId: number,
	input: { fromPartyId: string; toPartyId: string; eventDate: string },
	rawReason: string
) {
	const reason = reasonOf(rawReason);
	const { row, event } = await custodyContext(batchId, eventId);
	if (!ISO_DATE.test(input.eventDate)) throw new CorrectionError('Enter the date.');
	if (input.eventDate > lagosToday()) throw new CorrectionError("The date can't be in the future.");
	const ids = [input.toPartyId, input.fromPartyId].filter(Boolean);
	if (!input.toPartyId) throw new CorrectionError('Choose who received it.');
	if (input.fromPartyId && input.fromPartyId === input.toPartyId)
		throw new CorrectionError('Sender and receiver must be different.');
	const known = await ctx()
		.db.select({ id: party.id, name: party.name })
		.from(party)
		.where(inArray(party.id, ids));
	if (known.length !== new Set(ids).size)
		throw new CorrectionError('Choose parties from the list.');
	const name = (id: string) => known.find((p) => p.id === id)?.name ?? '';
	const unchanged =
		(event.fromPartyId ?? '') === input.fromPartyId &&
		event.toPartyId === input.toPartyId &&
		event.eventDate === input.eventDate;
	if (unchanged) throw new CorrectionError('Nothing changed.');
	await ctx()
		.db.transaction(async (tx) => {
			const [created] = await tx
				.insert(custodyEvent)
				.values({
					manufacturerId: event.manufacturerId,
					level: event.level,
					packId: event.packId,
					batchId: event.batchId,
					fromPartyId: input.fromPartyId || null,
					toPartyId: input.toPartyId,
					// "Receipt confirmed by this business" belongs to the business that confirmed it:
					// moved to another business, the record is DETECK's correction, not a receipt.
					eventType:
						event.eventType === 'received' && event.toPartyId !== input.toPartyId
							? 'shipped'
							: event.eventType,
					eventDate: input.eventDate,
					source: 'staff_correction',
					supersedesId: event.id
				})
				.returning({ id: custodyEvent.id });
			await audit(
				actor,
				{
					area: 'Console',
					action: 'custody_replace',
					itemType: 'custody_event',
					itemId: String(created.id),
					manufacturerId: row.manufacturerId,
					summary: `Corrected supply chain record ${event.id} of ${row.drug} batch ${row.batch.lot}. Reason: ${reason}`,
					before: {
						fromPartyId: event.fromPartyId,
						toPartyId: event.toPartyId,
						eventDate: event.eventDate
					},
					after: {
						fromPartyId: input.fromPartyId || null,
						toPartyId: input.toPartyId,
						eventDate: input.eventDate
					}
				},
				tx
			);
		})
		.catch(alreadyCorrected);
	const now = `${input.fromPartyId ? `${name(input.fromPartyId)} → ` : ''}${name(input.toPartyId)} on ${input.eventDate}`;
	await tellManufacturer(
		row,
		`Corrected supply chain record ${event.id}: now ${now}.`,
		reason,
		'custody'
	);
	if (event.eventType === 'received')
		await tellBusiness(
			row,
			event.toPartyId,
			event.toPartyId === input.toPartyId
				? `DETECK corrected a receipt your business confirmed. It now reads: ${now}.`
				: `DETECK moved a receipt your business confirmed to another business (${name(input.toPartyId)}). It no longer shows on your receipts.`,
			reason
		);
}

/** A business whose own receipt DETECK corrected or cancelled is told, like the manufacturer. */
async function tellBusiness(
	row: Awaited<ReturnType<typeof batchContext>>,
	partyId: string,
	what: string,
	reason: string
) {
	const [b] = await ctx()
		.db.select({ email: businessAccount.contactEmail })
		.from(businessAccount)
		.innerJoin(party, eq(party.id, businessAccount.partyId))
		.where(sql`${businessAccount.partyId} = ${partyId} or ${party.mergedIntoId} = ${partyId}`)
		.limit(1);
	if (!b) return;
	await sendEmail(
		emailTemplates.recordCorrected({
			to: b.email,
			drug: row.drug,
			lot: row.batch.lot,
			what,
			reason
		})
	).catch((e) => console.error('[email] receipt correction', e));
}

/** Parties a staff member can choose when correcting a record (merged duplicates left out). */
export async function partyChoices(q = '') {
	const term = q.trim().toLowerCase();
	return ctx()
		.db.select({ id: party.id, name: party.name, role: party.role, state: party.state })
		.from(party)
		.where(
			and(
				sql`${party.mergedIntoId} is null`,
				term ? sql`${party.normalisedName} like ${`%${term}%`}` : undefined
			)
		)
		.orderBy(party.name)
		.limit(2000);
}
