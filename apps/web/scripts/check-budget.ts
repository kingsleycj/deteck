// Checks the public pages against the PRD data budgets (F-04, US-04.1).
// Usage: BASE_URL=http://localhost:4173 node scripts/check-budget.ts [serial]
// Requires a running server with demo data (pnpm db:seed).
import { gzipSync } from 'node:zlib';

const base = (process.env.BASE_URL ?? 'http://localhost:4173').replace(/\/$/, '');
const serial = process.argv[2] ?? '7K4M9QX2TB8D';

const BUDGET = {
	firstVisitTotal: {
		limit: 300_000,
		target: 120_000,
		label: 'Checker first visit (HTML + CSS + JS)'
	},
	checkRoundTrip: {
		limit: 50_000,
		target: 10_000,
		label: 'One serial check (request + result page HTML)'
	},
	journey: { limit: 30_000, target: 10_000, label: 'Journey page HTML' }
};

const gz = (s: string | Uint8Array) => gzipSync(s).length;

async function fetchText(url: string, init?: RequestInit) {
	// Local servers run plain HTTP; tell adapter-node (PROTOCOL_HEADER=x-forwarded-proto) so CSRF checks match.
	const proto = new URL(base).protocol.replace(':', '');
	const res = await fetch(url, {
		redirect: 'manual',
		...init,
		headers: { accept: 'text/html', 'x-forwarded-proto': proto, ...(init?.headers ?? {}) }
	});
	return { res, text: await res.text() };
}

function assets(html: string): string[] {
	const urls = [
		...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
		...html.matchAll(/<link[^>]+href="([^"]+)"[^>]+rel="stylesheet"/g),
		...html.matchAll(/<script[^>]+src="([^"]+)"/g),
		...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)
	].map((m) => m[1]);
	return [...new Set(urls)];
}

let failed = false;
function report(key: keyof typeof BUDGET, bytes: number, detail = '') {
	const b = BUDGET[key];
	const status = bytes > b.limit ? 'FAIL' : bytes > b.target ? 'over target' : 'ok';
	if (bytes > b.limit) failed = true;
	console.info(
		`${status.padEnd(11)} ${b.label}: ${(bytes / 1000).toFixed(1)} KB gzip (limit ${b.limit / 1000} KB, target ${b.target / 1000} KB) ${detail}`
	);
}

const home = await fetchText(`${base}/check`);
let firstVisit = gz(home.text);
const parts = [`html ${(gz(home.text) / 1000).toFixed(1)} KB`];
for (const url of assets(home.text)) {
	const asset = await fetch(new URL(url, base));
	const bytes = gz(new Uint8Array(await asset.arrayBuffer()));
	firstVisit += bytes;
	parts.push(`${url.split('/').pop()} ${(bytes / 1000).toFixed(1)} KB`);
}
report('firstVisitTotal', firstVisit, `(${parts.join(', ')})`);

const body = new URLSearchParams({ serial }).toString();
// The checker's form posts to its named action, as a browser does.
const post = await fetchText(`${base}/check?/check`, {
	method: 'POST',
	headers: { 'content-type': 'application/x-www-form-urlencoded', origin: base },
	body
});
const location = post.res.headers.get('location');
if (!location) {
	console.error(`Check did not redirect (status ${post.res.status}). Is demo data seeded?`);
	process.exit(1);
}
const result = await fetchText(new URL(location, base).href);
report(
	'checkRoundTrip',
	body.length + gz(post.text) + gz(result.text) + 1200,
	'(includes ~1.2 KB of headers)'
);

const journey = await fetchText(new URL(`${location}/journey`, base).href);
report('journey', gz(journey.text));

process.exit(failed ? 1 : 0);
