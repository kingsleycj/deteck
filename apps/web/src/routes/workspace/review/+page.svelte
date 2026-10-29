<script lang="ts">
	import type { PageProps } from './$types';
	import Checklist from '#lib/ui/Checklist.svelte';

	let { data, form }: PageProps = $props();
	const canSubmit = $derived(
		['approved', 'changes_requested'].includes(data.company.status) &&
			!data.checklist.blocking &&
			data.access.isAdmin
	);
</script>

<svelte:head><title>Go-live readiness · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Go live</p>
		<h1>Ready to go live?</h1>
	</div>
</div>

{#if form && 'submitted' in form}<p class="toast">
		Submitted. A DETECK reviewer will check your data and email you.
	</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<div class="two-col">
	<section class="panel">
		<h2>Checklist</h2>
		<Checklist items={data.checklist.items} />
		<p class="help">
			Warnings don't block going live. People will see "No journey recorded yet" or "Packaging check
			not available yet" for those drugs.
		</p>
	</section>
	<aside class="panel">
		{#if data.company.status === 'in_review'}
			<h3>Waiting for DETECK</h3>
			<p class="small muted">
				A reviewer is checking your data. You'll get an email when they decide.
			</p>
		{:else if data.company.status === 'live'}
			<h3>You're live</h3>
			<p class="small muted">New imports go live straight away.</p>
		{:else}
			<h3>Submit for review</h3>
			<p class="small muted">
				A DETECK reviewer checks the data and spot-checks serials against your file. Your records go
				live when they approve.
			</p>
			<form method="post" action="?/submit">
				<button class="btn btn-primary btn-block" disabled={!canSubmit}
					>Submit for go-live review</button
				>
			</form>
			{#if !data.access.isAdmin}<p class="help">Only company admins can submit.</p>{/if}
		{/if}
	</aside>
</div>
