<script lang="ts">
	import Seo from '#lib/ui/Seo.svelte';
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Logo from '#lib/ui/Logo.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import LanguageMenu from '#lib/ui/LanguageMenu.svelte';
	import { LANDING_PHOTOS, photoSrcset } from '#lib/landing-photos.ts';
	import CheckingOverlay from '#lib/ui/CheckingOverlay.svelte';
	import Rich from '#lib/ui/Rich.svelte';
	import { page } from '$app/state';
	import { LOGO, plainText, SITE_NAME } from '#lib/seo.ts';

	let { data }: PageProps = $props();
	const t = $derived(data.t);
	const l = $derived(t.landing);

	// A pitch page for now (B-83): Akuabata's wording of 3 Nov 2026. Claims stay within what DETECK
	// does (analysis C-04 to C-08): a pack matches its maker's records; nothing here says a
	// medicine is genuine or safe. Sign-up flows come back when onboarding starts.
	const trust = $derived([l.trust.free, l.trust.network, l.trust.languages, l.trust.records]);
	const faqs = $derived([
		[l.faq.useQ, l.faq.useA],
		[l.faq.helpQ, l.faq.helpA],
		[l.faq.resultsQ, l.faq.resultsA],
		[l.faq.sourceQ, l.faq.sourceA],
		[l.faq.coverQ, l.faq.coverA],
		[l.faq.nextQ, l.faq.nextA]
	]);
	const WHO = {
		individuals: LANDING_PHOTOS.individuals,
		facilities: LANDING_PHOTOS.pharmacies,
		makers: LANDING_PHOTOS.distributors
	};
	const who = $derived([
		{
			id: 'individuals',
			...l.who.individuals,
			photo: WHO.individuals.file,
			links: [{ href: '/check', label: l.who.individuals.cta }]
		},
		{
			id: 'facilities',
			...l.who.facilities,
			photo: WHO.facilities.file,
			links: [
				{ href: '/business/register/pharmacy?role=pharmacy', label: l.who.facilities.pharmacy },
				{ href: '/business/register/pharmacy?role=hospital', label: l.who.facilities.hospital }
			]
		},
		{
			id: 'makers',
			...l.who.makers,
			photo: WHO.makers.file,
			links: [
				{ href: '/business/register', label: l.who.makers.manufacturer },
				{ href: '/business/register/pharmacy?role=distributor', label: l.who.makers.distributor }
			]
		}
	]);
	// What search engines read about DETECK (B-85): who runs it, the site, and the questions above.
	const structured = $derived.by(() => {
		const origin = page.url.origin;
		return [
			{
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: SITE_NAME,
				url: `${origin}/`,
				logo: new URL(LOGO, origin).href,
				areaServed: 'NG',
				contactPoint: {
					'@type': 'ContactPoint',
					contactType: 'customer support',
					url: `${origin}/contact`,
					availableLanguage: data.languages.map((l) => l.code)
				}
			},
			{ '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${origin}/` },
			{
				'@context': 'https://schema.org',
				'@type': 'FAQPage',
				inLanguage: data.lang,
				mainEntity: faqs.map(([q, a]) => ({
					'@type': 'Question',
					name: q,
					acceptedAnswer: { '@type': 'Answer', text: plainText(a) }
				}))
			}
		];
	});
	const credits = [
		LANDING_PHOTOS.hero,
		LANDING_PHOTOS.verify,
		WHO.individuals,
		WHO.facilities,
		WHO.makers,
		LANDING_PHOTOS.citizens
	].filter((c, i, all) => all.findIndex((other) => other.page === c.page) === i);
</script>

<Seo title={l.metaTitle} description={l.metaDescription} path="/" multilingual {structured} />
<svelte:head>
	<script src="/js/check.js" defer></script>
	<script src="/js/menu.js" defer></script>
</svelte:head>

<a class="skip" href="#main">{l.skip}</a>

<header class="top">
	<div class="wrap top-row">
		<a href="/" aria-label={t.nav.home} class="top-logo"><Logo height={30} /></a>
		<nav class="top-nav" aria-label={t.nav.main}>
			<a href="#how">{t.nav.how}</a>
			<a href="#faq">{l.navFaq}</a>
			<a href="/contact">{t.nav.contact}</a>
		</nav>
		<div class="top-actions">
			<span class="wide-nav"><LanguageMenu /></span>
			<a class="pill lime top-check" href="/check">{t.common.checkMedicine}</a>
			<!-- Public pages run without JavaScript: the menu is a disclosure the browser opens. -->
			<details class="menu">
				<summary aria-label={t.nav.menu}><Icon name="menu" size={22} /></summary>
				<div class="menu-panel">
					<nav aria-label={t.nav.main}>
						<a href="#how">{t.nav.how}</a>
						<a href="#faq">{l.navFaq}</a>
						<a href="/contact">{t.nav.contact}</a>
					</nav>
					<a class="pill lime" href="/check">{t.common.checkMedicine}</a>
					<LanguageMenu />
				</div>
			</details>
		</div>
	</div>
</header>

<main id="main">
	<!-- Hero: a serial check right away, beside a photo of medicine on a pharmacy counter. -->
	<section class="wrap" aria-labelledby="hero-title">
		<div class="lp-hero">
			<div class="lp-copy">
				<h1 id="hero-title">{l.heroTitle}</h1>
				<p class="lede">{l.lede}</p>
				<form method="post" action="/check?/check" class="serial-form" data-check-form novalidate>
					<label for="serial">{l.verifyLabel}</label>
					<div class="serial-field">
						<input
							id="serial"
							name="serial"
							type="text"
							placeholder={t.check.placeholder}
							autocomplete="off"
							autocapitalize="characters"
							spellcheck="false"
							required
						/>
						<button class="pill ink">{l.verifyButton}<Icon name="arrow" color="#DCFC7E" /></button>
					</div>
				</form>
				<div class="lp-links">
					<a class="pill outline" href="/scan"><Icon name="scan" />{l.scanPack}</a>
					<a class="text-link" href="#how">{l.seeHow}</a>
				</div>
				<p class="lp-note">{l.heroNote}</p>
			</div>
			<div class="lp-media">
				<div class="lp-photo">
					<img
						src="/img/landing/{LANDING_PHOTOS.hero.file}-1024.webp"
						srcset={photoSrcset(LANDING_PHOTOS.hero.file)}
						sizes="(max-width: 1023px) 100vw, 560px"
						width="1024"
						height="683"
						alt={l.heroAlt}
						fetchpriority="high"
						decoding="async"
					/>
				</div>
				<div class="lp-mascot" aria-hidden="true">
					<p class="lp-bubble">{l.heroBubble}</p>
					<div class="bob"><Mascot mood="wink" /></div>
				</div>
			</div>
		</div>
		<ul class="trust">
			{#each trust as item (item)}
				<li>{item}</li>
			{/each}
		</ul>
	</section>

	<!-- The film: Akuabata's showreel goes here once SHOWREEL_URL is set. -->
	<section id="film" class="wrap film" aria-label={l.reel.label}>
		<div class="reel">
			{#if data.showreel}
				<!-- The demo film has no captions file yet (SHOWREEL_CAPTIONS): a captions track with nothing
				     in it would only mislead. Add one with the final film. -->
				<!-- svelte-ignore a11y_media_has_caption -->
				<video
					src={data.showreel.video}
					poster={data.showreel.poster}
					controls
					playsinline
					preload="none"
					aria-label={l.reel.label}
				>
					{#if data.showreel.captions}<track
							kind="captions"
							src={data.showreel.captions}
							srclang="en"
							label="English"
						/>{/if}
				</video>
			{:else}
				<div class="reel-empty smiles-ink" role="img" aria-label="{l.reel.label}: {l.reel.soon}">
					<span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"
					></span><span class="corner br"></span>
					<div class="reel-centre" aria-hidden="true">
						<span class="play"><Icon name="play" size={34} color="#0B0B0F" stroke={2} /></span>
						<span class="reel-name">{l.reel.label}</span>
						<span class="reel-soon">{l.reel.soon}</span>
					</div>
					<span class="reel-ratio" aria-hidden="true">16:9</span>
				</div>
			{/if}
		</div>
	</section>

	<section id="how" class="wrap section" aria-labelledby="how-title">
		<div class="section-head">
			<h2 id="how-title" class="display">{l.howTitle}</h2>
		</div>
		<ol class="lp-steps">
			<li>
				<span class="step-n" aria-hidden="true">01</span>
				<span class="step-icon" aria-hidden="true"><Icon name="scan" size={26} /></span>
				<h3>{l.step1Title}</h3>
				<p>{l.step1Text}</p>
			</li>
			<li>
				<span class="step-n" aria-hidden="true">02</span>
				<span class="step-icon" aria-hidden="true"><Icon name="records" size={26} /></span>
				<h3>{l.step2Title}</h3>
				<p>{l.step2Text}</p>
			</li>
			<li class="step-last">
				<span class="step-n" aria-hidden="true">03</span>
				<span class="step-icon" aria-hidden="true"><Icon name="check" size={26} stroke={3} /></span>
				<h3>{l.step3Title}</h3>
				<p>{l.step3Text}</p>
			</li>
		</ol>
	</section>

	<!-- Verify further: the packaging photo check, with the camera screen over a real, unlabelled pack. -->
	<section id="verify-further" class="wrap section" aria-labelledby="vf-title">
		<div class="vf">
			<div class="vf-media">
				<img
					src="/img/landing/{LANDING_PHOTOS.verify.file}-1024.webp"
					srcset={photoSrcset(LANDING_PHOTOS.verify.file)}
					sizes="(max-width: 1023px) 100vw, 620px"
					width="1024"
					height="804"
					alt={l.verifyFurther.alt}
					loading="lazy"
					decoding="async"
				/>
				<!-- The scanning line, moving inside the camera frame drawn on the picture. -->
				<span class="vf-scan" aria-hidden="true"></span>
			</div>
			<div class="vf-copy">
				<h2 id="vf-title" class="display">{l.verifyFurther.title}</h2>
				<p class="section-lede">{l.verifyFurther.text}</p>
				<a class="pill lime big vf-button" href="/scan"
					><Icon name="scan" />{l.verifyFurther.button}</a
				>
			</div>
		</div>
	</section>

	<!-- Who we serve: one section with three tabs. The tabs are radio buttons, so they work without
	     JavaScript; a browser without :has() shows the three panels one after another instead. -->
	<section id="who" class="wrap section" aria-labelledby="who-title">
		<div class="who">
			{#each who as w, i (w.id)}
				<input
					type="radio"
					name="who"
					id="who-{w.id}"
					class="who-radio visually-hidden"
					checked={i === 0}
				/>
			{/each}
			<div class="who-side">
				<h2 id="who-title" class="who-title">{l.who.title}</h2>
				<div class="who-tabs">
					{#each who as w (w.id)}
						<label for="who-{w.id}" class="who-tab" data-who={w.id}
							><span class="who-arrow" aria-hidden="true">→</span>{w.tab}</label
						>
					{/each}
				</div>
			</div>
			<div class="who-panels">
				{#each who as w (w.id)}
					<article class="who-panel" data-who={w.id} aria-labelledby="who-{w.id}-title">
						<img
							src="/img/landing/{w.photo}-1024.webp"
							srcset={photoSrcset(w.photo)}
							sizes="(max-width: 1023px) 100vw, 780px"
							width="1024"
							height="683"
							alt={w.alt}
							loading="lazy"
							decoding="async"
						/>
						<div class="who-shade" aria-hidden="true"></div>
						<div class="who-text">
							<p class="who-kicker">{w.tab}</p>
							<h3 id="who-{w.id}-title">{w.title}</h3>
							<p>{w.text}</p>
							<div class="who-links">
								{#each w.links as link (link.href)}
									<a class="pill lime" href={link.href}
										>{link.label}<Icon name="arrow" size={16} /></a
									>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section id="impact" class="wrap section" aria-labelledby="impact-title">
		<div class="section-head">
			<h2 id="impact-title" class="display">{l.impact.title}</h2>
		</div>
		<ul class="impact">
			<li class="impact-lime">
				<span class="impact-n" aria-hidden="true">01</span>
				<h3>{l.impact.familiesTitle}</h3>
				<p>{l.impact.familiesText}</p>
			</li>
			<li class="impact-peri">
				<span class="impact-n" aria-hidden="true">02</span>
				<h3>{l.impact.dispensingTitle}</h3>
				<p>{l.impact.dispensingText}</p>
			</li>
			<li class="impact-peach">
				<span class="impact-n" aria-hidden="true">03</span>
				<h3>{l.impact.productsTitle}</h3>
				<p>{l.impact.productsText}</p>
			</li>
		</ul>
	</section>

	<section id="vision" class="wrap section" aria-labelledby="vision-title">
		<div class="vision">
			<div class="vision-photo">
				<img
					src="/img/landing/{LANDING_PHOTOS.citizens.file}-640.webp"
					srcset={photoSrcset(LANDING_PHOTOS.citizens.file)}
					sizes="(max-width: 1023px) 100vw, 600px"
					width="640"
					height="427"
					alt={l.visionAlt}
					loading="lazy"
					decoding="async"
				/>
			</div>
			<div class="vision-copy">
				<h2 id="vision-title" class="display">{l.visionTitle}</h2>
				<p class="section-lede">{l.visionText}</p>
			</div>
		</div>
	</section>

	<section id="faq" class="wrap section" aria-labelledby="faq-title">
		<div class="faq">
			<div class="faq-head">
				<h2 id="faq-title" class="display">{l.faq.title}</h2>
				<div class="faq-mascot" aria-hidden="true"><Mascot mood="thinking" /></div>
			</div>
			<div class="faq-list">
				{#each faqs as [q, a] (q)}
					<details>
						<summary>{q}<span class="faq-plus" aria-hidden="true"></span></summary>
						<p><Rich text={a} /></p>
					</details>
				{/each}
				<div class="faq-more">
					<p>{l.faq.more}</p>
					<div class="faq-more-buttons">
						<a class="pill ink" href="/contact?topic=partnering">{l.faq.partner}</a>
						<a class="pill outline-ink" href="/developers">{l.faq.api}</a>
						<a class="pill outline-ink" href="/contact">{l.faq.contactUs}</a>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section id="verify" class="wrap section" aria-labelledby="verify-title">
		<div class="cta smiles-ink-on-lime">
			<div class="cta-copy">
				<h2 id="verify-title" class="display">{l.verifyTitle}</h2>
				<div class="cta-buttons">
					<a class="pill ink big" href="/check">{t.common.checkMedicine}</a>
					<a class="pill outline-ink big" href="/scan"><Icon name="scan" />{l.scanPack}</a>
				</div>
			</div>
			<div class="cta-mascot" aria-hidden="true"><Mascot mood="happy" color="#FFFFFF" /></div>
		</div>
	</section>
</main>

<footer class="foot">
	<div class="wrap">
		<div class="foot-top">
			<div class="foot-lead">
				<Logo height={30} inverse />
				<p>{l.footerLead}</p>
			</div>
			<nav aria-label={l.footerNav} class="foot-cols">
				<div>
					<h2>{l.footerProduct}</h2>
					<a href="#how">{t.nav.how}</a>
					<a href="/check">{t.common.checkMedicine}</a>
					<a href="/scan">{l.scanPack}</a>
					<a href="#faq">{l.navFaq}</a>
				</div>
				<div>
					<h2>{l.footerBusiness}</h2>
					<a href="/business/register">{l.biz.registerManufacturer}</a>
					<a href="/business/register/pharmacy">{l.biz.registerBusiness}</a>
					<a href="/business/sign-in">{l.signIn}</a>
					<a href="/developers">{l.biz.docs}</a>
				</div>
				<div>
					<h2>{l.footerCompany}</h2>
					<a href="#vision">{l.navVision}</a>
					<a href="/privacy">{t.footer.privacy}</a>
					<a href="/terms">{t.footer.terms}</a>
					<a href="/contact">{l.contact}</a>
				</div>
			</nav>
		</div>
		<p class="credits">
			{l.photoCredit}:
			{#each credits as c, i (c.page)}<a href={c.page} rel="noopener">{c.photographer}</a
				>{#if 'licence' in c}
					(<a href={c.licence.url} rel="noopener license">{c.licence.name}</a>, {l.cropped}){/if}{i <
				credits.length - 1
					? ', '
					: '.'}{/each}
		</p>
		<p class="legal">{l.legal}</p>
	</div>
</footer>

<!-- Shown by /js/check.js while a check from the hero's serial box is on its way. -->
<CheckingOverlay />

<style>
	.wrap {
		width: 100%;
		max-width: 1240px;
		margin: 0 auto;
		padding-inline: 16px;
	}
	@media (min-width: 720px) {
		.wrap {
			padding-inline: 28px;
		}
	}
	.skip {
		position: absolute;
		left: -9999px;
		top: 8px;
		z-index: 30;
		padding: 10px 14px;
		border-radius: 10px;
		background: var(--ink);
		color: var(--white);
	}
	.skip:focus {
		left: 8px;
	}

	/* Header */
	.top {
		position: sticky;
		top: 0;
		z-index: 20;
		background: rgba(251, 251, 249, 0.92);
		backdrop-filter: saturate(1.4) blur(10px);
		border-bottom: 1px solid rgba(11, 11, 15, 0.06);
	}
	.top-row {
		display: flex;
		align-items: center;
		gap: 16px;
		min-height: 68px;
	}
	.top-logo {
		display: inline-flex;
		flex: 0 0 auto;
	}
	.top-nav {
		display: none;
		gap: 28px;
		margin-left: 28px;
		font-size: 14px;
		font-weight: 600;
	}
	.top-nav a,
	.menu-panel nav a,
	.foot-cols a {
		text-decoration: none;
	}
	.top-nav a:hover {
		color: var(--peri-ink);
	}
	.top-actions {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-left: auto;
	}
	.wide-nav {
		display: none;
	}
	.menu {
		position: relative;
	}
	.menu summary {
		list-style: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1.5px solid var(--line);
		background: var(--white);
		cursor: pointer;
	}
	.menu summary::-webkit-details-marker {
		display: none;
	}
	.menu-panel {
		position: absolute;
		right: 0;
		top: calc(100% + 10px);
		width: min(300px, calc(100vw - 32px));
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 14px;
		border-radius: var(--radius-l);
		background: var(--white);
		box-shadow: 0 20px 50px rgba(11, 11, 15, 0.16);
	}
	.menu-panel nav {
		display: flex;
		flex-direction: column;
	}
	.menu-panel nav a {
		padding: 12px 10px;
		border-radius: 12px;
		font-weight: 600;
	}
	.menu-panel nav a:hover {
		background: var(--grey-100);
	}
	@media (max-width: 420px) {
		.pill.top-check {
			padding: 0 14px;
			font-size: 13px;
		}
	}
	/* The smallest phones: the hero's own form is right below, and the menu has the link too. */
	@media (max-width: 379px) {
		/* .pill (below) would show it again: this rule must outweigh it. */
		.pill.top-check {
			display: none;
		}
	}
	/* Wide screens: the logo left, the links in the middle of the bar, the actions right. */
	@media (min-width: 1024px) {
		.top-row {
			display: grid;
			grid-template-columns: 1fr auto 1fr;
		}
		.top-nav,
		.wide-nav {
			display: inline-flex;
		}
		.top-nav {
			margin-left: 0;
			justify-self: center;
		}
		.top-actions {
			margin-left: 0;
			justify-self: end;
		}
		.menu {
			display: none;
		}
	}

	/* Shared pieces */
	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 20px;
		border: 0;
		border-radius: 999px;
		font: inherit;
		font-size: 14px;
		font-weight: 700;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			background-color 0.2s ease;
	}
	.pill:hover {
		transform: translateY(-1px);
	}
	.pill.big {
		min-height: 52px;
		padding: 0 26px;
		font-size: 15px;
	}
	.lime {
		background: var(--lime);
		color: var(--ink);
	}
	.lime:hover {
		background: var(--lime-deep);
	}
	.ink {
		background: var(--ink);
		color: var(--white);
	}
	.ink:hover {
		background: var(--ink-2);
	}
	.outline {
		background: rgba(255, 255, 255, 0.55);
		border: 1.5px solid rgba(11, 11, 15, 0.2);
		color: var(--ink);
	}
	.outline-ink {
		background: transparent;
		border: 1.5px solid var(--ink);
		color: var(--ink);
	}
	.text-link {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		font-weight: 600;
		text-underline-offset: 4px;
	}
	.display {
		margin: 0;
		font-size: clamp(30px, 4.4vw, 56px);
		font-weight: 800;
		line-height: 1.02;
		letter-spacing: -0.045em;
		text-wrap: balance;
	}
	.section {
		margin-top: clamp(64px, 9vw, 120px);
	}
	.section-head {
		max-width: 760px;
	}
	.section-lede {
		margin: 16px 0 0;
		font-size: 17px;
		line-height: 1.55;
		color: var(--text-2);
	}

	/* Hero */
	.lp-hero {
		position: relative;
		overflow: hidden;
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 28px;
		margin-top: 12px;
		padding: 28px 20px 24px;
		border-radius: 28px;
		background: var(--peri);
	}
	.lp-copy,
	.lp-media {
		position: relative;
	}
	.lp-hero h1 {
		margin-top: 18px;
		font-size: clamp(40px, 7vw, 86px);
		line-height: 0.95;
		letter-spacing: -0.05em;
		text-wrap: balance;
	}
	.lede {
		margin: 18px 0 0;
		max-width: 540px;
		font-size: 17px;
		line-height: 1.55;
		color: #1f2a4a;
	}
	.serial-form {
		margin-top: 26px;
		max-width: 540px;
	}
	.serial-form label {
		display: block;
		margin-bottom: 8px;
		font-size: 13px;
		font-weight: 700;
	}
	.serial-field {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 5px 5px 5px 18px;
		border-radius: 999px;
		background: var(--white);
		box-shadow: 0 10px 30px rgba(26, 53, 174, 0.14);
	}
	.serial-field:focus-within {
		outline: 3px solid var(--ink);
		outline-offset: 2px;
	}
	.serial-field input {
		flex: 1 1 auto;
		min-width: 0;
		min-height: 46px;
		border: 0;
		background: transparent;
		font: inherit;
		font-family: var(--font-mono);
		font-size: 16px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	.serial-field input::placeholder {
		text-transform: none;
		letter-spacing: 0;
		font-family: var(--font);
		color: var(--text-4);
	}
	.serial-field input:focus {
		outline: none;
	}
	.serial-field .pill {
		min-height: 46px;
	}
	.lp-links {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px 20px;
		margin-top: 16px;
	}
	.lp-note {
		margin: 14px 0 0;
		font-size: 13px;
		color: #33416b;
	}
	.lp-photo {
		overflow: hidden;
		border-radius: 22px;
		aspect-ratio: 3 / 2;
		background: var(--grey-100);
		box-shadow: 0 24px 60px rgba(26, 53, 174, 0.22);
	}
	.lp-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.lp-mascot {
		display: none;
	}
	/* One quiet line of promises under the hero. */
	.trust {
		list-style: none;
		margin: 18px 0 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px 28px;
		font-size: 14px;
		font-weight: 600;
		line-height: 1.4;
		text-align: center;
		color: var(--text-2);
	}
	@media (min-width: 720px) {
		.lp-hero {
			padding: 40px 36px 36px;
		}
	}
	@media (min-width: 1024px) {
		.lp-hero {
			grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
			align-items: center;
			gap: 40px;
			min-height: 620px;
			padding: 56px 56px 56px 60px;
			border-radius: 36px;
		}
		.lp-photo {
			aspect-ratio: 5 / 4;
			border-radius: 28px;
		}
		/* Deteck stands at the picture's top right corner, saying hello beside him (as in the
		   desktop designs), above the drawn pack. */
		.lp-mascot {
			position: absolute;
			display: flex;
			align-items: center;
			gap: 8px;
			right: -26px;
			top: -30px;
		}
		.lp-mascot .bob {
			width: 92px;
			flex: 0 0 auto;
		}
		.lp-bubble {
			margin: 0;
			padding: 10px 14px;
			border-radius: 16px 16px 4px 16px;
			background: var(--white);
			font-size: 13px;
			font-weight: 600;
			box-shadow: 0 10px 24px rgba(11, 11, 15, 0.12);
			white-space: nowrap;
		}
	}
	@media (prefers-reduced-motion: no-preference) {
		.bob {
			animation: bob 4s ease-in-out infinite;
		}
	}
	@keyframes bob {
		50% {
			transform: translateY(-6px);
		}
	}

	/* Film: straight after the hero, with no heading of its own. */
	.film {
		margin-top: clamp(24px, 3vw, 36px);
	}
	.reel {
		overflow: hidden;
		border-radius: 20px;
		aspect-ratio: 16 / 9;
		background: var(--ink);
		box-shadow: 0 30px 80px rgba(11, 11, 15, 0.18);
	}
	.reel video {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		background: var(--ink);
	}
	.reel-empty {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--white);
	}
	.reel-centre {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		text-align: center;
	}
	.play {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: clamp(64px, 9vw, 104px);
		height: clamp(64px, 9vw, 104px);
		border-radius: 50%;
		background: var(--lime);
		box-shadow: 0 0 0 12px rgba(220, 252, 126, 0.12);
		padding-left: 4px;
	}
	.reel-name {
		margin-top: 8px;
		font-family: var(--font-display);
		font-size: clamp(18px, 2.4vw, 28px);
		font-weight: 800;
		letter-spacing: -0.03em;
	}
	.reel-soon {
		padding: 5px 12px;
		border-radius: 999px;
		border: 1px solid #3a3d48;
		font-size: 12px;
		font-weight: 600;
		color: #c9cbd4;
	}
	.reel-ratio {
		position: absolute;
		right: 18px;
		bottom: 14px;
		font-family: var(--font-mono);
		font-size: 11px;
		color: #6a6f7e;
	}
	.corner {
		position: absolute;
		width: 28px;
		height: 28px;
		border: 2px solid var(--lime);
		opacity: 0.8;
	}
	.tl {
		left: 16px;
		top: 16px;
		border-right: 0;
		border-bottom: 0;
		border-top-left-radius: 10px;
	}
	.tr {
		right: 16px;
		top: 16px;
		border-left: 0;
		border-bottom: 0;
		border-top-right-radius: 10px;
	}
	.bl {
		left: 16px;
		bottom: 16px;
		border-right: 0;
		border-top: 0;
		border-bottom-left-radius: 10px;
	}
	.br {
		right: 16px;
		bottom: 34px;
		border-left: 0;
		border-top: 0;
		border-bottom-right-radius: 10px;
	}
	@media (min-width: 720px) {
		.reel {
			border-radius: 28px;
		}
	}
	@media (max-width: 479px) {
		.reel {
			aspect-ratio: 4 / 3;
		}
	}

	/* How it works */
	.lp-steps {
		list-style: none;
		margin: 32px 0 0;
		padding: 0;
		display: grid;
		gap: 14px;
	}
	.lp-steps li {
		position: relative;
		padding: 24px;
		border-radius: var(--radius-l);
		background: var(--white);
		border: 1px solid var(--line-soft);
	}
	.lp-steps .step-last {
		background: var(--ink);
		color: var(--white);
		border-color: var(--ink);
	}
	.step-n {
		position: absolute;
		right: 22px;
		top: 18px;
		font-family: var(--font-display);
		font-size: 40px;
		font-weight: 800;
		letter-spacing: -0.04em;
		/* A periwinkle dark enough for large text (3.8:1 on white). */
		color: #5b7fe0;
	}
	.step-last .step-n {
		color: var(--lime);
	}
	.step-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 52px;
		height: 52px;
		border-radius: 16px;
		background: var(--peri-tint);
	}
	.step-last .step-icon {
		background: var(--lime);
	}
	.lp-steps h3 {
		margin-top: 22px;
		font-size: 20px;
	}
	.lp-steps p {
		margin: 8px 0 0;
		color: var(--text-2);
		line-height: 1.55;
	}
	.step-last p {
		color: #c9cbd4;
	}
	@media (min-width: 720px) {
		.lp-steps {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.lp-steps li {
			padding: 30px;
			min-height: 280px;
		}
	}

	/* Verify further */
	.vf {
		display: grid;
		gap: 28px;
		align-items: center;
	}
	.vf-media {
		position: relative;
		overflow: hidden;
		border-radius: 28px;
		background: var(--ink);
		box-shadow: 0 30px 80px rgba(11, 11, 15, 0.16);
	}
	.vf-media img {
		display: block;
		width: 100%;
		height: auto;
	}
	/* Placed in the picture's own percentages: its frame runs from 24% to 76% across and from 17% to
	   91% down. Still for people who ask for less motion. */
	.vf-scan {
		position: absolute;
		left: 24.6%;
		right: 24.6%;
		top: 70%;
		height: 3px;
		border-radius: 3px;
		background: var(--lime);
		box-shadow: 0 0 16px 4px rgba(220, 252, 126, 0.55);
	}
	@media (prefers-reduced-motion: no-preference) {
		.vf-scan {
			animation: vf-scan 2.6s ease-in-out infinite alternate;
		}
	}
	@keyframes vf-scan {
		from {
			top: 20%;
		}
		to {
			top: 87%;
		}
	}
	.vf-button {
		margin-top: 26px;
	}
	@media (min-width: 1024px) {
		.vf {
			grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
			gap: 64px;
		}
	}

	/* Who we serve: the periwinkle side with the tabs, and the photo of the chosen tab. */
	.who {
		display: grid;
		gap: 14px;
	}
	.who-side {
		display: flex;
		flex-direction: column;
		gap: 22px;
		padding: 28px 22px;
		border-radius: 28px;
		background: var(--peri);
	}
	.who-title {
		margin: 0;
		font-size: clamp(26px, 3vw, 36px);
		font-weight: 800;
		line-height: 1.08;
		letter-spacing: -0.035em;
		text-wrap: balance;
	}
	.who-tabs {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.who-tab {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 46px;
		padding: 0 16px;
		border-radius: 14px;
		font-size: 15px;
		font-weight: 700;
		cursor: pointer;
	}
	.who-tab:hover {
		background: rgba(255, 255, 255, 0.4);
	}
	.who-arrow {
		display: none;
		color: var(--lime);
	}
	.who-panels {
		display: grid;
		gap: 14px;
	}
	.who-panel {
		position: relative;
		overflow: hidden;
		min-height: 440px;
		border-radius: 28px;
		background: var(--ink);
	}
	.who-panel img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.who-shade {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			180deg,
			rgba(11, 11, 15, 0) 30%,
			rgba(11, 11, 15, 0.55) 60%,
			rgba(11, 11, 15, 0.88) 100%
		);
	}
	.who-text {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 24px 22px;
		color: var(--white);
	}
	.who-kicker {
		margin: 0 0 6px;
		font-size: 13px;
		font-weight: 700;
		color: var(--lime);
	}
	.who-text h3 {
		margin: 0;
		font-size: clamp(26px, 3.4vw, 44px);
		font-weight: 800;
		line-height: 1.02;
		letter-spacing: -0.04em;
	}
	.who-text p {
		margin: 10px 0 0;
		max-width: 560px;
		font-size: 15px;
		line-height: 1.5;
		color: #e6e7ec;
	}
	.who-links {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 18px;
	}
	/* Where :has() works (nearly every browser), the radio buttons switch the panels like tabs. */
	@supports selector(:has(*)) {
		.who-panel,
		.who-kicker {
			display: none;
		}
		.who:has(#who-individuals:checked) .who-panel[data-who='individuals'],
		.who:has(#who-facilities:checked) .who-panel[data-who='facilities'],
		.who:has(#who-makers:checked) .who-panel[data-who='makers'] {
			display: block;
		}
		.who:has(#who-individuals:checked) .who-tab[data-who='individuals'],
		.who:has(#who-facilities:checked) .who-tab[data-who='facilities'],
		.who:has(#who-makers:checked) .who-tab[data-who='makers'] {
			background: var(--ink);
			color: var(--white);
		}
		.who:has(#who-individuals:checked) [data-who='individuals'] .who-arrow,
		.who:has(#who-facilities:checked) [data-who='facilities'] .who-arrow,
		.who:has(#who-makers:checked) [data-who='makers'] .who-arrow {
			display: inline;
		}
		.who:has(#who-individuals:focus-visible) .who-tab[data-who='individuals'],
		.who:has(#who-facilities:focus-visible) .who-tab[data-who='facilities'],
		.who:has(#who-makers:focus-visible) .who-tab[data-who='makers'] {
			outline: 3px solid var(--ink);
			outline-offset: 2px;
		}
	}
	@media (min-width: 1024px) {
		.who {
			grid-template-columns: minmax(0, 0.62fr) minmax(0, 1.38fr);
			gap: 16px;
		}
		.who-side {
			justify-content: space-between;
			padding: 34px 30px;
		}
		.who-panel {
			min-height: 560px;
		}
		.who-text {
			padding: 34px 36px;
		}
	}

	/* Our impact */
	.impact {
		list-style: none;
		margin: 32px 0 0;
		padding: 0;
		display: grid;
		gap: 14px;
	}
	.impact li {
		padding: 26px 24px;
		border-radius: var(--radius-l);
	}
	.impact-lime {
		background: var(--lime);
	}
	.impact-peri {
		background: var(--peri);
	}
	.impact-peach {
		background: var(--peach);
	}
	.impact-n {
		font-family: var(--font-display);
		font-size: 15px;
		font-weight: 800;
	}
	.impact h3 {
		margin-top: 36px;
		font-size: 22px;
		letter-spacing: -0.02em;
	}
	.impact p {
		margin: 8px 0 0;
		line-height: 1.55;
		color: #262a36;
	}
	@media (min-width: 720px) {
		.impact {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.impact li {
			min-height: 250px;
			padding: 30px;
		}
	}

	/* Vision */
	.vision {
		display: grid;
		gap: 28px;
		align-items: center;
	}
	.vision-photo {
		overflow: hidden;
		border-radius: 28px;
		aspect-ratio: 3 / 2;
		background: var(--grey-100);
	}
	.vision-photo img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	@media (min-width: 1024px) {
		.vision {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			gap: 64px;
		}
		.vision-photo {
			aspect-ratio: 5 / 4;
		}
	}

	/* Questions */
	.faq {
		display: grid;
		gap: 28px;
	}
	.faq-mascot {
		display: none;
	}
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.faq details {
		border-radius: 18px;
		background: var(--white);
		border: 1px solid var(--line-soft);
	}
	.faq details[open] {
		border-color: var(--line);
		box-shadow: 0 10px 30px rgba(11, 11, 15, 0.06);
	}
	.faq summary {
		list-style: none;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding: 18px 20px;
		font-weight: 700;
		cursor: pointer;
	}
	.faq summary::-webkit-details-marker {
		display: none;
	}
	.faq-plus {
		position: relative;
		width: 28px;
		height: 28px;
		flex: 0 0 28px;
		border-radius: 50%;
		background: var(--peri-tint);
	}
	.faq-plus::before,
	.faq-plus::after {
		content: '';
		position: absolute;
		left: 8px;
		right: 8px;
		top: 13px;
		height: 2px;
		border-radius: 2px;
		background: var(--ink);
	}
	.faq-plus::after {
		transform: rotate(90deg);
		transition: transform 0.2s ease;
	}
	.faq details[open] .faq-plus {
		background: var(--lime);
	}
	.faq details[open] .faq-plus::after {
		transform: rotate(0deg);
	}
	.faq details p {
		margin: 0;
		padding: 0 20px 20px;
		color: var(--text-2);
		line-height: 1.55;
		/* "What do the results mean?" puts each result on its own line. */
		white-space: pre-line;
	}
	.faq-more {
		margin-top: 14px;
		padding: 22px 20px;
		border-radius: 18px;
		background: var(--peri-tint);
	}
	.faq-more p {
		margin: 0;
		font-weight: 700;
	}
	.faq-more-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		margin-top: 14px;
	}
	@media (min-width: 1024px) {
		.faq {
			grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
			gap: 64px;
		}
		.faq-mascot {
			display: block;
			width: 130px;
			margin-top: 32px;
		}
	}

	/* Final check band */
	.cta {
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: flex-end;
		gap: 24px;
		padding: 36px 22px;
		border-radius: 28px;
	}
	.cta-copy {
		position: relative;
		max-width: 720px;
	}
	.cta .display {
		margin-top: 0;
	}
	.cta-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		margin-top: 24px;
	}
	.cta-mascot {
		display: none;
	}
	@media (min-width: 720px) {
		.cta {
			padding: 56px 48px;
			border-radius: 36px;
		}
		.cta-mascot {
			display: block;
			flex: 0 0 150px;
			width: 150px;
			margin: 0 0 -60px auto;
		}
	}

	/* Footer */
	.foot {
		margin-top: clamp(64px, 9vw, 120px);
		padding: 56px 0 32px;
		background: var(--ink);
		color: #c9cbd4;
	}
	.foot-top {
		display: grid;
		gap: 40px;
	}
	.foot-lead p {
		margin: 18px 0 0;
		max-width: 380px;
		font-size: 16px;
		line-height: 1.5;
	}
	.foot-cols {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 28px;
	}
	.foot-cols div {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.foot-cols h2 {
		margin-bottom: 6px;
		font-family: var(--font);
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8a8f9e;
	}
	.foot-cols a {
		padding: 6px 0;
		color: var(--white);
		font-size: 14px;
	}
	.foot-cols a:hover {
		color: var(--lime);
	}
	.credits,
	.legal {
		margin: 0;
		font-size: 12px;
		line-height: 1.6;
		color: #8a8f9e;
	}
	.credits {
		margin-top: 48px;
		padding-top: 20px;
		border-top: 1px solid #23252e;
	}
	.credits a {
		color: #c9cbd4;
	}
	.legal {
		margin-top: 8px;
	}
	@media (min-width: 720px) {
		.foot-cols {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.foot-top {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
			gap: 64px;
		}
	}
</style>
