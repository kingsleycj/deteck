<script lang="ts">
	import type { PageProps } from './$types';
	import ApiKeys from '#lib/ui/ApiKeys.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>API keys · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/portal">Overview</a> / API keys</p>
		<h1>API keys</h1>
		<p class="small muted">
			Connect your stock or dispensing software: check deliveries and record receipts automatically.
		</p>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}

{#if data.business.status !== 'approved'}
	<p class="notice notice-info">
		API keys can be created once DETECK approves your business{data.business.status === 'suspended'
			? ' and lifts the pause on your account'
			: ''}.
	</p>
{/if}

<ApiKeys
	keys={data.keys}
	scopes={data.scopes}
	canManage={data.access.isAdmin && !data.access.onBehalf && data.business.status === 'approved'}
	newKey={form && 'newKey' in form ? form.newKey : null}
/>
