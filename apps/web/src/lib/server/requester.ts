import type { RequestEvent } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
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

function device(event: RequestEvent): { id: string; isNew: boolean } {
	const existing = event.cookies.get(DEVICE_COOKIE);
	if (existing && /^[A-Za-z0-9_-]{16,32}$/.test(existing)) return { id: existing, isNew: false };
	const id = randomId(16);
	event.cookies.set(DEVICE_COOKIE, id, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: event.url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 365
	});
	return { id, isNew: true };
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
		state: toNigerianState(event.request.headers.get('cf-region')),
		packagingEnabled: packagingEnabled(event)
	};
}
