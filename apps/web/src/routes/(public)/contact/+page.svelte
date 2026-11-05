<script lang="ts">
	/**
	 * Contact us (B-84): a message form that emails the DETECK team, beside the other ways to reach
	 * it. A plain form, so it works without JavaScript. It looks like the landing page: a
	 * periwinkle panel with Deteck, and a white card for the form.
	 */
	import Seo from '#lib/ui/Seo.svelte';
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import PublicTop from '#lib/ui/PublicTop.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import Turnstile from '#lib/ui/Turnstile.svelte';
	import { page } from '$app/state';

	let { data, form }: PageProps = $props();
	const c = $derived(data.t.contact);
	const v = $derived((form?.values ?? {}) as Record<string, string>);
	const bad = $derived(form?.field ?? null);
</script>

<Seo
	title={c.metaTitle}
	description={c.metaDescription}
	path="/contact"
	multilingual
	structured={[
		{
			'@context': 'https://schema.org',
			'@type': 'ContactPage',
			name: c.metaTitle,
			url: `${page.url.origin}/contact`,
			inLanguage: data.lang
		}
	]}
/>

<div class="shell">
	<PublicTop />
	<main class="contact">
		<section class="intro" aria-labelledby="contact-title">
			<h1 id="contact-title">{c.title}</h1>
			<p class="lede">{c.lede}</p>
			<div class="hero-row">
				<div class="hero-mascot"><Mascot mood="wink" /></div>
				<p class="bubble bubble-left">{c.bubble}</p>
			</div>
			<h2 class="ways-title">{c.waysTitle}</h2>
			<ul class="ways">
				{#if data.contactEmail}
					<li>
						<strong>{c.emailTitle}</strong>
						<a href="mailto:{data.contactEmail}">{data.contactEmail}</a>
					</li>
				{/if}
				<li>
					<strong>{c.partnerTitle}</strong>
					<span>{c.partnerText}</span>
				</li>
				<li>
					<strong>{c.devTitle}</strong>
					<a href="/developers">{c.devText}</a>
				</li>
				<li>
					<strong>{c.faqTitle}</strong>
					<a href="/#faq">{c.faqText}</a>
				</li>
			</ul>
		</section>

		<section class="card form-card" aria-labelledby="form-title">
			{#if data.sent}
				<div class="sent" role="status">
					<div class="sent-mascot"><Mascot mood="happy" /></div>
					<h2 id="form-title">{c.sentTitle}</h2>
					<p>{c.sentText}</p>
					<a class="btn" href="/contact">{c.sendAnother}</a>
				</div>
			{:else}
				<h2 id="form-title">{c.formTitle}</h2>
				{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
				<form method="post" class="stack" style="--gap: 14px" novalidate>
					<div class="two">
						<div class="field" class:field-error={bad === 'name'}>
							<label for="name">{c.name}</label>
							<input
								id="name"
								name="name"
								autocomplete="name"
								required
								maxlength="100"
								value={v.name ?? ''}
								aria-invalid={bad === 'name' || undefined}
							/>
						</div>
						<div class="field" class:field-error={bad === 'email'}>
							<label for="email">{c.email}</label>
							<input
								id="email"
								name="email"
								type="email"
								autocomplete="email"
								required
								maxlength="200"
								value={v.email ?? ''}
								aria-invalid={bad === 'email' || undefined}
							/>
						</div>
					</div>
					<div class="field">
						<label for="organisation">{c.organisation}</label>
						<input
							id="organisation"
							name="organisation"
							autocomplete="organization"
							maxlength="150"
							value={v.organisation ?? ''}
						/>
					</div>
					<div class="field" class:field-error={bad === 'topic'}>
						<label for="topic">{c.topic}</label>
						<select
							id="topic"
							name="topic"
							required
							defaultValue={v.topic ?? data.topic}
							aria-invalid={bad === 'topic' || undefined}
						>
							<option value="">{c.chooseTopic}</option>
							{#each data.topics as topic (topic)}<option value={topic}>{c.topics[topic]}</option
								>{/each}
						</select>
					</div>
					<div class="field" class:field-error={bad === 'message'}>
						<label for="message">{c.message}</label>
						<textarea
							id="message"
							name="message"
							rows="7"
							required
							maxlength={data.maxMessage}
							aria-describedby="message-hint"
							aria-invalid={bad === 'message' || undefined}>{v.message ?? ''}</textarea
						>
						<span class="hint" id="message-hint">{c.messageHint}</span>
					</div>
					<!-- People never see this field; bots that fill it in are ignored. -->
					<div class="trap" aria-hidden="true">
						<label for="website">Website</label>
						<input id="website" name="website" tabindex="-1" autocomplete="off" />
					</div>
					<Turnstile siteKey={data.turnstile} />
					<p class="small muted">{c.privacy} <a href="/privacy">{c.privacyLink}</a></p>
					<button class="btn btn-primary btn-block">{c.send}</button>
				</form>
			{/if}
		</section>
	</main>
	<p class="worried">{c.worried}</p>
	<SiteFooter />
</div>

<style>
	.contact {
		display: grid;
		gap: 16px;
		margin-top: 12px;
	}
	.intro {
		display: flex;
		flex-direction: column;
		gap: 18px;
		padding: 28px 22px;
		border-radius: 28px;
		background: var(--peri);
	}
	.intro h1 {
		margin: 0;
		font-size: clamp(40px, 6vw, 72px);
		font-weight: 800;
		line-height: 0.95;
		letter-spacing: -0.05em;
	}
	.lede {
		margin: 0;
		max-width: 520px;
		font-size: 17px;
		line-height: 1.55;
		color: #1f2a4a;
	}
	.intro .hero-row {
		margin-top: 0;
	}
	.ways-title {
		margin: 6px 0 0;
		font-size: 18px;
	}
	.ways {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 10px;
	}
	.ways li {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 14px 16px;
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.55);
		font-size: 14px;
		line-height: 1.45;
	}
	.ways a {
		font-weight: 600;
		color: var(--ink);
		text-underline-offset: 3px;
		overflow-wrap: anywhere;
	}
	.form-card {
		padding: 24px 20px;
	}
	.form-card h2 {
		margin: 0 0 14px;
		font-size: 24px;
		letter-spacing: -0.02em;
	}
	.two {
		display: grid;
		gap: 14px;
	}
	.hint {
		font-size: 13px;
		color: var(--text-3);
	}
	/* Off screen, not display:none, so simple bots still find it. */
	.trap {
		position: absolute;
		left: -9999px;
		width: 1px;
		height: 1px;
		overflow: hidden;
	}
	.sent {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 12px;
		padding: 12px 0;
	}
	.sent-mascot {
		width: 110px;
	}
	.sent p {
		margin: 0;
		color: var(--text-2);
	}
	.worried {
		margin: 16px 0 0;
		padding: 14px 18px;
		border-radius: 16px;
		background: var(--peach-tint);
		color: var(--peach-text);
		font-size: 14px;
		line-height: 1.5;
	}
	@media (min-width: 640px) {
		.two {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.contact {
			grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
			align-items: start;
			gap: 20px;
		}
		.intro {
			padding: 44px 40px;
			border-radius: 36px;
		}
		.form-card {
			padding: 36px 36px 32px;
		}
	}
</style>
