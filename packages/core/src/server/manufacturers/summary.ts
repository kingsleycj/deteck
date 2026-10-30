import { desc, eq, sql } from 'drizzle-orm';
import { ctx, reportDb } from '../context.ts';
import {
	batch,
	custodyEvent,
	document,
	importJob,
	pack,
	packagingReference,
	packVoid,
	product
} from '../db/schema.ts';

export interface ProductRow {
	id: string;
	brandName: string;
	genericName: string;
	strength: string;
	dosageForm: string;
	packSize: string;
	gtin: string;
	nafdacRegNo: string;
	status: string;
	batches: number;
	serials: number;
	supplyEvents: number;
	batchesWithoutSupply: number;
	packaging: 'ready' | 'processing' | 'draft' | 'rejected' | 'missing';
}

/** Products with their data completeness (MF3 drugs table). */
export async function productRows(manufacturerId: string): Promise<ProductRow[]> {
	const rows = await reportDb().execute<{
		id: string;
		brand_name: string;
		generic_name: string;
		strength: string;
		dosage_form: string;
		pack_size: string;
		gtin: string;
		nafdac_reg_no: string;
		status: string;
		batches: number;
		serials: number;
		supply_events: number;
		batches_without_supply: number;
		packaging: string | null;
	}>(sql`
		select p.id, p.brand_name, p.generic_name, p.strength, p.dosage_form, p.pack_size, p.gtin, p.nafdac_reg_no, p.status,
			(select count(*)::int from ${batch} b where b.product_id = p.id) as batches,
			(select count(*)::int from ${pack} k where k.product_id = p.id and not exists (select 1 from ${packVoid} v where v.pack_id = k.id)) as serials,
			(select count(*)::int from ${custodyEvent} c join ${batch} b on b.id = c.batch_id where b.product_id = p.id and c.event_type <> 'voided' and not exists (select 1 from ${custodyEvent} c2 where c2.supersedes_id = c.id)) as supply_events,
			(select count(*)::int from ${batch} b where b.product_id = p.id
				and not exists (select 1 from ${custodyEvent} c where c.batch_id = b.id)) as batches_without_supply,
			(select r.status from ${packagingReference} r where r.product_id = p.id
				order by (r.status = 'ready') desc, r.version desc limit 1) as packaging
		from ${product} p
		where p.manufacturer_id = ${manufacturerId}
		order by p.brand_name, p.strength`);
	return rows.map((r) => ({
		id: r.id,
		brandName: r.brand_name,
		genericName: r.generic_name,
		strength: r.strength,
		dosageForm: r.dosage_form,
		packSize: r.pack_size,
		gtin: r.gtin,
		nafdacRegNo: r.nafdac_reg_no,
		status: r.status,
		batches: r.batches,
		serials: r.serials,
		supplyEvents: r.supply_events,
		batchesWithoutSupply: r.batches_without_supply,
		packaging:
			r.packaging === 'ready' ||
			r.packaging === 'rejected' ||
			r.packaging === 'draft' ||
			r.packaging === 'processing'
				? r.packaging
				: 'missing'
	}));
}

export async function documentsFor(manufacturerId: string) {
	return ctx()
		.db.select({
			id: document.id,
			kind: document.kind,
			fileName: document.fileName,
			sizeBytes: document.sizeBytes,
			createdAt: document.createdAt
		})
		.from(document)
		.where(eq(document.manufacturerId, manufacturerId))
		.orderBy(desc(document.createdAt));
}

export async function recentImports(manufacturerId: string, limit = 5) {
	return ctx()
		.db.select({
			id: importJob.id,
			kind: importJob.kind,
			fileName: importJob.fileName,
			status: importJob.status,
			counts: importJob.counts,
			createdAt: importJob.createdAt
		})
		.from(importJob)
		.where(eq(importJob.manufacturerId, manufacturerId))
		.orderBy(desc(importJob.createdAt))
		.limit(limit);
}

export interface ChecklistItem {
	key: string;
	label: string;
	state: 'ok' | 'warn' | 'bad';
	detail?: string;
}

/** The go-live checklist (MF6). Warnings don't block going live; "bad" items do. */
export async function goLiveChecklist(
	manufacturerId: string
): Promise<{ items: ChecklistItem[]; blocking: boolean }> {
	const docs = await documentsFor(manufacturerId);
	const products = await productRows(manufacturerId);
	const hasCert = docs.some((d) => d.kind === 'nafdac_certificate');
	const hasAgreement = docs.some((d) => d.kind === 'data_sharing_agreement');
	const serials = products.reduce((n, p) => n + p.serials, 0);
	const withSupply = products.filter((p) => p.supplyEvents > 0).length;
	const withPackaging = products.filter((p) => p.packaging === 'ready').length;
	const productsWithoutSerials = products.filter((p) => p.serials === 0).length;
	// Data that has been checked but not saved (or is being saved) isn't what the reviewer sees.
	const [{ unsaved }] = await reportDb().execute<{ unsaved: number }>(sql`
		select count(*)::int as unsaved from ${importJob}
		where manufacturer_id = ${manufacturerId} and status in ('validating', 'ready', 'committing')`);

	const items: ChecklistItem[] = [
		{
			key: 'documents',
			label: 'NAFDAC certificate and signed data-sharing agreement on file',
			state: hasCert && hasAgreement ? 'ok' : 'bad',
			detail: !hasCert
				? 'NAFDAC certificate missing'
				: !hasAgreement
					? 'Signed agreement missing'
					: undefined
		},
		{
			key: 'products',
			label: `${products.length} ${products.length === 1 ? 'drug' : 'drugs'}, each with a NAFDAC number and GTIN`,
			state: products.length > 0 ? 'ok' : 'bad'
		},
		{
			key: 'serials',
			label: `${serials.toLocaleString('en-NG')} serials`,
			state: serials === 0 ? 'bad' : productsWithoutSerials > 0 ? 'warn' : 'ok',
			detail:
				productsWithoutSerials > 0
					? `${productsWithoutSerials} ${productsWithoutSerials === 1 ? 'drug has' : 'drugs have'} no serials yet`
					: undefined
		},
		{
			key: 'supply',
			label: `Supply chain records for ${withSupply} of ${products.length} drugs`,
			state: products.length > 0 && withSupply === products.length ? 'ok' : 'warn',
			detail:
				withSupply < products.length
					? 'People checking the others see only the manufacturer\'s record, under "Recorded so far"'
					: undefined
		},
		{
			key: 'packaging',
			label: `Genuine packaging ready for ${withPackaging} of ${products.length} drugs`,
			state: products.length > 0 && withPackaging === products.length ? 'ok' : 'warn',
			detail:
				withPackaging < products.length
					? 'People will see "Packaging check not available yet" for the others'
					: undefined
		}
	];
	if (unsaved > 0)
		items.push({
			key: 'imports',
			label: `${unsaved} ${unsaved === 1 ? 'import is' : 'imports are'} checked but not saved yet`,
			state: 'bad',
			detail: `Import or cancel ${unsaved === 1 ? 'it' : 'them'} on the Import data page first, so the review covers all the data`
		});
	return { items, blocking: items.some((i) => i.state === 'bad') };
}

export async function manufacturerCounts(manufacturerId: string) {
	const [row] = await reportDb().execute<{
		products: number;
		batches: number;
		serials: number;
		events: number;
	}>(sql`
		select
			(select count(*)::int from ${product} where manufacturer_id = ${manufacturerId}) as products,
			(select count(*)::int from ${batch} b join ${product} p on p.id = b.product_id where p.manufacturer_id = ${manufacturerId}) as batches,
			(select count(*)::int from ${pack} k join ${product} p on p.id = k.product_id where p.manufacturer_id = ${manufacturerId} and not exists (select 1 from ${packVoid} v where v.pack_id = k.id)) as serials,
			(select count(*)::int from ${custodyEvent} c where c.manufacturer_id = ${manufacturerId} and c.event_type <> 'voided' and not exists (select 1 from ${custodyEvent} c2 where c2.supersedes_id = c.id)) as events`);
	return row;
}

export async function checksOfProducts(manufacturerId: string, days = 30) {
	const [row] = await reportDb().execute<{ n: number }>(sql`
		select count(*)::int as n from check_event c join ${product} p on p.id = c.product_id
		where p.manufacturer_id = ${manufacturerId} and c.created_at > now() - make_interval(days => ${days})`);
	return row.n;
}
