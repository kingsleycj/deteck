<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import PageHead from '#lib/ui/PageHead.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import ResultHero from '#lib/ui/ResultHero.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import { journeyLinkLine, packagingCopy } from '@deteck/core/messages/copy.ts';

	let { data: all }: PageProps = $props();
	const data = $derived(all.expired ? null : all);
	const t = $derived(all.t);
	const p = $derived(t.packaging);
	const running = $derived(
		Boolean(data && ['collecting', 'queued', 'processing'].includes(data.status))
	);
	const copy = $derived(packagingCopy(data?.outcome ?? 'CANT_TELL', t));
	const r = $derived(data?.result);
	const tick = $derived(copy.tone === 'valid' ? 'ok' : copy.tone);
</script>

<svelte:head>
	<title>DETECK · {running ? p.checking : copy.title}</title>
	<meta name="robots" content="noindex" />
	<!-- Every 4 s while the photos are compared: a light page, gentle on 2G. -->
	{#if running}<meta http-equiv="refresh" content="4" />{/if}
</svelte:head>

<div class="shell app-frame">
	<PageHead back="/check" backLabel={t.result.backAria} title={running ? p.checking : p.yourCheck}>
		{#snippet aside()}
			{#if r}<span class="mono"
					>{#if r.product}<span class="wide-only"
							>{r.product.brandName} {r.product.strength} ·
						</span>{/if}{r.serialDisplay}</span
				>{/if}
		{/snippet}
	</PageHead>

	{#if !data}
		<main class="stack" style="max-width: 520px">
			<div style="width: 120px"><Mascot mood="thinking" /></div>
			<h1>{t.result.expiredTitle}</h1>
			<p class="muted">{t.result.expiredBody}</p>
			<a href="/check" class="btn btn-primary">{t.common.checkSerial}</a>
		</main>
	{:else if running}
		<!-- D6 / M13: comparing the photos with the manufacturer's pack. -->
		<main class="comparing">
			<div class="cmp-art" aria-hidden="true">
				<div class="cmp-mascot"><Mascot mood="thinking" /></div>
			</div>
			<section class="cmp-text" role="status">
				<h1>{p.analysing}</h1>
				<p class="cmp-note">{p.analysingNote}</p>
				<ol class="cmp-steps">
					<li>
						<span class="cmp-tick" aria-hidden="true"
							><Icon name="check" size={14} stroke={3} /></span
						>{p.serialRead}
					</li>
					<li>
						<span class="cmp-tick" aria-hidden="true"
							><Icon name="check" size={14} stroke={3} /></span
						>{p.photosReceived}
					</li>
					<li class="now"><span class="cmp-spin" aria-hidden="true"></span>{p.comparing}</li>
				</ol>
			</section>
		</main>
	{:else}
		<!-- D8, D7, D13 / M14, M7, M15: the answer on the left, what was checked on the right. -->
		<main class="check">
			<div class="check-hero">
				<ResultHero
					tone={copy.tone}
					badges={copy.badges}
					bubble={copy.bubble}
					mood={copy.mood}
					title={copy.title ?? copy.badges.join(' · ')}
					showBadges={false}
					full
				/>
			</div>

			<div class="check-side">
				<div class="check-row">
					<span class="tick ok" aria-hidden="true"><Icon name="check" size={16} stroke={3} /></span>
					<span class="check-text">
						<span class="small muted">{p.serialRow}</span>
						<strong>{p.valid}{r?.manufacturer ? ` · ${r.manufacturer.name}` : ''}</strong>
					</span>
				</div>
				{#if data.verificationId}
					<a href="/r/{data.verificationId}" class="check-row">
						<span class="tick ok" aria-hidden="true"><Icon name="journey" size={16} /></span>
						<span class="check-text">
							<span class="small muted">{p.journeyRow}</span>
							<strong>{journeyLinkLine(data.journey, t)}</strong>
						</span>
						<span class="see">{t.result.journeyLink} →</span>
					</a>
				{/if}
				<div class="check-row check-pack">
					<div class="pack-head">
						<span class="tick {tick}" aria-hidden="true"
							>{#if copy.tone === 'info'}?{:else}<Icon
									name={copy.tone === 'valid' ? 'check' : 'alert'}
									size={16}
									stroke={3}
								/>{/if}</span
						>
						<span class="check-text">
							<span class="small muted">{p.packagingRow}</span>
							<strong>{copy.packagingLine}</strong>
						</span>
					</div>
					{#if data.categories.length}
						<ul class="found">
							{#each data.categories as c, i (i)}<li>
									<strong
										>{p.categories[c.category as keyof typeof p.categories] ??
											p.somethingDifferent}</strong
									>
									<span>{p.sides[c.side as keyof typeof p.sides] ?? c.side}</span>
								</li>{/each}
						</ul>
					{/if}
				</div>

				{#if copy.nextStep}<p class="next-step">
						<strong>{t.result.whatToDo}</strong>
						{copy.nextStep}
					</p>{/if}
				<p class="small muted">{p.disclaimer}</p>
				<div class="check-actions">
					{#if data.outcome !== 'NO_VISIBLE_INCONSISTENCIES' && data.verificationId}
						<a href="/scan?from={data.verificationId}" class="btn btn-block">{p.retakePhotos}</a>
					{/if}
					<a href="/check" class="btn btn-dark btn-block">{t.common.checkAnother}</a>
				</div>
				<p class="footer-note">{p.beta}</p>
			</div>
		</main>
	{/if}

	<SiteFooter />
</div>

<style>
	.comparing {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		padding: 20px 0;
		text-align: center;
	}
	.cmp-art {
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: var(--peri);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		overflow: hidden;
	}
	.cmp-mascot {
		width: 62%;
		margin-bottom: -4%;
		animation: bob 2.4s ease-in-out infinite;
	}
	@keyframes bob {
		50% {
			transform: translateY(-6px);
		}
	}
	.cmp-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		max-width: 520px;
	}
	.cmp-text h1 {
		font-size: 26px;
	}
	.cmp-note {
		margin: 0;
		color: #2e3242;
	}
	.cmp-steps {
		margin: 6px 0 0;
		padding: 16px 18px;
		list-style: none;
		border-radius: 20px;
		background: var(--white);
		border: 1px solid #e6e7ec;
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 15px;
		text-align: left;
	}
	.cmp-steps li {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.cmp-steps .now {
		font-weight: 700;
	}
	.cmp-tick {
		display: inline-flex;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--lime);
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
	}
	.cmp-spin {
		flex: 0 0 auto;
		width: 20px;
		height: 20px;
		margin: 2px;
		border-radius: 50%;
		border: 3px solid var(--line);
		border-top-color: var(--ink);
		animation: spin 0.9s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cmp-mascot,
		.cmp-spin {
			animation: none;
		}
	}
	.check {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.check-side {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.check-row {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		border-radius: var(--radius-l);
		border: 1px solid #e6e7ec;
		background: var(--white);
		text-decoration: none;
	}
	.check-pack {
		flex-direction: column;
		align-items: stretch;
	}
	.pack-head {
		display: flex;
		align-items: center;
		gap: 14px;
	}
	.check-text {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.see {
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
	}
	.tick {
		flex: 0 0 36px;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--lime);
		font-size: 18px;
		font-weight: 800;
	}
	.tick.warn,
	.tick.danger {
		background: var(--peach);
	}
	.tick.info {
		background: var(--grey-100);
	}
	.found {
		margin: 4px 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 10px;
	}
	.found li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 12px;
		border-radius: 14px;
		background: #f4f4f1;
		font-size: 13px;
	}
	.found li span {
		font-size: 12px;
		color: var(--text-3);
	}
	.check-actions {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	/* "Can't tell" sits on the pale periwinkle of the design. */
	.check-hero :global(.hero-info) {
		background: var(--peri-tint);
	}

	@media (min-width: 1024px) {
		.comparing {
			flex-direction: row;
			justify-content: center;
			gap: 72px;
			text-align: left;
		}
		.cmp-art {
			flex: 0 0 360px;
			width: 360px;
			height: 360px;
		}
		.cmp-text {
			align-items: flex-start;
			gap: 16px;
		}
		.cmp-text h1 {
			font-size: clamp(42px, 3.8vw, 54px);
			letter-spacing: -0.05em;
			line-height: 1;
		}
		.cmp-note {
			font-size: 18px;
			line-height: 1.55;
		}
		.check {
			display: grid;
			grid-template-columns: 5fr 6fr;
			gap: 20px;
		}
		.check-hero {
			display: flex;
			flex-direction: column;
		}
		.check-row {
			padding: 16px 18px;
			border-radius: 20px;
		}
		.check-text strong {
			font-size: 17px;
		}
		.tick {
			flex-basis: 40px;
			width: 40px;
			height: 40px;
		}
		.found {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.check-actions {
			margin-top: auto;
			flex-direction: row;
		}
		.check-actions .btn {
			min-height: 56px;
		}
	}
</style>
