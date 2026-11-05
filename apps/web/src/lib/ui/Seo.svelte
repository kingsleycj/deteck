<script lang="ts">
	/**
	 * A page's title and everything search engines and link previews read (B-85). `multilingual`
	 * pages list their five language versions; `noindex` keeps a page out of search results.
	 */
	import { page } from '$app/state';
	import type { Locale } from '@deteck/core/messages/i18n.ts';
	import { jsonLd, localizedUrl, ogLocale, SHARE_IMAGE, SITE_NAME } from '#lib/seo.ts';

	let {
		title,
		description,
		path = page.url.pathname,
		multilingual = false,
		noindex = false,
		type = 'website',
		structured = []
	}: {
		title: string;
		description: string;
		/** The page's address without ?lang= (defaults to the current one). */
		path?: string;
		multilingual?: boolean;
		noindex?: boolean;
		type?: 'website' | 'article';
		/** schema.org objects, each written as its own JSON-LD block. */
		structured?: object[];
	} = $props();

	const origin = $derived(page.url.origin);
	const lang = $derived((multilingual ? page.data.lang : 'en') as Locale);
	const languages = $derived(
		multilingual ? ((page.data.languages ?? []) as { code: Locale }[]).map((l) => l.code) : []
	);
	// Opened in a chosen language (?lang=): that version. Otherwise the plain, x-default address.
	const chosen = $derived(multilingual && page.url.searchParams.has('lang') ? lang : null);
	const canonical = $derived(localizedUrl(origin, path, chosen));
	const image = $derived(new URL(SHARE_IMAGE, origin).href);
	// Written as one string each, since Svelte can't place a JSON <script> in the head by itself.
	const blocks = $derived(
		structured.map((data) => `<script type="application/ld+json">${jsonLd(data)}<${'/'}script>`)
	);
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{:else}
		<link rel="canonical" href={canonical} />
	{/if}
	{#if languages.length > 1}
		{#each languages as code (code)}
			<link rel="alternate" hreflang={code} href={localizedUrl(origin, path, code)} />
		{/each}
		<link rel="alternate" hreflang="x-default" href={localizedUrl(origin, path, null)} />
	{/if}
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="DETECK: Verify Before You Trust." />
	<meta property="og:locale" content={ogLocale(lang)} />
	{#each languages.filter((code) => code !== lang) as code (code)}
		<meta property="og:locale:alternate" content={ogLocale(code)} />
	{/each}
	<meta name="twitter:card" content="summary_large_image" />
	{#each blocks as block, i (i)}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- our own data, escaped by jsonLd() -->
		{@html block}
	{/each}
</svelte:head>
