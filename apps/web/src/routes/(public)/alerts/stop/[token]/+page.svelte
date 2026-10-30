<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';

	let { data, form }: PageProps = $props();
	const a = $derived(data.t.alerts.stop);
</script>

<svelte:head><title>{a.metaTitle}</title><meta name="robots" content="noindex" /></svelte:head>

<div class="shell shell-narrow">
	<main class="stack center" style="--gap: 16px; align-items: center; padding: 40px 0">
		<div style="width: 130px"><Mascot mood="thinking" /></div>
		{#if form || !data.valid}
			{#if form?.stopped}
				<h1 style="font-size: 26px">{a.stoppedTitle}</h1>
				<p class="muted">{a.stoppedBody}</p>
			{:else}
				<h1 style="font-size: 26px">{a.badTitle}</h1>
				<p class="muted">{a.badBody}</p>
			{/if}
			<a class="btn btn-primary" href="/check">{data.t.common.checkMedicine}</a>
		{:else}
			<h1 style="font-size: 26px">{a.question}</h1>
			<form method="post"><button class="btn btn-primary">{a.button}</button></form>
		{/if}
	</main>
	<SiteFooter />
</div>
