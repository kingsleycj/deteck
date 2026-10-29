<script lang="ts">
	import { page } from '$app/state';
	import { useT } from '#lib/i18n.ts';

	const t = $derived(useT());
	const draft = $derived(page.data.lang !== 'en' && !t.meta.reviewed && t.common.draftNotice);
</script>

{#if draft}
	<p class="notice small draft-notice" lang={page.data.lang}>
		{t.common.draftNotice}
		<span lang="en"
			>This translation is a draft. If anything is unclear, choose English in the language menu.</span
		>
	</p>
{/if}
<footer class="site-footer">
	<a href="/">{t.footer.about}</a>
	<a href="/check">{t.footer.check}</a>
	<a href="/privacy">{t.footer.privacy}</a>
	<a href="/terms">{t.footer.terms}</a>
	<a href="/business">{t.footer.business}</a>
	<a href="/developers">{t.footer.developers}</a>
	<span>{t.footer.note}</span>
</footer>

<style>
	.draft-notice span {
		display: block;
		margin-top: 4px;
		color: var(--text-3);
	}
</style>
