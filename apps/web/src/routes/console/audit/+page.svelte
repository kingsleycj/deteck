<script lang="ts">
	import SearchField from '#lib/ui/SearchField.svelte';
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { countOf, formatDateTime, formatNumber } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const pages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const link = (page: number) => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- a throwaway copy used to build one link
		const p = new URLSearchParams(data.query);
		p.set('page', String(page));
		return `?${p}`;
	};
	const actions = [
		['', 'All actions'],
		['import', 'Imports'],
		['application', 'Application decisions'],
		['golive', 'Go-live'],
		['manufacturer', 'Suspensions'],
		['batch', 'Batch recalls'],
		['product', 'Drug edits and flags'],
		['party', 'Business reviews'],
		['signin', 'Sign-ins'],
		['invite', 'Invites']
	];
	const areaChip: Record<string, string> = {
		'Public app': 'chip-ok',
		'Manufacturer board': 'chip-progress',
		'Team and sign-in': '',
		Console: 'chip-warn',
		System: 'chip-warn'
	};
</script>

<svelte:head><title>Audit trail · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Admin and monitoring</p>
		<h1>Audit trail</h1>
	</div>
	<div class="row">
		<span class="small muted">{countOf(data.total, 'entry matches', 'entries match')}</span>
		{#if data.total > 0}<a class="btn btn-small" href="/console/audit/export.csv?{data.query}"
				>Export CSV</a
			>{:else}<span class="btn btn-small" aria-disabled="true">Export CSV</span>{/if}
	</div>
</div>

<form method="get" class="panel stack" style="padding: 14px; --gap: 12px" role="search">
	<SearchField
		id="q"
		value={data.filter.q}
		label="Search the audit trail"
		placeholder="File, person, item or text"
		wide
	/>
	<div class="form-grid" style="grid-template-columns: repeat(auto-fit, minmax(170px, 1fr))">
		<div class="field">
			<label for="area">Area</label>
			<select id="area" name="area"
				><option value="">All areas</option>{#each data.areas as a (a)}<option
						value={a}
						selected={data.filter.area === a}>{a}</option
					>{/each}</select
			>
		</div>
		<div class="field">
			<label for="actor">Person</label>
			<select id="actor" name="actor"
				><option value="">Anyone</option>{#each data.actors as a (a.id)}<option
						value={a.id}
						selected={data.filter.actor === a.id}>{a.label}</option
					>{/each}</select
			>
		</div>
		<div class="field">
			<label for="action">Action</label>
			<select id="action" name="action"
				>{#each actions as [v, l] (v)}<option value={v} selected={data.filter.action === v}
						>{l}</option
					>{/each}</select
			>
		</div>
		<div class="field">
			<label for="range">Date range</label>
			<select id="range" name="range">
				<option value="today" selected={data.range === 'today'}>Today</option>
				<option value="7" selected={data.range === '7'}>Last 7 days</option>
				<option value="30" selected={data.range === '30'}>Last 30 days</option>
				<option value="all" selected={data.range === 'all'}>All time</option>
			</select>
		</div>
	</div>
	<div class="row">
		<button class="btn btn-small">Apply filters</button><a class="small" href="/console/audit"
			>Clear filters</a
		>
	</div>
</form>

{#if data.rows.length === 0}
	<div class="empty">
		<div style="width: 90px"><Mascot mood="thinking" /></div>
		<h3>No entries match these filters</h3>
		<p class="small muted">Try a longer date range or clear the filters.</p>
	</div>
{:else}
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr><th>Time</th><th>Area</th><th>Who</th><th>What happened</th><th>Where from</th></tr
				></thead
			>
			<tbody>
				{#each data.rows as r (r.id)}
					<tr>
						<td class="small" style="white-space: nowrap">{formatDateTime(r.createdAt)}</td>
						<td><span class="chip {areaChip[r.area] ?? ''}">{r.area}</span></td>
						<td
							><strong>{r.actorLabel}</strong><span class="sub"
								>{r.actorRole}{r.onBehalf ? ' · on behalf' : ''}</span
							></td
						>
						<td
							>{r.summary}{#if r.before || r.after}<details>
									<summary class="tiny muted">Before and after</summary>
									<pre class="tiny" style="white-space: pre-wrap; margin: 6px 0 0">{JSON.stringify(
											{ before: r.before, after: r.after },
											null,
											1
										)}</pre>
								</details>{/if}</td
						>
						<td class="small muted">{r.ip ?? '—'}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<div class="row" style="justify-content: space-between">
		<p class="small muted">
			Entries can't be edited or deleted. Showing {(data.page - 1) * data.pageSize + 1}–{Math.min(
				data.page * data.pageSize,
				data.total
			)} of {formatNumber(data.total)}.
		</p>
		<div class="row">
			{#if data.page > 1}<a class="btn btn-small" href={link(data.page - 1)}>Previous</a>{/if}
			{#if data.page < pages}<a class="btn btn-small" href={link(data.page + 1)}>Next</a>{/if}
		</div>
	</div>
{/if}
<p class="help">
	The CSV export includes every filtered entry with: time, area, person, role, action, item, before,
	after, IP address and device.
</p>
