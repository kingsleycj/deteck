<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHead from '#lib/ui/PageHead.svelte';
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

<div class="shell app-frame">
	<PageHead back="/r/{data.id}" backLabel={t.journey.backAria} title={t.journey.title}>
		{#snippet aside()}
			{#if r}<span class="mono wide-only"
					>{r.product?.brandName} {r.product?.strength} · {r.serialDisplay}</span
				>{/if}
		{/snippet}
	</PageHead>

	{#if !r || !j}
		<main class="stack" style="max-width: 520px">
			<h1>{t.result.expiredTitle}</h1>
			<p class="muted">{t.journey.expiredBody}</p>
			<a href="/check" class="btn btn-primary">{t.common.checkSerial}</a>
		</main>
	{:else}
		<main class="journey-page">
			<!-- Left on a wide screen: what the journey means. Right: the recorded steps. -->
			<section class="stack" style="--gap: 16px">
				<div>
					<h1 class="journey-title">{t.journey.title}</h1>
					<p class="muted small" style="margin-top: 4px">
						{fmt(t.journey.batchLine, {
							product: `${r.product?.brandName ?? ''} ${r.product?.strength ?? ''}`.trim(),
							lot: r.batch?.lot ?? ''
						})}
					</p>
				</div>
				<div class="hero {j.state === 'NONE' ? 'hero-info' : 'hero-valid'} journey-hero">
					<div class="hero-row" style="margin-top: 0">
						<div class="hero-mascot">
							{#if j.state === 'NONE'}<Mascot mood="thinking" />{:else}<Mascot
									mood="happy"
									color="#FFFFFF"
								/>{/if}
						</div>
						<p class="bubble bubble-left">
							{#if j.state === 'NONE'}<strong>{t.journey.noneTitle}.</strong>
								{journeySummary(j, '', t)}{:else}{journeySummary(
									j,
									r.manufacturer?.name ?? t.result.TheManufacturer,
									t
								)}{/if}
						</p>
					</div>
				</div>
				{#if j.state !== 'NONE' && j.state !== 'BATCH_LEVEL' && j.lastHolder}
					<p class="notice">{fmt(t.journey.sellerPrompt, { holder: j.lastHolder.name })}</p>
				{:else if j.state === 'BATCH_LEVEL'}
					<p class="notice">{t.journey.batchPrompt}</p>
				{/if}
				<div class="stack journey-actions" style="--gap: 10px">
					{#if data.canCheckPackaging}
						<a href="/scan?from={encodeURIComponent(data.id)}" class="btn btn-block"
							><Icon name="scan" />{t.result.checkPackaging}</a
						>
					{/if}
					<a href="/check" class="btn btn-dark btn-block">{t.common.checkAnother}</a>
				</div>
			</section>

			<section class="card journey-steps" aria-label={t.journey.title}>
				{#if j.state === 'NONE'}
					<p class="step-label tiny journey-known">{t.journey.whatWeKnow.toUpperCase()}</p>
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
				{:else}
					<JourneyTimeline journey={j} />
				{/if}
			</section>
		</main>
		<p class="footer-note">{t.journey.footnote}</p>
	{/if}
	<SiteFooter />
</div>

<style>
	.journey-page {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.journey-title {
		font-size: 26px;
	}
	.journey-known {
		font-weight: 800;
		letter-spacing: 0.06em;
		color: var(--text-3);
		margin-bottom: 6px;
	}
	/* Phones: the steps come before the actions. */
	.journey-steps {
		order: 0;
	}
	@media (max-width: 899px) {
		.journey-page > section:first-child {
			display: contents;
		}
		.journey-actions {
			order: 2;
		}
	}
	@media (min-width: 900px) {
		.journey-page {
			display: grid;
			grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
			align-items: start;
			gap: 28px;
		}
		.journey-title {
			font-size: clamp(32px, 3.4vw, 44px);
		}
		.journey-hero {
			padding: 22px 22px 0;
		}
		.journey-steps {
			padding: 22px 24px;
		}
	}
</style>
