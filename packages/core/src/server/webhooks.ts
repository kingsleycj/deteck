/**
 * Webhooks: DETECK calls a manufacturer's or business's own system when something happens to
 * their data. Each delivery is signed so the receiver can check it came from DETECK, and failed
 * deliveries are retried with a growing delay.
 */
import { createHmac } from 'node:crypto';
import { lookup as dnsLookup, type LookupAddress, type LookupOptions } from 'node:dns';
import { lookup } from 'node:dns/promises';
// The Agent and fetch come from the same undici, so the connection guard always applies.
import { Agent, fetch } from 'undici';
import { BlockList, isIP } from 'node:net';
import { and, desc, eq, sql } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { ctx } from './context.ts';
import { randomId } from './crypto.ts';
import { webhookDelivery, webhookEndpoint } from './db/schema.ts';
import { enqueue } from './jobs.ts';
import { consume } from './rate-limit.ts';
import { companyActive, NOT_ACTIVE_MESSAGE, type CompanyRef } from './owner-status.ts';

/** Every event DETECK can send, with the wording shown when choosing them. */
export const WEBHOOK_EVENTS = {
	'import.completed': 'An import finished',
	'golive.decided': 'DETECK approved your data to go live, or sent it back',
	'product.reviewed': 'DETECK approved or rejected a new drug',
	'batch.status_changed': 'A batch was recalled, withdrawn or reactivated',
	'check.unusual': 'One of your serials was checked unusually often',
	'report.received': 'Someone reported a suspected fake of one of your drugs',
	'receipt.recorded': 'A pharmacy or distributor confirmed it received your packs',
	'record.corrected':
		'DETECK corrected one of your records (batch details, a serial or a supply chain record)'
} as const;
export type WebhookEvent = keyof typeof WEBHOOK_EVENTS | 'webhook.test';

/** Which owner an endpoint belongs to. Exactly one is set. */
export type WebhookOwner = { manufacturerId: string } | { businessId: string };

export class WebhookError extends Error {}

const ATTEMPTS = 8;
const TIMEOUT_MS = 10_000;

function ownerWhere(owner: WebhookOwner) {
	return 'manufacturerId' in owner
		? eq(webhookEndpoint.manufacturerId, owner.manufacturerId)
		: eq(webhookEndpoint.businessId, owner.businessId);
}

/**
 * Local test receivers (http://localhost) are allowed only on a developer's machine: never when
 * NODE_ENV is production, and only while DETECK itself runs on localhost.
 */
function allowLocalWebhooks() {
	return (
		process.env.NODE_ENV !== 'production' &&
		/^http:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(ctx().config.origin)
	);
}

/** Connects only to public addresses, checking every address DNS returns at connection time. */
const publicOnly = new Agent({
	connect: {
		lookup(hostname: string, options: LookupOptions, callback: LookupCallback) {
			dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
				const list = (addresses ?? []) as LookupAddress[];
				if (error) return callback(error, '', 0);
				if (list.length === 0 || list.some((a) => isPrivateAddress(a.address)))
					return callback(new Error('That address points into a private network.'), '', 0);
				if (options.all) return (callback as unknown as AllCallback)(null, list);
				callback(null, list[0].address, list[0].family);
			});
		}
	}
});
type LookupCallback = (error: Error | null, address: string, family: number) => void;
type AllCallback = (error: Error | null, addresses: LookupAddress[]) => void;

/** Addresses webhooks may never reach: private, loopback, link-local, reserved and multicast. */
const BLOCKED = new BlockList();
for (const [net, prefix] of [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16],
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.0.2.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['198.51.100.0', 24],
	['203.0.113.0', 24],
	['224.0.0.0', 4],
	['240.0.0.0', 4]
] as const)
	BLOCKED.addSubnet(net, prefix, 'ipv4');
for (const [net, prefix] of [
	// IPv4-compatible (::a.b.c.d) addresses, including :: and ::1.
	['::', 96],
	// NAT64 prefixes that can lead to private IPv4 networks.
	['64:ff9b:1::', 48],
	// IPv4-translated (::ffff:0:a.b.c.d), 6to4 (2002::/16) and Teredo (2001::/32) can all carry
	// a private IPv4 address inside.
	['::ffff:0:0:0', 96],
	['2002::', 16],
	['2001::', 32],
	['100::', 64],
	['2001:db8::', 32],
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8]
] as const)
	BLOCKED.addSubnet(net, prefix, 'ipv6');

/** IPv4 written inside IPv6 (::ffff:10.0.0.1, ::ffff:a00:1, 64:ff9b::a00:1), as plain IPv4. */
function embeddedIpv4(address: string): string | null {
	const a = address.toLowerCase();
	const dotted = /^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/.exec(a);
	if (dotted) return dotted[1];
	const hex = /^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(a);
	if (!hex) return null;
	const [hi, lo] = [parseInt(hex[1], 16), parseInt(hex[2], 16)];
	return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
}

export function isPrivateAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) return BLOCKED.check(address, 'ipv4');
	if (family !== 6) return true;
	const v4 = embeddedIpv4(address);
	return v4 ? BLOCKED.check(v4, 'ipv4') : BLOCKED.check(address, 'ipv6');
}

/**
 * Webhook addresses must be HTTPS and must not point into a private network, so nobody can use
 * DETECK to reach internal systems. Outside production, http://localhost is allowed for testing.
 */
export async function checkWebhookUrl(raw: string): Promise<URL> {
	let url: URL;
	try {
		url = new URL(raw.trim());
	} catch {
		throw new WebhookError('Enter a full web address, starting with https://');
	}
	// IPv6 addresses keep their brackets in URL.hostname.
	const host = url.hostname.replace(/^\[(.*)\]$/, '$1');
	const devLocal = allowLocalWebhooks() && ['localhost', '127.0.0.1', '::1'].includes(host);
	if (url.protocol !== 'https:' && !devLocal)
		throw new WebhookError('Webhook addresses must start with https://');
	if (url.username || url.password)
		throw new WebhookError("Don't put a username or password in the address.");
	if (devLocal) return url;
	// "localhost" names this machine whatever DNS says (RFC 6761).
	if (host === 'localhost' || host.endsWith('.localhost'))
		throw new WebhookError('That address points into a private network.');
	const addresses = isIP(host)
		? [{ address: host }]
		: await lookup(host, { all: true }).catch(() => {
				throw new WebhookError(`${host} can't be found.`);
			});
	if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address)))
		throw new WebhookError('That address points into a private network.');
	return url;
}

/** Webhooks per company. */
export const MAX_ENDPOINTS = 5;

export async function createEndpoint(
	actor: Actor,
	owner: WebhookOwner,
	input: { url: string; events: string[] },
	auditManufacturerId?: string
) {
	const company: CompanyRef =
		'manufacturerId' in owner
			? { type: 'manufacturer', manufacturerId: owner.manufacturerId }
			: { type: 'business', businessId: owner.businessId };
	if (!(await companyActive(company))) throw new WebhookError(NOT_ACTIVE_MESSAGE);
	// Every event goes to every endpoint, with retries: a few are plenty, and a cap stops one
	// account turning DETECK into a flood aimed at someone else's server.
	const existing = await ctx().db.$count(
		webhookEndpoint,
		and(ownerWhere(owner), eq(webhookEndpoint.active, true))
	);
	if (existing >= MAX_ENDPOINTS)
		throw new WebhookError(
			`You can have up to ${MAX_ENDPOINTS} webhooks. Remove one you no longer use first.`
		);
	const url = await checkWebhookUrl(input.url);
	const events = input.events.filter((e) => e in WEBHOOK_EVENTS);
	if (events.length === 0) throw new WebhookError('Choose at least one event.');
	const secret = `whsec_${randomId(24)}`;
	const [row] = await ctx()
		.db.insert(webhookEndpoint)
		.values({ ...owner, url: url.toString(), secret, events, createdBy: actor.userId })
		.returning();
	await audit(actor, {
		area: 'Manufacturer board',
		action: 'webhook_create',
		itemType: 'webhook',
		itemId: row.id,
		manufacturerId: auditManufacturerId,
		summary: `Added a webhook to ${url.host} for ${events.join(', ')}`
	});
	return row;
}

export async function listEndpoints(owner: WebhookOwner) {
	const { db } = ctx();
	const endpoints = await db
		.select()
		.from(webhookEndpoint)
		.where(and(ownerWhere(owner), eq(webhookEndpoint.active, true)))
		.orderBy(desc(webhookEndpoint.createdAt));
	const recent = endpoints.length
		? await db
				.select()
				.from(webhookDelivery)
				.where(
					sql`${webhookDelivery.endpointId} in ${endpoints.map((e) => e.id)} and ${webhookDelivery.createdAt} > now() - interval '14 days'`
				)
				.orderBy(desc(webhookDelivery.createdAt))
				.limit(50)
		: [];
	return endpoints.map((e) => ({
		...e,
		deliveries: recent.filter((d) => d.endpointId === e.id).slice(0, 10)
	}));
}

async function ownedEndpoint(owner: WebhookOwner, id: string) {
	const [row] = await ctx()
		.db.select()
		.from(webhookEndpoint)
		.where(and(eq(webhookEndpoint.id, id), ownerWhere(owner)));
	if (!row) throw new WebhookError('Webhook not found.');
	return row;
}

export async function removeEndpoint(
	actor: Actor,
	owner: WebhookOwner,
	id: string,
	auditManufacturerId?: string
) {
	const row = await ownedEndpoint(owner, id);
	await ctx()
		.db.update(webhookEndpoint)
		.set({ active: false, disabledReason: 'Removed' })
		.where(eq(webhookEndpoint.id, id));
	await audit(actor, {
		area: 'Manufacturer board',
		action: 'webhook_remove',
		itemType: 'webhook',
		itemId: id,
		manufacturerId: auditManufacturerId,
		summary: `Removed the webhook to ${new URL(row.url).host}`
	});
}

/** Sends a "webhook.test" event so the receiver can check its set-up. */
export async function sendTest(owner: WebhookOwner, id: string) {
	const row = await ownedEndpoint(owner, id);
	const limited = await consume([
		{ key: `webhook-test:${row.id}:h`, windowSeconds: 3600, max: 10 }
	]);
	if (!limited.ok)
		throw new WebhookError('That is a lot of test sends for one hour. Try again a little later.');
	// One try: the person is waiting to see whether their receiver works, not for retries.
	await queueDelivery(row.id, 'webhook.test', { message: 'This is a test from DETECK.' }, 0);
}

async function queueDelivery(
	endpointId: string,
	event: WebhookEvent,
	data: unknown,
	retries = ATTEMPTS
) {
	const id = crypto.randomUUID();
	const payload = { id, event, createdAt: new Date().toISOString(), data };
	await ctx().db.insert(webhookDelivery).values({ id, endpointId, event, payload });
	// About 4 hours of retries in total: 30 s, 1, 2, 4, 8, 16, 32, 64 and 128 minutes.
	await enqueue(
		'webhook.deliver',
		{ deliveryId: id },
		{ retryLimit: retries, retryDelay: 30, retryBackoff: true }
	);
}

/** Queues one delivery for every active endpoint of this owner that subscribed to the event. */
export async function emitEvent(
	owner: WebhookOwner | string | null | undefined,
	event: keyof typeof WEBHOOK_EVENTS,
	data: unknown
) {
	if (!owner) return;
	const who: WebhookOwner = typeof owner === 'string' ? { manufacturerId: owner } : owner;
	// A webhook problem must never break the action that caused the event, and one endpoint's
	// problem must not stop the others getting it.
	const endpoints = await ctx()
		.db.select({ id: webhookEndpoint.id })
		.from(webhookEndpoint)
		.where(
			and(
				ownerWhere(who),
				eq(webhookEndpoint.active, true),
				sql`${webhookEndpoint.events} ? ${event}`
			)
		)
		.catch((error) => {
			console.error('[webhooks] could not find endpoints', event, error);
			return [];
		});
	for (const e of endpoints)
		await queueDelivery(e.id, event, data).catch((error) =>
			console.error('[webhooks] could not queue', event, e.id, error)
		);
}

/** The signature header: v1=HMAC-SHA256(secret, "<timestamp>.<body>"), hex. */
export function signPayload(secret: string, timestamp: string, body: string): string {
	return `v1=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

/** The worker's job: POST one delivery. Throws on failure so the queue retries it. */
export async function deliverWebhook(deliveryId: string) {
	const { db } = ctx();
	const [row] = await db
		.select({ delivery: webhookDelivery, endpoint: webhookEndpoint })
		.from(webhookDelivery)
		.innerJoin(webhookEndpoint, eq(webhookEndpoint.id, webhookDelivery.endpointId))
		.where(eq(webhookDelivery.id, deliveryId));
	if (!row || row.delivery.status === 'delivered' || !row.endpoint.active) return;
	const attempts = row.delivery.attempts + 1;
	const body = JSON.stringify(row.delivery.payload);
	const timestamp = String(Math.floor(Date.now() / 1000));
	let statusCode: number | null = null;
	let problem: string | null = null;
	try {
		await checkWebhookUrl(row.endpoint.url);
		const response = await fetch(row.endpoint.url, {
			method: 'POST',
			redirect: 'manual',
			// The address is checked again as the connection is made: DNS can answer differently a
			// moment after the check above ("DNS rebinding").
			...(allowLocalWebhooks() ? {} : { dispatcher: publicOnly }),
			signal: AbortSignal.timeout(TIMEOUT_MS),
			headers: {
				'content-type': 'application/json',
				'user-agent': 'DETECK-Webhooks/1',
				'x-deteck-event': row.delivery.event,
				'x-deteck-delivery': row.delivery.id,
				'x-deteck-timestamp': timestamp,
				'x-deteck-signature': signPayload(row.endpoint.secret, timestamp, body)
			},
			body
		});
		statusCode = response.status;
		if (!response.ok) problem = `The receiver answered ${response.status}.`;
	} catch (error) {
		problem = error instanceof Error ? error.message : String(error);
	}
	const finalAttempt = attempts > ATTEMPTS || row.delivery.event === 'webhook.test';
	await db
		.update(webhookDelivery)
		.set({
			attempts,
			lastStatusCode: statusCode,
			lastError: problem,
			status: problem ? (finalAttempt ? 'failed' : 'retrying') : 'delivered',
			deliveredAt: problem ? null : new Date()
		})
		.where(eq(webhookDelivery.id, deliveryId));
	if (problem && !finalAttempt) throw new Error(`Webhook ${deliveryId} failed: ${problem}`);
}
