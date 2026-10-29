<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDate, formatMonth } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Received stock · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/portal">Overview</a> / Received stock</p>
		<h1>Received stock</h1>
	</div>
	<a href="/portal/check" class="btn btn-small">Check a delivery</a>
</div>

<div class="table-wrap">
	<table class="data">
		<thead
			><tr><th>Received</th><th>Drug</th><th>Batch</th><th>Expires</th><th>Batch status</th></tr
			></thead
		>
		<tbody>
			{#each data.rows as r (r.id)}
				<tr>
					<td>{formatDate(r.eventDate)}</td>
					<td>{r.drug}</td>
					<td class="mono">{r.lot}</td>
					<td>{formatMonth(r.expiryDate)}</td>
					<td
						>{#if r.batchStatus === 'active'}<span class="chip chip-ok">Active</span>{:else}<span
								class="chip chip-bad"
								>{r.batchStatus === 'recalled' ? 'Recalled' : 'Withdrawn'}</span
							>{/if}</td
					>
				</tr>
			{:else}
				<tr
					><td colspan="5" class="muted"
						>Nothing recorded yet. <a href="/portal/check">Check a delivery</a>.</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
