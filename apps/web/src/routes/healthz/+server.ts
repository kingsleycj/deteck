import { sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { ctx } from '@deteck/core/server/context.ts';

/** Render health check and uptime monitor target: the app is up and can reach Postgres. */
export const GET: RequestHandler = async () => {
	try {
		await ctx().db.execute(sql`select 1`);
		return new Response('ok', { headers: { 'cache-control': 'no-store' } });
	} catch {
		return new Response('database unavailable', {
			status: 503,
			headers: { 'cache-control': 'no-store' }
		});
	}
};
