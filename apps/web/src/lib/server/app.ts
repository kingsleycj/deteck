/**
 * SvelteKit-only bootstrap: reads the validated environment, creates the
 * database client and Better Auth, and initialises the shared server context.
 * Domain modules never import this file, so they stay usable from scripts.
 */
import { building, dev } from '$app/env';
import * as env from '$app/env/private';
import { getRequestEvent } from '$app/server';
import { createAuth } from '@deteck/core/server/auth-factory.ts';
import { configFromEnv } from '@deteck/core/server/config.ts';
import { initServerContext } from '@deteck/core/server/context.ts';
import { createDb, type Db } from '@deteck/core/server/db/client.ts';

// One config builder for the web app, the worker, scripts and tests ($app/env/private has
// already validated every variable against src/env.ts).
const config = configFromEnv({ ...env }, { building });

// In development every code change reloads this file: reuse the open connections instead of
// opening new ones each time until Postgres says "too many clients".
const kept = globalThis as typeof globalThis & { __deteckPools?: { db: Db; reportDb: Db } };
const pools = (dev && kept.__deteckPools) || {
	db: createDb(env.DATABASE_URL, { max: config.databasePoolMax }),
	// Console and workspace summaries get their own two connections, each query capped at 15 s.
	reportDb: createDb(env.DATABASE_URL, { max: 2, statementTimeoutMs: 15_000 })
};
if (dev) kept.__deteckPools = pools;
const { db, reportDb } = pools;

export const serverContext = initServerContext({ db, config, reportDb });

export const auth = createAuth({
	db,
	baseURL: config.origin,
	secret: config.authSecret,
	getRequestEvent
});
