import { eq, sql } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import { custodyEvent, manufacturer, party } from './db/schema.ts';

export class PartyError extends Error {}

export type PartyRow = {
	id: string;
	name: string;
	role: string;
	state: string | null;
	city: string | null;
	cac_rc: string | null;
	pcn_licence: string | null;
	gln: string | null;
	verified_at: Date | null;
	merged_into_id: string | null;
	created_by: string | null;
	events: number;
	manufacturers: number;
};

/** Supply chain businesses, with how many records mention them. */
export async function listParties(
	filter: { q?: string; unverifiedOnly?: boolean; manufacturerId?: string } = {}
) {
	const q = filter.q?.trim() ?? '';
	const like = `%${q}%`;
	// Records count against the business they were merged into. With a manufacturer filter, only that
	// manufacturer's records count, so one company never sees another's activity.
	const mid = filter.manufacturerId ?? null;
	return ctx().db.execute<PartyRow>(sql`
		with ids as (
			select p.id as party_id, p.id as event_party_id from ${party} p where p.merged_into_id is null
			union all
			select p.merged_into_id, p.id from ${party} p where p.merged_into_id is not null
		), counted as (
			select ids.party_id, count(*)::int as events, count(distinct c.manufacturer_id)::int as manufacturers
			from ids join ${custodyEvent} c on c.to_party_id = ids.event_party_id or c.from_party_id = ids.event_party_id
			where (${mid}::uuid is null or c.manufacturer_id = ${mid}::uuid) and c.event_type <> 'voided' and not exists (select 1 from ${custodyEvent} c2 where c2.supersedes_id = c.id)
			group by ids.party_id
		)
		select p.id, p.name, p.role, p.state, p.city, p.cac_rc, p.pcn_licence, p.gln, p.verified_at, p.merged_into_id,
			case when ${mid}::uuid is null then m.company_name end as created_by,
			coalesce(counted.events, 0) as events,
			case when ${mid}::uuid is null then coalesce(counted.manufacturers, 0) else 1 end as manufacturers
		from ${party} p
		left join ${manufacturer} m on m.id = p.created_by_manufacturer_id
		left join counted on counted.party_id = p.id
		where p.merged_into_id is null
			and (${q} = '' or p.name ilike ${like} or p.city ilike ${like} or p.state ilike ${like} or p.pcn_licence ilike ${like} or p.cac_rc ilike ${like})
			and (${filter.unverifiedOnly ?? false} = false or p.verified_at is null)
			and (${mid}::uuid is null or counted.events > 0)
		order by p.verified_at is not null, events desc, p.name
		limit 200`);
}

/** Verify a business after checking its licence (US-05.3 review). Optionally records identifiers. */
export async function verifyParty(
	actor: Actor,
	id: string,
	input: { pcnLicence?: string; cacRc?: string; gln?: string; unverify?: boolean }
) {
	const { db } = ctx();
	const [p] = await db.select().from(party).where(eq(party.id, id));
	if (!p) throw new PartyError('Business not found.');
	const gln = input.gln?.replace(/\s+/g, '') || null;
	if (gln && !/^\d{13}$/.test(gln)) throw new PartyError('A GLN has 13 digits.');
	const changes = input.unverify
		? { verifiedAt: null, verifiedBy: null }
		: {
				verifiedAt: new Date(),
				verifiedBy: actor.userId,
				pcnLicence: input.pcnLicence?.trim() || p.pcnLicence,
				cacRc: input.cacRc?.trim() || p.cacRc,
				gln: gln ?? p.gln
			};
	await db.transaction(async (tx) => {
		await tx.update(party).set(changes).where(eq(party.id, id));
		await audit(
			actor,
			{
				area: 'Console',
				action: input.unverify ? 'party_unverify' : 'party_verify',
				itemType: 'party',
				itemId: id,
				summary: `${input.unverify ? 'Removed verification from' : 'Verified'} ${p.name}`,
				before: { verified: Boolean(p.verifiedAt) },
				after: changes
			},
			tx
		);
	});
}

/** Merges a duplicate into the surviving business. Journeys follow the merge (D-08). */
export async function mergeParty(actor: Actor, duplicateId: string, survivorId: string) {
	if (duplicateId === survivorId)
		throw new PartyError('Choose a different business to merge into.');
	const { db } = ctx();
	const [dup] = await db.select().from(party).where(eq(party.id, duplicateId));
	const [keep] = await db.select().from(party).where(eq(party.id, survivorId));
	if (!dup || !keep) throw new PartyError('Business not found.');
	if (keep.mergedIntoId)
		throw new PartyError(
			`${keep.name} was itself merged. Merge into the surviving record instead.`
		);
	await db.transaction(async (tx) => {
		await tx
			.update(party)
			.set({ mergedIntoId: survivorId })
			.where(eq(party.mergedIntoId, duplicateId));
		await tx.update(party).set({ mergedIntoId: survivorId }).where(eq(party.id, duplicateId));
		await audit(
			actor,
			{
				area: 'Console',
				action: 'party_merge',
				itemType: 'party',
				itemId: duplicateId,
				summary: `Merged ${dup.name} into ${keep.name}`,
				before: { name: dup.name },
				after: { mergedInto: keep.name }
			},
			tx
		);
	});
}
