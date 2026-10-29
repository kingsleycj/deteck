<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Settings · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Admin and monitoring</p>
		<h1>Settings</h1>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}

<section class="panel stack" style="--gap: 12px; max-width: 760px">
	<h2>Data-sharing agreement template</h2>
	<p class="small muted">
		Manufacturers download this from Company and documents, sign it, and upload the signed copy.
		They need a signed copy on file before importing serials or supply chain records.
	</p>
	{#if data.agreement}
		<p class="small">
			Current: <a href="/files/site/agreement_template">{data.agreement.fileName}</a> · published
			{formatDateTime(data.agreement.uploadedAt)}
		</p>
	{:else}
		<p class="notice small">Not published yet: manufacturers have no template to download.</p>
	{/if}
	<form
		method="post"
		action="?/agreement"
		enctype="multipart/form-data"
		class="row"
		style="--gap: 10px"
	>
		<label for="agreement-file" class="visually-hidden">Agreement template file</label>
		<input id="agreement-file" name="file" type="file" accept="application/pdf" required />
		<button class="btn btn-primary btn-small">Publish</button>
	</form>
</section>
