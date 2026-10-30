<script lang="ts">
	/**
	 * The journey as one row, left to right, as in the desktop result design: the manufacturer,
	 * each recorded business, and the last recorded holder highlighted in lime. Only recorded steps
	 * are shown; nothing is drawn as missing (supply chains aren't always a straight line).
	 */
	import type { Journey } from '@deteck/core/verify/journey-types.ts';
	import { formatDate, stepLabel } from '@deteck/core/messages/copy.ts';
	import Icon from './Icon.svelte';
	import { useT } from '#lib/i18n.ts';

	let { journey }: { journey: Journey } = $props();
	const t = $derived(useT());
	const last = $derived(journey.steps.length - 1);
</script>

<ol class="row-journey">
	{#each journey.steps as step, i (i)}
		{@const isLast = i === last}
		<li class:holder={isLast && step.kind === 'party'}>
			<div class="mark">
				<span class="dot" aria-hidden="true">
					<Icon
						name={isLast && step.kind === 'party'
							? 'plus'
							: step.kind === 'manufacturer'
								? 'factory'
								: 'truck'}
						size={18}
						color={isLast && step.kind === 'party' ? '#0B0B0F' : '#DCFC7E'}
						stroke={2}
					/>
				</span>
				{#if !isLast}<span class="line" aria-hidden="true"></span>{/if}
			</div>
			<div class="what">
				<p class="label">{stepLabel(step, isLast, journey.state, t)}</p>
				<p class="name">{step.name}</p>
				{#if step.kind === 'manufacturer'}
					<p class="meta">{step.place}<br />{t.result.batch} {step.lot}</p>
				{:else}
					{#if step.place}<p class="meta">{step.place}</p>{/if}
					{#if step.date && !isLast}<p class="meta">{formatDate(step.date)}</p>{/if}
					<p class="meta">
						{step.verified ? t.journey.verified : t.journey.unverified}{#if step.confirmed}<br />{t
								.journey.confirmed}{/if}
					</p>
				{/if}
			</div>
		</li>
	{/each}
</ol>

<style>
	/* One row when it fits; on a narrower panel the steps wrap to a second row, never hidden. */
	.row-journey {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		row-gap: 20px;
	}
	li {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}
	.mark {
		display: flex;
		align-items: center;
	}
	.dot {
		flex: 0 0 auto;
		display: inline-flex;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: var(--ink);
		align-items: center;
		justify-content: center;
	}
	.holder .dot {
		background: var(--lime);
		border: 2px solid var(--ink);
	}
	.line {
		flex: 1 1 auto;
		height: 3px;
		background: var(--ink);
	}
	.what {
		padding-right: 14px;
	}
	.holder .what {
		padding: 12px 14px;
		border-radius: 18px;
		background: var(--lime);
	}
	.label {
		margin: 0;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: var(--text-3);
	}
	.holder .label {
		font-weight: 800;
		color: var(--ink);
	}
	.name {
		margin: 4px 0 0;
		font-size: 16px;
		font-weight: 700;
		line-height: 1.3;
	}
	.meta {
		margin: 4px 0 0;
		font-size: 13px;
		line-height: 1.5;
		color: var(--text-2);
	}
	.holder .meta {
		color: #24261f;
	}
</style>
