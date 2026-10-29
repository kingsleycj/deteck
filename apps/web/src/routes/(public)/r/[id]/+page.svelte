<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import ResultHero from '#lib/ui/ResultHero.svelte';
	import JourneyTimeline from '#lib/ui/JourneyTimeline.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import LanguageMenu from '#lib/ui/LanguageMenu.svelte';
	import {
		formatMonth,
		journeyLinkLine,
		journeySummary,
		resultCopy
	} from '@deteck/core/messages/copy.ts';
	import { fmt } from '#lib/i18n.ts';

	let { data, form }: PageProps = $props();
	const t = $derived(data.t);
	const r = $derived(data.result);
	/** Results where reporting the pack is offered first. */
	const warning = $derived(
		r !== null &&
			(r.code === 'UNRECOGNISED' ||
				r.code === 'RECALLED' ||
				r.code === 'CANT_CONFIRM' ||
				r.flags.includes('LOT_MISMATCH') ||
				r.flags.includes('EXPIRY_MISMATCH'))
	);
	const copy = $derived(r ? resultCopy(r, t) : null);
	// Two different scans: re-reading the code (after Unrecognised) or the packaging check (beta).
	const scanLabel = $derived(
		data.canCheckPackaging
			? t.result.checkPackaging
			: r?.code === 'UNRECOGNISED' || r?.reason === 'needs_scan'
				? t.result.scanCode
				: null
	);
	const scanHref = $derived(`/scan?from=${encodeURIComponent(data.id)}`);
</script>

<svelte:head>
	<title>DETECK · {copy ? copy.badges.join(' · ') : t.result.metaExpired}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="shell">
	<header class="page-head">
		<a href="/check" class="back" aria-label={t.result.backAria}><Icon name="back" /></a>
		<span>{t.result.head}</span>
		{#if r}<span class="mono" aria-label={t.result.serialAria}>{r.serialDisplay}</span>{/if}
		<LanguageMenu />
	</header>

	{#if !r || !copy}
		<main class="stack" style="max-width: 520px">
			<div style="width: 120px"><Mascot mood="thinking" /></div>
			<h1>{t.result.expiredTitle}</h1>
			<p class="muted">{t.result.expiredBody}</p>
			<a href="/check" class="btn btn-primary">{t.common.checkSerial}</a>
		</main>
	{:else}
		<main class="grid-2">
			<section class="stack">
				<ResultHero
					tone={copy.tone}
					badges={copy.badges}
					bubble={copy.bubble}
					mood={copy.mood}
					title={copy.title}
				/>

				{#if r.code === 'NEEDS_BATCH' && r.reason !== 'needs_scan'}
					<form method="post" action="?/batch" class="card stack" style="--gap: 10px">
						<label for="lot" class="label">{t.result.batchLabel}</label>
						<input
							id="lot"
							name="lot"
							class="input input-serial"
							value={form?.lot ?? ''}
							autocomplete="off"
							autocapitalize="characters"
							required
							aria-describedby="lot-help"
						/>
						<p id="lot-help" class="help">{t.result.batchHelp}</p>
						{#if form?.message}<p class="error-text" role="alert">{form.message}</p>{/if}
						<button class="btn btn-primary btn-block">{t.result.continue}</button>
					</form>
				{/if}

				{#if r.product && r.code !== 'CANT_CONFIRM'}
					<section class="card" style="padding: 6px 18px" aria-label={t.result.detailsAria}>
						<dl class="facts">
							<div class="wide">
								<dt>{t.result.product}</dt>
								<dd class="big">
									{r.product.brandName}
									{r.product.strength}
									{r.product.dosageForm.toLowerCase()}
								</dd>
							</div>
							<div class="wide">
								<dt>{t.result.manufacturer}</dt>
								<dd>{r.manufacturer?.name}</dd>
							</div>
							<div>
								<dt>{t.result.nafdac}</dt>
								<dd class="mono">{r.product.nafdacRegNo}</dd>
							</div>
							<div>
								<dt>{t.result.batch}</dt>
								<dd class="mono">{r.batch?.lot}</dd>
							</div>
							<div>
								<dt>{r.flags.includes('EXPIRED') ? t.result.expired : t.result.expires}</dt>
								<dd>{formatMonth(r.batch?.expiryDate)}</dd>
							</div>
							<div>
								<dt>{t.result.pack}</dt>
								<dd>{r.product.packSize}</dd>
							</div>
						</dl>
					</section>
				{/if}

				{#if copy.reasons}
					<section class="card stack" style="--gap: 12px">
						{#if r.code === 'UNRECOGNISED' && !r.serialHelp}<p
								class="small"
								style="font-weight: 700"
							>
								{t.result.reasonsIntro}
							</p>{/if}
						<ol class="reasons">
							{#each copy.reasons as reason (reason)}<li><span>{reason}</span></li>{/each}
						</ol>
					</section>
				{/if}

				{#if copy.nextStep}
					<p class="next-step" class:next-step-danger={copy.tone === 'danger'}>{copy.nextStep}</p>
				{/if}

				{#if r.code === 'VALID'}
					<a href="/r/{data.id}/journey" class="journey-link journey-mobile">
						<span class="icon-tile"><Icon name="journey" size={20} /></span>
						<span style="flex: 1 1 auto">
							<span style="display: block; font-weight: 700">{t.result.journeyLink}</span>
							<span class="sub">{journeyLinkLine(data.journey, t)}</span>
						</span>
						<Icon name="chevron" color="#DCFC7E" />
					</a>
				{/if}

				<div class="stack" style="--gap: 10px">
					{#if scanLabel}
						<a href={data.canCheckPackaging ? scanHref : '/scan'} class="btn btn-block"
							><Icon name="scan" />{scanLabel}</a
						>
					{/if}
					{#if r.code === 'UNRECOGNISED' || r.code === 'NEEDS_BATCH'}
						<a href="/check" class="btn btn-block">{t.result.retype}</a>
					{:else}
						<a href="/check" class="btn btn-block">{t.common.checkAnother}</a>
					{/if}
					{#if warning}
						<a href="/report?from={data.id}" class="btn btn-block btn-danger-outline"
							>{t.result.report}</a
						>
					{/if}
				</div>
				{#if r.code === 'VALID'}
					<details
						class="card alert-signup"
						open={Boolean(form && ('alertMessage' in form || 'alertDone' in form))}
					>
						<summary><strong>{t.alerts.summary}</strong></summary>
						{#if form && 'alertDone' in form}
							<p class="notice notice-ok small" role="status">{form.alertDone}</p>
						{:else}
							<form
								method="post"
								action="?/alert"
								class="stack"
								style="--gap: 10px; margin-top: 10px"
							>
								{#if data.whatsappAlerts}
									<fieldset class="row small" style="--gap: 14px; border: 0; padding: 0; margin: 0">
										<legend class="visually-hidden">{t.alerts.how}</legend>
										<label class="row" style="--gap: 6px"
											><input type="radio" name="channel" value="email" checked />
											{t.alerts.email}</label
										>
										<label class="row" style="--gap: 6px"
											><input type="radio" name="channel" value="whatsapp" />
											{t.alerts.whatsapp}</label
										>
									</fieldset>
								{/if}
								<div class="field">
									<label for="alert-address"
										>{data.whatsappAlerts ? t.alerts.addressBoth : t.alerts.email}</label
									>
									<input
										id="alert-address"
										name="address"
										required
										maxlength="200"
										value={form && 'alertAddress' in form ? form.alertAddress : ''}
										autocomplete="email"
									/>
								</div>
								{#if form && 'alertMessage' in form}<p class="error-text" role="alert">
										{form.alertMessage}
									</p>{/if}
								<label class="row small" style="--gap: 8px; align-items: flex-start"
									><input type="checkbox" name="consent" style="margin-top: 3px" />
									<span>{t.alerts.consent}</span></label
								>
								<button class="btn btn-small">{t.alerts.signUp}</button>
							</form>
						{/if}
					</details>
				{/if}

				{#if !warning && r.code !== 'NEEDS_BATCH'}
					<p class="small center" style="margin-top: 10px">
						{t.result.worried} <a href="/report?from={data.id}">{t.result.worriedLink}</a>
					</p>
				{/if}

				<p class="footer-note">{t.result.footnote}</p>
			</section>

			{#if r.code === 'VALID'}
				<aside
					class="card stack journey-desktop"
					aria-labelledby="journey-title"
					style="--gap: 14px"
				>
					<h2 id="journey-title">{t.journey.title}</h2>
					{#if data.journey && data.journey.state !== 'NONE'}
						<p class="muted small">
							{journeySummary(data.journey, r.manufacturer?.name ?? t.result.TheManufacturer, t)}
						</p>
						<JourneyTimeline journey={data.journey} />
						{#if data.journey.state === 'TO_RETAIL' && data.journey.lastHolder}
							<p class="notice">
								{fmt(t.journey.sellerPrompt, { holder: data.journey.lastHolder.name })}
							</p>
						{:else if data.journey.state === 'BATCH_LEVEL'}
							<p class="notice">{t.journey.batchPrompt}</p>
						{/if}
					{:else}
						<p class="step-name" style="font-weight: 700">{t.journey.noneTitle}</p>
						<p class="muted small">
							{journeySummary({ state: 'NONE', steps: [], recordedSteps: 0, gaps: 0 }, '', t)}
							{t.result.journeyStillStands}
						</p>
					{/if}
				</aside>
			{/if}
		</main>
	{/if}

	<SiteFooter />
</div>

<style>
	.alert-signup summary {
		cursor: pointer;
		min-height: 32px;
		display: flex;
		align-items: center;
	}
	.alert-signup {
		margin-top: 12px;
	}
	.journey-desktop {
		display: none;
	}
	@media (min-width: 900px) {
		.journey-desktop {
			display: flex;
		}
		.journey-mobile {
			display: none;
		}
	}
</style>
