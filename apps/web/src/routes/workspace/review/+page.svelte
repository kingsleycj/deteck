<script lang="ts">
	import type { PageProps } from './$types';
	import Checklist from '#lib/ui/Checklist.svelte';

	let { data, form }: PageProps = $props();
	const items = $derived(data.checklist.items);
	const done = $derived(items.filter((i) => i.state === 'ok').length);
	const warnings = $derived(items.filter((i) => i.state === 'warn'));
	const blocking = $derived(items.filter((i) => i.state === 'bad'));
	const canSubmit = $derived(
		['approved', 'changes_requested'].includes(data.company.status) &&
			!data.checklist.blocking &&
			data.access.isAdmin
	);
	/** The server asked to confirm: some items are warnings. */
	const confirming = $derived(Boolean(form && 'confirm' in form && form.confirm) && canSubmit);
	/** Where each item is fixed. */
	const fix: Record<string, string> = {
		documents: '/workspace/company',
		products: '/workspace/import',
		serials: '/workspace/import',
		supply: '/workspace/import',
		packaging: '/workspace/packaging',
		imports: '/workspace/import'
	};
	const checkedAt = $derived(
		new Date(data.checkedAt).toLocaleTimeString('en-NG', {
			hour: '2-digit',
			minute: '2-digit',
			timeZone: 'Africa/Lagos'
		})
	);
</script>

<svelte:head><title>Go-live readiness · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Go live</p>
		<h1>Ready to go live?</h1>
	</div>
	<!-- Plain GET: the checklist is worked out again from your data as it is now. -->
	<a class="btn btn-small" href="/workspace/review" data-sveltekit-reload>Check readiness again</a>
</div>

{#if form && 'submitted' in form}<p class="toast">
		Submitted. A DETECK reviewer will check your data and email you.
	</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<section
	class="readiness"
	class:ready={!blocking.length && !warnings.length}
	class:partly={!blocking.length && warnings.length}
	aria-label="Readiness"
>
	<div>
		<p class="readiness-state">
			{blocking.length
				? 'Not ready yet'
				: warnings.length
					? 'Ready, with things to finish'
					: 'Ready to go live'}
		</p>
		<p class="small">
			{done} of {items.length} done{blocking.length
				? `, ${blocking.length} must be fixed first`
				: warnings.length
					? `, ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}`
					: ''}. Checked at {checkedAt}.
		</p>
	</div>
	<div class="bar" aria-hidden="true">
		<span style="width: {items.length ? Math.round((done / items.length) * 100) : 0}%"></span>
	</div>
</section>

<div class="two-col">
	<section class="panel" id="checklist">
		<h2>Checklist</h2>
		<Checklist {items} {fix} />
		<p class="help">
			Red items must be fixed before you can submit. Warnings don't block going live, but people
			checking those drugs see less: only the manufacturer's record (no supply chain steps), or
			"Packaging check not available yet". After a change, press "Check readiness again".
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
		{:else if confirming}
			<h3>Go live with these unfinished?</h3>
			<ul class="small stack" style="--gap: 6px; padding-left: 18px">
				{#each warnings as w (w.key)}<li>
						{w.label}{#if w.detail}: {w.detail}{/if}
					</li>{/each}
			</ul>
			<p class="small muted">
				You can finish them after going live. Or go back, make the changes, and check readiness
				again first.
			</p>
			<div class="stack" style="--gap: 8px">
				<a class="btn btn-block" href="#checklist">Go back and make changes</a>
				<form method="post" action="?/submit">
					<input type="hidden" name="confirmed" value="yes" />
					<button class="btn btn-primary btn-block">Submit anyway</button>
				</form>
			</div>
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
			{#if blocking.length}<p class="help">Fix the red items first, then check readiness again.</p>
			{:else if !data.access.isAdmin}<p class="help">Only company admins can submit.</p>{/if}
		{/if}
	</aside>
</div>

<style>
	.readiness {
		display: grid;
		gap: 10px;
		padding: 16px 18px;
		border-radius: var(--radius-l);
		background: var(--red-tint);
	}
	.readiness.partly {
		background: var(--peach);
	}
	.readiness.ready {
		background: var(--lime-tint);
	}
	.readiness-state {
		font-weight: 800;
		font-size: 18px;
	}
	.bar {
		height: 8px;
		border-radius: 999px;
		background: rgba(11, 11, 15, 0.1);
		overflow: hidden;
	}
	.bar span {
		display: block;
		height: 100%;
		background: var(--ink);
		border-radius: inherit;
	}
</style>
