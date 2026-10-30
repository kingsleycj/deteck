import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

import { fileURLToPath } from 'node:url';

const rootEnv = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(rootEnv)) process.loadEnvFile(rootEnv);

const PORT = 4174;
const e2eDatabase =
	process.env.E2E_DATABASE_URL ?? 'postgres://deteck:deteck@localhost:5435/deteck_e2e';

export default defineConfig({
	testDir: 'tests/e2e',
	testMatch: '**/*.e2e.ts',
	fullyParallel: false,
	workers: 1,
	timeout: 60_000,
	globalSetup: './tests/e2e/global-setup.ts',
	use: {
		baseURL: `http://localhost:${PORT}`,
		// adapter-node trusts this header (PROTOCOL_HEADER) so CSRF checks pass over plain HTTP.
		extraHTTPHeaders: { 'x-forwarded-proto': 'http' },
		trace: 'retain-on-failure'
	},
	projects: [
		{
			name: 'mobile',
			use: { ...devices['Pixel 5'] },
			testMatch: ['**/public.e2e.ts', '**/accessibility.e2e.ts', '**/scan-camera.e2e.ts']
		},
		{ name: 'desktop', use: { viewport: { width: 1440, height: 900 } } }
	],
	webServer: {
		// The database is migrated before the server starts (it checks its keys against it); global
		// setup then rebuilds it with test data. CI has built the app already: E2E_SKIP_BUILD=1.
		command: `${process.env.E2E_SKIP_BUILD ? '' : 'pnpm build && '}node ../../packages/core/scripts/migrate.ts && node build/index.js`,
		port: PORT,
		reuseExistingServer: false,
		timeout: 180_000,
		env: {
			...(process.env as Record<string, string>),
			DATABASE_URL: e2eDatabase,
			PORT: String(PORT),
			ORIGIN: `http://localhost:${PORT}`,
			PROTOCOL_HEADER: 'x-forwarded-proto',
			EMAIL_DRIVER: 'log',
			STORAGE_DRIVER: 'local',
			STORAGE_LOCAL_DIR: '.data/e2e-uploads',
			FEATURE_PACKAGING_AI: 'public',
			// Switched off for now in the product, but kept working: the tests use it.
			FEATURE_REPORTS: 'on',
			ANTHROPIC_API_KEY: '',
			RATE_LIMIT_DEVICE_PER_MINUTE: '100',
			RATE_LIMIT_DEVICE_PER_HOUR: '1000',
			RATE_LIMIT_IP_PER_HOUR: '5000'
		}
	}
});
