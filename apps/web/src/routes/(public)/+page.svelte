<script lang="ts">
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Logo from '#lib/ui/Logo.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import LanguageMenu from '#lib/ui/LanguageMenu.svelte';
	import Rich from '#lib/ui/Rich.svelte';

	let { data }: PageProps = $props();
	const t = $derived(data.t);
	const l = $derived(t.landing);

	// Copy follows analysis C-04 to C-08 and R2: no "genuine/real" claims, no
	// competitor comparisons, no pharmacy check, and honest data-cost wording.
	const AUDIENCES = [
		{ id: 'citizens', img: 'family', wide: false },
		{ id: 'pharmacies', img: 'pharmacist', wide: true },
		{ id: 'hospitals', img: 'nurse', wide: true },
		{ id: 'distributors', img: null, wide: true },
		{ id: 'manufacturers', img: 'technician', wide: true }
	] as const;
	const audiences = $derived(AUDIENCES.map((a) => ({ ...a, ...l.audiences[a.id] })));
	const strengths = $derived(Object.values(l.strengths));
	const pilotHref = $derived(
		data.contactEmail ? `mailto:${data.contactEmail}?subject=DETECK%20pilot` : '/business/register'
	);
	const srcset = (name: string, wide: boolean) =>
		`/img/landing/${name}-640.webp 640w, /img/landing/${name}-1024.webp ${wide ? 1024 : 824}w`;
</script>

<svelte:head>
	<title>{l.metaTitle}</title>
	<meta name="description" content={l.metaDescription} />
	<link
		rel="preload"
		as="image"
		href="/img/landing/pharmacist-1024.webp"
		imagesrcset={srcset('pharmacist', true)}
		imagesizes="(max-width: 860px) 100vw, 620px"
	/>
</svelte:head>

<div class="frame">
	<div class="page">
		<header class="lp-top">
			<div class="row" style="--gap: clamp(20px, 4vw, 56px)">
				<a href="/" aria-label={t.nav.home} style="display: inline-flex"><Logo height={30} /></a>
				<nav class="lp-nav" aria-label={t.nav.main}>
					<a href="#how">{t.nav.how}</a>
					<a href="#who">{l.navWho}</a>
					<a href="#vision">{l.navVision}</a>
				</nav>
			</div>
			<div class="row" style="--gap: 10px">
				<LanguageMenu />
				<a class="pill-btn lime" href="/check">{t.common.checkMedicine}</a>
			</div>
		</header>

		<main id="top">
			<section class="hero" aria-labelledby="hero-title">
				<div class="hero-copy">
					<p class="eyebrow">
						<span class="dot"></span>{l.eyebrow}
					</p>
					<h1 id="hero-title">{l.heroTitle}</h1>
					<p class="lede">{l.lede}</p>
					<div class="row" style="--gap: 22px; margin-top: 32px">
						<a class="pill-btn lime big" href="/check">{t.common.checkMedicine}</a>
						<a class="pill-btn dark big" href="/scan"
							><Icon name="scan" size={18} color="#FFFFFF" />{l.scanPack}</a
						>
						<a class="text-link" href="#how">{l.seeHow}</a>
					</div>
				</div>
				<div class="hero-media">
					<div class="hero-mascot" aria-hidden="true">
						<div class="bob"><Mascot mood="wink" /></div>
					</div>
					<p class="hero-bubble" aria-hidden="true">{l.heroBubble}</p>
					<div class="photo hero-photo">
						<img
							src="/img/landing/pharmacist-1024.webp"
							srcset={srcset('pharmacist', true)}
							sizes="(max-width: 860px) 100vw, 620px"
							width="1024"
							height="688"
							alt={l.heroAlt}
						/>
						<div class="hero-chip">
							<span class="chip-icon"><Icon name="check" size={18} stroke={3} /></span>
							<div>
								<strong>{l.heroChip}</strong>
								<span class="chip-sub">{l.heroChipSub}</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<section id="how" class="section" aria-labelledby="how-title">
				<div class="row" style="justify-content: space-between; align-items: baseline">
					<h2 id="how-title" class="eyebrow"><span class="dot"></span>{t.nav.how}</h2>
					<p class="small muted">{l.runPharmacy} <a href="#who">{l.runPharmacyLink}</a></p>
				</div>
				<ol class="steps">
					<li>
						<span class="step-n" aria-hidden="true">01.</span>
						<div>
							<h3>{l.step1Title}</h3>
							<p>{l.step1Text}</p>
						</div>
					</li>
					<li>
						<span class="step-n" aria-hidden="true">02.</span>
						<div>
							<h3>{l.step2Title}</h3>
							<p>{l.step2Text}</p>
						</div>
					</li>
					<li>
						<span class="step-n" aria-hidden="true">03.</span>
						<div>
							<h3>{l.step3Title}</h3>
							<p>{l.step3Text}</p>
						</div>
					</li>
				</ol>
			</section>

			<section id="who" class="section" aria-labelledby="who-title">
				<div class="who">
					{#each audiences as a, i (a.id)}
						<input
							type="radio"
							name="audience"
							id="aud-{a.id}"
							class="visually-hidden aud-radio"
							checked={i === 0}
						/>
					{/each}
					<div class="who-list">
						<div>
							<h2 id="who-title" class="eyebrow"><span class="dot"></span>{l.navWho}</h2>
							<p class="who-lead">{l.whoLead}</p>
						</div>
						<div class="aud-labels" role="presentation">
							{#each audiences as a (a.id)}
								<label for="aud-{a.id}" class="aud-label" data-aud={a.id}>{a.label}</label>
							{/each}
						</div>
					</div>
					<div class="who-panels">
						{#each audiences as a (a.id)}
							<article class="who-panel" class:plain={!a.img} data-aud={a.id} aria-label={a.label}>
								{#if a.img}
									<img
										src="/img/landing/{a.img}-1024.webp"
										srcset={srcset(a.img, a.wide)}
										sizes="(max-width: 860px) 100vw, 800px"
										alt={a.alt}
										loading="lazy"
									/>
								{:else}
									<div class="who-illustration" aria-hidden="true">
										<div style="width: 160px"><Mascot mood="happy" /></div>
									</div>
								{/if}
								<div class="who-shade" aria-hidden="true"></div>
								<div class="who-text">
									<p class="who-kicker">{a.label}</p>
									<h3>{a.title}</h3>
									<p>{a.text}</p>
								</div>
							</article>
						{/each}
					</div>
				</div>
			</section>

			<section id="vision" class="vision" aria-labelledby="vision-title">
				<div class="split">
					<p class="eyebrow"><span class="dot"></span>{l.navVision}</p>
					<div>
						<h2 id="vision-title" class="display"><Rich text={l.visionTitle} tag="mark" /></h2>
						<p class="vision-text">{l.visionText}</p>
					</div>
				</div>
				<h3 class="impact-title">{l.impactTitle}</h3>
				<div class="cards">
					<div class="card-img">
						<div class="photo">
							<img
								src="/img/landing/family-640.webp"
								width="640"
								height="795"
								alt={l.impact1Alt}
								loading="lazy"
								style="object-position: center 30%"
							/>
						</div>
						<div class="card-body">
							<h4>{l.impact1Title}</h4>
							<p>{l.impact1Text}</p>
						</div>
					</div>
					<div class="card-img">
						<div class="photo">
							<img
								src="/img/landing/nurse-640.webp"
								width="640"
								height="430"
								alt={l.impact2Alt}
								loading="lazy"
							/>
						</div>
						<div class="card-body">
							<h4>{l.impact2Title}</h4>
							<p>{l.impact2Text}</p>
						</div>
					</div>
					<div class="card-img">
						<div class="photo">
							<img
								src="/img/landing/technician-640.webp"
								width="640"
								height="430"
								alt={l.impact3Alt}
								loading="lazy"
							/>
						</div>
						<div class="card-body">
							<h4>{l.impact3Title}</h4>
							<p>{l.impact3Text}</p>
						</div>
					</div>
				</div>
			</section>

			<section class="section" aria-labelledby="diff-title">
				<div class="split">
					<p class="eyebrow"><span class="dot"></span>{l.whyEyebrow}</p>
					<h2 id="diff-title" class="display">{l.whyTitle}</h2>
				</div>
				<ul class="strengths">
					{#each strengths as s (s)}
						<li>
							<span class="tick" aria-hidden="true"
								><Icon name="check" size={16} stroke={3} color="#DCFC7E" /></span
							>{s}
						</li>
					{/each}
				</ul>
			</section>

			<section id="verify" class="section" aria-labelledby="verify-title">
				<div class="verify">
					<div style="flex: 1 1 440px; min-width: 0">
						<p class="eyebrow on-dark">
							<span class="dot lime-dot"></span>{t.common.checkMedicine}
						</p>
						<h2 id="verify-title" class="display">{l.verifyTitle}</h2>
					</div>
					<form method="post" action="/check?/check" class="verify-form">
						<label for="serial">{l.verifyLabel}</label>
						<div class="row" style="--gap: 10px">
							<input
								id="serial"
								name="serial"
								type="text"
								placeholder={t.check.placeholder}
								autocomplete="off"
								autocapitalize="characters"
								spellcheck="false"
								inputmode="text"
								required
							/>
							<button class="pill-btn lime big">{l.verifyButton}</button>
						</div>
						<a class="pill-btn dark" href="/scan"><Icon name="scan" size={18} />{t.check.scan}</a>
						<p class="fine">{l.verifyFine}</p>
					</form>
				</div>
			</section>
		</main>

		<footer class="lp-footer">
			<div class="row" style="justify-content: space-between; align-items: flex-start; --gap: 32px">
				<div style="flex: 1 1 320px; max-width: 420px">
					<p class="footer-lead">{l.footerLead}</p>
					<a class="pill-btn lime" href={pilotHref} style="margin-top: 20px"
						>{data.contactEmail ? l.pilotPartner : l.registerCompany}</a
					>
				</div>
				<nav aria-label={l.footerNav} class="row" style="--gap: 48px; align-items: flex-start">
					<div class="footer-col">
						<span>{l.footerProduct}</span><a href="#how">{t.nav.how}</a><a href="/check"
							>{t.common.checkMedicine}</a
						><a href="/business">{t.nav.manufacturers}</a>
					</div>
					<div class="footer-col">
						<span>{l.footerCompany}</span><a href="#vision">{l.navVision}</a><a href="/privacy"
							>{t.footer.privacy}</a
						><a href="/terms">{t.footer.terms}</a>
						{#if data.contactEmail}<a href="mailto:{data.contactEmail}">{l.contact}</a>{/if}
					</div>
				</nav>
			</div>
			<p class="legal">{l.legal}</p>
		</footer>
	</div>
</div>

<style>
	.frame {
		background: #f4f4f1;
		padding: clamp(8px, 1.5vw, 20px);
	}
	.page {
		max-width: 1320px;
		margin: 0 auto;
		background: var(--paper);
		border-radius: clamp(20px, 2.4vw, 32px);
		overflow: hidden;
		box-shadow:
			0 1px 0 rgba(0, 0, 0, 0.04),
			0 30px 80px rgba(20, 20, 40, 0.06);
	}
	.lp-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 18px clamp(16px, 3vw, 32px);
		background: var(--white);
	}
	.lp-nav {
		display: flex;
		gap: 30px;
		font-size: 14px;
		font-weight: 600;
	}
	.lp-nav a,
	.footer-col a {
		text-decoration: none;
	}
	.lp-nav a:hover,
	.footer-col a:hover {
		color: var(--peri-ink);
	}
	.pill-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		min-height: 44px;
		padding: 0 22px;
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
	.pill-btn:hover {
		transform: translateY(-2px);
	}
	.pill-btn.big {
		min-height: 52px;
		padding: 0 28px;
		font-size: 16px;
	}
	.lime {
		background: var(--lime);
		color: var(--ink);
	}
	.lime:hover {
		background: #cdf35e;
	}
	.dark {
		align-self: flex-start;
		background: #17181f;
		color: var(--white);
		border: 1px solid #3a3d48;
	}
	.text-link {
		font-weight: 600;
		text-underline-offset: 4px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}
	.eyebrow {
		margin: 0;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #2d4fe0;
		flex: 0 0 auto;
	}
	.lime-dot {
		background: var(--lime);
	}
	.display {
		margin: 0;
		font-size: clamp(36px, 5.6vw, 78px);
		font-weight: 800;
		line-height: 0.98;
		letter-spacing: -0.05em;
	}

	.hero {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: clamp(36px, 5vw, 64px);
		padding: clamp(28px, 4vw, 56px) clamp(16px, 3vw, 32px) clamp(48px, 5vw, 64px);
		background: var(--peri);
	}
	.hero-copy {
		flex: 1 1 460px;
		min-width: 0;
		max-width: 640px;
	}
	.hero-copy .eyebrow {
		margin-bottom: 24px;
	}
	.hero h1 {
		font-size: clamp(48px, 7.2vw, 104px);
		font-weight: 800;
		line-height: 0.92;
		letter-spacing: -0.055em;
	}
	.lede {
		margin: 28px 0 0;
		max-width: 470px;
		font-size: clamp(16px, 1.3vw, 18px);
		line-height: 1.55;
		color: #16182a;
	}
	.hero-media {
		flex: 1 1 500px;
		min-width: 0;
		max-width: 620px;
		position: relative;
	}
	.hero-mascot {
		position: absolute;
		left: max(-56px, -4vw);
		bottom: -26px;
		width: 120px;
		z-index: 3;
	}
	.hero-bubble {
		position: absolute;
		left: 76px;
		bottom: 122px;
		z-index: 3;
		margin: 0;
		padding: 10px 14px;
		border-radius: 16px 16px 16px 4px;
		background: var(--white);
		box-shadow: 0 10px 24px rgba(20, 40, 120, 0.16);
		font-size: 14px;
		font-weight: 600;
		max-width: 240px;
	}
	.photo {
		overflow: hidden;
		background: #8fb3f5;
	}
	.photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.hero-photo {
		position: relative;
		z-index: 2;
		border-radius: var(--radius-xl);
		aspect-ratio: 3 / 2;
		box-shadow: 0 24px 50px rgba(20, 40, 120, 0.18);
	}
	.hero-chip {
		position: absolute;
		right: 14px;
		bottom: 14px;
		max-width: calc(100% - 100px);
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 16px;
		border-radius: var(--radius-m);
		background: rgba(255, 255, 255, 0.95);
		font-size: 14px;
	}
	.chip-icon {
		flex: 0 0 auto;
		display: inline-flex;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--lime);
		align-items: center;
		justify-content: center;
	}
	.chip-sub {
		display: block;
		font-size: 12px;
		color: var(--text-2);
	}
	.bob {
		animation: bob 3.4s ease-in-out infinite;
	}
	@keyframes bob {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	.section {
		padding: clamp(48px, 6vw, 72px) clamp(16px, 3vw, 32px) 0;
	}
	.steps {
		margin: 24px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.steps li {
		flex: 1 1 300px;
		min-width: 0;
		min-height: 260px;
		padding: 26px;
		border-radius: 24px;
		background: var(--lime);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 40px;
	}
	.step-n {
		font-size: 40px;
		font-weight: 500;
		color: rgba(11, 11, 15, 0.5);
	}
	.steps h3 {
		font-size: 24px;
		font-weight: 700;
	}
	.steps p {
		margin: 10px 0 0;
		font-size: 15px;
		line-height: 1.55;
		color: #24261f;
	}

	.who {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.who-list {
		flex: 1 1 320px;
		min-width: 0;
		min-height: 520px;
		padding: 26px;
		border-radius: 24px;
		background: var(--peri);
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 40px;
	}
	.who-lead {
		margin: 18px 0 0;
		font-size: 28px;
		font-weight: 700;
		line-height: 1.1;
		letter-spacing: -0.03em;
		max-width: 300px;
	}
	.aud-labels {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.aud-label {
		min-height: 44px;
		display: flex;
		align-items: center;
		padding: 6px 14px;
		margin-left: -14px;
		border-radius: 12px;
		font-size: 17px;
		font-weight: 500;
		cursor: pointer;
		transition: padding-left 0.25s ease;
	}
	.aud-label:hover {
		padding-left: 22px;
	}
	.who-panels {
		flex: 2.2 1 520px;
		min-width: 0;
		display: grid;
		gap: 12px;
	}
	.who-panel {
		position: relative;
		min-height: 520px;
		overflow: hidden;
		border-radius: 24px;
		background: #8fb3f5;
	}
	.who-panel img,
	.who-illustration {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.who-illustration {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 60px;
		background: var(--peri-tint);
	}
	.who-shade {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(0, 0, 0, 0) 40%, rgba(0, 0, 0, 0.75) 100%);
	}
	.who-text {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		padding: clamp(20px, 3vw, 32px);
		color: var(--white);
	}
	.plain .who-shade {
		display: none;
	}
	.plain .who-text,
	.plain .who-text p:last-child,
	.plain .who-kicker {
		color: var(--ink);
	}
	.who-kicker {
		margin: 0 0 8px;
		font-size: 13px;
		font-weight: 600;
		color: #dfe3ee;
	}
	.who-text h3 {
		font-size: clamp(26px, 3vw, 36px);
		font-weight: 700;
		line-height: 1.05;
	}
	.who-text p:last-child {
		margin: 10px 0 0;
		max-width: 520px;
		font-size: 16px;
		line-height: 1.55;
		color: #f0f2f7;
	}
	/* Tabs without JavaScript: radio buttons pick the panel. Browsers without :has() show every panel. */
	@supports selector(:has(*)) {
		.who-panel {
			display: none;
		}
		.who:has(#aud-citizens:checked) .who-panel[data-aud='citizens'],
		.who:has(#aud-pharmacies:checked) .who-panel[data-aud='pharmacies'],
		.who:has(#aud-hospitals:checked) .who-panel[data-aud='hospitals'],
		.who:has(#aud-distributors:checked) .who-panel[data-aud='distributors'],
		.who:has(#aud-manufacturers:checked) .who-panel[data-aud='manufacturers'] {
			display: block;
		}
		.who:has(#aud-citizens:checked) .aud-label[data-aud='citizens'],
		.who:has(#aud-pharmacies:checked) .aud-label[data-aud='pharmacies'],
		.who:has(#aud-hospitals:checked) .aud-label[data-aud='hospitals'],
		.who:has(#aud-distributors:checked) .aud-label[data-aud='distributors'],
		.who:has(#aud-manufacturers:checked) .aud-label[data-aud='manufacturers'] {
			background: var(--ink);
			color: var(--white);
			font-weight: 600;
			padding-left: 14px;
		}
		.who:has(.aud-radio:focus-visible) .aud-labels {
			outline: 3px solid #2d4fe0;
			outline-offset: 6px;
			border-radius: 12px;
		}
	}

	.vision {
		margin-top: clamp(48px, 6vw, 72px);
		padding: clamp(64px, 8vw, 110px) clamp(16px, 3vw, 32px);
		background: var(--peri-tint);
	}
	.split {
		display: flex;
		flex-wrap: wrap;
		gap: 24px clamp(24px, 6vw, 96px);
	}
	.split > .eyebrow {
		flex: 0 0 160px;
		align-self: flex-start;
		margin-top: 10px;
	}
	.split > :last-child {
		flex: 1 1 560px;
		min-width: 0;
	}
	/* The highlighted word comes from the dictionary, rendered by Rich. */
	.vision :global(mark) {
		background: linear-gradient(transparent 62%, var(--lime) 62%);
		color: inherit;
	}
	.vision-text {
		margin: 28px 0 0;
		max-width: 620px;
		font-size: 18px;
		line-height: 1.65;
		color: #2e3242;
	}
	.impact-title {
		margin: clamp(56px, 7vw, 88px) 0 0;
		font-size: 22px;
		font-weight: 700;
	}
	.cards {
		margin-top: 20px;
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}
	.card-img {
		flex: 1 1 280px;
		min-width: 0;
		overflow: hidden;
		border-radius: 24px;
		background: var(--white);
	}
	.card-img .photo {
		height: 200px;
	}
	.card-body {
		padding: 22px 24px 26px;
	}
	.card-body h4 {
		margin: 0;
		font-size: 20px;
		font-weight: 700;
		letter-spacing: -0.02em;
	}
	.card-body p {
		margin: 8px 0 0;
		font-size: 15px;
		line-height: 1.55;
		color: var(--text-2);
	}

	.strengths {
		margin: clamp(36px, 5vw, 56px) 0 0;
		padding: clamp(24px, 3vw, 36px);
		list-style: none;
		border-radius: 24px;
		background: var(--lime);
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 380px), 1fr));
		gap: 0 32px;
	}
	.strengths li {
		display: flex;
		gap: 14px;
		padding: 16px 0;
		border-top: 1px solid rgba(11, 11, 15, 0.12);
		font-size: 17px;
		font-weight: 600;
		line-height: 1.45;
	}
	.tick {
		flex: 0 0 auto;
		display: inline-flex;
		width: 26px;
		height: 26px;
		border-radius: 50%;
		background: var(--ink);
		color: var(--lime);
		align-items: center;
		justify-content: center;
	}

	#verify {
		padding-bottom: clamp(16px, 3vw, 32px);
	}
	.verify {
		border-radius: var(--radius-xl);
		background: var(--ink);
		color: var(--white);
		padding: clamp(28px, 5vw, 64px);
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		justify-content: space-between;
		gap: 36px;
	}
	.verify .display {
		font-size: clamp(34px, 5vw, 68px);
	}
	.on-dark {
		color: #c9cbd4;
		margin-bottom: 18px;
	}
	.verify-form {
		flex: 1 1 420px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.verify-form label {
		font-size: 14px;
		font-weight: 600;
		color: #c9cbd4;
	}
	.verify-form input {
		flex: 1 1 220px;
		min-width: 0;
		min-height: 56px;
		padding: 0 20px;
		border-radius: 999px;
		border: 1px solid #3a3d48;
		background: #17181f;
		color: var(--white);
		font-family: var(--font-mono);
		font-size: 16px;
	}
	.verify-form input:focus {
		outline: 3px solid var(--lime);
		outline-offset: 2px;
	}
	.fine {
		margin: 6px 0 0;
		font-size: 13px;
		line-height: 1.6;
		color: #a3a6b2;
	}

	.lp-footer {
		padding: clamp(40px, 5vw, 64px) clamp(16px, 3vw, 32px) 28px;
	}
	.footer-lead {
		margin: 0;
		font-size: 26px;
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.15;
	}
	.footer-col {
		display: flex;
		flex-direction: column;
		gap: 12px;
		font-size: 15px;
	}
	.footer-col span {
		font-size: 13px;
		color: var(--text-3);
		font-weight: 600;
	}
	.legal {
		margin: 40px 0 0;
		padding-top: 18px;
		border-top: 1px solid var(--line);
		font-size: 13px;
		line-height: 1.6;
		color: #5d6272;
	}

	@media (max-width: 860px) {
		.lp-nav {
			display: none;
		}
	}
	@media (max-width: 700px) {
		.hero-bubble {
			display: none;
		}
		.hero-mascot {
			left: 8px;
			bottom: -16px;
			width: 78px;
		}
		.hero-chip {
			padding: 10px 12px;
		}
		.chip-sub {
			display: none;
		}
		.who-list {
			min-height: 0;
			gap: 24px;
		}
		.who-panel {
			min-height: 420px;
		}
		.steps li {
			min-height: 0;
			gap: 22px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bob {
			animation: none;
		}
		.pill-btn,
		.aud-label {
			transition: none;
		}
	}
</style>
