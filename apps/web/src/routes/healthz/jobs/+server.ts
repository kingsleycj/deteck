import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { ctx } from '@deteck/core/server/context.ts';

/**
 * For the uptime monitor: answers 503 when background jobs (imports, emails, alerts, webhooks)
 * have been waiting more than 10 minutes, which means the worker is down or stuck. /healthz only
 * says the website and database are up.
 */
export const GET: RequestHandler = async () => {
	try {
		const [row] = await ctx().db.execute<{ waiting: number; oldest_minutes: number | null }>(sql`
			select count(*)::int as waiting,
				floor(extract(epoch from now() - min(start_after)) / 60)::int as oldest_minutes
			from pgboss.job
			where state in ('created', 'retry') and start_after < now() - interval '10 minutes'`);
		if (row.waiting > 0)
			return new Response(
				`${row.waiting} job(s) waiting for over ${row.oldest_minutes} minutes: is the worker running?`,
				{ status: 503, headers: { 'cache-control': 'no-store' } }
			);
		return new Response('ok', { headers: { 'cache-control': 'no-store' } });
	} catch {
		return new Response('job queue unavailable', {
			status: 503,
			headers: { 'cache-control': 'no-store' }
		});
	}
};
