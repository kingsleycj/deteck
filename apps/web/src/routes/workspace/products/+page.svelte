<script lang="ts">
	import type { PageProps } from './$types';
	import { formatNumber, PACKAGING_STATUS } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Products and batches · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Products</p>
		<h1>Products and batches</h1>
	</div>
	<a href="/workspace/import" class="btn btn-small">Import data</a>
</div>

<div class="table-wrap">
	<table class="data">
		<thead
			><tr
				><th>Drug</th><th>GTIN</th><th>NAFDAC no.</th><th>Batches</th><th>Serials</th><th
					>Packaging</th
				></tr
			></thead
		>
		<tbody>
			{#each data.products as p (p.id)}
				<tr>
					<td
						><a href="/workspace/products/{p.id}"><strong>{p.brandName} {p.strength}</strong></a
						><span class="sub">{p.genericName} · {p.dosageForm} · {p.packSize}</span></td
					>
					<td class="mono">{p.gtin}</td>
					<td class="mono">{p.nafdacRegNo}</td>
					<td>{formatNumber(p.batches)}</td>
					<td>{formatNumber(p.serials)}</td>
					<td
						><span class="chip {PACKAGING_STATUS[p.packaging].chip}"
							>{PACKAGING_STATUS[p.packaging].label}</span
						></td
					>
				</tr>
			{:else}
				<tr
					><td colspan="6" class="muted"
						>No drugs yet. <a href="/workspace/import">Import your drug list</a>.</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
