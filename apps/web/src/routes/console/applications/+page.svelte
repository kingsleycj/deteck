<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();

	type Tab = 'waiting' | 'manufacturer' | 'business' | 'golive' | 'applicant' | 'rejected';
	const TABS: { key: Tab; label: string }[] = [
		{ key: 'waiting', label: 'Needs a decision' },
		{ key: 'manufacturer', label: 'Manufacturers' },
		{ key: 'business', label: 'Pharmacies and distributors' },
		{ key: 'golive', label: 'Go-live reviews' },
		{ key: 'applicant', label: 'Waiting for the applicant' },
		{ key: 'rejected', label: 'Rejected' }
	];
	const tab = $derived(
		(TABS.find((x) => x.key === page.url.searchParams.get('tab'))?.key ?? 'waiting') as Tab
	);
	const decide = $derived(data.items.filter((i) => i.stage === 'new' || i.stage === 'golive'));
	const shown = $derived(
		tab === 'waiting'
			? decide
			: tab === 'manufacturer'
				? decide.filter((i) => i.group === 'manufacturer' && i.stage === 'new')
				: tab === 'business'
					? decide.filter((i) => i.group === 'business')
					: tab === 'golive'
						? decide.filter((i) => i.stage === 'golive')
						: tab === 'applicant'
							? data.items.filter((i) => i.stage === 'waiting')
							: data.items.filter((i) => i.stage === 'rejected')
	);
	const count = (key: Tab) =>
		key === 'waiting'
			? decide.length
			: key === 'manufacturer'
				? decide.filter((i) => i.group === 'manufacturer' && i.stage === 'new').length
				: key === 'business'
					? decide.filter((i) => i.group === 'business').length
					: key === 'golive'
						? decide.filter((i) => i.stage === 'golive').length
						: key === 'applicant'
							? data.items.filter((i) => i.stage === 'waiting').length
							: data.items.filter((i) => i.stage === 'rejected').length;

	const STAGE: Record<string, { label: string; chip: string; action: string }> = {
		new: { label: 'New application', chip: 'chip-progress', action: 'Review' },
		golive: { label: 'Go-live review', chip: 'chip-ok', action: 'Review data' },
		waiting: { label: 'Information requested', chip: 'chip-warn', action: 'Open' },
		rejected: { label: 'Rejected', chip: 'chip-bad', action: 'Open' }
	};
	// Whole days in Nigeria (UTC+1), so yesterday evening reads "Yesterday", not "Today".
	const lagosDay = (ms: number) => Math.floor((ms + 3_600_000) / 86_400_000);
	const today = lagosDay(Date.now());
	const daysWaiting = (iso: string) => today - lagosDay(Date.parse(iso));
	const age = (item: { since: string; stage: string }) => {
		const d = daysWaiting(item.since);
		if (item.stage === 'waiting')
			return d === 0 ? 'Asked today' : d === 1 ? 'Asked yesterday' : `Asked ${d} days ago`;
		return d === 0 ? 'Today' : d === 1 ? 'Yesterday' : `${d} days`;
	};
	const tiles: { key: Tab; label: string; note: string }[] = [
		{ key: 'manufacturer', label: 'Manufacturers', note: 'New company applications' },
		{ key: 'business', label: 'Pharmacies and distributors', note: 'PCN licences to check' },
		{ key: 'golive', label: 'Go-live reviews', note: 'Data to approve before it goes public' },
		{ key: 'applicant', label: 'Waiting for the applicant', note: 'You asked for more information' }
	];
</script>

<svelte:head><title>Applications · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">DETECK team console</p>
		<h1>Applications</h1>
		<p class="small muted">
			Applications and go-live reviews waiting for a DETECK decision, oldest first. Every decision
			needs a reason and is emailed to the applicant. New drugs from live companies are reviewed
			under <a href="/console/drugs">Drugs and batches</a>.
		</p>
	</div>
</div>

<section class="tiles" aria-label="Summary">
	{#each tiles as tile (tile.key)}
		<a class="tile" class:active={tab === tile.key} href="?tab={tile.key}">
			<span class="tile-n">{count(tile.key)}</span>
			<span class="tile-label">{tile.label}</span>
			<span class="tile-note">{tile.note}</span>
		</a>
	{/each}
</section>

<nav class="tabs" aria-label="Show">
	{#each TABS as x (x.key)}
		<a href="?tab={x.key}" aria-current={tab === x.key ? 'page' : undefined}
			>{x.label} <span class="tab-n">{count(x.key)}</span></a
		>
	{/each}
</nav>

{#if shown.length === 0}
	<div class="empty">
		<div style="width: 90px"><Mascot mood="happy" /></div>
		<h3>{tab === 'rejected' ? 'Nothing rejected' : 'Nothing waiting here'}</h3>
		<p class="small muted">
			{tab === 'applicant'
				? 'No applicant owes DETECK an answer.'
				: tab === 'rejected'
					? 'Rejected applications appear here, so they can be reopened.'
					: 'New applications and go-live submissions appear here, and the team is emailed.'}
		</p>
	</div>
{:else}
	<ul class="queue" aria-label="Applications">
		{#each shown as item (item.stage + item.id)}
			{@const st = STAGE[item.stage]}
			<li class="queue-row">
				<div class="who">
					<a class="who-name" href={item.href}>{item.name}</a>
					<span class="who-meta">{item.kind}{item.place ? ` · ${item.place}` : ''}</span>
				</div>
				<div class="what">
					<span class="chip {st.chip}">{st.label}</span>
					<span class="detail small muted">{item.detail}</span>
				</div>
				<div class="when">
					<span
						class="age"
						class:late={(item.stage === 'new' || item.stage === 'golive') &&
							daysWaiting(item.since) >= 3}>{age(item)}</span
					>
					<span class="tiny muted">{formatDateTime(item.since)}</span>
				</div>
				<a
					class="btn btn-small {item.stage === 'new' || item.stage === 'golive'
						? 'btn-primary'
						: ''}"
					href={item.href}>{st.action}</a
				>
			</li>
		{/each}
	</ul>
	{#if tab === 'rejected'}<p class="help">
			Open one to reopen it, for example after the company contacts DETECK.
		</p>{/if}
{/if}

<style>
	.tiles {
		display: grid;
		gap: 12px;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}
	.tile {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 16px 18px;
		border-radius: var(--radius-l);
		border: 1px solid #e6e7ec;
		background: var(--white);
		text-decoration: none;
	}
	.tile.active {
		background: var(--ink);
		border-color: var(--ink);
		color: var(--white);
	}
	.tile-n {
		font-family: var(--font-display);
		font-size: 30px;
		font-weight: 800;
		letter-spacing: -0.03em;
	}
	.tile.active .tile-n {
		color: var(--lime);
	}
	.tile-label {
		font-weight: 700;
	}
	.tile-note {
		font-size: 12px;
		color: var(--text-3);
	}
	.tile.active .tile-note {
		color: #c9cbd4;
	}
	.tab-n {
		margin-left: 4px;
		font-size: 12px;
		opacity: 0.7;
	}
	.queue {
		list-style: none;
		margin: 0;
		padding: 0;
		border-radius: var(--radius-l);
		border: 1px solid #e6e7ec;
		background: var(--white);
		overflow: hidden;
	}
	.queue-row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 8px 14px;
		align-items: center;
		padding: 14px 16px;
	}
	.queue-row + .queue-row {
		border-top: 1px solid var(--line-soft);
	}
	.who {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.who-name {
		font-weight: 700;
		text-decoration: none;
	}
	.who-name:hover {
		text-decoration: underline;
	}
	.who-meta {
		font-size: 13px;
		color: var(--text-3);
	}
	.what,
	.when {
		display: flex;
		flex-direction: column;
		gap: 4px;
		align-items: flex-start;
	}
	.what {
		grid-column: 1;
	}
	.when {
		grid-column: 1;
		grid-row: 3;
	}
	.queue-row > .btn {
		grid-column: 2;
		grid-row: 1;
	}
	/* A long information request stays on two lines; the full text is on the application. */
	.detail {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		overflow-wrap: anywhere;
	}
	.age {
		font-weight: 700;
		font-size: 13px;
	}
	.age.late {
		color: var(--peach-ink);
	}
	@media (min-width: 900px) {
		.queue-row {
			grid-template-columns: minmax(0, 1.4fr) minmax(0, 1.2fr) 140px auto;
		}
		.what,
		.when,
		.queue-row > .btn {
			grid-column: auto;
			grid-row: auto;
		}
	}
</style>
