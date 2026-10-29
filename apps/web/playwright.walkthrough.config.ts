import { defineConfig } from '@playwright/test';
import base from './playwright.config.ts';

/** `pnpm screenshots`: the e2e server and demo data, driven through every flow for the walkthrough. */
export default defineConfig({
	...base,
	testDir: 'tests/walkthrough',
	testMatch: '**/*.capture.ts',
	timeout: 600_000,
	projects: [{ name: 'capture', use: { viewport: { width: 1280, height: 800 } } }]
});
