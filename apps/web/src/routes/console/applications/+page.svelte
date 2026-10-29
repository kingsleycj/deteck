<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { countOf, formatDateTime, PARTY_ROLE } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Applications · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">DETECK team console</p>
		<h1>Applications and reviews</h1>
	</div>
</div>

<section class="stack" style="--gap: 12px">
	<h2>New applications ({data.pending.length})</h2>
	{#if data.pending.length === 0}
		<div class="empty">
			<div style="width: 90px"><Mascot mood="happy" /></div>
			<p class="muted">No applications waiting. Nice.</p>
		</div>
	{:else}
		<div class="table-wrap">
			<table class="data">
				<thead><tr><th>Company</th><th>State</th><th>Registered</th><th></th></tr></thead>
				<tbody>
					{#each data.pending as m (m.id)}
						<tr
							><td><strong>{m.companyName}</strong></td><td>{m.state}</td><td
								>{formatDateTime(m.createdAt)}</td
							><td><a class="btn btn-small" href="/console/applications/{m.id}">Review</a></td></tr
						>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>

<section class="stack" style="--gap: 12px">
	<h2>Waiting for the manufacturer ({data.infoRequested.length})</h2>
	{#each data.infoRequested as m (m.id)}
		<p>
			<a href="/console/applications/{m.id}">{m.companyName}</a>
			<span class="chip chip-warn">Information requested</span>
		</p>
	{:else}
		<p class="muted small">None.</p>
	{/each}
</section>

<section class="stack" style="--gap: 12px">
	<h2>Pharmacies, hospitals and distributors ({data.businessPending.length})</h2>
	{#each data.businessPending as b (b.id)}
		<p>
			<a href="/console/business-accounts/{b.id}">{b.name}</a>
			<span class="small muted"
				>· {PARTY_ROLE[b.role] ?? b.role} · {b.state} · PCN
				<span class="mono">{b.pcnLicence}</span></span
			>
		</p>
	{:else}
		<p class="muted small">None.</p>
	{/each}
</section>

{#if data.rejected.length}
	<section class="stack" style="--gap: 12px">
		<h2>Rejected ({data.rejected.length})</h2>
		<p class="help">Open one to reopen it, for example after the company contacts DETECK.</p>
		{#each data.rejected as m (m.id)}
			<p>
				<a href="/console/applications/{m.id}">{m.companyName}</a>
				<span class="chip chip-bad">Rejected</span>
			</p>
		{/each}
	</section>
{/if}

<section class="stack" style="--gap: 12px">
	<h2>Go-live reviews ({data.inReview.length})</h2>
	{#each data.inReview as m (m.id)}
		<p>
			<a href="/console/manufacturers/{m.id}/review">{m.companyName}</a>
			<a class="btn btn-small" href="/console/manufacturers/{m.id}/review">Review data</a>
			<span class="small muted"
				>· {countOf(m.products, 'drug', 'drugs')} · {countOf(m.serials, 'serial', 'serials')} · submitted
				{formatDateTime(m.submittedForReviewAt)}</span
			>
		</p>
	{:else}
		<p class="muted small">None.</p>
	{/each}
</section>
