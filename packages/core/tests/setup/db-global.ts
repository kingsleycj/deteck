import { existsSync } from 'node:fs';
import { runMigrations } from '../../src/server/db/migrate.ts';
import { fileURLToPath } from 'node:url';

const rootEnv = fileURLToPath(new URL('../../../../.env', import.meta.url));

/** Rebuilds the test database from the migrations once per test run. */
export default async function setup() {
	if (!process.env.TEST_DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv);
	const url = process.env.TEST_DATABASE_URL;
	if (!url) throw new Error('TEST_DATABASE_URL is not set (see .env.example)');
	await runMigrations(url, { reset: true });
}
