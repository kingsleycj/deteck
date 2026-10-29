/**
 * Usage insights (US-06.4), unusual-check signals (G-16) and the audit trail
 * (US-06.3). Everything here is aggregated; no personal identifiers are
 * returned, and small counts are suppressed by state.
 */
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from 'drizzle-orm';
import { reportDb } from './context.ts';
import { auditLog, batch, checkEvent, manufacturer, product } from './db/schema.ts';
import { consume } from './rate-limit.ts';
import { emitEvent } from './webhooks.ts';

export const SMALL_COUNT = 5;

export interface Range {
	from: Date;
	to: Date;
}

export function rangeFromDays(days: number, now = new Date()): Range {
	const to = new Date(now);
	const from = new Date(now.getTime() - days * 86400000);
	return { from, to };
}

export async function insights(range: Range) {
	const db = reportDb();
	// Raw SQL parameters must be strings: postgres.js doesn't serialise Date here.
	const from = range.from.toISOString();
	const to = range.to.toISOString();
	const daily = await db.execute<{
		day: string;
		serial: number;
		scan: number;
		journey: number;
		packaging: number;
	}>(sql`
		select to_char(d.day, 'YYYY-MM-DD') as day,
			count(*) filter (where c.kind = 'serial')::int as serial,
			count(*) filter (where c.kind = 'scan')::int as scan,
			count(*) filter (where c.kind = 'journey')::int as journey,
			count(*) filter (where c.kind = 'packaging')::int as packaging
		from generate_series(date_trunc('day', ${from}::timestamptz at time zone 'Africa/Lagos'), date_trunc('day', ${to}::timestamptz at time zone 'Africa/Lagos'), interval '1 day') as d(day)
		left join ${checkEvent} c on date_trunc('day', c.created_at at time zone 'Africa/Lagos') = d.day
			and c.created_at between ${from}::timestamptz and ${to}::timestamptz
		group by d.day order by d.day`);

	const results = await db.execute<{ result: string; n: number }>(sql`
		select split_part(result, ':', 1) as result, count(*)::int as n from ${checkEvent}
		where kind in ('serial', 'scan') and created_at between ${from}::timestamptz and ${to}::timestamptz
		group by 1 order by 2 desc`);

	const packaging = await db.execute<{ result: string; n: number }>(sql`
		select result, count(*)::int as n from ${checkEvent}
		where kind = 'packaging' and created_at between ${from}::timestamptz and ${to}::timestamptz
		group by 1 order by 2 desc`);

	const topProducts = await db.execute<{
		id: string;
		name: string;
		manufacturer: string;
		n: number;
	}>(sql`
		select p.id, p.brand_name || ' ' || p.strength as name, m.company_name as manufacturer, count(*)::int as n
		from ${checkEvent} c join ${product} p on p.id = c.product_id join ${manufacturer} m on m.id = p.manufacturer_id
		where c.kind in ('serial', 'scan') and c.created_at between ${from}::timestamptz and ${to}::timestamptz
		group by p.id, p.brand_name, p.strength, m.company_name order by n desc limit 10`);

	const byState = await db.execute<{ state: string; n: number }>(sql`
		select coalesce(state, 'Unknown') as state, count(*)::int as n from ${checkEvent}
		where kind in ('serial', 'scan') and created_at between ${from}::timestamptz and ${to}::timestamptz
		group by 1 order by 2 desc`);

	const [totals] = await db.execute<{
		checks: number;
		serial: number;
		scan: number;
		journeys: number;
		devices: number;
	}>(sql`
		select count(*) filter (where kind in ('serial', 'scan'))::int as checks,
			count(*) filter (where kind = 'serial')::int as serial,
			count(*) filter (where kind = 'scan')::int as scan,
			count(*) filter (where kind = 'journey')::int as journeys,
			count(distinct device_day_hash)::int as devices
		from ${checkEvent} where created_at between ${from}::timestamptz and ${to}::timestamptz`);

	return {
		daily: [...daily],
		results: [...results],
		packaging: [...packaging],
		topProducts: [...topProducts],
		byState: byState.map((s) => ({ state: s.state, n: s.n, suppressed: s.n < SMALL_COUNT })),
		totals
	};
}

/** Serials checked from unusually many devices or states (possible copied codes, G-16). */
export async function signals(
	options: { days?: number; minDevices?: number; minStates?: number } = {}
) {
	const days = options.days ?? 7;
	const minDevices = options.minDevices ?? 8;
	const minStates = options.minStates ?? 3;
	return reportDb().execute<{
		key: string;
		product: string | null;
		manufacturer: string | null;
		lot: string | null;
		checks: number;
		devices: number;
		states: number;
		last_seen: Date;
	}>(sql`
		select encode(c.serial_key_hmac, 'hex') as key,
			max(p.brand_name || ' ' || p.strength) as product,
			max(m.company_name) as manufacturer,
			max(b.lot) as lot,
			count(*)::int as checks,
			count(distinct c.device_day_hash)::int as devices,
			count(distinct c.state)::int as states,
			max(c.created_at) as last_seen
		from ${checkEvent} c
		left join ${product} p on p.id = c.product_id
		left join ${manufacturer} m on m.id = p.manufacturer_id
		left join ${batch} b on b.id = c.batch_id
		where c.serial_key_hmac is not null and c.kind in ('serial', 'scan')
			and c.created_at > now() - make_interval(days => ${days})
		group by c.serial_key_hmac
		having count(distinct c.device_day_hash) >= ${minDevices} or count(distinct c.state) >= ${minStates}
		order by devices desc, checks desc
		limit 100`);
}

/**
 * Tells manufacturers (by webhook) when one of their serials was checked from unusually many
 * devices or states in the last 24 hours. At most once a day per serial. Serials are only stored
 * as keyed codes, so the event names the drug and batch, not the serial.
 */
export async function notifyUnusualChecks(now = new Date()) {
	const rows = await reportDb().execute<{
		key: string;
		manufacturer_id: string;
		gtin: string;
		drug: string;
		lot: string | null;
		checks: number;
		devices: number;
		states: number;
	}>(sql`
		select encode(c.serial_key_hmac, 'hex') as key, p.manufacturer_id, max(p.gtin) as gtin,
			max(p.brand_name || ' ' || p.strength) as drug, max(b.lot) as lot,
			count(*)::int as checks,
			count(distinct c.device_day_hash)::int as devices,
			count(distinct c.state)::int as states
		from ${checkEvent} c
		join ${product} p on p.id = c.product_id
		left join ${batch} b on b.id = c.batch_id
		where c.serial_key_hmac is not null and c.kind in ('serial', 'scan')
			and c.created_at > ${now.toISOString()}::timestamptz - interval '24 hours'
		group by c.serial_key_hmac, p.manufacturer_id
		having count(distinct c.device_day_hash) >= 8 or count(distinct c.state) >= 3
		limit 200`);
	let sent = 0;
	for (const r of rows) {
		const first = await consume([{ key: `unusual:${r.key}`, windowSeconds: 86_400, max: 1 }], now);
		if (!first.ok) continue;
		await emitEvent(r.manufacturer_id, 'check.unusual', {
			signalId: r.key.slice(0, 16),
			gtin: r.gtin,
			drug: r.drug,
			lot: r.lot,
			last24Hours: { checks: r.checks, devices: r.devices, states: r.states }
		});
		sent++;
	}
	return sent;
}

// ---------------------------------------------------------------- audit trail

export interface AuditFilter {
	q?: string;
	area?: string;
	action?: string;
	actor?: string;
	manufacturerId?: string;
	from?: Date;
	to?: Date;
}

function auditWhere(f: AuditFilter): SQL | undefined {
	const conditions: (SQL | undefined)[] = [
		f.area ? eq(auditLog.area, f.area) : undefined,
		f.action ? ilike(auditLog.action, `${f.action}%`) : undefined,
		f.actor ? eq(auditLog.actorUserId, f.actor) : undefined,
		f.manufacturerId ? eq(auditLog.manufacturerId, f.manufacturerId) : undefined,
		f.from ? gte(auditLog.createdAt, f.from) : undefined,
		f.to ? lte(auditLog.createdAt, f.to) : undefined,
		f.q
			? or(
					ilike(auditLog.summary, `%${f.q}%`),
					ilike(auditLog.actorLabel, `%${f.q}%`),
					ilike(auditLog.itemId, `%${f.q}%`)
				)
			: undefined
	];
	const used = conditions.filter(Boolean) as SQL[];
	return used.length ? and(...used) : undefined;
}

export async function auditPage(f: AuditFilter, page = 1, pageSize = 25) {
	const db = reportDb();
	const where = auditWhere(f);
	const [rows, [{ n }]] = await Promise.all([
		db
			.select()
			.from(auditLog)
			.where(where)
			.orderBy(desc(auditLog.createdAt), desc(auditLog.id))
			.limit(pageSize)
			.offset((page - 1) * pageSize),
		db
			.select({ n: sql<number>`count(*)::int` })
			.from(auditLog)
			.where(where)
	]);
	return { rows, total: n, page, pageSize };
}

let actorsCache: { at: number; value: { id: string; label: string }[] } | undefined;

/** The people in the audit trail, for its filter. Cached for 5 minutes: it reads the whole log. */
export async function auditActors() {
	if (actorsCache && Date.now() - actorsCache.at < 5 * 60_000) return actorsCache.value;
	const value = [
		...(await reportDb().execute<{ id: string; label: string }>(sql`
		select distinct on (actor_user_id) actor_user_id as id, actor_label as label
		from ${auditLog} where actor_user_id is not null order by actor_user_id, created_at desc`))
	];
	actorsCache = { at: Date.now(), value };
	return value;
}

const csvCell = (v: unknown) => {
	const s = v === null || v === undefined ? '' : typeof v === 'string' ? v : JSON.stringify(v);
	const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
	return `"${safe.replace(/"/g, '""')}"`;
};

export function toCsv(rows: unknown[][]): string {
	return rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** Streams the filtered audit trail as CSV, newest first (US-06.3). */
export async function* auditCsv(f: AuditFilter): AsyncGenerator<string> {
	const where = auditWhere(f);
	yield '﻿' +
		toCsv([
			[
				'Time',
				'Area',
				'Person',
				'Role',
				'On behalf',
				'Action',
				'Item type',
				'Item',
				'Summary',
				'Before',
				'After',
				'IP address',
				'Device'
			]
		]) +
		'\r\n';
	let lastId = Number.MAX_SAFE_INTEGER;
	for (;;) {
		const rows = await reportDb()
			.select()
			.from(auditLog)
			.where(and(where, sql`${auditLog.id} < ${lastId}`))
			.orderBy(desc(auditLog.id))
			.limit(1000);
		if (rows.length === 0) return;
		yield toCsv(
			rows.map((r) => [
				r.createdAt.toISOString(),
				r.area,
				r.actorLabel,
				r.actorRole,
				r.onBehalf ? 'yes' : '',
				r.action,
				r.itemType,
				r.itemId,
				r.summary,
				r.before,
				r.after,
				r.ip,
				r.userAgent
			])
		) + '\r\n';
		lastId = rows[rows.length - 1].id;
	}
}
