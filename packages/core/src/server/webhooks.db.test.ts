import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { auditLog, webhookDelivery, webhookEndpoint } from './db/schema.ts';
import { SYSTEM_ACTOR } from './audit.ts';
import { defineJob } from './jobs.ts';
import {
	checkWebhookUrl,
	createEndpoint,
	deliverWebhook,
	emitEvent,
	listEndpoints,
	removeEndpoint,
	sendTest,
	signPayload,
	WebhookError
} from './webhooks.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeManufacturer } from '../../tests/helpers/fixtures.ts';

const dns = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('node:dns/promises', () => ({ lookup: dns.lookup }));
// Deliveries use undici's fetch; send it through the global one, which each test replaces.
vi.mock('undici', async (original) => ({
	...(await original<typeof import('undici')>()),
	fetch: (...args: Parameters<typeof fetch>) => globalThis.fetch(...args)
}));

// Capture queued deliveries instead of sending them in-line.
const queued: string[] = [];
defineJob('webhook.deliver', async (data) => {
	queued.push(String(data.deliveryId));
});

const PUBLIC = [{ address: '93.184.216.34', family: 4 }];

describe('webhooks', () => {
	let manufacturerId: string;

	beforeEach(async () => {
		await resetDb();
		queued.length = 0;
		dns.lookup.mockReset();
		dns.lookup.mockResolvedValue(PUBLIC);
		manufacturerId = (await makeManufacturer()).id;
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.unstubAllEnvs();
	});

	const owner = () => ({ manufacturerId });

	it('signs v1=HMAC-SHA256(secret, "<timestamp>.<body>") in hex', () => {
		const body = '{"event":"webhook.test"}';
		const expected = createHmac('sha256', 'whsec_abc').update(`1767225600.${body}`).digest('hex');
		expect(signPayload('whsec_abc', '1767225600', body)).toBe(`v1=${expected}`);
		expect(signPayload('whsec_other', '1767225600', body)).not.toBe(`v1=${expected}`);
	});

	it('accepts a public https address and rejects http, credentials and private networks', async () => {
		await expect(checkWebhookUrl('https://hooks.example.com/deteck')).resolves.toBeInstanceOf(URL);
		await expect(checkWebhookUrl('https://93.184.216.34/hook')).resolves.toBeInstanceOf(URL);
		await expect(checkWebhookUrl('http://hooks.example.com/deteck')).rejects.toThrow(
			'must start with https://'
		);
		await expect(checkWebhookUrl('hooks.example.com')).rejects.toBeInstanceOf(WebhookError);
		await expect(checkWebhookUrl('https://me:pw@hooks.example.com/')).rejects.toThrow(
			'username or password'
		);
		for (const ip of [
			'10.0.0.5',
			'127.0.0.2',
			'0.0.0.0',
			'169.254.169.254',
			'172.16.4.1',
			'172.31.255.1',
			'192.168.1.10',
			'100.64.0.1'
		])
			await expect(checkWebhookUrl(`https://${ip}/hook`), ip).rejects.toThrow('private network');
		await expect(checkWebhookUrl('https://172.32.0.1/hook')).resolves.toBeInstanceOf(URL);
	});

	it('rejects a host name that resolves into a private network, or does not resolve', async () => {
		dns.lookup.mockResolvedValueOnce([...PUBLIC, { address: '10.1.2.3', family: 4 }]);
		await expect(checkWebhookUrl('https://internal.example.com/')).rejects.toThrow(
			'private network'
		);
		dns.lookup.mockResolvedValueOnce([{ address: 'fd12:3456::1', family: 6 }]);
		await expect(checkWebhookUrl('https://v6.example.com/')).rejects.toThrow('private network');
		dns.lookup.mockResolvedValueOnce([{ address: 'fe80::1', family: 6 }]);
		await expect(checkWebhookUrl('https://link.example.com/')).rejects.toThrow('private network');
		dns.lookup.mockRejectedValueOnce(new Error('ENOTFOUND'));
		await expect(checkWebhookUrl('https://nowhere.example.com/')).rejects.toThrow("can't be found");
	});

	it('allows plain http://localhost only outside production', async () => {
		await expect(checkWebhookUrl('http://localhost:3000/hook')).resolves.toBeInstanceOf(URL);
		vi.stubEnv('NODE_ENV', 'production');
		await expect(checkWebhookUrl('http://localhost:3000/hook')).rejects.toThrow(
			'must start with https://'
		);
	});

	// Regression: localhost is refused in production.
	it('rejects https://localhost and https://127.0.0.1 in production', async () => {
		vi.stubEnv('NODE_ENV', 'production');
		await expect(checkWebhookUrl('https://localhost/hook')).rejects.toBeInstanceOf(WebhookError);
		await expect(checkWebhookUrl('https://127.0.0.1/hook')).rejects.toBeInstanceOf(WebhookError);
	});

	// Regression: private IPv4 written as IPv6 is refused too.
	it('rejects IPv4-mapped IPv6 answers in link-local and 172.16/12 ranges', async () => {
		dns.lookup.mockResolvedValueOnce([{ address: '::ffff:169.254.169.254', family: 6 }]);
		await expect(checkWebhookUrl('https://metadata.example.com/')).rejects.toThrow(
			'private network'
		);
		dns.lookup.mockResolvedValueOnce([{ address: '::ffff:172.16.0.1', family: 6 }]);
		await expect(checkWebhookUrl('https://mapped.example.com/')).rejects.toThrow('private network');
	});

	it('creates, lists and removes endpoints for their owner only', async () => {
		const row = await createEndpoint(SYSTEM_ACTOR, owner(), {
			url: 'https://hooks.example.com/deteck',
			events: ['batch.status_changed', 'not.an.event']
		});
		expect(row.secret).toMatch(/^whsec_/);
		expect(row.events).toEqual(['batch.status_changed']);
		expect(row.manufacturerId).toBe(manufacturerId);
		await expect(
			createEndpoint(SYSTEM_ACTOR, owner(), {
				url: 'https://hooks.example.com/deteck',
				events: ['nope']
			})
		).rejects.toThrow('Choose at least one event.');

		await sendTest(owner(), row.id);
		const listed = await listEndpoints(owner());
		expect(listed.map((e) => e.id)).toEqual([row.id]);
		expect(listed[0].deliveries.map((d) => d.event)).toEqual(['webhook.test']);

		const other = { manufacturerId: (await makeManufacturer({ companyName: 'Other' })).id };
		expect(await listEndpoints(other)).toEqual([]);
		await expect(removeEndpoint(SYSTEM_ACTOR, other, row.id)).rejects.toThrow('Webhook not found.');

		await removeEndpoint(SYSTEM_ACTOR, owner(), row.id);
		expect(await listEndpoints(owner())).toEqual([]);
		const [after] = await ctx()
			.db.select()
			.from(webhookEndpoint)
			.where(eq(webhookEndpoint.id, row.id));
		expect(after).toMatchObject({ active: false, disabledReason: 'Removed' });
		expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'webhook_remove'))).toBe(1);
	});

	it('queues an event only for active endpoints subscribed to it', async () => {
		const recalls = await createEndpoint(SYSTEM_ACTOR, owner(), {
			url: 'https://hooks.example.com/a',
			events: ['batch.status_changed']
		});
		await createEndpoint(SYSTEM_ACTOR, owner(), {
			url: 'https://hooks.example.com/b',
			events: ['import.completed']
		});
		const removed = await createEndpoint(SYSTEM_ACTOR, owner(), {
			url: 'https://hooks.example.com/c',
			events: ['batch.status_changed']
		});
		await removeEndpoint(SYSTEM_ACTOR, owner(), removed.id);
		const other = await makeManufacturer({ companyName: 'Other' });
		await createEndpoint(
			SYSTEM_ACTOR,
			{ manufacturerId: other.id },
			{ url: 'https://hooks.example.com/d', events: ['batch.status_changed'] }
		);

		await emitEvent(manufacturerId, 'batch.status_changed', { lot: 'NB-2611' });
		const rows = await ctx().db.select().from(webhookDelivery);
		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({ endpointId: recalls.id, event: 'batch.status_changed' });
		expect(rows[0].payload).toMatchObject({
			id: rows[0].id,
			event: 'batch.status_changed',
			data: { lot: 'NB-2611' }
		});
		expect(queued).toEqual([rows[0].id]);

		await emitEvent(null, 'batch.status_changed', {});
		await emitEvent(owner(), 'check.unusual', {});
		expect(await ctx().db.$count(webhookDelivery)).toBe(1);
	});

	describe('delivery', () => {
		async function oneDelivery() {
			const endpoint = await createEndpoint(SYSTEM_ACTOR, owner(), {
				url: 'https://hooks.example.com/a',
				events: ['batch.status_changed']
			});
			await emitEvent(manufacturerId, 'batch.status_changed', { lot: 'NB-2611' });
			const [delivery] = await ctx().db.select().from(webhookDelivery);
			return { endpoint, delivery };
		}

		const load = async (id: string) =>
			(await ctx().db.select().from(webhookDelivery).where(eq(webhookDelivery.id, id)))[0];

		it('posts a signed body and marks it delivered on 2xx', async () => {
			const { endpoint, delivery } = await oneDelivery();
			const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
			vi.stubGlobal('fetch', fetchMock);
			await deliverWebhook(delivery.id);

			expect(fetchMock).toHaveBeenCalledTimes(1);
			const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
			expect(url).toBe(endpoint.url);
			const headers = init.headers as Record<string, string>;
			expect(headers['x-deteck-event']).toBe('batch.status_changed');
			expect(headers['x-deteck-delivery']).toBe(delivery.id);
			expect(headers['x-deteck-signature']).toBe(
				signPayload(endpoint.secret, headers['x-deteck-timestamp'], String(init.body))
			);
			expect(JSON.parse(String(init.body))).toEqual(delivery.payload);

			const done = await load(delivery.id);
			expect(done).toMatchObject({ status: 'delivered', attempts: 1, lastStatusCode: 204 });
			expect(done.deliveredAt).toBeInstanceOf(Date);

			await deliverWebhook(delivery.id);
			expect(fetchMock).toHaveBeenCalledTimes(1);
		});

		it('throws so the queue retries on a non-2xx answer, and gives up after the last attempt', async () => {
			const { delivery } = await oneDelivery();
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => new Response('nope', { status: 500 }))
			);
			await expect(deliverWebhook(delivery.id)).rejects.toThrow('failed');
			expect(await load(delivery.id)).toMatchObject({
				status: 'retrying',
				attempts: 1,
				lastStatusCode: 500,
				lastError: 'The receiver answered 500.',
				deliveredAt: null
			});

			await ctx()
				.db.update(webhookDelivery)
				.set({ attempts: 8 })
				.where(eq(webhookDelivery.id, delivery.id));
			await expect(deliverWebhook(delivery.id)).resolves.toBeUndefined();
			expect(await load(delivery.id)).toMatchObject({ status: 'failed', attempts: 9 });
		});

		it('records a network error and skips removed endpoints', async () => {
			const { endpoint, delivery } = await oneDelivery();
			vi.stubGlobal(
				'fetch',
				vi.fn(async () => {
					throw new Error('connect ECONNREFUSED');
				})
			);
			await expect(deliverWebhook(delivery.id)).rejects.toThrow('ECONNREFUSED');
			expect(await load(delivery.id)).toMatchObject({
				status: 'retrying',
				lastStatusCode: null,
				lastError: 'connect ECONNREFUSED'
			});

			await removeEndpoint(SYSTEM_ACTOR, owner(), endpoint.id);
			const fetchMock = vi.fn();
			vi.stubGlobal('fetch', fetchMock);
			await deliverWebhook(delivery.id);
			expect(fetchMock).not.toHaveBeenCalled();
		});
	});
});
