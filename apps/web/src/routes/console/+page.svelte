<script lang="ts">
	import type { PageProps } from './$types';
	import DailyChart from '#lib/ui/DailyChart.svelte';
	import SplitBar from '#lib/ui/SplitBar.svelte';
	import { countOf, formatDateTime, formatNumber, PACKAGING_OUTCOME } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const i = $derived(data.insights);
	const n = (code: string) => i.results.find((r) => r.result === code)?.n ?? 0;
	const otherResults = $derived(
		i.results
			.filter((r) => !['VALID', 'UNRECOGNISED', 'RECALLED'].includes(r.result))
			.reduce((a, r) => a + r.n, 0)
	);
	const live = $derived(data.counts.live ?? 0);
	const manufacturers = $derived(Object.values(data.counts).reduce((a, b) => a + b, 0));
	const peak = $derived(
		i.daily.reduce(
			(best, d) => (d.serial + d.scan > best.n ? { n: d.serial + d.scan, day: d.day } : best),
			{ n: 0, day: '' }
		)
	);
	const today = new Date().toLocaleDateString('en-GB', {
		weekday: 'long',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'Africa/Lagos'
	});
</script>

<svelte:head><title>Overview · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">{today}</p>
		<h1>Overview</h1>
	</div>
	<nav class="tabs" aria-label="Date range">
		{#each [[1, '24 hours'], [7, '7 days'], [30, '30 days'], [90, '90 days']] as [d, label] (d)}
			<a href="?days={d}" aria-current={data.days === d ? 'page' : undefined}>{label}</a>
		{/each}
		<a href="/console/insights.csv?days={data.days}">Export CSV</a>
	</nav>
</div>

<section class="stats">
	<div class="stat">
		<span class="k">People who checked</span><span class="n">{formatNumber(i.totals.devices)}</span
		><span class="d">Anonymous devices per day, summed</span>
	</div>
	<div class="stat">
		<span class="k">Checks run</span><span class="n">{formatNumber(i.totals.checks)}</span><span
			class="d">{formatNumber(i.totals.serial)} serial · {formatNumber(i.totals.scan)} scans</span
		>
	</div>
	<a class="stat" href="/console/manufacturers"
		><span class="k">Manufacturers</span><span class="n">{formatNumber(manufacturers)}</span><span
			class="d"
			>{live} live · {data.counts.in_review ?? 0} in review · {data.counts.pending ?? 0} waiting</span
		></a
	>
	<a class="stat" href="/console/drugs"
		><span class="k">Registered drugs</span><span class="n"
			>{formatNumber(data.catalogue.products)}</span
		><span class="d"
			>{countOf(data.catalogue.serials, 'serial', 'serials')} · {data.catalogue.with_packaging} with packaging</span
		></a
	>
	<a class="stat {data.signals ? 'dark' : ''}" href="/console/signals"
		><span class="k">Unusual checks</span><span class="n">{data.signals}</span><span class="d"
			>Serials checked from many devices (7 days)</span
		></a
	>
	<a class="stat {data.scans.serviceErrors ? 'dark' : ''}" href="/console/scans"
		><span class="k">Packaging scans</span><span class="n">{formatNumber(data.scans.total)}</span
		><span class="d"
			>{data.scans.serviceErrors} AI errors · {data.scans.agreement === null
				? `${data.scans.waitingForReview} to review`
				: `${Math.round(data.scans.agreement * 100)}% reviewer agreement`}</span
		></a
	>
</section>

<div class="two-col">
	<div class="stack" style="--gap: 20px">
		<section class="panel">
			<div class="page-title">
				<h2>Checks per day</h2>
				<span class="small muted"
					>{peak.n ? `Peak ${formatNumber(peak.n)} on ${peak.day}` : 'No checks yet'}</span
				>
			</div>
			<DailyChart days={i.daily} />
		</section>
		<section class="panel">
			<h2>Results</h2>
			<SplitBar
				ariaLabel="Result split for serial checks and scans"
				parts={[
					{ label: 'Valid', n: n('VALID'), color: '#0ca30c', icon: '✓' },
					{ label: 'Unrecognised', n: n('UNRECOGNISED'), color: '#fab219', icon: '!' },
					{ label: 'Recalled', n: n('RECALLED'), color: '#d03b3b', icon: '✕' },
					{
						label: 'Other (not covered, can’t confirm, needs batch)',
						n: otherResults,
						color: '#A3A8B4',
						icon: '·'
					}
				]}
			/>
			{#if i.packaging.length}
				<h3 style="margin-top: 8px">Packaging checks</h3>
				<p class="small">
					{i.packaging
						.map((p) => `${PACKAGING_OUTCOME[p.result] ?? p.result}: ${formatNumber(p.n)}`)
						.join(' · ')}
				</p>
			{/if}
		</section>
		<div class="grid-2" style="gap: 20px">
			<section class="panel">
				<h3>Most-checked drugs</h3>
				<table class="data">
					<tbody>
						{#each i.topProducts as p (p.id)}<tr
								><td
									><a href="/console/drugs/{p.id}">{p.name}</a><span class="sub"
										>{p.manufacturer}</span
									></td
								><td style="text-align: right">{formatNumber(p.n)}</td></tr
							>{:else}<tr><td class="muted">No checks yet.</td></tr>{/each}
					</tbody>
				</table>
			</section>
			<section class="panel">
				<h3>Checks by state</h3>
				<table class="data">
					<tbody>
						{#each i.byState as s (s.state)}<tr
								><td>{s.state}</td><td style="text-align: right"
									>{s.suppressed ? 'fewer than 5' : formatNumber(s.n)}</td
								></tr
							>{:else}<tr><td class="muted">No checks yet.</td></tr>{/each}
					</tbody>
				</table>
				<p class="help">Approximate, from network location. Counts under 5 are hidden.</p>
			</section>
		</div>
	</div>
	<aside class="stack" style="--gap: 14px">
		<section class="panel">
			<h3>Journeys opened</h3>
			<p class="stat" style="border: 0; padding: 0">
				<span class="n">{formatNumber(i.totals.journeys)}</span>
			</p>
		</section>
		<section class="panel">
			<div class="page-title">
				<h3>Latest activity</h3>
				<a class="small" href="/console/audit">Full audit trail →</a>
			</div>
			{#each data.recent as r (r.id)}
				<p class="small">
					<span class="tiny muted">{r.area} · {formatDateTime(r.createdAt)}</span><br />{r.summary}
				</p>
			{:else}
				<p class="small muted">Nothing yet.</p>
			{/each}
		</section>
	</aside>
</div>
