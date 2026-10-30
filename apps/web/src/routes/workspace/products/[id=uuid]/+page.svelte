<script lang="ts">
	import type { PageProps } from './$types';
	import BatchTable from '#lib/ui/BatchTable.svelte';
	import { appliesTo, PACKAGING_STATUS } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const p = $derived(data.detail);
	const fields = [
		['brandName', 'Brand name'],
		['genericName', 'Generic name'],
		['strength', 'Strength'],
		['dosageForm', 'Dosage form'],
		['packSize', 'Pack size'],
		['nafdacRegNo', 'NAFDAC reg. no.']
	] as const;
	// The same rule as the server's (suspended companies can fix their records too).
	const canEdit = $derived(!data.company.editBlocked);
	const typedValues = $derived(
		form && 'values' in form ? (form.values as Record<string, string>) : undefined
	);
</script>

<svelte:head><title>{p.brandName} {p.strength} · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace/products">Products</a> / {p.brandName}</p>
		<h1>{p.brandName} {p.strength}</h1>
		<p class="small muted">
			GTIN <span class="mono">{p.gtin}</span> · NAFDAC
			<span class="mono">{p.nafdacRegNo}</span>{#if p.status !== 'active'}
				· <span class="chip chip-bad"
					>{p.status === 'pending_review'
						? "Waiting for DETECK review: people can't check it yet"
						: p.status === 'rejected'
							? "Not approved by DETECK: people can't check it"
							: p.status === 'flagged'
								? 'Flagged by DETECK'
								: 'Deactivated by DETECK'}</span
				>{/if}
		</p>
	</div>
	<a class="btn btn-small" href="/workspace/packaging/{p.id}">Packaging photos</a>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}
{#if p.statusReason}<p class="notice small">DETECK note: "{p.statusReason}"</p>{/if}

<section class="stack" style="--gap: 12px">
	<h2>Batches</h2>
	<BatchTable
		batches={p.batches}
		canChangeStatus={data.access.isAdmin &&
			(!data.access.onBehalf || data.access.staffRole === 'admin')}
		canReactivate={data.access.onBehalf && data.access.staffRole === 'admin'}
	/>
</section>

<div class="two-col">
	{#if canEdit}
		<form method="post" action="?/edit" class="panel">
			<h2>Correct the drug details</h2>
			<div class="form-grid">
				{#each fields as [key, label] (key)}
					<div class="field">
						<label for={key}>{label}</label><input
							id={key}
							name={key}
							defaultValue={typedValues?.[key] ?? p[key]}
							required
						/>
					</div>
				{/each}
				<div class="field span-2">
					<label for="serialHint"
						>Where the serial is printed (optional, for DETECK reviewers)</label
					><input
						id="serialHint"
						name="serialHint"
						defaultValue={typedValues?.serialHint ?? p.serialHint ?? ''}
						placeholder="e.g. After SN, next to the barcode on the back"
					/>
				</div>
			</div>
			<p class="help">The GTIN can't be changed. Every edit is recorded in the audit trail.</p>
			<button class="btn btn-primary">Save changes</button>
		</form>
	{/if}
	<aside class="panel">
		<h3>Packaging references</h3>
		{#each p.references as r (r.id)}
			<p class="small">
				Version {r.version} · {appliesTo(r.effectiveFrom)}
				<span class="chip {PACKAGING_STATUS[r.status]?.chip ?? ''}"
					>{PACKAGING_STATUS[r.status]?.label ?? r.status}</span
				>
			</p>
		{:else}
			<p class="small muted">No packaging photos yet.</p>
		{/each}
		<a class="btn btn-small" href="/workspace/packaging/{p.id}">Add packaging photos</a>
	</aside>
</div>
