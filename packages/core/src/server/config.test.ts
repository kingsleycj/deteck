import { describe, expect, it } from 'vitest';
import { configFromEnv } from './config.ts';

const live = {
	NODE_ENV: 'production',
	ORIGIN: 'https://deteck.example',
	DATABASE_URL: 'postgres://x@localhost/x',
	BETTER_AUTH_SECRET: 'a'.repeat(32),
	SERIAL_HMAC_KEY: 'b'.repeat(32),
	DEVICE_HASH_SECRET: 'c'.repeat(32),
	STORAGE_DRIVER: 's3',
	S3_BUCKET: 'files',
	S3_ACCESS_KEY_ID: 'id',
	S3_SECRET_ACCESS_KEY: 'secret',
	EMAIL_DRIVER: 'resend',
	RESEND_API_KEY: 're_test',
	EMAIL_FROM: 'DETECK <no-reply@deteck.example>'
};

describe('production settings', () => {
	it('starts with a complete set', () => {
		expect(configFromEnv(live).production).toBe(true);
	});

	it('refuses a client-address header without the edge secret that proves it', () => {
		expect(() => configFromEnv({ ...live, ADDRESS_HEADER: 'cf-connecting-ip' })).toThrow(
			/EDGE_SECRET/
		);
		expect(() =>
			configFromEnv({ ...live, ADDRESS_HEADER: 'cf-connecting-ip', EDGE_SECRET: 'short' })
		).toThrow(/EDGE_SECRET/);
		expect(
			configFromEnv({ ...live, ADDRESS_HEADER: 'cf-connecting-ip', EDGE_SECRET: 'e'.repeat(32) })
				.edgeSecret
		).toHaveLength(32);
	});

	it('refuses a guessable pilot code while the pilot is on', () => {
		expect(() =>
			configFromEnv({
				...live,
				FEATURE_PACKAGING_AI: 'pilot',
				ANTHROPIC_API_KEY: 'sk-test',
				PILOT_ACCESS_CODE: 'test'
			})
		).toThrow(/PILOT_ACCESS_CODE/);
	});
});
