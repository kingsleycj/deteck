<script lang="ts">
	/**
	 * The coloured answer card. Phones (and the desktop "valid + journey" design): the badges, then
	 * Deteck's speech bubble with Deteck beside it. `full` (the other desktop result designs): the
	 * card fills its column, with the big title, an optional line under it, and Deteck standing at
	 * the bottom left with the bubble beside it. The title is always the page's h1; where the design
	 * shows no title it is read by screen readers only.
	 */
	import Mascot from './Mascot.svelte';
	import Icon from './Icon.svelte';
	import type { Tone } from '@deteck/core/messages/copy.ts';

	let {
		tone,
		badges,
		bubble,
		mood,
		title,
		sub,
		serial,
		serialLabel,
		full = false,
		showBadges = true
	}: {
		tone: Tone;
		badges: string[];
		bubble: string;
		mood: 'happy' | 'concerned' | 'thinking' | 'wink';
		title: string;
		/** A line under the title, on wide screens (for example who made it, the batch and expiry). */
		sub?: string;
		/** The serial that was checked, shown in a chip under the title on wide screens. */
		serial?: string;
		serialLabel?: string;
		full?: boolean;
		/** The packaging answer has no badge in the designs; its title says it. */
		showBadges?: boolean;
	} = $props();

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

<section class="hero hero-{tone}" class:hero-full={full} aria-labelledby="result-title">
	<div class="badges" class:visually-hidden={!showBadges}>
		{#each badges as badge, i (badge)}
			<span class="badge {i === 0 ? badgeClass[tone] : 'badge-danger'}">
				{#if i === 0}<Icon name={icon} size={14} color={iconColor[tone]} stroke={3} />{/if}{badge}
			</span>
		{/each}
	</div>
	<h1 id="result-title" class="hero-title">{title}</h1>
	{#if sub}<p class="hero-sub">{sub}</p>{/if}
	{#if serial}<p class="hero-serial">
			{serialLabel} <span class="mono">{serial}</span>
		</p>{/if}
	<div class="hero-row">
		<p class="bubble">{bubble}</p>
		<div class="hero-mascot">
			<!-- White on the lime and peach cards, lime on the periwinkle and red ones (the designs). -->
			<Mascot {mood} color={tone === 'valid' || tone === 'warn' ? '#FFFFFF' : '#DCFC7E'} />
		</div>
	</div>
</section>

<style>
	/* Phones follow the mobile designs: no title on the card, Deteck's bubble says it. */
	.hero-title,
	.hero-sub,
	.hero-serial {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip: rect(0 0 0 0);
		white-space: nowrap;
	}
	@media (min-width: 1024px) {
		.hero {
			padding: 24px 24px 0;
		}
		.hero .hero-row {
			margin-top: 14px;
			gap: 14px;
		}
		.hero .hero-row :global(.bubble) {
			margin-bottom: 24px;
			padding: 16px 18px;
			border-radius: 20px 20px 4px 20px;
			font-size: 17px;
			line-height: 1.45;
		}
		.hero .hero-row :global(.hero-mascot) {
			flex-basis: 132px;
			width: 132px;
			margin-bottom: -8px;
		}
		.hero-full {
			display: flex;
			flex-direction: column;
			height: 100%;
			min-height: 560px;
			padding: 32px 32px 0;
		}
		.hero-full .hero-title,
		.hero-full .hero-sub,
		.hero-full .hero-serial {
			position: static;
			width: auto;
			height: auto;
			overflow: visible;
			clip: auto;
			white-space: normal;
		}
		.hero-full .hero-title {
			margin: 22px 0 0;
			font-size: clamp(40px, 3.7vw, 52px);
			letter-spacing: -0.045em;
			line-height: 1;
		}
		.hero-full .visually-hidden + .hero-title {
			margin-top: 0;
		}
		.hero-sub {
			margin: 12px 0 0;
			font-size: 16px;
			line-height: 1.5;
		}
		.hero-serial {
			margin: 14px 0 0;
			align-self: flex-start;
			display: inline-flex;
			align-items: center;
			gap: 10px;
			padding: 10px 14px;
			border-radius: 14px;
			background: rgba(255, 255, 255, 0.7);
			font-size: 13px;
			color: #6a4a2e;
		}
		.hero-serial .mono {
			font-size: 15px;
			color: var(--ink);
		}
		/* Deteck stands at the bottom left, its speech bubble beside it. */
		.hero-full .hero-row {
			margin-top: auto;
			padding-top: 24px;
			flex-direction: row-reverse;
			align-items: flex-end;
			gap: 20px;
		}
		.hero-full .hero-row :global(.bubble) {
			margin-bottom: 110px;
			padding: 18px 20px;
			border-radius: 22px 22px 22px 6px;
			box-shadow: 0 12px 30px rgba(120, 60, 10, 0.12);
		}
		.hero-full .hero-row :global(.hero-mascot) {
			flex-basis: 200px;
			width: 200px;
			margin-bottom: -10px;
		}
	}
</style>
