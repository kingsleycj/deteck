<script lang="ts">
	import type { PageProps } from './$types';
	import { BUSINESS_STATUS, quoted } from '#lib/ui/status.ts';
	import { formatDate } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const b = $derived(data.business);
	const s = $derived(BUSINESS_STATUS[b.status]);
</script>

<svelte:head><title>{b.name} · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">{b.roleLabel} portal</p>
		<h1>{b.name} <span class="chip {s.chip}" style="vertical-align: middle">{s.label}</span></h1>
		<p class="small muted">{[b.town, b.state].filter(Boolean).join(', ')}</p>
	</div>
	{#if b.status === 'approved'}<a href="/portal/check" class="btn btn-primary">Check a delivery</a
		>{/if}
</div>

{#if b.status === 'pending'}
	<p class="notice notice-info">
		<strong>Your application is with a DETECK reviewer.</strong> We check your PCN premises licence. You'll
		get an email with the decision.
	</p>
{:else if b.status === 'info_requested'}
	<p class="notice">
		<strong>DETECK needs more information.</strong> Reviewer's note: {quoted(b.statusReason)} Answer it
		on
		<a href="/portal/company">Business and documents</a>.
	</p>
{:else if b.status === 'rejected'}
	<p class="notice notice-error">
		<strong>Your application wasn't approved.</strong> Reason: {quoted(b.statusReason)} Contact DETECK{data.contactEmail
			? ` at ${data.contactEmail}`
			: ''} if you think this is a mistake.
	</p>
{:else if b.status === 'suspended'}
	<p class="notice notice-error">
		<strong>Your account is paused.</strong> Reason: {quoted(b.statusReason)} Contact DETECK to resolve
		it.
	</p>
{/if}

{#if data.recalled.length}
	<section class="panel" style="border-color: var(--red)">
		<h2>Recalled stock you received</h2>
		<p class="small muted">
			These batches were recalled or withdrawn, and the records show you received some of their
			packs (your own receipts or the supplier's records). Take them off your shelves and follow the
			recall instructions.
		</p>
		<ul>
			{#each data.recalled as r, i (i)}
				<li>
					<strong>{r.drug}</strong> batch <span class="mono">{r.lot}</span>: {r.status}{r.source
						? ` by ${r.source}`
						: ''}{r.reason ? `, ${r.reason}` : ''}
				</li>
			{/each}
		</ul>
	</section>
{/if}

<div class="two-col">
	<section class="panel">
		<h2>How DETECK helps you</h2>
		<ol>
			<li>
				<strong>Check a delivery.</strong> Paste or upload the serials, or the scanned codes, from a delivery
				and see each pack's result at once.
			</li>
			<li>
				<strong>Confirm what you received.</strong> Packs you confirm show your business, "Verified by
				DETECK", in the journey people see.
			</li>
			<li>
				<strong>Get recall warnings.</strong> If a batch you received is recalled, it shows here.
			</li>
		</ol>
	</section>
	<aside class="panel">
		<h3>Recently received</h3>
		{#each data.receipts as r (r.id)}
			<p class="small">{r.drug} · <span class="mono">{r.lot}</span> · {formatDate(r.eventDate)}</p>
		{:else}
			<p class="small muted">Nothing recorded yet.</p>
		{/each}
		<a href="/portal/receipts" class="btn btn-small">All received stock</a>
	</aside>
</div>
