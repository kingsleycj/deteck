<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatNumber, MANUFACTURER_STATUS } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const total = $derived(Object.values(data.counts).reduce((a, b) => a + b, 0));
	const serials = $derived(data.rows.reduce((a, r) => a + r.serials, 0));
	const filters = ['live', 'approved', 'in_review', 'pending', 'suspended'];
</script>

<svelte:head><title>Manufacturers · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">DETECK team console</p>
		<h1>Manufacturers</h1>
	</div>
	<form method="get" class="row" style="--gap: 8px">
		{#if data.status}<input type="hidden" name="status" value={data.status} />{/if}
		<input
			class="input"
			name="q"
			value={data.q}
			placeholder="Search manufacturers"
			aria-label="Search manufacturers"
			style="min-width: 240px"
		/>
		<button class="btn btn-small">Search</button>
	</form>
</div>

<section class="stats">
	<div class="stat">
		<span class="k">Manufacturers</span><span class="n">{formatNumber(total)}</span>
	</div>
	<div class="stat">
		<span class="k">Live</span><span class="n">{formatNumber(data.counts.live)}</span>
	</div>
	<div class="stat">
		<span class="k">Waiting for review</span><span class="n"
			>{formatNumber((data.counts.pending ?? 0) + (data.counts.in_review ?? 0))}</span
		>
	</div>
	<div class="stat dark">
		<span class="k">Serials on record (shown)</span><span class="n">{formatNumber(serials)}</span>
	</div>
</section>

<nav class="tabs" aria-label="Filter by status">
	<a href="/console/manufacturers" aria-current={!data.status ? 'page' : undefined}>All {total}</a>
	{#each filters as f (f)}
		<a href="?status={f}" aria-current={data.status === f ? 'page' : undefined}
			>{MANUFACTURER_STATUS[f].label} {data.counts[f] ?? 0}</a
		>
	{/each}
</nav>

{#if data.rows.length === 0}
	<div class="empty">
		<div style="width: 100px"><Mascot mood="wink" /></div>
		<h3>{data.q ? `No manufacturer matches "${data.q}"` : 'No manufacturers yet'}</h3>
		<p class="muted small">
			{data.q
				? 'Check the spelling, or clear the search.'
				: 'Manufacturers appear here when they register.'}
		</p>
	</div>
{:else}
	<div class="table-wrap">
		<table class="data">
			<thead><tr><th>Manufacturer</th><th>Status</th><th>Drugs</th><th>Serials</th></tr></thead>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td
							><a href="/console/manufacturers/{r.id}"><strong>{r.companyName}</strong></a><span
								class="sub">{[r.town, r.state].filter(Boolean).join(', ')}</span
							></td
						>
						<td
							><span class="chip {MANUFACTURER_STATUS[r.status].chip}"
								>{MANUFACTURER_STATUS[r.status].label}</span
							></td
						>
						<td>{formatNumber(r.products)}</td>
						<td>{formatNumber(r.serials)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
