import { beforeEach, describe, expect, it } from 'vitest';
import { createHmac } from 'node:crypto';
import type { ServerConfig } from './config.ts';
import { initServerContext } from './context.ts';
import type { Db } from './db/client.ts';
import { normalisePhone, verifyMetaSignature, whatsappEnabled } from './whatsapp.ts';

const whatsapp: NonNullable<ServerConfig['whatsapp']> = {
	accessToken: 'token',
	phoneNumberId: '123',
	apiVersion: 'v23.0',
	appSecret: 'meta-app-secret',
	templates: { subscribed: 's', recall: 'r', language: 'en' }
};

const useConfig = (config: Partial<ServerConfig>) =>
	initServerContext({ db: {} as Db, config: config as ServerConfig });

describe('normalisePhone', () => {
	it('turns Nigerian numbers into international form without the plus', () => {
		expect(normalisePhone('0803 123 4567')).toBe('2348031234567');
		expect(normalisePhone('0803-123-4567')).toBe('2348031234567');
		expect(normalisePhone('+234 803 123 4567')).toBe('2348031234567');
		expect(normalisePhone('2348031234567')).toBe('2348031234567');
		expect(normalisePhone('+44 20 7946 0958')).toBe('442079460958');
	});

	it('returns null for junk', () => {
		for (const junk of ['', 'call me', '12345', '0803', '+', '08031234567890123', '0803+1234567'])
			expect(normalisePhone(junk), junk).toBeNull();
	});
});

describe('verifyMetaSignature', () => {
	beforeEach(() => useConfig({ whatsapp }));

	const sign = (body: string, secret = 'meta-app-secret') =>
		`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;

	it('accepts the X-Hub-Signature-256 Meta sends', () => {
		const body = '{"entry":[]}';
		expect(verifyMetaSignature(body, sign(body))).toBe(true);
		expect(whatsappEnabled()).toBe(true);
	});

	it('rejects a wrong secret, an altered body and malformed headers', () => {
		const body = '{"entry":[]}';
		expect(verifyMetaSignature(body, sign(body, 'other'))).toBe(false);
		expect(verifyMetaSignature(`${body} `, sign(body))).toBe(false);
		expect(verifyMetaSignature(body, null)).toBe(false);
		expect(verifyMetaSignature(body, sign(body).replace('sha256=', 'sha1='))).toBe(false);
		expect(verifyMetaSignature(body, `${sign(body)}00`)).toBe(false);
	});

	it('rejects everything when no app secret is configured', () => {
		const body = '{"entry":[]}';
		useConfig({ whatsapp: { ...whatsapp, appSecret: undefined } });
		expect(verifyMetaSignature(body, sign(body))).toBe(false);
		useConfig({});
		expect(verifyMetaSignature(body, sign(body))).toBe(false);
		expect(whatsappEnabled()).toBe(false);
	});
});
