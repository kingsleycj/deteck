<script lang="ts">
	/**
	 * One stacked bar showing shares, with every segment labelled in text
	 * (status colours never carry meaning alone).
	 */
	import { formatNumber } from './status.ts';

	interface Part {
		label: string;
		n: number;
		color: string;
		icon: string;
	}
	let { parts, ariaLabel }: { parts: Part[]; ariaLabel: string } = $props();
	const total = $derived(parts.reduce((a, p) => a + p.n, 0));
	const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
</script>

{#if total === 0}
	<p class="small muted">No checks in this period.</p>
{:else}
	<div class="split" role="img" aria-label={ariaLabel}>
		{#each parts.filter((p) => p.n > 0) as p (p.label)}
			<span
				style="flex: {p.n}; background: {p.color}"
				title="{p.label}: {formatNumber(p.n)} ({pct(p.n)}%)"
			></span>
		{/each}
	</div>
	<ul class="split-legend">
		{#each parts as p (p.label)}
			<li>
				<i style="background: {p.color}" aria-hidden="true"></i><span aria-hidden="true"
					>{p.icon}</span
				>
				{p.label} <strong>{pct(p.n)}%</strong> <span class="muted">({formatNumber(p.n)})</span>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.split {
		display: flex;
		gap: 2px;
		height: 14px;
		border-radius: 4px;
		overflow: hidden;
	}
	.split span {
		min-width: 3px;
	}
	.split-legend {
		list-style: none;
		margin: 10px 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px 16px;
		font-size: 13px;
	}
	.split-legend i {
		display: inline-block;
		width: 10px;
		height: 10px;
		border-radius: 2px;
		margin-right: 4px;
	}
</style>
