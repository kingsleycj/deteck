<script lang="ts">
	import SearchField from '#lib/ui/SearchField.svelte';
	import type { PageProps } from './$types';
	import {
		formatDateTime,
		formatNumber,
		MANUFACTURER_STATUS,
		PACKAGING_STATUS,
		PRODUCT_STATUS
	} from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Drugs · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">DETECK team console</p>
		<h1>Drugs and batches</h1>
	</div>
	<form method="get" class="page-search" role="search">
		<SearchField
			value={data.q}
			label="Search drugs"
			placeholder="Name, NAFDAC no., GTIN, manufacturer or batch"
			wide
		/>
	</form>
</div>

{#if data.waiting.length}
	<section class="panel" style="border-color: var(--peach)">
		<h2>New drugs waiting for review ({data.waiting.length})</h2>
		<p class="small muted">
			Live manufacturers added these. People can't check them until you approve each one: compare
			the GTIN and NAFDAC number with the NAFDAC Green Book.
		</p>
		{#each data.waiting as r (r.id)}
			<p>
				<a href="/console/drugs/{r.id}"><strong>{r.brand_name} {r.strength}</strong></a>
				<span class="small muted"
					>· {r.manufacturer_name} · GTIN <span class="mono">{r.gtin}</span> · NAFDAC
					<span class="mono">{r.nafdac_reg_no}</span></span
				>
			</p>
		{/each}
	</section>
{/if}

<div class="table-wrap">
	<table class="data">
		<thead
			><tr
				><th>Drug</th><th>Manufacturer</th><th>NAFDAC no.</th><th>Serials</th><th>Packaging</th><th
					>Status</th
				><th>Last update</th></tr
			></thead
		>
		<tbody>
			{#each data.rows as r (r.id)}
				<tr>
					<td
						><a href="/console/drugs/{r.id}"><strong>{r.brand_name} {r.strength}</strong></a><span
							class="sub">{r.generic_name} · <span class="mono">{r.gtin}</span></span
						></td
					>
					<td
						>{r.manufacturer_name}<span class="sub"
							>{MANUFACTURER_STATUS[r.manufacturer_status].label}</span
						></td
					>
					<td class="mono">{r.nafdac_reg_no}</td>
					<td>{formatNumber(r.serials)}</td>
					<td
						><span
							class="chip {PACKAGING_STATUS[
								r.packaging === 'ready' || r.packaging === 'rejected'
									? r.packaging
									: r.packaging
										? 'processing'
										: 'missing'
							].chip}"
							>{PACKAGING_STATUS[
								r.packaging === 'ready' || r.packaging === 'rejected'
									? r.packaging
									: r.packaging
										? 'processing'
										: 'missing'
							].label}</span
						></td
					>
					<td
						>{#if r.status === 'active'}<span class="chip chip-ok">Active</span>{:else}<span
								class="chip chip-bad">{PRODUCT_STATUS[r.status] ?? r.status}</span
							>{/if}</td
					>
					<td class="small">{formatDateTime(r.updated_at)}</td>
				</tr>
			{:else}
				<tr
					><td colspan="7" class="muted"
						>{data.q ? `Nothing matches "${data.q}".` : 'No drugs yet.'}</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
