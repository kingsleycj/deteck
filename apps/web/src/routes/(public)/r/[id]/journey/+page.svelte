<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import JourneyTimeline from '#lib/ui/JourneyTimeline.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import { formatMonth, journeySummary } from '@deteck/core/messages/copy.ts';
	import { fmt } from '#lib/i18n.ts';

	let { data }: PageProps = $props();
	const t = $derived(data.t);
	const r = $derived(data.result);
	const j = $derived(data.journey);
</script>

<svelte:head>
	<title>{t.journey.metaTitle}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="shell shell-narrow">
	<header class="page-head">
		<a href="/r/{data.id}" class="back" aria-label={t.journey.backAria}><Icon name="back" /></a>
		<span>{t.journey.title}</span>
	</header>

	{#if !r || !j}
		<main class="stack">
			<h1>{t.result.expiredTitle}</h1>
			<p class="muted">{t.journey.expiredBody}</p>
			<a href="/check" class="btn btn-primary">{t.common.checkSerial}</a>
		</main>
	{:else}
		<main class="stack">
			<div>
				<h1 style="font-size: 26px">{t.journey.title}</h1>
				<p class="muted small" style="margin-top: 4px">
					{fmt(t.journey.batchLine, {
						product: `${r.product?.brandName ?? ''} ${r.product?.strength ?? ''}`.trim(),
						lot: r.batch?.lot ?? ''
					})}
				</p>
			</div>

			{#if j.state === 'NONE'}
				<div class="hero hero-info">
					<div class="hero-row" style="margin-top: 0">
						<div class="hero-mascot"><Mascot mood="thinking" /></div>
						<p class="bubble bubble-left">
							<strong>{t.journey.noneTitle}.</strong>
							{journeySummary(j, '', t)}
						</p>
					</div>
				</div>
				<section class="card stack" style="--gap: 6px">
					<p
						class="step-label tiny"
						style="font-weight: 800; letter-spacing: 0.06em; color: var(--text-3)"
					>
						{t.journey.whatWeKnow.toUpperCase()}
					</p>
					<p style="font-weight: 700">
						{fmt(t.journey.madeBy, { maker: r.manufacturer?.name ?? '' })}
					</p>
					<p class="small muted">
						{[r.manufacturer?.town, r.manufacturer?.state].filter(Boolean).join(', ')} · {fmt(
							t.journey.madeExpires,
							{
								made: formatMonth(r.batch?.manufactureDate, t.common.notRecorded),
								expires: formatMonth(r.batch?.expiryDate)
							}
						)}
					</p>
				</section>
			{:else}
				<div class="hero hero-valid">
					<div class="hero-row" style="margin-top: 0">
						<div class="hero-mascot"><Mascot mood="happy" color="#FFFFFF" /></div>
						<p class="bubble bubble-left">
							{journeySummary(j, r.manufacturer?.name ?? t.result.TheManufacturer, t)}
						</p>
					</div>
				</div>
				<section class="card"><JourneyTimeline journey={j} /></section>
				{#if j.state === 'TO_RETAIL' && j.lastHolder}
					<p class="notice">{fmt(t.journey.sellerPrompt, { holder: j.lastHolder.name })}</p>
				{:else if j.state === 'BATCH_LEVEL'}
					<p class="notice">{t.journey.batchPrompt}</p>
				{/if}
			{/if}

			{#if data.canCheckPackaging}
				<a href="/scan?from={encodeURIComponent(data.id)}" class="btn btn-block"
					><Icon name="scan" />{t.result.checkPackaging}</a
				>
			{/if}
			<a href="/check" class="btn btn-block">{t.common.checkAnother}</a>
			<p class="footer-note">{t.journey.footnote}</p>
		</main>
	{/if}
	<SiteFooter />
</div>
