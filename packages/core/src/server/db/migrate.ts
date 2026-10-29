import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const migrationsFolder = fileURLToPath(new URL('../../../drizzle', import.meta.url));

/** Applies pending SQL migrations from ./drizzle. Safe to run on every deploy. */
export async function runMigrations(url: string, options: { reset?: boolean } = {}) {
	const client = postgres(url, { max: 1, onnotice: () => {} });
	try {
		if (options.reset) {
			await client.unsafe(
				'DROP SCHEMA IF EXISTS public CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; CREATE SCHEMA public;'
			);
		}
		// The website and the worker may both migrate during one deploy: one at a time.
		await client`select pg_advisory_lock(4243)`;
		try {
			await migrate(drizzle(client), { migrationsFolder });
		} finally {
			await client`select pg_advisory_unlock(4243)`;
		}
	} finally {
		await client.end({ timeout: 5 });
	}
}
