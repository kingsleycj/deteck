<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PublicTop from '#lib/ui/PublicTop.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import CheckingOverlay from '#lib/ui/CheckingOverlay.svelte';
	import Rich from '#lib/ui/Rich.svelte';
	import { rateLimited } from '@deteck/core/messages/copy.ts';

	let { data, form }: PageProps = $props();
	const t = $derived(data.t);

	const problem = $derived(form && 'problem' in form ? form.problem : undefined);
	const retryAfter = $derived(form && 'retryAfter' in form ? form.retryAfter : undefined);
	const slow = $derived(Boolean(form && 'slow' in form && form.slow));
	const turnstile = $derived(form && 'turnstile' in form ? form.turnstile : null);
	const message = $derived(
		problem
			? t.format[problem]
			: slow
				? t.network.slowServer
				: retryAfter
					? rateLimited(retryAfter, t)
					: undefined
	);
</script>

<svelte:head>
	<title>{t.check.metaTitle}</title>
	<meta name="description" content={t.check.metaDescription} />
	<script src="/js/check.js" defer></script>
	{#if turnstile}<script
			src="https://challenges.cloudflare.com/turnstile/v0/api.js"
			async
			defer
		></script>{/if}
</svelte:head>

<div class="shell app-frame">
	<PublicTop />
	{#if page.url.searchParams.get('pilot') === 'on'}
		<p class="notice notice-ok small" role="status">{t.check.pilotOn}</p>
	{/if}

	<!-- Phones: the mobile design (M1). Wide screens: the desktop designs, D1 (the form on the left,
	     Deteck's panel on the right) and D9 when the serial's format is wrong. -->
	<main class="home" class:home-problem={problem}>
		<section class="home-main">
			<div class="hero hero-info home-hero phone-only">
				<div class="hero-row" style="margin-top: 0">
					<div class="hero-mascot" style="flex-basis: 104px; width: 104px">
						<Mascot mood={problem ? 'concerned' : 'wink'} />
					</div>
					<p class="bubble bubble-left" style="margin-bottom: 60px">
						{problem ? t.format.mascot : t.check.greeting}
					</p>
				</div>
			</div>

			{#if !problem}<p class="eyebrow-dot desk-only">{t.check.eyebrow}</p>{/if}
			<div class="home-title">
				<h1>{t.check.title}<span class="desk-only" aria-hidden="true">.</span></h1>
				<p class="muted phone-only">{t.check.subtitle}</p>
				<p class="lede desk-only">{t.check.lede}</p>
			</div>

			<form
				method="post"
				action="?/check"
				class="stack check-form"
				style="--gap: 10px"
				data-check-form
				novalidate
			>
				<label for="serial" class="label">{t.check.label}</label>
				<div class="serial-row">
					<input
						id="serial"
						name="serial"
						type="text"
						class="input input-serial"
						placeholder={t.check.placeholder}
						value={form?.serial ?? ''}
						autocomplete="off"
						autocapitalize="characters"
						spellcheck="false"
						inputmode="text"
						maxlength="200"
						required
						aria-invalid={problem ? 'true' : undefined}
						aria-describedby={message ? 'serial-error serial-hint' : 'serial-hint'}
					/>
					<button type="submit" class="btn btn-primary submit">{t.check.submit}</button>
				</div>
				{#if message}
					<p id="serial-error" class={problem ? 'error-text with-icon' : 'notice'} role="alert">
						{#if problem}<Icon name="alert" size={18} color="#B42318" />{/if}{message}
					</p>
				{/if}
				<div class="hint-box" id="serial-hint">
					<Icon name="barcode" size={22} color="#4D5263" />
					<p><Rich text={t.check.hint} /></p>
				</div>
			</form>
			{#if turnstile}
				<form method="post" action="?/human" class="card stack" style="--gap: 10px">
					<p class="small"><Rich text={t.check.humanPrompt} /></p>
					<input type="hidden" name="serial" value={form?.serial ?? ''} />
					<div class="cf-turnstile" data-sitekey={turnstile}></div>
					<button class="btn btn-block">{t.check.humanButton}</button>
				</form>
			{/if}

			<div class="divider phone-only">{t.common.or}</div>
			<div class="scan-row">
				<a href="/scan" class="btn scan-btn"><Icon name="scan" />{t.check.scan}</a>
				<p class="desk-only">{t.check.scanNote}</p>
			</div>
			<p class="footer-note phone-only" style="margin-top: 4px">{t.check.footer}</p>
		</section>

		{#if problem}
			<aside class="home-panel panel-tips desk-only" aria-labelledby="tips-title">
				<p class="tips-eyebrow">{t.check.tipsEyebrow}</p>
				<h2 id="tips-title">{t.check.tipsTitle}</h2>
				<ul class="tips">
					<li><Rich text={t.check.tip1} /></li>
					<li><Rich text={t.check.tip2} /></li>
					<li><Rich text={t.check.tip3} /></li>
				</ul>
				<div class="panel-say">
					<div class="panel-mascot"><Mascot mood="concerned" /></div>
					<p class="bubble bubble-left">{t.format.mascot}</p>
				</div>
			</aside>
		{:else}
			<aside class="home-panel panel-hello desk-only" aria-label={t.check.asideLabel}>
				<svg class="swoosh" aria-hidden="true" viewBox="0 0 600 300" preserveAspectRatio="none"
					><path
						d="M40 170 C 110 240 160 290 220 270 C 290 250 360 110 600 40"
						fill="none"
						stroke="#DCFC7E"
						stroke-width="16"
						stroke-linecap="round"
					/></svg
				>
				<ol class="steps">
					<li>
						<span class="step-t">{t.check.step1Title}</span><span>{t.check.step1Text}</span>
					</li>
					<li>
						<span class="step-t">{t.check.step2Title}</span><span>{t.check.step2Text}</span>
					</li>
					<li>
						<span class="step-t">{t.check.step3Title}</span><span>{t.check.step3Text}</span>
					</li>
				</ol>
				<div class="panel-say hello">
					<div class="panel-mascot"><Mascot mood="wink" /></div>
					<div class="hello-bubble">
						<p class="hello-title">{t.check.helloTitle}</p>
						<p>{t.check.helloBody}</p>
					</div>
				</div>
			</aside>
		{/if}
	</main>

	<SiteFooter />
</div>

<CheckingOverlay />

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.home-main {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	/* Phones: the box, the hint, then the button (one button: it moves beside the box on desktop). */
	.serial-row {
		display: contents;
	}
	.submit {
		order: 10;
		width: 100%;
		margin-top: 4px;
	}
	.with-icon {
		display: flex;
		align-items: flex-start;
		gap: 8px;
	}
	.with-icon :global(svg) {
		margin-top: 1px;
	}
	.scan-btn {
		width: 100%;
	}
	.eyebrow-dot {
		margin: 0;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
	}
	.eyebrow-dot::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #2d4fe0;
	}

	@media (min-width: 1024px) {
		.home {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 20px;
			padding-top: 28px !important;
			padding-bottom: 36px !important;
		}
		.home-problem {
			grid-template-columns: 6fr 5fr;
		}
		.home-main {
			justify-content: center;
			gap: 0;
			padding: 0 40px 0 12px;
		}
		.eyebrow-dot {
			display: flex;
			margin-bottom: 18px;
		}
		.home-title h1 {
			font-size: clamp(54px, 5vw, 72px);
			letter-spacing: -0.05em;
			line-height: 0.95;
		}
		.lede {
			margin: 20px 0 0;
			max-width: 480px;
			font-size: 18px;
			line-height: 1.55;
			color: #2e3242;
		}
		.check-form {
			margin-top: 34px;
			max-width: 560px;
		}
		.check-form .label {
			font-size: 14px;
		}
		.serial-row {
			display: flex;
			gap: 10px;
		}
		.serial-row input {
			flex: 1 1 auto;
			min-width: 0;
			height: 60px;
			padding: 0 22px;
			border-radius: 999px;
			border: 1.5px solid var(--ink);
			font-size: 17px;
		}
		.submit {
			order: 0;
			width: auto;
			margin-top: 0;
			flex: 0 0 auto;
			height: 60px;
			padding: 0 30px;
			font-size: 16px;
		}
		/* The hint becomes the design's small line under the box. */
		.hint-box {
			padding: 0;
			margin: 2px 0 0 4px;
			background: none;
			border: 0;
			font-size: 13px;
			color: var(--text-3);
		}
		.hint-box :global(svg) {
			display: none;
		}
		.scan-row {
			margin-top: 26px;
			display: flex;
			align-items: center;
			gap: 16px;
		}
		.scan-btn {
			width: auto;
			height: 52px;
			padding: 0 22px;
		}
		.scan-row p {
			margin: 0;
			max-width: 240px;
			font-size: 13px;
			line-height: 1.45;
			color: var(--text-3);
		}
		/* D9: the form sits in a white card. */
		.home-problem .home-main {
			justify-content: flex-start;
			padding: 44px;
			border-radius: 28px;
			background: var(--white);
			border: 1px solid #e6e7ec;
		}
		.home-problem .home-title h1 {
			font-size: clamp(46px, 4.2vw, 60px);
			line-height: 0.98;
		}
		.home-problem .lede {
			max-width: 520px;
			margin-top: 18px;
			font-size: 17px;
			color: var(--text-2);
		}
		.home-problem .check-form {
			margin-top: 28px;
		}
		.home-problem .serial-row input {
			height: 64px;
			border: 2px solid var(--red);
			font-size: 18px;
		}
		.home-problem .submit {
			height: 64px;
		}
		.home-problem .scan-row {
			margin-top: auto;
			padding-top: 26px;
		}
		.home-problem .scan-row p {
			display: none;
		}
		.check-form .error-text {
			margin: 4px 0 0 6px;
			font-size: 15px;
		}

		.home-panel {
			position: relative;
			overflow: hidden;
			border-radius: 28px;
			display: flex;
			flex-direction: column;
			min-height: 600px;
		}
		/* The step cards sit at the top and Deteck at the bottom, both in the flow, so a longer
		   language can't make the bubble cover the cards. */
		.panel-hello {
			justify-content: space-between;
			gap: 24px;
			padding: 28px;
			background: var(--peri);
		}
		.swoosh {
			position: absolute;
			inset: 0;
			width: 100%;
			height: 100%;
		}
		.steps {
			position: relative;
			margin: 0;
			padding: 0;
			list-style: none;
			display: grid;
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 10px;
		}
		.steps li {
			display: flex;
			flex-direction: column;
			gap: 4px;
			padding: 14px;
			border-radius: 18px;
			background: rgba(255, 255, 255, 0.85);
			font-size: 13px;
			line-height: 1.4;
		}
		.step-t {
			font-size: 12px;
			font-weight: 700;
			color: #2d4fe0;
		}
		.panel-say {
			position: relative;
			display: flex;
			align-items: flex-end;
			gap: 18px;
		}
		.hello .panel-mascot {
			flex: 0 0 210px;
			width: 210px;
			margin-bottom: -32px;
		}
		/* Narrower desktops (and longer languages): a smaller Deteck leaves the bubble room. */
		@media (max-width: 1199px) {
			.hello .panel-mascot {
				flex-basis: 150px;
				width: 150px;
			}
		}
		.hello-bubble {
			flex: 1 1 auto;
			margin-bottom: 110px;
			padding: 18px 20px;
			border-radius: 22px 22px 22px 6px;
			background: var(--white);
			box-shadow: 0 12px 30px rgba(20, 40, 120, 0.15);
		}
		.hello-bubble p {
			margin: 6px 0 0;
			font-size: 15px;
			line-height: 1.5;
			color: #2e3242;
		}
		.hello-bubble .hello-title {
			margin: 0;
			font-family: var(--font-display);
			font-size: 22px;
			font-weight: 700;
			letter-spacing: -0.02em;
			color: var(--ink);
		}
		/* D9: where to find the serial. */
		.panel-tips {
			padding: 32px 32px 0;
			background: var(--peach);
		}
		.tips-eyebrow {
			margin: 0;
			font-size: 12px;
			font-weight: 800;
			letter-spacing: 0.06em;
			text-transform: uppercase;
			color: var(--peach-ink);
		}
		.panel-tips h2 {
			margin-top: 10px;
			font-size: 32px;
			letter-spacing: -0.035em;
		}
		.tips {
			margin: 16px 0 0;
			padding: 0;
			list-style: none;
			display: flex;
			flex-direction: column;
			gap: 10px;
			font-size: 15px;
			line-height: 1.45;
		}
		.tips li {
			padding: 12px 16px;
			border-radius: 16px;
			background: rgba(255, 255, 255, 0.75);
		}
		.panel-tips .panel-say {
			margin-top: auto;
			gap: 16px;
		}
		.panel-tips .panel-mascot {
			flex: 0 0 150px;
			width: 150px;
			margin-bottom: -8px;
		}
		.panel-tips .bubble {
			margin: 0 0 70px;
			padding: 14px 16px;
			font-size: 15px;
		}
	}
</style>
