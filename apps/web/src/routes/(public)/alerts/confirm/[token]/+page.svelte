<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';
	import { fmt } from '#lib/i18n.ts';

	let { data, form }: PageProps = $props();
	const a = $derived(data.t.alerts.confirm);
	// Confirmed now (the button), or earlier (the link opened again).
	const done = $derived(form?.confirmed ?? (data.alert?.confirmed ? data.alert : null));
</script>

<svelte:head><title>{a.metaTitle}</title><meta name="robots" content="noindex" /></svelte:head>

<div class="shell shell-narrow">
	<main class="stack center" style="--gap: 16px; align-items: center; padding: 40px 0">
		<div style="width: 130px"><Mascot mood={done ? 'happy' : 'thinking'} /></div>
		{#if done}
			<h1 style="font-size: 26px">{a.doneTitle}</h1>
			<p class="muted">{fmt(a.doneBody, { drug: done.drug, lot: done.lot })}</p>
			<a class="btn btn-primary" href="/check">{data.t.common.checkMedicine}</a>
		{:else if data.alert}
			<h1 style="font-size: 26px">
				{fmt(a.question, { drug: data.alert.drug, lot: data.alert.lot })}
			</h1>
			<form method="post"><button class="btn btn-primary">{a.button}</button></form>
		{:else}
			<h1 style="font-size: 26px">{a.badTitle}</h1>
			<p class="muted">{a.badBody}</p>
			<a class="btn btn-primary" href="/check">{data.t.common.checkMedicine}</a>
		{/if}
	</main>
	<SiteFooter />
</div>
