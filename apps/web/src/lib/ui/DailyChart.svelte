<script lang="ts">
	/**
	 * Stacked daily bars (serial checks + scans). Server-rendered SVG with a
	 * per-bar tooltip, a legend and a table view (dataviz: identity never by colour alone).
	 * Colours: validated categorical slots 1 and 2 (#2a78d6, #eb6834).
	 */
	import { formatNumber } from './status.ts';

	let { days }: { days: { day: string; serial: number; scan: number }[] } = $props();

	const W = 720;
	const H = 180;
	const pad = { top: 10, right: 8, bottom: 22, left: 36 };
	const max = $derived(Math.max(1, ...days.map((d) => d.serial + d.scan)));
	const niceMax = $derived(Math.ceil(max / 5) * 5 || 5);
	const step = $derived((W - pad.left - pad.right) / Math.max(1, days.length));
	const barW = $derived(Math.max(2, Math.min(18, step - 3)));
	const y = (v: number) => pad.top + (H - pad.top - pad.bottom) * (1 - v / niceMax);
	const label = (iso: string) => {
		const [, m, d] = iso.split('-').map(Number);
		return `${d} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]}`;
	};
	const peak = $derived(
		days.reduce(
			(best, d) => (d.serial + d.scan > best.serial + best.scan ? d : best),
			days[0] ?? { day: '', serial: 0, scan: 0 }
		)
	);
</script>

<figure class="chart">
	<div class="legend" aria-hidden="true">
		<span><i style="background: #2a78d6"></i>Serial checks</span>
		<span><i style="background: #eb6834"></i>Scans</span>
	</div>
	<svg
		viewBox="0 0 {W} {H}"
		role="img"
		aria-label="Checks per day. Peak {formatNumber(peak.serial + peak.scan)} on {peak.day
			? label(peak.day)
			: '—'}. Table view below."
	>
		{#each [0, 0.5, 1] as t (t)}
			<line
				x1={pad.left}
				x2={W - pad.right}
				y1={y(niceMax * t)}
				y2={y(niceMax * t)}
				stroke="#E3E5EA"
				stroke-width="1"
			/>
			<text x={pad.left - 6} y={y(niceMax * t) + 4} text-anchor="end" font-size="10" fill="#6A6F7E"
				>{formatNumber(Math.round(niceMax * t))}</text
			>
		{/each}
		{#each days as d, i (d.day)}
			{@const x = pad.left + i * step + (step - barW) / 2}
			{@const scanTop = y(d.scan)}
			{@const serialTop = y(d.serial + d.scan)}
			<g>
				<title
					>{label(d.day)}: {formatNumber(d.serial)} serial checks, {formatNumber(d.scan)} scans</title
				>
				<rect
					x={pad.left + i * step}
					y={pad.top}
					width={step}
					height={H - pad.top - pad.bottom}
					fill="transparent"
				/>
				{#if d.scan > 0}
					<rect
						{x}
						y={scanTop}
						width={barW}
						height={Math.max(0, y(0) - scanTop)}
						fill="#eb6834"
						rx={d.serial > 0 ? 0 : 2}
					/>
				{/if}
				{#if d.serial > 0}
					<rect
						{x}
						y={serialTop}
						width={barW}
						height={Math.max(0, scanTop - serialTop - (d.scan > 0 ? 2 : 0))}
						fill="#2a78d6"
						rx="2"
					/>
				{/if}
			</g>
			{#if i === 0 || i === days.length - 1 || i === Math.floor(days.length / 2)}
				<text x={x + barW / 2} y={H - 6} text-anchor="middle" font-size="10" fill="#6A6F7E"
					>{label(d.day)}</text
				>
			{/if}
		{/each}
		<line x1={pad.left} x2={W - pad.right} y1={y(0)} y2={y(0)} stroke="#C9CDD6" stroke-width="1" />
	</svg>
	<details>
		<summary class="small">Table view</summary>
		<div class="table-wrap" style="margin-top: 8px; max-height: 260px; overflow-y: auto">
			<table class="data">
				<thead><tr><th>Day</th><th>Serial checks</th><th>Scans</th></tr></thead>
				<tbody>
					{#each days as d (d.day)}<tr
							><td>{label(d.day)}</td><td>{formatNumber(d.serial)}</td><td
								>{formatNumber(d.scan)}</td
							></tr
						>{/each}
				</tbody>
			</table>
		</div>
	</details>
</figure>

<style>
	.chart {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.chart svg {
		width: 100%;
		height: auto;
		display: block;
	}
	.legend {
		display: flex;
		gap: 16px;
		font-size: 12px;
		color: var(--text-2);
	}
	.legend i {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		margin-right: 6px;
		vertical-align: -1px;
	}
</style>
