<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import ResultHero from '#lib/ui/ResultHero.svelte';
	import { journeyLinkLine, packagingCopy } from '@deteck/core/messages/copy.ts';

	let { data }: PageProps = $props();
	const t = $derived(data.t);
	const p = $derived(t.packaging);
	const running = $derived(['collecting', 'queued', 'processing'].includes(data.status));
	const copy = $derived(packagingCopy(data.outcome ?? 'CANT_TELL', t));
	const r = $derived(data.result);
</script>

<svelte:head>
	<title>DETECK · {running ? p.checking : copy.title}</title>
	<meta name="robots" content="noindex" />
	{#if running}<meta http-equiv="refresh" content="2" />{/if}
</svelte:head>

<div class="shell shell-narrow">
	<header class="page-head">
		<a href="/check" class="back" aria-label={t.result.backAria}><Icon name="back" /></a>
		<span>{running ? p.checking : p.yourCheck}</span>
		{#if r}<span class="mono">{r.serialDisplay}</span>{/if}
	</header>

	{#if running}
		<section class="stack center" style="--gap: 16px; align-items: center; padding: 28px 0">
			<div style="width: 150px"><Mascot mood="thinking" /></div>
			<h1 style="font-size: 24px">{p.analysing}</h1>
			<p class="muted">{p.analysingNote}</p>
			<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<ul class="reasons" style="text-align: left">
				<li><span>{p.serialRead}</span></li>
				<li><span>{p.photosReceived}</span></li>
				<li><span>{p.comparing}</span></li>
			</ul>
		</section>
	{:else}
		<main class="stack">
			{#if r?.product}<p class="small muted">
					{r.product.brandName}
					{r.product.strength} · {r.serialDisplay}
				</p>{/if}
			<ResultHero
				tone={copy.tone}
				badges={copy.badges}
				bubble={copy.bubble}
				mood={copy.mood}
				title={copy.title}
			/>

			<section class="card stack" style="--gap: 0">
				<div
					class="row"
					style="justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line-soft)"
				>
					<span class="small muted">{p.serialRow}</span><strong
						>{p.valid}{r?.manufacturer ? ` · ${r.manufacturer.name}` : ''}</strong
					>
				</div>
				{#if data.verificationId}
					<a
						href="/r/{data.verificationId}/journey"
						class="row"
						style="justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--line-soft); text-decoration: none"
					>
						<span class="small muted">{p.journeyRow}</span><strong
							>{journeyLinkLine(data.journey, t)} →</strong
						>
					</a>
				{/if}
				<div style="padding: 10px 0">
					<div class="row" style="justify-content: space-between">
						<span class="small muted">{p.packagingRow}</span><strong>{copy.packagingLine}</strong>
					</div>
					{#if data.categories.length}
						<ul class="reasons" style="margin-top: 10px">
							{#each data.categories as c, i (i)}<li>
									<span
										>{p.categories[c.category as keyof typeof p.categories] ??
											p.somethingDifferent}<span class="sub small muted">
											· {p.sides[c.side as keyof typeof p.sides] ?? c.side}</span
										></span
									>
								</li>{/each}
						</ul>
					{/if}
				</div>
			</section>

			{#if copy.nextStep}<p class="next-step">{copy.nextStep}</p>{/if}
			<p class="small muted">{p.disclaimer}</p>
			{#if data.outcome !== 'NO_VISIBLE_INCONSISTENCIES' && data.verificationId}
				<a href="/scan/photos?from={data.verificationId}" class="btn btn-block">{p.retakePhotos}</a>
			{/if}
			<a href="/check" class="btn btn-primary btn-block">{t.common.checkAnother}</a>
			<p class="footer-note">{p.beta}</p>
		</main>
	{/if}
</div>
