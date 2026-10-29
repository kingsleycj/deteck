/**
 * A simple load test: many checks at once against a running DETECK, then the throughput and how
 * long answers took. It uses no extra tools, only Node.
 *
 *   node scripts/load-test.js --url http://localhost:4173 --seconds 20 --concurrency 20
 *   node scripts/load-test.js --url https://staging.example --mode api --key dtk_live_…
 *
 * Modes:
 *   page (default)  POST /check like the public form does (each request looks like a new device)
 *   api             POST /api/v1/checks with an API key (give the key a high per-minute limit)
 *
 * The server's own rate limits will answer 429 under load. For a local test, start the server
 * with RATE_LIMIT_IP_PER_HOUR=10000000 and RATE_LIMIT_DEVICE_PER_MINUTE=1000000 (page mode: every
 * request is a new device, and new devices share an allowance per address). Never point this at
 * production without
 * telling the people who run it: it is meant to push the server hard.
 */
const args = Object.fromEntries(
	process.argv
		.slice(2)
		.join(' ')
		.split('--')
		.filter(Boolean)
		.map((pair) => {
			const [k, ...v] = pair.trim().split(/\s+/);
			return [k, v.join(' ') || 'true'];
		})
);
const base = (args.url ?? 'http://localhost:4173').replace(/\/$/, '');
const seconds = Number(args.seconds ?? 20);
const concurrency = Number(args.concurrency ?? 20);
const mode = args.mode ?? 'page';
const serials = (args.serials ?? '7K4M9QX2TB8D,3M8P41KD7Q2X,A7R2C9L4E1DX,ZZZZ8888ZZZZ').split(',');
if (mode === 'api' && !args.key) {
	console.error('api mode needs --key dtk_live_…');
	process.exit(1);
}

const latencies = [];
const statuses = new Map();
let errors = 0;
let firstError = '';
const stopAt = Date.now() + seconds * 1000;

async function one(i) {
	const serial = serials[i % serials.length];
	const started = performance.now();
	try {
		const response =
			mode === 'api'
				? await fetch(`${base}/api/v1/checks`, {
						method: 'POST',
						headers: { 'content-type': 'application/json', authorization: `Bearer ${args.key}` },
						body: JSON.stringify({ serial })
					})
				: await fetch(`${base}/check?/check`, {
						method: 'POST',
						redirect: 'manual',
						headers: {
							'content-type': 'application/x-www-form-urlencoded',
							accept: 'text/html',
							origin: base,
							'x-forwarded-proto': base.startsWith('https') ? 'https' : 'http'
						},
						body: `serial=${encodeURIComponent(serial)}`
					});
		await response.arrayBuffer();
		latencies.push(performance.now() - started);
		statuses.set(response.status, (statuses.get(response.status) ?? 0) + 1);
	} catch (error) {
		errors++;
		firstError ||= String(error?.cause?.message ?? error?.message ?? error);
	}
}

async function worker(id) {
	let i = id;
	while (Date.now() < stopAt) {
		await one(i);
		i += concurrency;
	}
}

console.info(`Load test: ${mode} mode, ${concurrency} at once for ${seconds} s against ${base}`);
const t0 = performance.now();
await Promise.all(Array.from({ length: concurrency }, (_, id) => worker(id)));
const elapsed = (performance.now() - t0) / 1000;

latencies.sort((a, b) => a - b);
const pct = (p) => (latencies.length ? latencies[Math.floor((latencies.length - 1) * p)] : 0);
const ok = [...statuses].filter(([s]) => s < 400).reduce((n, [, c]) => n + c, 0);
console.info(`
Requests        ${latencies.length + errors} in ${elapsed.toFixed(1)} s  (${(latencies.length / elapsed).toFixed(1)} a second)
Answered OK     ${ok}   (status codes: ${[...statuses].map(([s, c]) => `${s}×${c}`).join(', ') || 'none'})
Network errors  ${errors}${firstError ? `  (first: ${firstError})` : ''}
Time to answer  median ${pct(0.5).toFixed(0)} ms · 95% under ${pct(0.95).toFixed(0)} ms · 99% under ${pct(0.99).toFixed(0)} ms · slowest ${pct(1).toFixed(0)} ms
`);
if (statuses.get(429))
	console.info(
		'Some requests were rate-limited (429): raise the limits for a test run, as explained at the top of this file.'
	);
