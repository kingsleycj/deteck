import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll } from 'vitest';
import { configFromEnv } from '../../src/server/config.ts';
import { initServerContext } from '../../src/server/context.ts';
import { createDb } from '../../src/server/db/client.ts';
import { fileURLToPath } from 'node:url';

const rootEnv = fileURLToPath(new URL('../../../../.env', import.meta.url));

if (!process.env.TEST_DATABASE_URL && existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const db = createDb(process.env.TEST_DATABASE_URL!, { max: 4 });

initServerContext({
	db,
	config: configFromEnv({
		...process.env,
		EMAIL_DRIVER: 'log',
		STORAGE_DRIVER: 'local',
		STORAGE_LOCAL_DIR: mkdtempSync(join(tmpdir(), 'deteck-test-')),
		FEATURE_PACKAGING_AI: 'public',
		ANTHROPIC_API_KEY: ''
	})
});

afterAll(async () => {
	await db.$close();
});
