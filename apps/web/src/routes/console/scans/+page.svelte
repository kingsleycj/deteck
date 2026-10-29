<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateTime, formatNumber } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const a = $derived(data.accuracy);
	const SIDE: Record<string, string> = { front: 'Front', back: 'Back', label: 'Label and batch' };
	const ORDER = ['front', 'back', 'label'];
</script>

<svelte:head><title>Packaging scans · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<h1>Packaging scans</h1>
		<p class="small muted">
			Scans whose photos people agreed to share. Say whether the AI's answer was right: the verdicts
			measure its accuracy. Photos are deleted 90 days after the scan.
		</p>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<section class="stats">
	<div class="stat">
		<span class="k">Scans, last {a.days} days</span><span class="n">{formatNumber(a.total)}</span>
	</div>
	<div class="stat">
		<span class="k">Reviewer agreement</span><span class="n"
			>{a.agreement === null ? '—' : `${Math.round(a.agreement * 100)}%`}</span
		><span class="d"
			>{a.agreement === null
				? 'Shown after 10 reviewed scans'
				: `from ${formatNumber(a.labelled)} reviewed`}</span
		>
	</div>
	<div class="stat">
		<span class="k">AI service errors</span><span class="n">{formatNumber(a.serviceErrors)}</span
		><span class="d">Errors, timeouts and refusals</span>
	</div>
	<div class="stat">
		<span class="k">Waiting for review</span><span class="n"
			>{formatNumber(a.waitingForReview)}</span
		>
	</div>
</section>

{#if a.reasons.length}
	<p class="small muted">
		"Can't tell" reasons:
		{#each a.reasons as r, i (r.reason)}{i ? ' · ' : ''}{data.reasons[r.reason] ?? r.reason}: {r.n}{/each}
	</p>
{/if}

<p class="row" style="--gap: 8px; margin: 16px 0">
	<a class="btn btn-small {data.unlabelled ? 'btn-primary' : ''}" href="?">Not reviewed yet</a>
	<a class="btn btn-small {data.unlabelled ? '' : 'btn-primary'}" href="?show=all"
		>All shared scans</a
	>
</p>

<div class="stack" style="--gap: 16px">
	{#each data.scans as s (s.id)}
		<article class="panel stack" style="--gap: 10px">
			<div class="row" style="--gap: 8px; justify-content: space-between">
				<div>
					<strong>{s.drug ?? 'Unknown drug'}</strong>
					<p class="small muted">
						{formatDateTime(s.createdAt)} · {s.model && s.model !== 'none'
							? s.model
							: 'no AI model'}
					</p>
				</div>
				<span class="chip"
					>{data.outcomes[s.outcome ?? ''] ?? s.outcome}{s.confidence !== null
						? ` · ${Math.round(s.confidence * 100)}%`
						: ''}</span
				>
			</div>
			<div class="photos">
				{#each ORDER.filter((side) => s.photoSides.includes(side)) as side (side)}
					<a href="/console/scans/{s.id}/{side}" target="_blank" rel="noopener">
						<img
							src="/console/scans/{s.id}/{side}"
							alt="{SIDE[side] ?? side} of the pack"
							loading="lazy"
						/>
						<span class="tiny muted">{SIDE[side] ?? side}</span>
					</a>
				{/each}
			</div>
			{#if s.categories?.length}
				<ul class="small">
					{#each s.categories as c, i (i)}<li><strong>{c.category}</strong>: {c.detail}</li>{/each}
				</ul>
			{/if}
			{#if s.error}<p class="small muted">Reason: {data.reasons[s.error] ?? s.error}</p>{/if}
			{#if s.reviewLabel}
				<p class="small">
					<strong>Verdict:</strong>
					{data.labels[s.reviewLabel as keyof typeof data.labels] ?? s.reviewLabel}
					{#if s.reviewer}<span class="muted">
							· {s.reviewer}, {formatDateTime(s.reviewedAt)}</span
						>{/if}
					{#if s.reviewNote}<br /><span class="muted">"{s.reviewNote}"</span>{/if}
				</p>
			{/if}
			<details open={!s.reviewLabel}>
				<summary class="small">{s.reviewLabel ? 'Change verdict' : 'Give a verdict'}</summary>
				<form method="post" action="?/label" class="stack" style="--gap: 8px; margin-top: 8px">
					<input type="hidden" name="id" value={s.id} />
					<fieldset class="stack" style="--gap: 6px; border: 0; padding: 0; margin: 0">
						<legend class="visually-hidden">Verdict</legend>
						{#each Object.entries(data.labels) as [value, label] (value)}
							<label class="row small" style="--gap: 8px"
								><input
									type="radio"
									name="label"
									{value}
									required
									checked={s.reviewLabel === value}
								/>
								{label}</label
							>
						{/each}
					</fieldset>
					<input
						name="note"
						class="input"
						maxlength="1000"
						placeholder="Note (optional)"
						aria-label="Note"
					/>
					<div><button class="btn btn-small btn-primary">Save verdict</button></div>
				</form>
			</details>
		</article>
	{:else}
		<p class="muted">
			{data.unlabelled ? 'Nothing waiting for review.' : 'No shared scans in the last 90 days.'}
		</p>
	{/each}
</div>

<style>
	.photos {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
	}
	.photos a {
		display: grid;
		gap: 4px;
		text-decoration: none;
	}
	.photos img {
		width: 140px;
		height: 140px;
		object-fit: cover;
		border-radius: 10px;
		background: var(--surface-2, #eee);
	}
</style>
