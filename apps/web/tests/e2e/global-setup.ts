import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { configFromEnv } from '@deteck/core/server/config.ts';
import { initServerContext } from '@deteck/core/server/context.ts';
import { createDb } from '@deteck/core/server/db/client.ts';
import { runMigrations } from '@deteck/core/server/db/migrate.ts';
import { inviteStaff } from '@deteck/core/server/team.ts';
import { SYSTEM_ACTOR } from '@deteck/core/server/audit.ts';

/** Rebuilds the e2e database, seeds demo data and creates a staff invite. */
export default async function globalSetup() {
	const rootEnv = fileURLToPath(new URL('../../../../.env', import.meta.url));
	if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);
	const url = process.env.E2E_DATABASE_URL!;
	await runMigrations(url, { reset: true });
	execFileSync(
		process.execPath,
		[fileURLToPath(import.meta.resolve('@deteck/core/scripts/seed.ts')), '--packs', '50'],
		{
			env: { ...process.env, DATABASE_URL: url },
			stdio: 'ignore'
		}
	);
	const db = createDb(url, { max: 1 });
	initServerContext({
		db,
		config: configFromEnv({ ...process.env, ORIGIN: 'http://localhost:4174', EMAIL_DRIVER: 'log' })
	});
	const { url: inviteUrl } = await inviteStaff(
		{ ...SYSTEM_ACTOR, label: 'E2E setup' },
		{ email: 'ada@deteck.test', name: 'Ada Okafor', role: 'admin' }
	);
	await db.$close();
	writeFileSync(
		'tests/e2e/.state.json',
		JSON.stringify({ staffInvite: inviteUrl.replace('http://localhost:4174', '') })
	);
}
