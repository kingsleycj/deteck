<script lang="ts">
	import type { PageProps } from './$types';
	import { PACKAGING_STATUS } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const ready = $derived(data.products.filter((p) => p.packaging === 'ready').length);
</script>

<svelte:head><title>Packaging photos · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Packaging photos</p>
		<h1>Packaging photos</h1>
		<p class="small muted">{ready} of {data.products.length} drugs ready for the packaging check</p>
	</div>
</div>

<p class="notice small">
	The packaging check (beta) compares photos people take of a pack with the photos you upload here.
	Upload the front, the back and the label for each drug. Photos of the sides and of a security
	feature are optional but help. When your packaging changes, start a new version with the date the
	new pack was first made, so older batches are still compared with the old pack.
</p>

<div class="table-wrap">
	<table class="data">
		<thead><tr><th>Drug</th><th>GTIN</th><th>Packaging</th><th></th></tr></thead>
		<tbody>
			{#each data.products as p (p.id)}
				<tr>
					<td
						><strong>{p.brandName} {p.strength}</strong><span class="sub"
							>{p.genericName} · {p.dosageForm} · {p.packSize}</span
						></td
					>
					<td class="mono">{p.gtin}</td>
					<td
						><span class="chip {PACKAGING_STATUS[p.packaging].chip}"
							>{PACKAGING_STATUS[p.packaging].label}</span
						></td
					>
					<td
						><a class="btn btn-small" href="/workspace/packaging/{p.id}"
							>{p.packaging === 'missing' ? 'Add photos' : 'Manage'}</a
						></td
					>
				</tr>
			{:else}
				<tr
					><td colspan="4" class="muted"
						>No drugs yet. <a href="/workspace/import">Import your drug list</a> first.</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
