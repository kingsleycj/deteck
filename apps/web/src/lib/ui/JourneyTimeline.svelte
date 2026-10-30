<script lang="ts">
	import type { Journey } from '@deteck/core/verify/journey-types.ts';
	import { formatMonth, stepLabel } from '@deteck/core/messages/copy.ts';
	import { fmt, useT } from '#lib/i18n.ts';

	let { journey }: { journey: Journey } = $props();
	const t = $derived(useT());
	const lastIndex = $derived(journey.steps.length - 1);
</script>

<ol class="timeline">
	{#each journey.steps as step, i (i)}
		{#if step.kind === 'manufacturer'}
			<li>
				<p class="step-label">{stepLabel(step, i === lastIndex, journey.state, t)}</p>
				<p class="step-name">{step.name}</p>
				<p class="step-meta">
					{fmt(t.journey.stepBatch, {
						place: step.place,
						lot: step.lot,
						expires: formatMonth(step.expiryDate)
					})}
				</p>
			</li>
		{:else}
			<li class:end={i === lastIndex && journey.state !== 'BATCH_LEVEL'}>
				<p class="step-label">{stepLabel(step, i === lastIndex, journey.state, t)}</p>
				<p class="step-name">{step.name}</p>
				{#if step.place}<p class="step-meta">{step.place}</p>{/if}
				<span class={step.verified ? 'tag-verified' : 'tag-unverified'}>
					{step.verified ? t.journey.verified : t.journey.unverified}
				</span>
				{#if step.confirmed}<span class="tag-verified">{t.journey.confirmed}</span>{/if}
			</li>
		{/if}
	{/each}
</ol>
