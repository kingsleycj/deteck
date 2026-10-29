import { and, desc, eq, sql } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import {
	batch,
	custodyEvent,
	manufacturer,
	pack,
	packagingReference,
	packVoid,
	product
} from './db/schema.ts';
import { queueRecallAlerts, queueRecallLifted } from './alerts.ts';
import { clearCoverageCache } from './verify/lookup.ts';
import { emitEvent } from './webhooks.ts';
import { today } from './time.ts';

export class CatalogueError extends Error {}

/** US-06.2: search drugs by name, NAFDAC number, manufacturer or batch, optionally by status. */
export async function searchProducts(q: string, limit = 50, status?: string) {
	const term = q.trim();
	const like = `%${term}%`;
	return ctx().db.execute<{
		id: string;
		brand_name: string;
		generic_name: string;
		strength: string;
		gtin: string;
		nafdac_reg_no: string;
		status: string;
		manufacturer_id: string;
		manufacturer_name: string;
		manufacturer_status: string;
		serials: number;
		packaging: string | null;
		updated_at: Date;
	}>(sql`
		select p.id, p.brand_name, p.generic_name, p.strength, p.gtin, p.nafdac_reg_no, p.status,
			m.id as manufacturer_id, m.company_name as manufacturer_name, m.status as manufacturer_status,
			(select count(*)::int from ${pack} k where k.product_id = p.id and not exists (select 1 from ${packVoid} v where v.pack_id = k.id)) as serials,
			(select r.status from ${packagingReference} r where r.product_id = p.id order by (r.status = 'ready') desc, r.version desc limit 1) as packaging,
			greatest(p.updated_at, coalesce((select max(b.updated_at) from ${batch} b where b.product_id = p.id), p.updated_at)) as updated_at
		from ${product} p join ${manufacturer} m on m.id = p.manufacturer_id
		where (${status ?? null}::text is null or p.status::text = ${status ?? null})
			and (${term} = ''
			or p.brand_name ilike ${like} or p.generic_name ilike ${like} or p.nafdac_reg_no ilike ${like}
			or p.gtin like ${like} or m.company_name ilike ${like}
			or exists (select 1 from ${batch} b where b.product_id = p.id and b.lot ilike ${like}))
		order by updated_at desc
		limit ${limit}`);
}

export async function productDetail(productId: string, manufacturerId?: string) {
	const { db } = ctx();
	const where = manufacturerId
		? and(eq(product.id, productId), eq(product.manufacturerId, manufacturerId))
		: eq(product.id, productId);
	const [p] = await db
		.select({
			product,
			manufacturerName: manufacturer.companyName,
			manufacturerStatus: manufacturer.status
		})
		.from(product)
		.innerJoin(manufacturer, eq(manufacturer.id, product.manufacturerId))
		.where(where);
	if (!p) return null;
	const batches = await db.execute<{
		id: string;
		lot: string;
		manufacture_date: string | null;
		expiry_date: string;
		quantity: number | null;
		status: string;
		status_reason: string | null;
		status_source: string | null;
		status_effective_at: string | null;
		serials: number;
		events: number;
	}>(sql`
		select b.id, b.lot, b.manufacture_date, b.expiry_date, b.quantity, b.status, b.status_reason, b.status_source, b.status_effective_at,
			(select count(*)::int from ${pack} k where k.batch_id = b.id and not exists (select 1 from ${packVoid} v where v.pack_id = k.id)) as serials,
			(select count(*)::int from ${custodyEvent} c where c.batch_id = b.id and c.event_type <> 'voided' and not exists (select 1 from ${custodyEvent} c2 where c2.supersedes_id = c.id)) as events
		from ${batch} b where b.product_id = ${productId}
		order by b.expiry_date desc`);
	const references = await db
		.select()
		.from(packagingReference)
		.where(eq(packagingReference.productId, productId))
		.orderBy(desc(packagingReference.version));
	return {
		...p.product,
		manufacturerName: p.manufacturerName,
		manufacturerStatus: p.manufacturerStatus,
		batches,
		references
	};
}

const EDITABLE = [
	'brandName',
	'genericName',
	'strength',
	'dosageForm',
	'packSize',
	'nafdacRegNo',
	'serialHint'
] as const;

/** Small correction form (dev-plan P4). Every change is audited with before and after values. */
export async function updateProduct(
	actor: Actor,
	productId: string,
	manufacturerId: string,
	input: Record<string, string>
) {
	const { db } = ctx();
	const [current] = await db
		.select()
		.from(product)
		.where(and(eq(product.id, productId), eq(product.manufacturerId, manufacturerId)));
	if (!current) throw new CatalogueError('Drug not found.');
	const changes: Record<string, string | null> = {};
	for (const key of EDITABLE) {
		if (!(key in input)) continue;
		const value = input[key].trim();
		if (key !== 'serialHint' && value.length === 0)
			throw new CatalogueError('Fill in every required field.');
		const next = value || null;
		if ((current[key] ?? null) !== next) changes[key] = next;
	}
	if (Object.keys(changes).length === 0) return false;
	const before = Object.fromEntries(
		Object.keys(changes).map((k) => [k, current[k as keyof typeof current]])
	);
	await db.transaction(async (tx) => {
		await tx.update(product).set(changes).where(eq(product.id, productId));
		await audit(
			actor,
			{
				area: 'Manufacturer board',
				action: 'product_edit',
				itemType: 'product',
				itemId: productId,
				manufacturerId,
				summary: `Edited ${current.brandName} ${current.strength}`,
				before,
				after: changes
			},
			tx
		);
	});
	return true;
}

/** Recall, withdraw or reactivate a batch (G-15). A recall overrides Valid on every check. */
export async function setBatchStatus(
	actor: Actor,
	batchId: string,
	input: {
		status: 'active' | 'recalled' | 'withdrawn';
		reason: string;
		source: string;
		effectiveAt?: string;
	},
	manufacturerId?: string
) {
	const { db } = ctx();
	const [row] = await db
		.select({
			batch,
			manufacturerId: product.manufacturerId,
			brandName: product.brandName,
			gtin: product.gtin
		})
		.from(batch)
		.innerJoin(product, eq(product.id, batch.productId))
		.where(eq(batch.id, batchId));
	if (!row || (manufacturerId && row.manufacturerId !== manufacturerId))
		throw new CatalogueError('Batch not found.');
	if (input.reason.trim().length < 3) throw new CatalogueError('A reason is required.');
	if (input.status !== 'active' && input.source.trim().length < 2)
		throw new CatalogueError('Say who issued the recall or withdrawal.');
	const effective =
		input.effectiveAt && /^\d{4}-\d{2}-\d{2}$/.test(input.effectiveAt)
			? input.effectiveAt
			: today();
	// The public result says the batch "was recalled on" this date, and it takes effect now.
	if (input.status !== 'active' && effective > today())
		throw new CatalogueError(
			"The effective date can't be in the future. Record the recall on the day it starts."
		);
	await db.transaction(async (tx) => {
		await tx
			.update(batch)
			.set({
				status: input.status,
				statusReason: input.status === 'active' ? null : input.reason.trim(),
				statusSource: input.status === 'active' ? null : input.source.trim(),
				statusEffectiveAt: input.status === 'active' ? null : effective
			})
			.where(eq(batch.id, batchId));
		await audit(
			actor,
			{
				area: actor.role.startsWith('DETECK') ? 'Console' : 'Manufacturer board',
				action: `batch_${input.status}`,
				itemType: 'batch',
				itemId: batchId,
				manufacturerId: row.manufacturerId,
				summary: `${input.status === 'active' ? 'Reactivated' : input.status === 'recalled' ? 'Recalled' : 'Withdrew'} ${row.brandName} batch ${row.batch.lot}`,
				before: { status: row.batch.status },
				after: {
					status: input.status,
					reason: input.reason.trim(),
					source: input.source.trim(),
					effectiveAt: effective
				}
			},
			tx
		);
	});
	await emitEvent(row.manufacturerId, 'batch.status_changed', {
		gtin: row.gtin,
		drug: row.brandName,
		lot: row.batch.lot,
		status: input.status,
		reason: input.reason.trim(),
		source: input.source.trim() || null,
		effectiveAt: input.status === 'active' ? null : effective
	});
	// People who asked to be told about this batch get an alert when it's recalled or withdrawn.
	if (input.status !== 'active') await queueRecallAlerts(batchId);
	else if (row.batch.status !== 'active') await queueRecallLifted(batchId);
}

/** US-06.2: DETECK staff flag or deactivate a product, with a required reason. */
export async function setProductStatus(
	actor: Actor,
	productId: string,
	status: 'active' | 'flagged' | 'deactivated',
	reason: string
) {
	if (reason.trim().length < 3) throw new CatalogueError('A reason is required.');
	const { db } = ctx();
	const [p] = await db.select().from(product).where(eq(product.id, productId));
	if (!p) throw new CatalogueError('Drug not found.');
	// Turning down a new drug keeps it hidden ("rejected"), rather than paused and visible.
	const stored = p.status === 'pending_review' && status === 'deactivated' ? 'rejected' : status;
	await db.transaction(async (tx) => {
		await tx
			.update(product)
			.set({ status: stored, statusReason: status === 'active' ? null : reason.trim() })
			.where(eq(product.id, productId));
		await audit(
			actor,
			{
				area: 'Console',
				action: `product_${status}`,
				itemType: 'product',
				itemId: productId,
				manufacturerId: p.manufacturerId,
				summary: `${status === 'active' ? (p.status === 'pending_review' ? 'Approved the new drug' : 'Reactivated') : status === 'flagged' ? 'Flagged' : p.status === 'pending_review' ? 'Rejected the new drug' : 'Deactivated'} ${p.brandName} ${p.strength}`,
				before: { status: p.status },
				after: { status: stored, reason: reason.trim() }
			},
			tx
		);
	});
	clearCoverageCache();
	if (p.status === 'pending_review')
		await emitEvent(p.manufacturerId, 'product.reviewed', {
			gtin: p.gtin,
			drug: `${p.brandName} ${p.strength}`,
			decision: status === 'active' ? 'approved' : 'rejected',
			reason: reason.trim()
		});
}
