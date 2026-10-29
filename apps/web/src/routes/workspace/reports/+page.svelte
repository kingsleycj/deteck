<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const STATUS: Record<string, string> = {
		new: 'New',
		investigating: 'DETECK is investigating',
		referred: 'Referred to NAFDAC',
		closed: 'Closed'
	};
</script>

<svelte:head><title>Reports · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Reports</p>
		<h1>Reports about your drugs</h1>
	</div>
</div>

<p class="small muted" style="max-width: 760px">
	People can report a pack they think is fake. You see the reports they agreed to share, without
	their contact details. DETECK follows up each one and may contact you about it.
</p>

{#if data.rows.length === 0}
	<div class="empty">
		<div style="width: 90px"><Mascot mood="happy" /></div>
		<h3>No reports</h3>
		<p class="small muted">Nobody has reported a suspected fake of your drugs.</p>
	</div>
{:else}
	<div class="table-wrap">
		<table class="data">
			<thead><tr><th>Received</th><th>Drug</th><th>Where bought</th><th>Status</th></tr></thead>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td>{formatDateTime(r.createdAt)}</td>
						<td><a href="/workspace/reports/{r.id}"><strong>{r.productDescription}</strong></a></td>
						<td
							>{r.placeName}<span class="sub">{[r.town, r.state].filter(Boolean).join(', ')}</span
							></td
						>
						<td>{STATUS[r.status]}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
