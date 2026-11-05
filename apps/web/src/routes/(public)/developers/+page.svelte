<script lang="ts">
	import Seo from '#lib/ui/Seo.svelte';
	import PublicTop from '#lib/ui/PublicTop.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const checkExample = `curl -X POST https://deteck.ng/api/v1/checks \\
  -H "Content-Type: application/json" \\
  -d '{"serial": "7K4M9QX2TB8D"}'`;
	const checkAnswer = `{
  "id": "Xb3…",
  "result": {
    "code": "VALID",
    "flags": [],
    "serialDisplay": "…TB8D",
    "manufacturer": { "name": "Northbridge Pharma Ltd", "state": "Ogun", "town": "Ota" },
    "product": { "brandName": "Curavyn", "strength": "500 mg", "nafdacRegNo": "A4-0000", … },
    "batch": { "lot": "NB-2611", "expiryDate": "2028-04-30", "status": "active", … },
    "journeyAvailable": true
  },
  "summary": { "title": "VALID", "message": "This serial matches Northbridge Pharma Ltd's records for Curavyn 500 mg." },
  "links": { "journey": "/api/v1/checks/Xb3…/journey" }
}`;
	const importExample = `curl -X POST https://deteck.ng/api/v1/manufacturer/imports \\
  -H "Authorization: Bearer dtk_live_ab12cd34_…" \\
  -H "Content-Type: application/json" \\
  -d '{
    "kind": "batches_serials",
    "commit": true,
    "rows": [
      { "gtin": "09506000990019", "lot": "NB-2611", "manufactureDate": "2026-03-01",
        "expiryDate": "2028-04-30", "serial": "7K4M9QX2TB8D" }
    ]
  }'`;
	const receiptExample = `curl -X POST https://deteck.ng/api/v1/business/receipts \\
  -H "Authorization: Bearer dtk_live_…" \\
  -H "Content-Type: application/json" \\
  -d '{ "codes": ["7K4M9QX2TB8D", "H2R5W8C1N6PZ"], "receivedOn": "2026-10-26",
        "supplier": "Lakeside Medical Supply" }'`;
	const verifyExample = `import { createHmac, timingSafeEqual } from 'node:crypto';

// In your webhook handler, with the raw request body as a string:
function fromDeteck(body, headers, secret) {
  const timestamp = headers['x-deteck-timestamp'];
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false; // older than 5 minutes
  const expected = 'v1=' + createHmac('sha256', secret).update(\`\${timestamp}.\${body}\`).digest('hex');
  const given = headers['x-deteck-signature'] ?? '';
  return expected.length === given.length && timingSafeEqual(Buffer.from(expected), Buffer.from(given));
}`;
</script>

<Seo
	title="DETECK API · Developers"
	description="Check medicine serials, send manufacturer data and check deliveries with the DETECK REST API."
/>

<div class="shell">
	<PublicTop />
	{#if data.lang !== 'en'}<p class="notice small" lang={data.lang}>
			{data.t.common.englishOnly}
		</p>{/if}
	<main class="prose" lang="en">
		<h1>The DETECK API</h1>
		<p>
			Everything the DETECK website does with serials is also available to your own systems: a
			mobile app, pharmacy software, a manufacturer's ERP. The API speaks JSON over HTTPS at
			<span class="mono">/api/v1</span>. The machine-readable description is at
			<a href="/api/v1/openapi.json">/api/v1/openapi.json</a> (OpenAPI 3.1).
		</p>

		<h2>Keys and limits</h2>
		<ul>
			<li>
				<strong>Checking serials</strong> needs no key: up to 300 requests an hour from one IP address.
				A key raises the limit.
			</li>
			<li>
				<strong>Manufacturers</strong> create keys in the workspace (API and webhooks).
				<strong>Pharmacies, hospitals and distributors</strong> create keys in their portal.
				<strong>Partner apps</strong> get a key from DETECK.
			</li>
			<li>
				Send the key in a header: <span class="mono">Authorization: Bearer dtk_live_…</span>. Each
				key has its own limit per minute (120 by default). Too many requests get
				<span class="mono">429</span> with a <span class="mono">Retry-After</span> header.
			</li>
			<li>Keys are shown once. If one leaks, revoke it straight away and create a new one.</li>
		</ul>

		<h2>Errors</h2>
		<p>
			Every error has the same shape, with an HTTP status: <span class="mono"
				>{'{ "error": { "code": "missing_scope", "message": "…" } }'}</span
			>. The message is written for people; the code is stable for programs.
		</p>

		<h2>Check a serial</h2>
		<pre><code>{checkExample}</code></pre>
		<p>
			Or send a scanned DataMatrix code as <span class="mono">{'{ "code": "(01)…(21)…" }'}</span>.
			The answer:
		</p>
		<pre><code>{checkAnswer}</code></pre>
		<p>
			<span class="mono">summary</span> is DETECK's own wording for people. Ask for another language
			with <span class="mono">Accept-Language</span> or <span class="mono">?lang=</span>:
			<span class="mono">pcm</span> (Nigerian Pidgin), <span class="mono">ha</span> (Hausa),
			<span class="mono">yo</span> (Yorùbá) or <span class="mono">ig</span> (Igbo).
		</p>
		<p>
			<span class="mono">result.code</span> is always one of these. Show the flags too: an expired
			or mismatched pack is still <span class="mono">VALID</span> with a flag.
		</p>
		<div class="table-scroll">
			<table>
				<thead><tr><th>code</th><th>Meaning</th></tr></thead>
				<tbody>
					<tr
						><td class="mono">VALID</td><td
							>The serial is in a live manufacturer's records. Flags: EXPIRED, LOT_MISMATCH,
							EXPIRY_MISMATCH</td
						></tr
					>
					<tr
						><td class="mono">RECALLED</td><td
							>The batch was recalled or withdrawn (see batch.status and batch.statusReason)</td
						></tr
					>
					<tr><td class="mono">UNRECOGNISED</td><td>No live record of this serial</td></tr>
					<tr
						><td class="mono">NOT_COVERED</td><td
							>A scanned product whose manufacturer isn't on DETECK yet</td
						></tr
					>
					<tr
						><td class="mono">CANT_CONFIRM</td><td
							>The manufacturer or the drug is paused on DETECK</td
						></tr
					>
					<tr
						><td class="mono">NEEDS_BATCH</td><td
							>The serial exists on more than one product; check by scanned code instead</td
						></tr
					>
				</tbody>
			</table>
		</div>
		<p>
			Never describe a VALID result as "genuine" or "safe" to people: it means the serial matches
			the manufacturer's records. The <span class="mono">summary</span> field carries DETECK's own wording.
		</p>

		<h2>Manufacturers: send data</h2>
		<p>
			Send drugs (<span class="mono">products</span>), batches and serials (<span class="mono"
				>batches_serials</span
			>) or supply chain records (<span class="mono">distribution</span>) as rows. They are checked
			exactly like an uploaded spreadsheet. With <span class="mono">"commit": false</span> the rows are
			only checked.
		</p>
		<pre><code>{importExample}</code></pre>
		<p>
			The answer is <span class="mono">202</span> with an import id. Read
			<span class="mono">GET /api/v1/manufacturer/imports/{'{id}'}</span> until its status is
			<span class="mono">committed</span> (or <span class="mono">ready</span> when only checking).
			It lists the counts and the first 100 problem rows with reasons. Sending exactly the same rows
			again returns the first import, so you can retry without importing twice. Up to 50,000 rows a
			request. Recall or withdraw a batch with
			<span class="mono">POST /api/v1/manufacturer/batch-status</span>.
		</p>

		<h2>Pharmacies and distributors: check a delivery</h2>
		<p>
			<span class="mono">POST /api/v1/business/checks</span> with
			<span class="mono">{'{ "codes": [...] }'}</span> checks up to 500 at once. To record what you received:
		</p>
		<pre><code>{receiptExample}</code></pre>

		<h2 id="webhooks">Webhooks</h2>
		<p>
			Manufacturers can ask DETECK to call their own HTTPS address when something happens: an import
			finishes, a go-live decision, a new drug reviewed, a batch recalled, a serial checked
			unusually often, a suspected fake reported, or a pharmacy confirming receipt. Each delivery is
			a POST with a JSON body:
			<span class="mono">{'{ "id", "event", "createdAt", "data" }'}</span>, and these headers:
			<span class="mono">x-deteck-event</span>, <span class="mono">x-deteck-delivery</span>,
			<span class="mono">x-deteck-timestamp</span> and <span class="mono">x-deteck-signature</span>.
			Answer with any 2xx status; anything else is retried for about 2 hours with growing gaps.
		</p>
		<p>Check every delivery's signature with your signing secret:</p>
		<pre><code>{verifyExample}</code></pre>
	</main>
	<SiteFooter />
</div>

<style>
	pre {
		background: var(--ink);
		color: #e8eaef;
		padding: 14px 16px;
		border-radius: 12px;
		/* Long lines wrap instead of scrolling: this page has no JavaScript, and a box that
		   scrolls sideways must be reachable by keyboard (WCAG 2.1.1). */
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		font-size: 13px;
		line-height: 1.5;
	}
	code {
		font-family: var(--font-mono);
	}
</style>
