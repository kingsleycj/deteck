import { and, eq, gt, lt, sql } from 'drizzle-orm';
import { ctx } from './context.ts';
import { rateLimit } from './db/schema.ts';

export interface Limit {
	key: string;
	windowSeconds: number;
	max: number;
}

export type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/**
 * Fixed-window counters in Postgres. Counts every limit in one round trip and
 * fails if any is over. Windows are aligned to the epoch, so all app instances agree.
 */
/** `cost`: how much this request uses (a delivery of 300 codes costs 300). */
export async function consume(limits: Limit[], now = new Date(), cost = 1): Promise<LimitResult> {
	if (limits.length === 0) return { ok: true };
	const rows = limits.map((l) => {
		const ms = l.windowSeconds * 1000;
		return { ...l, windowStart: new Date(Math.floor(now.getTime() / ms) * ms) };
	});
	const counts = await ctx()
		.db.insert(rateLimit)
		.values(rows.map((r) => ({ key: r.key, windowStart: r.windowStart, count: cost })))
		.onConflictDoUpdate({
			target: [rateLimit.key, rateLimit.windowStart],
			set: { count: sql`${rateLimit.count} + ${cost}` }
		})
		.returning({ key: rateLimit.key, count: rateLimit.count });

	let retryAfter = 0;
	for (const r of rows) {
		const count = counts.find((c) => c.key === r.key)?.count ?? 0;
		if (count > r.max) {
			const windowEnd = r.windowStart.getTime() + r.windowSeconds * 1000;
			retryAfter = Math.max(retryAfter, Math.ceil((windowEnd - now.getTime()) / 1000));
		}
	}
	return retryAfter > 0 ? { ok: false, retryAfterSeconds: retryAfter } : { ok: true };
}

/** Current count for a fixed window, without incrementing it. */
export async function currentCount(
	key: string,
	windowSeconds: number,
	now = new Date()
): Promise<number> {
	const ms = windowSeconds * 1000;
	const windowStart = new Date(Math.floor(now.getTime() / ms) * ms);
	const [row] = await ctx()
		.db.select({ count: rateLimit.count })
		.from(rateLimit)
		.where(and(eq(rateLimit.key, key), eq(rateLimit.windowStart, windowStart)))
		.limit(1);
	return row?.count ?? 0;
}

/**
 * Count in the current and the previous window together, so a burst that straddles a window
 * boundary still counts in full (a simple sliding window).
 */
export async function recentCount(
	key: string,
	windowSeconds: number,
	now = new Date()
): Promise<number> {
	const ms = windowSeconds * 1000;
	return (
		(await currentCount(key, windowSeconds, now)) +
		(await currentCount(key, windowSeconds, new Date(now.getTime() - ms)))
	);
}

/** Starts a lock that lasts exactly `seconds` from now (not aligned to a window). */
export async function setLock(key: string, now = new Date()) {
	await ctx()
		.db.insert(rateLimit)
		.values({ key, windowStart: now, count: 1 })
		.onConflictDoNothing();
}

/** Whether a lock set with `setLock` in the last `seconds` is still running. */
export async function isLocked(key: string, seconds: number, now = new Date()): Promise<boolean> {
	const [row] = await ctx()
		.db.select({ key: rateLimit.key })
		.from(rateLimit)
		.where(
			and(
				eq(rateLimit.key, key),
				gt(rateLimit.windowStart, new Date(now.getTime() - seconds * 1000))
			)
		)
		.limit(1);
	return Boolean(row);
}

/** Forgets every window of a counter, e.g. failed sign-ins after a successful one. */
export async function clearCounter(key: string) {
	await ctx().db.delete(rateLimit).where(eq(rateLimit.key, key));
}

/** Deletes windows older than a day (run by the maintenance job). */
export async function purgeRateLimits(now = new Date()) {
	await ctx()
		.db.delete(rateLimit)
		.where(lt(rateLimit.windowStart, new Date(now.getTime() - 24 * 3600 * 1000)));
}

/**
 * The address limits count. One person on IPv6 usually controls a whole /64 network (billions of
 * addresses), so IPv6 is counted per /64; IPv4 per address.
 */
export function ipKey(ip: string): string {
	const address = ip.split('%')[0].toLowerCase();
	if (!address.includes(':')) return address;
	const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
	if (mapped) return mapped[1];
	const [head, tail = ''] = address.split('::');
	const front = head ? head.split(':') : [];
	const back = tail ? tail.split(':') : [];
	const groups = address.includes('::')
		? [...front, ...Array(Math.max(0, 8 - front.length - back.length)).fill('0'), ...back]
		: front;
	return `${groups
		.slice(0, 4)
		.map((g) => g.replace(/^0+(?=.)/, '') || '0')
		.join(':')}::/64`;
}

/**
 * Limits for one public check (PRD: per device and per IP; decisions-for-review R-12). Someone who
 * passed the "are you human?" check today gets five times the device limits; the IP limit stays.
 * A request with no device cookie (a new visitor, or a script that drops cookies) also counts
 * against a shared "new devices" allowance for its address, so clearing cookies doesn't reset
 * the limits.
 */
export function checkLimits(
	deviceId: string,
	ip: string,
	human = false,
	newDevice = false
): Limit[] {
	const { rateLimits } = ctx().config;
	const factor = human ? 5 : 1;
	const address = ipKey(ip);
	return [
		{ key: `chk:d:${deviceId}:m`, windowSeconds: 60, max: rateLimits.devicePerMinute * factor },
		{ key: `chk:d:${deviceId}:h`, windowSeconds: 3600, max: rateLimits.devicePerHour * factor },
		{
			key: `chk:ip:${address}:h`,
			windowSeconds: 3600,
			max: rateLimits.ipPerHour * (human ? 2 : 1)
		},
		...(newDevice
			? [
					{
						key: `chk:new:${address}:m`,
						windowSeconds: 60,
						max: rateLimits.devicePerMinute * 6
					}
				]
			: [])
	];
}
