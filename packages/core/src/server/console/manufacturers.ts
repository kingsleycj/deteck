import { sql } from 'drizzle-orm';
import { ctx } from '../context.ts';
import { manufacturer, pack, packVoid, product } from '../db/schema.ts';

export interface ManufacturerListRow {
	id: string;
	companyName: string;
	state: string;
	town: string | null;
	status: string;
	products: number;
	serials: number;
	createdAt: Date;
	submittedForReviewAt: Date | null;
}

/** Manufacturer "folders" (MF1) with search and a status filter. */
export async function listManufacturers(
	filter: { status?: string; q?: string } = {}
): Promise<ManufacturerListRow[]> {
	const q = filter.q?.trim();
	const rows = await ctx().db.execute<{
		id: string;
		company_name: string;
		state: string;
		factory_town: string | null;
		status: string;
		products: number;
		serials: number;
		created_at: Date;
		submitted_for_review_at: Date | null;
	}>(sql`
		select m.id, m.company_name, m.state, m.factory_town, m.status, m.created_at, m.submitted_for_review_at,
			(select count(*)::int from ${product} p where p.manufacturer_id = m.id) as products,
			(select count(*)::int from ${pack} k join ${product} p on p.id = k.product_id where p.manufacturer_id = m.id and not exists (select 1 from ${packVoid} v where v.pack_id = k.id)) as serials
		from ${manufacturer} m
		where (${filter.status ?? null}::text is null or m.status::text = ${filter.status ?? null})
			and (${q ?? null}::text is null or m.company_name ilike ${'%' + (q ?? '') + '%'} or m.nafdac_company_reg ilike ${'%' + (q ?? '') + '%'})
		order by (m.status = 'live') desc, m.company_name`);
	return rows.map((r) => ({
		id: r.id,
		companyName: r.company_name,
		state: r.state,
		town: r.factory_town,
		status: r.status,
		products: r.products,
		serials: r.serials,
		createdAt: new Date(r.created_at),
		submittedForReviewAt: r.submitted_for_review_at ? new Date(r.submitted_for_review_at) : null
	}));
}

export async function statusCounts() {
	const rows = await ctx().db.execute<{ status: string; n: number }>(
		sql`select status::text as status, count(*)::int as n from ${manufacturer} group by status`
	);
	return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<string, number>;
}
