<script lang="ts">
	import Mascot from '#lib/ui/Mascot.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import { useT } from '#lib/i18n.ts';

	const t = $derived(useT());
</script>

<svelte:head><title>{t.report.thanks.metaTitle}</title></svelte:head>

<div class="shell shell-narrow">
	<main class="stack center" style="--gap: 16px; align-items: center; padding: 40px 0">
		<div style="width: 140px"><Mascot mood="happy" /></div>
		<h1 style="font-size: 26px">{t.report.thanks.title}</h1>
		<p class="muted">{t.report.thanks.body}</p>
		<a class="btn btn-primary" href="/check">{t.common.checkAnother}</a>
	</main>
	<SiteFooter />
</div>
