/**
 * Error tracking with Sentry, for the web app and the worker. Off when SENTRY_DSN is empty.
 * No personal data is sent: no IP addresses, cookies, request bodies or serials.
 */
import * as Sentry from '@sentry/node';

let enabled = false;

export function initErrorTracking(dsn: string | undefined, service: 'web' | 'worker') {
	if (!dsn || enabled) return;
	Sentry.init({
		dsn,
		environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
		serverName: `deteck-${service}`,
		// Collect no personal data: no user fields, cookies, headers, bodies or query strings.
		dataCollection: {
			userInfo: false,
			cookies: false,
			httpHeaders: false,
			httpBodies: [],
			urlQueryParams: false
		},
		tracesSampleRate: 0,
		beforeSend(event) {
			if (event.request) {
				delete event.request.cookies;
				delete event.request.data;
				delete event.request.headers;
				delete event.request.query_string;
			}
			delete event.user;
			return event;
		}
	});
	enabled = true;
}

/** Reports an unexpected error; safe to call when tracking is off. */
export function captureError(error: unknown, context: Record<string, unknown> = {}) {
	if (!enabled) return;
	Sentry.captureException(error, { extra: context });
}

/** Sends anything queued before the process exits. */
export async function flushErrors() {
	if (enabled) await Sentry.flush(2000);
}
