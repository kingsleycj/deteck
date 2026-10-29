import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.db.test.ts']
				}
			},
			{
				test: {
					name: 'db',
					environment: 'node',
					include: ['src/**/*.db.test.ts'],
					globalSetup: ['./tests/setup/db-global.ts'],
					setupFiles: ['./tests/setup/db-context.ts'],
					fileParallelism: false,
					testTimeout: 30_000,
					hookTimeout: 60_000
				}
			}
		]
	}
});
