<script lang="ts">
	import type { PageProps } from './$types';
	import BatchTable from '#lib/ui/BatchTable.svelte';
	import {
		MANUFACTURER_STATUS,
		PACKAGING_STATUS,
		PRODUCT_STATUS,
		appliesTo
	} from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const p = $derived(data.detail);
</script>

<svelte:head><title>{p.brandName} {p.strength} · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/console/drugs">Drugs</a> / {p.brandName}</p>
		<h1>{p.brandName} {p.strength}</h1>
		<p class="small muted">
			<a href="/console/manufacturers/{p.manufacturerId}">{p.manufacturerName}</a>
			({MANUFACTURER_STATUS[p.manufacturerStatus].label}) · GTIN <span class="mono">{p.gtin}</span>
			· NAFDAC <span class="mono">{p.nafdacRegNo}</span>
		</p>
	</div>
	{#if p.status !== 'active'}<span class="chip chip-bad"
			>{PRODUCT_STATUS[p.status] ?? p.status}</span
		>{/if}
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}
{#if p.statusReason}<p class="notice small">Reason: "{p.statusReason}"</p>{/if}

<section class="stack" style="--gap: 12px">
	<h2>Batches</h2>
	<BatchTable
		batches={p.batches}
		canChangeStatus={data.staff.isAdmin}
		batchHref={(id) => `/console/drugs/${p.id}/batches/${id}`}
	/>
	<p class="small muted">
		Open a batch to correct its details, void a serial or fix a supply chain record.
	</p>
</section>

<div class="two-col">
	<section class="panel">
		<h2>Details</h2>
		<dl class="facts">
			<div>
				<dt>Generic name</dt>
				<dd>{p.genericName}</dd>
			</div>
			<div>
				<dt>Dosage form</dt>
				<dd>{p.dosageForm}</dd>
			</div>
			<div>
				<dt>Pack size</dt>
				<dd>{p.packSize}</dd>
			</div>
			<div>
				<dt>Serial printed</dt>
				<dd>{p.serialHint ?? '—'}</dd>
			</div>
		</dl>
		<h3>Packaging references</h3>
		{#each p.references as r (r.id)}
			<p class="small">
				Version {r.version} · {appliesTo(r.effectiveFrom)}
				<span class="chip {PACKAGING_STATUS[r.status]?.chip ?? ''}"
					>{PACKAGING_STATUS[r.status]?.label ?? r.status}</span
				>
			</p>
		{:else}
			<p class="small muted">None.</p>
		{/each}
	</section>
	<form method="post" action="?/productStatus" class="panel">
		<h3>{p.status === 'pending_review' ? 'Review this new drug' : 'Flag or deactivate'}</h3>
		<p class="small muted">
			{p.status === 'pending_review'
				? "A live manufacturer added this drug. Its serials aren't checkable until it's approved (Active). Choose Rejected to turn it down: it then stays hidden."
				: data.staff.isAdmin
					? 'Flagging is internal. Deactivating stops Valid results for every serial of this drug.'
					: 'Flagging is internal. Only an admin can deactivate or reactivate a drug.'}
		</p>
		<div class="field">
			<label for="status">Status</label>
			<select id="status" name="status">
				{#if p.status === 'pending_review'}<option value="" selected disabled
						>Waiting for review</option
					>{/if}
				{#if p.status === 'rejected'}<option value="" selected disabled
						>Rejected (hidden from the public)</option
					>{/if}
				<option value="active" selected={p.status === 'active'}>Active</option>
				<!-- Flagging keeps a drug public: only for drugs DETECK has already approved. -->
				{#if p.status !== 'pending_review' && p.status !== 'rejected'}<option
						value="flagged"
						selected={p.status === 'flagged'}>Flagged for review</option
					>{/if}
				{#if data.staff.isAdmin || p.status === 'pending_review'}<option
						value="deactivated"
						selected={p.status === 'deactivated'}
						>{p.status === 'pending_review' ? 'Rejected' : 'Deactivated'}</option
					>{:else if p.status === 'deactivated'}<option value="" selected disabled
						>Deactivated</option
					>{/if}
			</select>
		</div>
		<div class="field">
			<label for="reason">Reason (required)</label><textarea
				id="reason"
				name="reason"
				required
				minlength="3"></textarea>
		</div>
		<button class="btn btn-small">Save status</button>
	</form>
</div>
