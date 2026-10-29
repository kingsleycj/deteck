<script lang="ts">
	import type { PageProps } from './$types';
	import ApiKeys from '#lib/ui/ApiKeys.svelte';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const canManage = $derived(
		data.access.isAdmin && !data.access.onBehalf && data.company.toolsOpen
	);
</script>

<svelte:head><title>API and webhooks · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / API and webhooks</p>
		<h1>API and webhooks</h1>
		<p class="small muted">
			Send data from your own systems, and get told when something happens to your records.
		</p>
	</div>
	<a class="btn btn-small" href="/developers">API documentation</a>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
{#if !data.company.toolsOpen}
	<p class="notice notice-info">
		API keys and webhooks open once DETECK has approved your company.
	</p>
{/if}

<ApiKeys
	keys={data.keys}
	scopes={data.scopes}
	{canManage}
	newKey={form && 'newKey' in form ? form.newKey : null}
/>

<section class="panel stack" style="--gap: 12px">
	<h2>Webhooks</h2>
	<p class="small muted">
		DETECK sends a signed POST request to your address when one of these events happens. The
		<a href="/developers#webhooks">documentation</a> shows how to check the signature.
	</p>
	{#if form && 'newSecret' in form}
		<div class="notice notice-ok" role="status">
			<p><strong>Copy the signing secret now.</strong> It won't be shown again.</p>
			<p class="mono" style="word-break: break-all; margin-top: 6px">{form.newSecret}</p>
		</div>
	{/if}
	{#each data.endpoints as e (e.id)}
		<div class="card stack" style="--gap: 8px">
			<div class="row" style="justify-content: space-between">
				<strong class="mono small" style="word-break: break-all">{e.url}</strong>
				{#if canManage}
					<div class="row" style="--gap: 6px">
						<form method="post" action="?/testWebhook">
							<input type="hidden" name="id" value={e.id} /><button class="btn btn-small"
								>Send a test</button
							>
						</form>
						<form method="post" action="?/removeWebhook">
							<input type="hidden" name="id" value={e.id} /><button class="btn btn-small"
								>Remove</button
							>
						</form>
					</div>
				{/if}
			</div>
			<p class="small muted">{e.events.join(', ')}</p>
			{#if e.deliveries.length}
				<table class="data small">
					<thead><tr><th>Sent</th><th>Event</th><th>Result</th></tr></thead>
					<tbody>
						{#each e.deliveries as d (d.id)}
							<tr>
								<td>{formatDateTime(d.createdAt)}</td>
								<td class="mono">{d.event}</td>
								<td
									>{d.status === 'delivered'
										? `Delivered (${d.lastStatusCode})`
										: d.status === 'failed'
											? `Failed: ${d.lastError ?? ''}`
											: d.attempts
												? `Retrying (${d.attempts} ${d.attempts === 1 ? 'try' : 'tries'} so far): ${d.lastError ?? ''}`
												: 'Queued'}</td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{:else}
		<p class="small muted">No webhooks yet.</p>
	{/each}
	{#if canManage}
		<form method="post" action="?/createWebhook" class="form-grid">
			<div class="field span-2">
				<label for="url">Your HTTPS address</label>
				<input
					id="url"
					name="url"
					type="url"
					required
					placeholder="https://erp.example.com/deteck"
				/>
			</div>
			<fieldset class="field span-2" style="border: 0; padding: 0; margin: 0">
				<legend class="label">Events</legend>
				{#each data.events as ev (ev.key)}
					<label class="row small" style="--gap: 6px"
						><input type="checkbox" name="events" value={ev.key} checked />
						<span><span class="mono">{ev.key}</span> · {ev.label}</span></label
					>
				{/each}
			</fieldset>
			<div class="span-2"><button class="btn btn-primary btn-small">Add webhook</button></div>
		</form>
	{/if}
</section>
