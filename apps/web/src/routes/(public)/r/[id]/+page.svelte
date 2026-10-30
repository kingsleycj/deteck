<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import ResultHero from '#lib/ui/ResultHero.svelte';
	import JourneyTimeline from '#lib/ui/JourneyTimeline.svelte';
	import JourneyRow from '#lib/ui/JourneyRow.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import PageHead from '#lib/ui/PageHead.svelte';
	import CheckingOverlay from '#lib/ui/CheckingOverlay.svelte';
	import {
		formatMonth,
		journeyLinkLine,
		journeySummary,
		resultCopy
	} from '@deteck/core/messages/copy.ts';
	import { fmt, plural } from '#lib/i18n.ts';

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
	const plainValid = $derived(r?.code === 'VALID' && copy?.tone === 'valid');
	const j = $derived(data.journey);
	const hasJourney = $derived(Boolean(j && j.state !== 'NONE' && j.steps.length > 1));
	/**
	 * The desktop designs: "journey" (valid, with the journey beside it), "nojourney" (valid, no
	 * journey recorded yet) and "side" (the answer card with what to do beside it). Phones show the
	 * same parts in one column, in the mobile designs' order.
	 */
	const layout = $derived(plainValid ? (hasJourney ? 'journey' : 'nojourney') : 'side');
	// "Verify further by scan": the packaging check when this product has reference photos, or a
	// fresh scan when the serial wasn't found (the scan reads the code the pack really carries).
	// Hidden when the manufacturer hasn't shared its packaging (the designs' "no reference" state).
	const scanHref = $derived(
		data.canCheckPackaging
			? `/scan?from=${encodeURIComponent(data.id)}`
			: // A code without a serial can't be checked any better by scanning it again.
				(r?.code === 'UNRECOGNISED' && r.reason !== 'no_serial_in_code') ||
				  r?.reason === 'needs_scan'
				? '/scan'
				: null
	);
	const productLine = $derived(
		r?.product
			? `${r.product.brandName} ${r.product.strength} ${r.product.dosageForm.toLowerCase()}`
			: ''
	);
	const madeLine = $derived(
		r?.manufacturer && r.batch
			? [
					fmt(t.journey.madeBy, {
						maker: [r.manufacturer.name, r.manufacturer.town].filter(Boolean).join(', ')
					}),
					`${t.result.batch} ${r.batch.lot}`,
					`${t.result.expires} ${formatMonth(r.batch.expiryDate, t.common.notRecorded)}`
				].join(' · ')
			: undefined
	);
	const noReference = $derived(page.url.searchParams.get('scan') === 'noref');
</script>

<svelte:head>
	<title>DETECK · {copy ? copy.badges.join(' · ') : t.result.metaExpired}</title>
	<meta name="robots" content="noindex" />
	<script src="/js/check.js" defer></script>
</svelte:head>

<div class="shell app-frame">
	<PageHead back="/check" backLabel={t.result.backAria} title={t.result.head}>
		{#snippet aside()}
			{#if r}<span class="mono head-serial" aria-label={t.result.serialAria}>{r.serialDisplay}</span
				>{/if}
			<form method="post" action="/check?/check" class="head-check" data-check-form novalidate>
				<label for="head-serial" class="visually-hidden">{t.check.label}</label>
				<input
					id="head-serial"
					name="serial"
					class="mono"
					placeholder={t.check.placeholder}
					autocomplete="off"
					autocapitalize="characters"
					spellcheck="false"
					maxlength="200"
				/>
				<button class="btn btn-dark btn-small">{t.result.checkAnotherShort}</button>
			</form>
		{/snippet}
	</PageHead>

	{#if !r || !copy}
		<main class="stack" style="max-width: 520px">
			<div style="width: 120px"><Mascot mood="thinking" /></div>
			<h1>{t.result.expiredTitle}</h1>
			<p class="muted">{t.result.expiredBody}</p>
			<a href="/check" class="btn btn-primary">{t.common.checkSerial}</a>
		</main>
	{:else}
		{#snippet facts(big = false)}
			{#if r.product && r.code !== 'CANT_CONFIRM'}
				<section class="card b-facts" class:facts-big={big} aria-label={t.result.detailsAria}>
					<dl class="facts">
						<div class="wide">
							<dt>{t.result.product}</dt>
							<dd class="big">{productLine}</dd>
						</div>
						<div>
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
						<div class:expired={r.flags.includes('EXPIRED')}>
							<dt>{r.flags.includes('EXPIRED') ? t.result.expired : t.result.expires}</dt>
							<dd>{formatMonth(r.batch?.expiryDate, t.common.notRecorded)}</dd>
						</div>
					</dl>
				</section>
			{/if}
		{/snippet}

		{#snippet scanButton()}
			{#if scanHref}
				<a href={scanHref} class="btn btn-block b-scan"
					><Icon name="scan" />{data.canCheckPackaging
						? t.result.checkPackaging
						: t.result.scanCode}</a
				>
			{/if}
		{/snippet}

		{#snippet alerts()}
			<!-- Not for an expired pack: the sign-up would be deleted 30 days after expiry, already past. -->
			{#if r.code === 'VALID' && !r.flags.includes('EXPIRED')}
				<details
					class="card alert-signup b-alerts"
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
									<label class="option"
										><input type="radio" name="channel" value="email" checked />
										{t.alerts.email}</label
									>
									<label class="option"
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
							<label class="option"
								><input
									type="checkbox"
									name="consent"
									checked={Boolean(form && 'alertConsent' in form && form.alertConsent)}
								/>
								<span>{t.alerts.consent}</span></label
							>
							<button class="btn btn-small">{t.alerts.signUp}</button>
						</form>
					{/if}
				</details>
			{/if}
		{/snippet}

		{#snippet footnote()}
			<div class="b-foot">
				{#if !warning && r.code !== 'NEEDS_BATCH' && data.features.reports}
					<p class="small center" style="margin: 0 0 10px">
						{t.result.worried} <a href="/report?from={data.id}">{t.result.worriedLink}</a>
					</p>
				{/if}
				<p class="footer-note">{t.result.footnote}</p>
			</div>
		{/snippet}

		{#if noReference}
			<p class="notice notice-info small" role="status">{t.packaging.notAvailable}</p>
		{/if}

		<main class="result result-{layout}">
			{#if layout === 'journey' && j}
				<!-- Valid, with its journey: the answer and details on the left, the journey on the right. -->
				<div class="col col-left">
					<div class="b-hero">
						<ResultHero
							tone={copy.tone}
							badges={copy.badges}
							bubble={copy.bubble}
							mood={copy.mood}
							title={copy.title ?? copy.badges.join(' · ')}
						/>
					</div>
					{@render facts()}
					<a href="/r/{data.id}/journey" class="journey-link b-journey-link">
						<span class="icon-tile"><Icon name="journey" size={20} /></span>
						<span style="flex: 1 1 auto">
							<span style="display: block; font-weight: 700">{t.result.journeyLink}</span>
							<span class="sub">{journeyLinkLine(j, t)}</span>
						</span>
						<Icon name="chevron" color="#DCFC7E" />
					</a>
					<div class="b-bottom">
						{@render scanButton()}
						<a href="/check" class="btn btn-dark btn-block phone-only">{t.common.checkAnother}</a>
						{@render alerts()}
						{@render footnote()}
					</div>
				</div>
				<section class="col journey-panel" aria-labelledby="journey-title">
					<div class="jp-head">
						<div>
							<p class="eyebrow-dot">{t.journey.title}</p>
							<h2 id="journey-title">
								{j.state === 'BATCH_LEVEL'
									? journeyLinkLine(j, t)
									: j.lastHolder
										? fmt(t.journey.link.lastWith, { name: j.lastHolder.name, where: '' })
										: t.journey.title}
							</h2>
						</div>
						<span class="pill">{plural(j.recordedSteps, t.journey.stepsCount)}</span>
					</div>
					{#if j.state === 'BATCH_LEVEL'}
						<JourneyTimeline journey={j} />
					{:else}
						<JourneyRow journey={j} />
					{/if}
					<div class="jp-say">
						<div class="jp-mascot"><Mascot mood="wink" /></div>
						<p class="bubble bubble-left">
							{journeySummary(j, r.manufacturer?.name ?? t.result.theManufacturer, t)}
						</p>
					</div>
					<p class="notice jp-note">
						{j.state === 'BATCH_LEVEL'
							? t.journey.batchPrompt
							: j.lastHolder
								? fmt(t.journey.sellerPrompt, { holder: j.lastHolder.name })
								: ''}
					</p>
				</section>
			{:else if layout === 'nojourney'}
				<!-- Valid, no journey recorded yet. -->
				<div class="col col-left">
					<div class="b-hero">
						<ResultHero
							tone={copy.tone}
							badges={copy.badges}
							bubble={copy.bubble}
							mood={copy.mood}
							title={productLine || (copy.title ?? '')}
							sub={madeLine}
							full
						/>
					</div>
					<div class="phone-only stack" style="--gap: 16px">
						{@render facts()}
					</div>
				</div>
				<div class="col">
					<section class="card nojourney" aria-labelledby="journey-title">
						<p class="eyebrow-dot">{t.journey.title}</p>
						<div class="nj-circle"><div><Mascot mood="thinking" /></div></div>
						<h2 id="journey-title">{t.journey.noneTitle}</h2>
						<p class="muted">
							{journeySummary({ state: 'NONE', steps: [], recordedSteps: 0 }, '', t)}
							{t.result.journeyStillStands}
						</p>
						{#if scanHref}<a href={scanHref} class="btn b-scan-inline"
								><Icon name="scan" />{t.result.checkPackaging}</a
							>{/if}
					</section>
					<a href="/check" class="btn btn-dark btn-block phone-only">{t.common.checkAnother}</a>
					{@render alerts()}
					{@render footnote()}
				</div>
			{:else}
				<!-- Every other answer: the card on the left, the details and what to do on the right. -->
				<div class="col col-left">
					<div class="b-hero">
						<ResultHero
							tone={copy.tone}
							badges={copy.badges}
							bubble={copy.bubble}
							mood={copy.mood}
							title={copy.title ?? copy.badges.join(' · ')}
							serial={r.code === 'UNRECOGNISED' && r.reason !== 'no_serial_in_code'
								? r.serialDisplay
								: undefined}
							serialLabel={t.result.serialChecked}
							full
						/>
					</div>
				</div>
				<div class="col col-side">
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
					{@render facts(true)}
					{#if copy.reasons}
						<section class="card stack reasons-card" style="--gap: 12px">
							{#if r.code === 'UNRECOGNISED' && !r.serialHelp}<h2 class="reasons-title">
									{t.result.reasonsIntro}
								</h2>{/if}
							<ol class="reasons">
								{#each copy.reasons as reason (reason)}<li><span>{reason}</span></li>{/each}
							</ol>
						</section>
					{/if}
					{#if copy.nextStep && r.code !== 'UNRECOGNISED'}
						<p class="next-step" class:next-step-danger={copy.tone === 'danger'}>
							<strong>{t.result.whatToDo}</strong>
							{copy.nextStep}
						</p>
					{/if}
					{#if r.code === 'UNRECOGNISED' || r.code === 'NEEDS_BATCH'}
						<form
							method="post"
							action="/check?/check"
							class="card stack retype desk-only"
							style="--gap: 10px"
							data-check-form
							novalidate
						>
							<label for="retype" class="label">{t.result.retype}</label>
							<div class="inline-field">
								<input
									id="retype"
									name="serial"
									class="input input-serial"
									placeholder={t.check.placeholder}
									autocomplete="off"
									autocapitalize="characters"
									spellcheck="false"
									maxlength="200"
								/>
								<button class="btn btn-dark">{t.result.checkAgain}</button>
							</div>
						</form>
						<a href="/check" class="btn btn-dark btn-block phone-only">{t.result.retype}</a>
					{/if}
					{#if r.code === 'VALID' && j && j.state !== 'NONE'}
						<a href="/r/{data.id}/journey" class="btn btn-block">{t.result.journeyLink}</a>
					{/if}
					{@render scanButton()}
					{#if warning && data.features.reports}
						<a href="/report?from={data.id}" class="btn btn-block btn-danger-outline"
							>{t.result.report}</a
						>
					{/if}
					{#if r.code === 'UNRECOGNISED'}
						<p class="not-sure"><strong>{t.result.notSure}</strong> {copy.nextStep}</p>
					{:else if r.code !== 'NEEDS_BATCH'}
						<a href="/check" class="btn btn-dark btn-block b-another">{t.common.checkAnother}</a>
					{/if}
					{@render alerts()}
					{@render footnote()}
				</div>
			{/if}
		</main>
	{/if}

	<SiteFooter />
</div>

<!-- Shown by /js/check.js while a check from the header or the re-type form is on its way. -->
<CheckingOverlay />

<style>
	.result {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.col {
		display: flex;
		flex-direction: column;
		gap: 16px;
		min-width: 0;
	}
	.head-check,
	.desk-only,
	.journey-panel {
		display: none;
	}
	.alert-signup summary {
		cursor: pointer;
		min-height: 32px;
		display: flex;
		align-items: center;
	}
	.b-facts {
		padding: 6px 18px;
	}
	.expired dt,
	.expired dd {
		color: var(--red);
		font-weight: 800;
	}
	.reasons-title {
		font-size: 15px;
	}
	.inline-field {
		display: flex;
		gap: 10px;
	}
	.inline-field .btn {
		white-space: nowrap;
	}
	.inline-field input {
		flex: 1 1 auto;
		min-width: 0;
		height: 54px;
		border-radius: 999px;
		padding: 0 20px;
	}
	.not-sure {
		margin: 0;
		padding: 14px 18px;
		border-radius: 18px;
		background: var(--grey-100);
		font-size: 14px;
		line-height: 1.5;
	}
	.nojourney {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.nj-circle {
		display: none;
	}
	.eyebrow-dot {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
	}
	.eyebrow-dot::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #2d4fe0;
	}

	/* ---- the desktop designs (D2, D4, D11, D14) */
	@media (min-width: 1024px) {
		.head-serial,
		.phone-only {
			display: none;
		}
		.desk-only {
			display: flex;
		}
		.head-check {
			display: flex;
			gap: 8px;
		}
		.head-check input {
			width: 260px;
			height: 46px;
			padding: 0 18px;
			border-radius: 999px;
			border: 1px solid #c9cdd6;
			background: var(--paper);
			font-size: 15px;
			color: var(--ink);
		}
		.head-check .btn {
			height: 46px;
			min-height: 46px;
		}
		.result {
			display: grid;
			gap: 20px;
			align-items: stretch;
		}
		.result-journey {
			grid-template-columns: 5fr 7fr;
		}
		.result-side {
			grid-template-columns: 6fr 5fr;
		}
		.result-nojourney {
			grid-template-columns: 5fr 6fr;
		}
		.b-journey-link {
			display: none;
		}
		.b-hero {
			display: flex;
			flex-direction: column;
		}
		.result-side .b-hero,
		.result-nojourney .b-hero {
			flex: 1 1 auto;
		}
		.b-facts {
			border-radius: 24px;
			padding: 6px 22px;
		}
		.b-facts.facts-big {
			padding: 8px 26px;
		}
		.b-facts :global(dd.big) {
			font-family: var(--font-display);
			font-size: 22px;
		}
		.b-bottom {
			margin-top: auto;
			display: flex;
			flex-direction: column;
			gap: 10px;
		}
		.col-side .b-another,
		.col-side .not-sure {
			margin-top: auto;
		}
		.journey-panel {
			display: flex;
			flex-direction: column;
			gap: 22px;
			padding: 28px 32px;
			border-radius: 28px;
			background: var(--white);
			border: 1px solid #e6e7ec;
		}
		.jp-head {
			display: flex;
			align-items: flex-end;
			justify-content: space-between;
			gap: 20px;
		}
		.jp-head h2 {
			margin-top: 8px;
			font-size: clamp(26px, 2.4vw, 34px);
			letter-spacing: -0.04em;
		}
		.jp-say {
			display: flex;
			align-items: flex-end;
			gap: 14px;
			padding: 16px 18px 0;
			border-radius: 22px;
			background: var(--peri);
			overflow: hidden;
		}
		.jp-mascot {
			flex: 0 0 74px;
			width: 74px;
			margin-bottom: -4px;
		}
		.jp-say .bubble {
			margin: 0 0 16px;
			font-size: 14px;
		}
		.jp-note {
			margin-top: auto;
		}
		.nojourney {
			flex: 1 1 auto;
			align-items: center;
			justify-content: center;
			gap: 16px;
			padding: 28px;
			border-radius: 28px;
			text-align: center;
		}
		.nojourney .eyebrow-dot {
			align-self: flex-start;
		}
		.nj-circle {
			display: flex;
			width: 200px;
			height: 200px;
			border-radius: 50%;
			background: var(--grey-100);
			align-items: flex-end;
			justify-content: center;
			overflow: hidden;
		}
		.nj-circle > div {
			width: 130px;
			margin-bottom: -6px;
		}
		.nojourney h2 {
			font-size: 28px;
			letter-spacing: -0.03em;
		}
		.nojourney .muted {
			max-width: 440px;
			font-size: 15px;
			line-height: 1.55;
		}
		.b-scan-inline {
			margin-top: 8px;
		}
		.reasons-card {
			border-radius: 24px;
			padding: 24px 26px;
		}
		.reasons-title {
			font-size: 20px;
			font-weight: 700;
			letter-spacing: -0.02em;
		}
		.retype {
			border-radius: 24px;
			padding: 22px 26px;
		}
		.next-step {
			border-radius: 18px;
			padding: 16px 20px;
			font-size: 15px;
		}
	}
</style>
