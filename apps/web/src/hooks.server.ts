import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit/hooks';
import { timingSafeEqual } from 'node:crypto';
import { building, dev } from '$app/env';
import * as env from '$app/env/private';
import { auth, serverContext } from '#lib/server/app.ts';
import '@deteck/core/server/job-definitions.ts';
import { recoverInterruptedImports } from '@deteck/core/server/imports/engine.ts';
import { startJobs, stopJobs } from '@deteck/core/server/jobs.ts';
import { checkSecrets } from '@deteck/core/server/secrets-check.ts';
import { captureError, flushErrors, initErrorTracking } from '@deteck/core/server/monitoring.ts';
import { staffRole } from '#lib/server/guards.ts';
import { isLocale, pickLocale } from '@deteck/core/messages/i18n.ts';
import { LANG_COOKIE, langCookieOptions } from '#lib/server/lang.ts';

/** Starts the background job queue when the server starts (not during the build). */
export const init: ServerInit = async () => {
	if (building) return;
	initErrorTracking(serverContext.config.sentryDsn, 'web');
	// Refuse to serve with a serial or sign-in key this database wasn't set up with.
	await checkSecrets();
	// JOBS_IN_WEB=true (local development, small deploys) runs jobs here too; otherwise the
	// worker app runs them and the web app only queues them.
	const work = env.JOBS_IN_WEB;
	if (work) await recoverInterruptedImports();
	// In development a code change runs this again: stop the queue the last version started.
	const previous = globalThis as typeof globalThis & { __deteckStopJobs?: () => Promise<void> };
	if (dev) await previous.__deteckStopJobs?.().catch(() => undefined);
	await startJobs(env.DATABASE_URL, { work });
	if (dev) previous.__deteckStopJobs = stopJobs;
	// adapter-node closes the HTTP server on SIGTERM, then emits this. Without it the job queue and
	// database pool keep the process alive until the host kills it.
	process.once('sveltekit:shutdown', async () => {
		await stopJobs();
		await serverContext.db.$close();
		await serverContext.reportDb?.$close();
		await flushErrors();
	});
};

const SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
	'Permissions-Policy': 'camera=(self), microphone=(), geolocation=(), payment=()',
	'X-Frame-Options': 'DENY',
	'Cross-Origin-Opener-Policy': 'same-origin'
};
if (!dev) SECURITY_HEADERS['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';

const PUBLIC_BODY_LIMIT = 20 * 1024 * 1024;

/** Areas that need to know who is signed in. The public checker never does. */
const SESSION_PATHS = ['/business', '/console', '/workspace', '/portal', '/files'];
/** Signed-in areas where spreadsheets and documents are uploaded (bigger bodies allowed). */
const UPLOAD_PATHS = ['/console', '/workspace', '/portal'];

/** True when the request came through Cloudflare (it adds the shared secret header). */
function fromEdge(header: string | null, secret: string) {
	const given = Buffer.from(header ?? '');
	const expected = Buffer.from(secret);
	return given.length === expected.length && timingSafeEqual(given, expected);
}

export const handle: Handle = async ({ event, resolve }) => {
	// Decoded, as the router sees it: "/%77orkspace" is "/workspace" for every check below.
	let path: string;
	try {
		path = decodeURI(event.url.pathname);
	} catch {
		return new Response('Bad request', { status: 400 });
	}
	// With EDGE_SECRET set, only requests through Cloudflare are served: nobody can reach the
	// server's own address directly and fake the visitor IP header that rate limits rely on.
	// Render's health check calls the server directly, so /healthz stays open.
	const edgeSecret = serverContext.config.edgeSecret;
	if (
		edgeSecret &&
		!path.startsWith('/healthz') &&
		!fromEdge(event.request.headers.get('x-deteck-edge'), edgeSecret)
	)
		return new Response('Forbidden', { status: 403 });
	// Reports of fakes are switched off for now (FEATURE_REPORTS). Their layouts answer page visits
	// with the "Not found" page; form actions and the photo addresses skip those layouts, so they
	// are refused here.
	if (
		!serverContext.config.reportsEnabled &&
		/^\/(report|console\/reports|workspace\/reports)(\/|$)/.test(path) &&
		(event.request.method !== 'GET' || path.includes('/photo/'))
	)
		return new Response('Not found', { status: 404 });
	// Every sign-in flow calls Better Auth on the server, with DETECK's lockout and audit rules.
	// Its own HTTP API would skip those rules, so it isn't exposed.
	if (path === '/api/auth' || path.startsWith('/api/auth/'))
		return new Response('Not found', { status: 404 });
	const businessArea = SESSION_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
	// Large bodies only where signed-in people upload spreadsheets and documents (and the
	// manufacturer API). A public form, registration included, needs at most a few photos or
	// documents. A body without a declared size (streamed) is refused there: its size can't be
	// checked before it's read, and browsers always declare it for forms.
	const uploadArea =
		UPLOAD_PATHS.some((p) => path === p || path.startsWith(`${p}/`)) ||
		path.startsWith('/api/v1/manufacturer');
	if (!uploadArea && event.request.method === 'POST') {
		const length = event.request.headers.get('content-length');
		if (length === null && event.request.body)
			return new Response('Length required', { status: 411 });
		if (Number(length ?? 0) > PUBLIC_BODY_LIMIT)
			return new Response('That upload is too large. Use smaller photos (under 20 MB in total).', {
				status: 413
			});
	}
	if (businessArea) {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (session) {
			event.locals.session = session.session;
			event.locals.user = session.user;
		}
	}

	// Defence in depth: layout guards don't run before form actions, so the
	// signed-in areas are also gated here. Each action still checks its own permissions.
	const area = path.startsWith('/console')
		? 'console'
		: path.startsWith('/workspace') || path.startsWith('/portal')
			? 'workspace'
			: null;
	if (area) {
		const user = event.locals.user;
		const to = (location: string) => new Response(null, { status: 303, headers: { location } });
		if (!user) return to(`/business/sign-in?next=${encodeURIComponent(path + event.url.search)}`);
		if (!user.twoFactorEnabled) return to('/business/setup-2fa');
		// Pages show the friendly 403 page from the console layout; anything else stops here.
		if (area === 'console' && !staffRole(user) && event.request.method !== 'GET')
			return new Response('This area is for DETECK staff.', { status: 403 });
		// A DETECK reviewer inside a company's workspace or portal can look, not change: changes
		// made on a company's behalf alter public answers, so they're for DETECK admins.
		// The page comes back with a notice saying so (see the workspace and portal layouts).
		if (area === 'workspace' && staffRole(user) === 'reviewer' && event.request.method !== 'GET')
			return to(`${path}?readonly=1`);
	}

	// The visitor's language: ?lang= (from a shared link) is remembered; then their earlier choice,
	// then their browser's languages. Business areas stay in English.
	const enabled = serverContext.config.languages;
	const asked = event.url.searchParams.get('lang');
	if (isLocale(asked) && enabled.includes(asked))
		event.cookies.set(LANG_COOKIE, asked, langCookieOptions);
	const publicPage = !businessArea;
	event.locals.lang = publicPage
		? pickLocale(
				isLocale(asked) ? asked : event.cookies.get(LANG_COOKIE),
				event.request.headers.get('accept-language'),
				enabled
			)
		: 'en';

	const response = await resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.locals.lang)
	});
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
		if (!response.headers.has(name)) response.headers.set(name, value);
	}
	return response;
};

export const handleError: HandleServerError = (caught) => {
	if (caught.kind === 'unknown') {
		console.error(
			`[error] ${caught.event.request.method} ${caught.event.url.pathname}`,
			caught.error
		);
		captureError(caught.error, {
			method: caught.event.request.method,
			route: caught.event.route.id
		});
		return { message: 'Something went wrong on our side. Please try again.' };
	}
};
