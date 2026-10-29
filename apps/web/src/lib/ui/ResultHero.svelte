<script lang="ts">
	import Mascot from './Mascot.svelte';
	import Icon from './Icon.svelte';
	import type { Tone } from '@deteck/core/messages/copy.ts';
	import { fmt, useT } from '#lib/i18n.ts';

	let {
		tone,
		badges,
		bubble,
		mood,
		title
	}: {
		tone: Tone;
		badges: string[];
		bubble: string;
		mood: 'happy' | 'concerned' | 'thinking' | 'wink';
		title?: string;
	} = $props();

	const t = $derived(useT());
	const badgeClass: Record<Tone, string> = {
		valid: '',
		warn: 'badge-warn',
		info: 'badge-info',
		danger: 'badge-danger'
	};
	const icon = $derived(tone === 'valid' ? 'check' : tone === 'info' ? 'info' : 'alert');
	const iconColor: Record<Tone, string> = {
		valid: '#DCFC7E',
		warn: '#FFC58F',
		info: '#ADC9FF',
		danger: '#FFFFFF'
	};
</script>

<section class="hero hero-{tone}" aria-labelledby="result-title">
	<div class="badges">
		{#each badges as badge, i (badge)}
			<span class="badge {i === 0 ? badgeClass[tone] : 'badge-warn'}">
				{#if i === 0}<Icon name={icon} size={14} color={iconColor[tone]} stroke={3} />{/if}{badge}
			</span>
		{/each}
	</div>
	{#if title}
		<h1 id="result-title" style="margin-top: 12px; font-size: 26px">{title}</h1>
	{:else}
		<h1 id="result-title" class="visually-hidden">
			{fmt(t.result.heading, { badges: badges.join(', ') })}
		</h1>
	{/if}
	<div class="hero-row">
		<p class="bubble">{bubble}</p>
		<div class="hero-mascot">
			<Mascot {mood} color={tone === 'valid' ? '#FFFFFF' : '#DCFC7E'} />
		</div>
	</div>
</section>
