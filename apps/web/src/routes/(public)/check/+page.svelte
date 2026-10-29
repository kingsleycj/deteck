<script lang="ts">
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import PublicTop from '#lib/ui/PublicTop.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
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

<div class="shell">
	<PublicTop />
	{#if page.url.searchParams.get('pilot') === 'on'}
		<p class="notice notice-ok small" role="status">{t.check.pilotOn}</p>
	{/if}

	<main class="grid-2">
		<section class="stack">
			<div class="hero hero-info home-hero">
				<div class="hero-row" style="margin-top: 0">
					<div class="hero-mascot" style="flex-basis: 104px; width: 104px">
						<Mascot mood={problem ? 'concerned' : 'wink'} />
					</div>
					<p class="bubble bubble-left" style="margin-bottom: 60px">
						{problem ? t.format.mascot : t.check.greeting}
					</p>
				</div>
			</div>

			<div>
				<h1>{t.check.title}</h1>
				<p class="muted" style="margin-top: 6px">{t.check.subtitle}</p>
			</div>

			<form
				method="post"
				action="?/check"
				class="stack"
				style="--gap: 10px"
				data-check-form
				novalidate
			>
				<label for="serial" class="label">{t.check.label}</label>
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
				{#if message}
					<p id="serial-error" class={problem ? 'error-text' : 'notice'} role="alert">{message}</p>
				{/if}
				<div class="hint-box" id="serial-hint">
					<Icon name="barcode" size={22} color="#4D5263" />
					<p><Rich text={t.check.hint} /></p>
				</div>
				<button type="submit" class="btn btn-primary btn-block" style="margin-top: 4px"
					>{t.check.submit}</button
				>
			</form>
			{#if turnstile}
				<form method="post" action="?/human" class="card stack" style="--gap: 10px">
					<p class="small"><Rich text={t.check.humanPrompt} /></p>
					<input type="hidden" name="serial" value={form?.serial ?? ''} />
					<div class="cf-turnstile" data-sitekey={turnstile}></div>
					<button class="btn btn-block">{t.check.humanButton}</button>
				</form>
			{/if}

			<div class="divider">{t.common.or}</div>
			<a href="/scan" class="btn btn-block"><Icon name="scan" />{t.check.scan}</a>
			<p class="footer-note" style="margin-top: 4px">{t.check.footer}</p>
		</section>

		<aside class="home-aside" aria-label={t.check.asideLabel}>
			<div class="card stack" style="--gap: 14px">
				<h2>{t.check.asideTitle}</h2>
				<ol class="reasons">
					<li><span><Rich text={t.check.asideSerial} /></span></li>
					<li><span><Rich text={t.check.asidePackaging} /></span></li>
					<li><span><Rich text={t.check.asideJourney} /></span></li>
				</ol>
				<p class="small muted">{t.check.asideNote}</p>
			</div>
		</aside>
	</main>

	<!-- Shown by /js/check.js while a check is in progress (progressive enhancement). -->
	<div class="checking-overlay" data-checking hidden>
		<div style="width: 140px"><Mascot mood="thinking" /></div>
		<h2>{t.check.checkingTitle}</h2>
		<p class="muted">{t.check.checkingBody}</p>
		<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
		<div class="notice" data-slow hidden>
			<p>{t.network.slow}</p>
			<button type="button" class="btn btn-dark btn-small" data-retry style="margin-top: 10px"
				>{t.check.retry}</button
			>
		</div>
		<div class="notice" data-offline hidden>
			<p><strong>{t.network.offlineTitle}</strong></p>
			<p>{t.network.offlineBody}</p>
			<button type="button" class="btn btn-dark btn-small" data-retry style="margin-top: 10px"
				>{t.check.tryAgain}</button
			>
		</div>
	</div>

	<SiteFooter />
</div>

<style>
	.home-aside {
		display: none;
	}
	@media (min-width: 900px) {
		.home-aside {
			display: block;
			position: sticky;
			top: 24px;
		}
	}
</style>
