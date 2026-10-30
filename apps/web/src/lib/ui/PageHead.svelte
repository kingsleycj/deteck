<script lang="ts">
	/**
	 * The header of a public page. Phones: a back (or close) button and the page's name. Wide
	 * screens, as in the desktop designs: the logo, "/ the page's name", and on the right a short
	 * reference (the serial) and the language menu.
	 */
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import Logo from './Logo.svelte';
	import LanguageMenu from './LanguageMenu.svelte';
	import { useT } from '#lib/i18n.ts';

	let {
		back,
		backLabel,
		title,
		close = false,
		languages = true,
		aside
	}: {
		back: string;
		backLabel: string;
		title: string;
		/** A close (×) button instead of a back arrow. */
		close?: boolean;
		languages?: boolean;
		aside?: Snippet;
	} = $props();
	const t = $derived(useT());
</script>

<header class="page-head">
	<a href={back} class="back" aria-label={backLabel}><Icon name={close ? 'close' : 'back'} /></a>
	<a href="/" class="head-logo" aria-label={t.nav.home}><Logo height={26} /></a>
	<span class="head-title"><span class="head-slash" aria-hidden="true">/</span>{title}</span>
	<span class="head-aside">
		{#if aside}{@render aside()}{/if}
		{#if languages}<LanguageMenu />{/if}
	</span>
</header>

<style>
	.head-logo,
	.head-slash {
		display: none;
	}
	.head-aside {
		margin-left: auto;
		display: inline-flex;
		align-items: center;
		gap: 10px;
		font-size: 12px;
		font-weight: 400;
		color: var(--text-3);
	}
	@media (min-width: 900px) {
		.page-head {
			padding: 6px 0 4px;
		}
		.back {
			display: none;
		}
		.head-logo {
			display: inline-flex;
		}
		.head-title {
			color: var(--text-2);
			font-weight: 600;
		}
		.head-slash {
			display: inline;
			margin-right: 8px;
			color: var(--text-4);
		}
	}
</style>
