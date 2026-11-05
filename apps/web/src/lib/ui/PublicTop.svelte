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
		<a href="/#faq">{t.landing.navFaq}</a>
		<a href="/contact">{t.nav.contact}</a>
	</nav>
	<div class="row" style="--gap: 8px">
		<LanguageMenu />
		<a class="topbar-signin" href="/business/sign-in">{t.landing.signIn}</a>
	</div>
</header>
