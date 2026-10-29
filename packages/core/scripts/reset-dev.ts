// Wipes the LOCAL database and rebuilds it: migrations, demo data and demo accounts.
//   pnpm db:reset --yes
// Everything in the local database is deleted. It refuses to run against a non-local database.
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';
import { runMigrations } from '../src/server/db/migrate.ts';

const url = process.env.DATABASE_URL ?? '';
const host = URL.canParse(url) ? new URL(url).hostname : '';
if (!['localhost', '127.0.0.1'].includes(host)) {
	console.error('db:reset only runs against a local database (localhost).');
	process.exit(1);
}
if (!process.argv.includes('--yes')) {
	console.error(
		`This deletes everything in ${new URL(url).pathname.slice(1)} on ${host}. Run again with --yes to go ahead.`
	);
	process.exit(1);
}

// The job queue lives in its own schema; old jobs shouldn't survive a reset.
const client = postgres(url, { max: 1, onnotice: () => {} });
await client.unsafe('DROP SCHEMA IF EXISTS pgboss CASCADE');
await client.end({ timeout: 5 });
await runMigrations(url, { reset: true });
console.info('Database rebuilt from the migrations.');

rmSync(
	process.env.DEMO_ACCOUNTS_FILE ??
		fileURLToPath(new URL('../../../.data/demo-accounts.json', import.meta.url)),
	{ force: true }
);
const run = (script: string) =>
	execFileSync(process.execPath, [fileURLToPath(new URL(script, import.meta.url))], {
		stdio: 'inherit',
		env: process.env
	});
run('./seed.ts');
run('./demo-accounts.ts');
