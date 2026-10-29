/**
 * Shared plumbing for the REST API (/api/v1): key authentication, scopes, rate limits, CORS and
 * JSON errors. Every error has the same shape: { "error": { "code": "...", "message": "..." } }.
 */
import type { RequestEvent } from '@sveltejs/kit';
import { verifyApiKey, type ApiScope } from '@deteck/core/server/api-keys.ts';
import type { Actor } from '@deteck/core/server/audit.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { consume, ipKey } from '@deteck/core/server/rate-limit.ts';

export class ApiProblem extends Error {
	constructor(
		public status: number,
		public code: string,
		message: string,
		public headers: Record<string, string> = {}
	) {
		super(message);
	}
}

/** Public endpoints may be called from any website (they hold no cookies or secrets). */
export const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Authorization, Content-Type',
	'Access-Control-Max-Age': '86400'
};

export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...CORS,
			...headers
		}
	});
}

export function problem(error: unknown) {
	if (error instanceof ApiProblem)
		return json(
			{ error: { code: error.code, message: error.message } },
			error.status,
			error.headers
		);
	console.error('[api]', error);
	return json(
		{ error: { code: 'server_error', message: 'Something went wrong on our side. Try again.' } },
		500
	);
}

/** Wraps a handler so every thrown ApiProblem becomes a JSON error. */
export function handler(fn: (event: RequestEvent) => Promise<Response>) {
	return async (event: RequestEvent) => {
		try {
			return await fn(event);
		} catch (error) {
			return problem(error);
		}
	};
}

function clientIp(event: RequestEvent) {
	try {
		return ipKey(event.getClientAddress());
	} catch {
		return 'unknown';
	}
}

type VerifiedKey = NonNullable<Awaited<ReturnType<typeof verifyApiKey>>>;

export interface ApiCaller {
	key: VerifiedKey | null;
	ip: string;
	actor: Actor;
}

/**
 * Authenticates the request. With `scope`, a key with that scope is required; without it, the
 * request may be anonymous (limited per IP) or use any key (limited per key).
 */
export async function caller(event: RequestEvent, scope?: ApiScope): Promise<ApiCaller> {
	const ip = clientIp(event);
	const header = event.request.headers.get('authorization');
	let key: VerifiedKey | null = null;
	if (header) {
		const presented = header.replace(/^Bearer\s+/i, '');
		key = await verifyApiKey(presented);
		if (!key)
			throw new ApiProblem(
				401,
				'invalid_key',
				'This API key is not valid, or it has been revoked.'
			);
	}
	if (key && !key.ownerActive)
		throw new ApiProblem(
			403,
			'company_not_active',
			"This key's company isn't approved on DETECK right now, so the key can't be used."
		);
	if (scope && !key)
		throw new ApiProblem(
			401,
			'key_required',
			'This endpoint needs an API key: Authorization: Bearer <key>.'
		);
	if (scope && key && !key.scopes.includes(scope))
		throw new ApiProblem(403, 'missing_scope', `This key doesn't have the "${scope}" permission.`);

	const limited = await consume(
		key
			? [{ key: `api:k:${key.id}:m`, windowSeconds: 60, max: key.rateLimit }]
			: [{ key: `api:ip:${ip}:h`, windowSeconds: 3600, max: ctx().config.apiAnonymousPerHour }]
	);
	if (!limited.ok)
		throw new ApiProblem(429, 'rate_limited', 'Too many requests. Slow down and try again.', {
			'Retry-After': String(limited.retryAfterSeconds)
		});
	return {
		key,
		ip,
		actor: {
			userId: null,
			label: key ? `API key "${key.name}" (${key.prefix})` : 'Anonymous API caller',
			role: 'API',
			onBehalf: false,
			ip,
			userAgent: event.request.headers.get('user-agent')
		}
	};
}

/** Reads a JSON body (at most 20 MB), or throws a clear error. */
export async function body<T = Record<string, unknown>>(event: RequestEvent): Promise<T> {
	const length = Number(event.request.headers.get('content-length') ?? 0);
	if (length > 20 * 1024 * 1024)
		throw new ApiProblem(413, 'too_large', 'The request body can be up to 20 MB.');
	try {
		return (await event.request.json()) as T;
	} catch {
		throw new ApiProblem(400, 'invalid_json', 'The request body must be JSON.');
	}
}

/** The answer to a CORS preflight request. */
export const OPTIONS = () => new Response(null, { status: 204, headers: CORS });
