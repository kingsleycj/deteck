import { and, asc, eq, inArray, isNull, ne, notInArray, sql } from 'drizzle-orm';
import type { Journey, JourneyStep, PartyRoleName } from '../../verify/journey-types.ts';
import type { VerificationResult } from '../../verify/types.ts';
import { ctx } from '../context.ts';
import { businessAccount, custodyEvent, party } from '../db/schema.ts';

const RETAIL_ROLES: PartyRoleName[] = ['pharmacy', 'hospital'];

interface EventRow {
	id: number;
	fromPartyId: string | null;
	toPartyId: string;
	eventDate: string;
	/** "received" rows are a business's own confirmation (business accounts). */
	eventType: 'shipped' | 'received' | 'voided';
}

interface PublicParty {
	id: string;
	name: string;
	role: PartyRoleName;
	place: string | null;
	verified: boolean;
}

function place(city: string | null, state: string | null): string | null {
	return [city, state].filter(Boolean).join(', ') || null;
}

/** Loads parties, following merges to the surviving record. Only public fields are selected. */
async function loadParties(ids: string[]): Promise<Map<string, PublicParty>> {
	const result = new Map<string, PublicParty>();
	let pending = [...new Set(ids)];
	const redirects = new Map<string, string>();
	for (let depth = 0; pending.length > 0 && depth < 5; depth++) {
		const rows = await ctx()
			.db.select({
				id: party.id,
				name: party.name,
				role: party.role,
				city: party.city,
				state: party.state,
				verifiedAt: party.verifiedAt,
				// A pharmacy or distributor DETECK suspended keeps its history but loses the label.
				// (The party is named in full: in this one-table query a bare "id" would mean the account's.)
				businessSuspended: sql<boolean>`exists (select 1 from ${businessAccount} a where a.party_id = ${party}.id and a.status <> 'approved')`,
				mergedIntoId: party.mergedIntoId
			})
			.from(party)
			.where(inArray(party.id, pending));
		pending = [];
		for (const row of rows) {
			if (row.mergedIntoId) {
				redirects.set(row.id, row.mergedIntoId);
				pending.push(row.mergedIntoId);
			} else {
				result.set(row.id, {
					id: row.id,
					name: row.name,
					role: row.role,
					place: place(row.city, row.state),
					verified: row.verifiedAt !== null && !row.businessSuspended
				});
			}
		}
	}
	for (const [from, to] of redirects) {
		let target = to;
		while (redirects.has(target)) target = redirects.get(target)!;
		const resolved = result.get(target);
		if (resolved) result.set(from, resolved);
	}
	return result;
}

/**
 * Events not replaced by a later correction. Corrections point at what they supersede; a
 * "voided" correction cancels a record without replacing it, so it never shows itself.
 */
async function currentEvents(where: ReturnType<typeof and>): Promise<EventRow[]> {
	const superseded = ctx()
		.db.select({ id: custodyEvent.supersedesId })
		.from(custodyEvent)
		.where(sql`${custodyEvent.supersedesId} is not null`);
	return ctx()
		.db.select({
			id: custodyEvent.id,
			fromPartyId: custodyEvent.fromPartyId,
			toPartyId: custodyEvent.toPartyId,
			eventDate: custodyEvent.eventDate,
			eventType: custodyEvent.eventType
		})
		.from(custodyEvent)
		.where(
			and(where, notInArray(custodyEvent.id, superseded), ne(custodyEvent.eventType, 'voided'))
		)
		.orderBy(
			asc(custodyEvent.eventDate),
			// On the same day, the shipment comes before the receipt that confirms it.
			sql`${custodyEvent.eventType} = 'received'`,
			asc(custodyEvent.id)
		);
}

/** "Northbridge Pharma Ltd" and "NORTHBRIDGE PHARMA" are the same company. */
function sameCompany(a: string, b: string) {
	const plain = (s: string) =>
		s
			.toLowerCase()
			.replace(/\b(ltd|limited|plc|nig|nigeria|co|company|inc)\b/g, '')
			.replace(/[^a-z0-9]/g, '');
	return plain(a) !== '' && plain(a) === plain(b);
}

function manufacturerStep(result: VerificationResult): JourneyStep {
	const m = result.manufacturer!;
	const b = result.batch!;
	return {
		kind: 'manufacturer',
		name: m.name,
		place: place(m.town, m.state) ?? m.state,
		lot: b.lot,
		manufactureDate: b.manufactureDate,
		expiryDate: b.expiryDate
	};
}

function partyStep(p: PublicParty, date: string | null, confirmed = false): JourneyStep {
	return {
		kind: 'party',
		name: p.name,
		role: p.role,
		place: p.place,
		date,
		verified: p.verified,
		...(confirmed ? { confirmed: true } : {})
	};
}

function finish(state: Journey['state'], steps: JourneyStep[]): Journey {
	const parties = steps.filter(
		(s): s is Extract<JourneyStep, { kind: 'party' }> => s.kind === 'party'
	);
	const last = parties.at(-1);
	return {
		state,
		steps,
		lastHolder: last
			? { name: last.name, role: last.role, place: last.place, date: last.date }
			: undefined,
		recordedSteps: steps.filter((s) => s.kind !== 'gap').length,
		gaps: steps.filter((s) => s.kind === 'gap').length
	};
}

/** Builds the public journey for a Valid result (decisions.md D-08, journey rules). */
export async function buildJourney(result: VerificationResult): Promise<Journey> {
	if (result.code !== 'VALID' || !result.batch || !result.manufacturer) {
		return { state: 'NONE', steps: [], recordedSteps: 0, gaps: 0 };
	}

	const packEvents = result.packId
		? await currentEvents(
				and(eq(custodyEvent.level, 'pack'), eq(custodyEvent.packId, result.packId))
			)
		: [];

	// Packs only a business has recorded (it confirmed receiving them) but whose manufacturer
	// recorded shipments by batch: show the batch list, with the confirming business marked.
	const shipments = packEvents.filter((e) => e.eventType !== 'received');
	if (packEvents.length > 0 && shipments.length === 0) {
		const batchLevel = await currentEvents(
			and(
				eq(custodyEvent.level, 'batch'),
				eq(custodyEvent.batchId, result.batch.id),
				isNull(custodyEvent.packId)
			)
		);
		if (batchLevel.length > 0) {
			const parties = await loadParties([
				...batchLevel.map((e) => e.toPartyId),
				...packEvents.map((e) => e.toPartyId)
			]);
			const steps: JourneyStep[] = [manufacturerStep(result)];
			const seen = new Set<string>();
			for (const e of batchLevel) {
				const p = parties.get(e.toPartyId);
				if (p && !seen.has(p.id)) {
					seen.add(p.id);
					steps.push(partyStep(p, e.eventDate));
				}
			}
			for (const e of packEvents) {
				const p = parties.get(e.toPartyId);
				if (!p) continue;
				const existing = steps.find((s) => s.kind === 'party' && s.name === p.name);
				if (existing && existing.kind === 'party') existing.confirmed = true;
				else steps.push(partyStep(p, e.eventDate, true));
			}
			return finish('BATCH_LEVEL', steps);
		}
	}

	if (packEvents.length > 0) {
		const parties = await loadParties(
			packEvents.flatMap((e) => [e.toPartyId, e.fromPartyId ?? []].flat())
		);
		const steps: JourneyStep[] = [manufacturerStep(result)];
		let previousHolder: PublicParty | undefined;
		for (const event of packEvents) {
			const to = parties.get(event.toPartyId);
			if (!to) continue;
			// The same hand-off recorded twice (a business confirming what the records already say,
			// or a shipment imported after the business confirmed it): one step, marked confirmed.
			if (previousHolder?.id === to.id) {
				const last = steps.at(-1);
				if (event.eventType === 'received' && last?.kind === 'party') last.confirmed = true;
				continue;
			}
			const from = event.fromPartyId ? parties.get(event.fromPartyId) : undefined;
			const fromIsManufacturer =
				!from || from.role === 'manufacturer' || sameCompany(from.name, result.manufacturer.name);
			const sameAsPrevious = from && previousHolder && from.id === previousHolder.id;
			// Gap rule: the sender is not the last recorded holder, so a hand-off is missing.
			if (from && !sameAsPrevious && !(fromIsManufacturer && !previousHolder)) {
				steps.push({
					kind: 'gap',
					afterName: previousHolder?.name ?? result.manufacturer.name,
					beforeName: from.name
				});
				steps.push(partyStep(from, null));
			}
			steps.push(partyStep(to, event.eventDate, event.eventType === 'received'));
			previousHolder = to;
		}
		const endsAtRetail = previousHolder && RETAIL_ROLES.includes(previousHolder.role);
		return finish(endsAtRetail ? 'TO_RETAIL' : 'ENDS_BEFORE_RETAIL', steps);
	}

	const batchEvents = await currentEvents(
		and(
			eq(custodyEvent.level, 'batch'),
			eq(custodyEvent.batchId, result.batch.id),
			isNull(custodyEvent.packId)
		)
	);
	if (batchEvents.length === 0) {
		return { state: 'NONE', steps: [manufacturerStep(result)], recordedSteps: 1, gaps: 0 };
	}
	const parties = await loadParties(batchEvents.map((e) => e.toPartyId));
	const firstDate = new Map<string, string>();
	for (const e of batchEvents) {
		const p = parties.get(e.toPartyId);
		if (p && !firstDate.has(p.id)) firstDate.set(p.id, e.eventDate);
	}
	const steps: JourneyStep[] = [manufacturerStep(result)];
	for (const [id, date] of firstDate) steps.push(partyStep(parties.get(id)!, date));
	return finish('BATCH_LEVEL', steps);
}
