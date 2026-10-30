<script lang="ts">
	/**
	 * The error page: the root one, and the public one (which has the visitor's language, because
	 * the public pages' layout gives it).
	 */
	import { page } from '$app/state';
	import Mascot from './Mascot.svelte';
	import { fmt, type Messages } from '#lib/i18n.ts';

	const business = $derived(/^\/(business|workspace|console|files|portal)/.test(page.url.pathname));
	// Public pages pass the visitor's language; business areas are in English.
	const t = $derived(page.data.t as Messages | undefined);
	const e = $derived(
		t?.error ?? {
			notFoundTitle: "I can't find that page",
			notFoundBody: 'The link may be old or mistyped.',
			forbiddenTitle: "This page isn't open to you",
			forbiddenBody: 'Your account does not have access to this page.',
			tooManyTitle: 'Too many requests',
			tooManyBody: 'Please wait a minute.',
			otherTitle: 'Something went wrong on our side',
			otherBody:
				'Nothing you did caused this. Please try again in a minute. If you were checking a medicine, type the serial again.',
			code: 'Error {status}'
		}
	);
	// Business errors carry a specific English message; public pages use the translated wording.
	const own = $derived(business ? page.error?.message : undefined);
	const copy = $derived(
		page.status === 404
			? { title: e.notFoundTitle, body: e.notFoundBody }
			: page.status === 403
				? { title: e.forbiddenTitle, body: own || e.forbiddenBody }
				: page.status === 429
					? { title: e.tooManyTitle, body: own || e.tooManyBody }
					: page.status < 500 && own
						? // A request the server refused on purpose (for example 409: another tab is
							// working on a different company). Its message says what to do.
							{ title: "That didn't go through", body: own }
						: { title: e.otherTitle, body: e.otherBody }
	);
</script>

<svelte:head><title>{copy.title} · DETECK</title></svelte:head>

<div class="shell shell-narrow">
	<main class="stack center" style="--gap: 16px; align-items: center; padding: 48px 0">
		<div style="width: 140px"><Mascot mood={page.status === 404 ? 'thinking' : 'concerned'} /></div>
		<h1 style="font-size: 26px">{copy.title}</h1>
		<p class="muted">{copy.body}</p>
		{#if business}
			<a class="btn btn-primary" href="/business/home">Go to your account</a>
			<form method="post" action="/business/sign-out">
				<button class="btn">Sign out</button>
			</form>
		{:else}
			<a class="btn btn-primary" href="/check">{t?.common.checkMedicine ?? 'Check a medicine'}</a>
		{/if}
		<p class="small muted">{fmt(e.code, { status: page.status })}</p>
	</main>
</div>
