<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const STATUS: Record<string, { label: string; chip: string }> = {
		new: { label: 'New', chip: 'chip-warn' },
		investigating: { label: 'Investigating', chip: 'chip-progress' },
		referred: { label: 'Referred to NAFDAC', chip: 'chip-progress' },
		closed: { label: 'Closed', chip: '' }
	};
	const tabs = $derived([
		[
			'open',
			`Open (${(data.counts.new ?? 0) + (data.counts.investigating ?? 0) + (data.counts.referred ?? 0)})`
		],
		['new', `New (${data.counts.new ?? 0})`],
		['closed', `Closed (${data.counts.closed ?? 0})`],
		['all', 'All']
	]);
</script>

<svelte:head><title>Reports · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Admin and monitoring</p>
		<h1>Reports of suspected fakes</h1>
	</div>
	<nav class="tabs" aria-label="Status">
		{#each tabs as [key, label] (key)}<a
				href="?status={key}"
				aria-current={data.status === key ? 'page' : undefined}>{label}</a
			>{/each}
	</nav>
</div>

{#if data.rows.length === 0}
	<div class="empty">
		<div style="width: 90px"><Mascot mood="happy" /></div>
		<h3>No reports here</h3>
		<p class="small muted">Reports people send from the checker appear here.</p>
	</div>
{:else}
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr
					><th>Received</th><th>Medicine</th><th>Where bought</th><th>Check said</th><th>Photos</th
					><th>Status</th></tr
				></thead
			>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td>{formatDateTime(r.createdAt)}</td>
						<td
							><a href="/console/reports/{r.id}"
								><strong>{r.productDescription ?? 'Not given'}</strong></a
							>{#if r.manufacturerName}<span class="sub">{r.manufacturerName}</span>{/if}</td
						>
						<td
							>{r.placeName}<span class="sub">{[r.town, r.state].filter(Boolean).join(', ')}</span
							></td
						>
						<td class="mono small">{r.resultCode}</td>
						<td>{r.photos}</td>
						<td><span class="chip {STATUS[r.status].chip}">{STATUS[r.status].label}</span></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
