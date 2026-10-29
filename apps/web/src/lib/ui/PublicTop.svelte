<script lang="ts">
	import Logo from './Logo.svelte';
	import LanguageMenu from './LanguageMenu.svelte';
	import { useT } from '#lib/i18n.ts';

	const t = $derived(useT());
</script>

<header class="topbar">
	<a href="/" aria-label={t.nav.home} style="display: inline-flex"><Logo height={28} /></a>
	<nav aria-label={t.nav.main}>
		<a href="/#how">{t.nav.how}</a>
		<a href="/#who">{t.nav.pharmacies}</a>
		<a href="/business">{t.nav.manufacturers}</a>
	</nav>
	<div class="row" style="--gap: 8px">
		<span class="pill">{t.nav.badge}</span>
		<LanguageMenu />
	</div>
</header>
