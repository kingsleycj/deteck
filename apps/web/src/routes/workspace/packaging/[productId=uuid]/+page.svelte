<script lang="ts">
	import Upload from '#lib/ui/Upload.svelte';
	import type { PageProps } from './$types';
	import { appliesTo, PACKAGING_STATUS } from '#lib/ui/status.ts';
	import { lagosToday } from '@deteck/core/dates.ts';

	let { data, form }: PageProps = $props();

	const sides = [
		['front', 'Front'],
		['back', 'Back'],
		['left', 'Left side (optional)'],
		['right', 'Right side (optional)'],
		['label', 'Label (batch and expiry)'],
		['security', 'Security feature (optional)']
	] as const;
	const required = ['front', 'back', 'label'];

	const open = $derived(
		data.references.find((r) => r.status === 'draft' || r.status === 'rejected')
	);
	const others = $derived(data.references.filter((r) => r.id !== open?.id));
	const processing = $derived(data.references.some((r) => r.status === 'processing'));
	const passing = $derived(
		open ? required.filter((s) => open.images.some((i) => i.side === s && i.passed)).length : 0
	);
	const imageFor = (side: string) => open?.images.find((i) => i.side === side);
	const today = lagosToday();
</script>

<svelte:head>
	<title>Packaging photos · {data.product.name} · DETECK</title>
	{#if processing}<meta http-equiv="refresh" content="3" />{/if}
</svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace/packaging">Packaging photos</a> / {data.product.name}</p>
		<h1>{data.product.name}</h1>
		<p class="small muted">GTIN <span class="mono">{data.product.gtin}</span></p>
	</div>
	<a class="btn btn-small" href="/workspace/products/{data.product.id}">Drug details</a>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message && !('side' in form && form.side)}<p
		class="notice notice-error"
		role="alert"
	>
		{form.message}
	</p>{/if}
{#if processing}<p class="notice small" role="status">
		Checking the photos you submitted… This page refreshes by itself.
	</p>{/if}

{#if open}
	<section class="panel stack" style="--gap: 14px">
		<div class="row" style="justify-content: space-between">
			<h2>Version {open.version} · for {appliesTo(open.effectiveFrom)}</h2>
			<span class="chip {PACKAGING_STATUS[open.status]?.chip ?? ''}"
				>{PACKAGING_STATUS[open.status]?.label ?? open.status}</span
			>
		</div>
		{#if open.rejectionReason}<p class="notice notice-error small">{open.rejectionReason}</p>{/if}
		<p class="help">
			Lay the pack flat on a plain surface in daylight, fill the frame with one side and avoid
			glare. Photos must be at least 1,000 px on the short side.
		</p>

		<div class="side-grid">
			{#each sides as [side, label] (side)}
				{@const image = imageFor(side)}
				<form
					method="post"
					action="?/upload"
					enctype="multipart/form-data"
					class="side"
					class:bad={image && !image.passed}
				>
					<input type="hidden" name="referenceId" value={open.id} />
					<input type="hidden" name="side" value={side} />
					<div class="side-photo">
						{#if image && image.width > 0}<img
								src="/workspace/packaging/image/{image.id}"
								alt="{label} of the pack"
								loading="lazy"
							/>{:else}<span class="muted small">No photo</span>{/if}
					</div>
					<p><strong>{label}</strong></p>
					{#if image?.passed}<p class="small" style="color: var(--lime-ink)">
							✓ Passed · {image.width}×{image.height}
						</p>{/if}
					{#if image && !image.passed}<p class="error-text small">{image.failReason}</p>{/if}
					{#if form && 'side' in form && form.side === side && form.message && (!image || image.passed)}<p
							class="error-text small"
						>
							{form.message}
						</p>{/if}
					<Upload
						id="photo-{side}"
						name="photo"
						title="Photo of the {label.toLowerCase()}"
						hint={image ? 'Choose another to replace it' : 'JPG, PNG or WebP, sharp and evenly lit'}
						accept="image/jpeg,image/png,image/webp"
						required
					/>
					<button class="btn btn-small">{image ? 'Replace' : 'Upload'}</button>
				</form>
			{/each}
		</div>

		<form method="post" action="?/submit" class="row" style="justify-content: space-between">
			<input type="hidden" name="referenceId" value={open.id} />
			<span class="small muted">{passing} of {required.length} required photos passed</span>
			<button class="btn btn-primary" disabled={passing < required.length}
				>Submit for the packaging check</button
			>
		</form>
	</section>
{:else}
	<form method="post" action="?/newVersion" class="panel stack" style="--gap: 12px">
		<h2>
			{data.references.length
				? 'Packaging changed? Start a new version'
				: 'Add the packaging photos'}
		</h2>
		<p class="help">
			{data.references.length
				? 'Batches made on or after this date will be compared with the new photos. Older batches keep using the earlier version.'
				: 'This first version applies to every batch of this drug until you add a newer one.'}
		</p>
		{#if data.references.length}
			<div class="field" style="max-width: 240px">
				<label for="effectiveFrom">New pack first made on</label><input
					id="effectiveFrom"
					name="effectiveFrom"
					type="date"
					value={today}
					required
				/>
			</div>
		{/if}
		<button class="btn btn-primary"
			>{data.references.length
				? 'Start version ' + (data.references[0].version + 1)
				: 'Start adding photos'}</button
		>
	</form>
{/if}

{#if others.length}
	<section class="stack" style="--gap: 12px">
		<h2>Versions</h2>
		<div class="table-wrap">
			<table class="data">
				<thead><tr><th>Version</th><th>Applies to</th><th>Photos</th><th>Status</th></tr></thead>
				<tbody>
					{#each others as r (r.id)}
						<tr>
							<td>Version {r.version}</td>
							<td>{appliesTo(r.effectiveFrom)}</td>
							<td>{r.images.filter((i) => i.passed).length}</td>
							<td
								><span class="chip {PACKAGING_STATUS[r.status]?.chip ?? ''}"
									>{PACKAGING_STATUS[r.status]?.label ?? r.status}</span
								></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

<style>
	.side-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 12px;
	}
	.side {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 12px;
		border: 1px solid var(--line, #e3e5ea);
		border-radius: 12px;
	}
	.side.bad {
		border-color: var(--red);
	}
	.side-photo {
		aspect-ratio: 4 / 3;
		border-radius: 8px;
		background: var(--grey-100);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.side-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
</style>
