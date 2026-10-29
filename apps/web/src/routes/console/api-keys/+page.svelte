<script lang="ts">
	import type { PageProps } from './$types';
	import ApiKeys from '#lib/ui/ApiKeys.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Partner API keys · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Admin and monitoring</p>
		<h1>Partner API keys</h1>
		<p class="small muted">
			Keys for partner apps (for example a health app or a pharmacy chain's own app) that check
			serials. Manufacturers and businesses create their own keys.
		</p>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}

<ApiKeys
	keys={data.keys}
	scopes={data.scopes}
	canManage={true}
	newKey={form && 'newKey' in form ? form.newKey : null}
/>
