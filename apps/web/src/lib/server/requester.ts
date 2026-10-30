import type { RequestEvent } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { toNigerianState } from '@deteck/core/nigeria.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { randomId } from '@deteck/core/server/crypto.ts';
import { ipKey } from '@deteck/core/server/rate-limit.ts';
import type { Requester } from '@deteck/core/server/verify/check.ts';
import { today } from '@deteck/core/server/time.ts';

const DEVICE_COOKIE = 'dtk_d';
const PILOT_COOKIE = 'dtk_pilot';

/** Anonymous first-party device id, used only for rate limits and daily-hashed analytics. */
export function deviceId(event: RequestEvent): string {
	return device(event).id;
}

/** The cookie is `<id>.<signature>`, so nobody can invent a fresh device to dodge the limits. */
function signDevice(id: string): string {
	return createHmac('sha256', ctx().config.deviceHashSecret)
		.update(`device:${id}`)
		.digest('base64url')
		.slice(0, 22);
}

function readDevice(value: string | undefined): string | null {
	const match = value?.match(/^([A-Za-z0-9_-]{16,32})\.([A-Za-z0-9_-]{22})$/);
	if (!match) return null;
	const expected = Buffer.from(signDevice(match[1]));
	const given = Buffer.from(match[2]);
	return expected.length === given.length && timingSafeEqual(expected, given) ? match[1] : null;
}

// One id per request, even for a new visitor whose cookie is only being set now.
const seen = new WeakMap<RequestEvent, { id: string; isNew: boolean }>();

function device(event: RequestEvent): { id: string; isNew: boolean } {
	const known = seen.get(event);
	if (known) return known;
	const existing = readDevice(event.cookies.get(DEVICE_COOKIE));
	// An unsigned or altered cookie is treated as a new device (and replaced).
	const result = existing ? { id: existing, isNew: false } : { id: randomId(16), isNew: true };
	if (result.isNew)
		event.cookies.set(DEVICE_COOKIE, `${result.id}.${signDevice(result.id)}`, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: event.url.protocol === 'https:',
			maxAge: 60 * 60 * 24 * 365
		});
	seen.set(event, result);
	return result;
}

/** Tied to the current code, so changing PILOT_ACCESS_CODE locks out every earlier pilot browser. */
function pilotToken(): string {
	const code = ctx().config.pilotAccessCode ?? '';
	return createHmac('sha256', ctx().config.deviceHashSecret)
		.update(`pilot-access:${code}`)
		.digest('base64url');
}

export function grantPilotAccess(event: RequestEvent) {
	event.cookies.set(PILOT_COOKIE, pilotToken(), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 90
	});
}

/** Whether this browser may use the packaging scan (feature flag D-10). */
export function packagingEnabled(event: RequestEvent): boolean {
	const mode = ctx().config.packagingAi;
	if (mode === 'public') return true;
	if (mode === 'pilot') return event.cookies.get(PILOT_COOKIE) === pilotToken();
	return false;
}

const HUMAN_COOKIE = 'dtk_human';

function humanToken(deviceId: string, day = today()): string {
	return createHmac('sha256', ctx().config.deviceHashSecret)
		.update(`human:${deviceId}:${day}`)
		.digest('base64url');
}

/** After the "are you human?" check: good for the rest of the day, for this device only. */
export function grantHumanPass(event: RequestEvent) {
	event.cookies.set(HUMAN_COOKIE, humanToken(deviceId(event)), {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 24
	});
}

function isHuman(event: RequestEvent, id: string): boolean {
	return event.cookies.get(HUMAN_COOKIE) === humanToken(id);
}

/**
 * The visitor's state, from Cloudflare's cf-region header. Only trusted when EDGE_SECRET proves the
 * request came through Cloudflare (the hooks refuse anything else); otherwise anyone could type it.
 */
export function visitorState(event: RequestEvent): string | null {
	if (!ctx().config.edgeSecret) return null;
	return toNigerianState(event.request.headers.get('cf-region'));
}

export function requester(event: RequestEvent): Requester {
	let ip = 'unknown';
	try {
		ip = event.getClientAddress();
	} catch {
		// Not available in some test environments.
	}
	const { id, isNew } = device(event);
	return {
		deviceId: id,
		newDevice: isNew,
		human: isHuman(event, id),
		ip: ipKey(ip),
		state: visitorState(event),
		packagingEnabled: packagingEnabled(event)
	};
}
