<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatDateTime, formatNumber } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Unusual checks · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Admin and monitoring</p>
		<h1>Unusual checks</h1>
	</div>
	<nav class="tabs" aria-label="Period">
		{#each [[1, 'Today'], [7, '7 days'], [30, '30 days']] as [d, label] (d)}<a
				href="?days={d}"
				aria-current={data.days === d ? 'page' : undefined}>{label}</a
			>{/each}
	</nav>
</div>

<p class="small muted" style="max-width: 760px">
	Serials checked from 8 or more devices, or from 3 or more states, in the period. This can mean a
	code has been copied onto other packs, but repeated checks alone don't prove it: buyers,
	pharmacists and patients may all check the same pack. Serials are shown only as a reference code.
	Use the drug page to flag the drug or recall a batch after investigating.
</p>

{#if data.rows.length === 0}
	<div class="empty">
		<div style="width: 90px"><Mascot mood="happy" /></div>
		<h3>Nothing unusual</h3>
		<p class="small muted">No serial was checked unusually often in this period.</p>
	</div>
{:else}
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr
					><th>Serial reference</th><th>Drug</th><th>Batch</th><th>Checks</th><th>Devices</th><th
						>States</th
					><th>Last seen</th></tr
				></thead
			>
			<tbody>
				{#each data.rows as r (r.key)}
					<tr>
						<td class="mono small">{r.key.slice(0, 10)}…</td>
						<td
							>{r.product ?? 'Unrecognised serial'}<span class="sub">{r.manufacturer ?? ''}</span
							></td
						>
						<td class="mono">{r.lot ?? '—'}</td>
						<td>{formatNumber(r.checks)}</td>
						<td><strong>{formatNumber(r.devices)}</strong></td>
						<td>{r.states}</td>
						<td class="small">{formatDateTime(r.last_seen)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
