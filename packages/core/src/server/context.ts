import type { ServerConfig } from './config.ts';
import type { Db } from './db/client.ts';

/**
 * The database and configuration every server module uses. SvelteKit sets it
 * up in hooks.server.ts; scripts and tests call initServerContext themselves.
 * Keeping $app imports out of domain code lets the same code run everywhere.
 */
export interface ServerContext {
	db: Db;
	config: ServerConfig;
	/**
	 * A small pool with a query time limit for console and workspace summaries (counts, charts).
	 * Slow reports then can't take the connections public checks need. Falls back to `db`.
	 */
	reportDb?: Db;
}

let current: ServerContext | undefined;

export function initServerContext(context: ServerContext): ServerContext {
	current = context;
	return context;
}

export function ctx(): ServerContext {
	if (!current) throw new Error('Server context has not been initialised');
	return current;
}

/** The database for heavy read-only summaries (see `reportDb`). */
export function reportDb(): Db {
	const c = ctx();
	return c.reportDb ?? c.db;
}
