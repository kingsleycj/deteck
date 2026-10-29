<script lang="ts">
	import { formatDateTime } from './status.ts';

	interface Key {
		id: string;
		name: string;
		prefix: string;
		scopes: string[];
		rateLimit: number;
		createdAt: Date | string;
		lastUsedAt: Date | string | null;
	}
	let {
		keys,
		scopes,
		canManage,
		newKey = null
	}: {
		keys: Key[];
		scopes: { key: string; label: string }[];
		canManage: boolean;
		newKey?: string | null;
	} = $props();
</script>

<section class="panel stack" style="--gap: 12px">
	<h2>API keys</h2>
	<p class="small muted">
		A key lets your own systems use the DETECK API. Treat it like a password: anyone with it can act
		for your company. See the <a href="/developers">API documentation</a>.
	</p>
	{#if newKey}
		<div class="notice notice-ok" role="status">
			<p><strong>Copy this key now.</strong> It won't be shown again.</p>
			<p class="mono" style="word-break: break-all; margin-top: 6px">{newKey}</p>
		</div>
	{/if}
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr
					><th>Name</th><th>Key starts</th><th>Permissions</th><th>Limit</th><th>Last used</th
					>{#if canManage}<th></th>{/if}</tr
				></thead
			>
			<tbody>
				{#each keys as k (k.id)}
					<tr>
						<td
							><strong>{k.name}</strong><span class="sub"
								>Created {formatDateTime(k.createdAt)}</span
							></td
						>
						<td class="mono small">{k.prefix}…</td>
						<td class="small">{k.scopes.join(', ')}</td>
						<td class="small">{k.rateLimit}/min</td>
						<td class="small">{k.lastUsedAt ? formatDateTime(k.lastUsedAt) : 'Never'}</td>
						{#if canManage}<td
								><form method="post" action="?/revokeKey">
									<input type="hidden" name="id" value={k.id} /><button class="btn btn-small"
										>Revoke</button
									>
								</form></td
							>{/if}
					</tr>
				{:else}
					<tr><td colspan="6" class="muted">No keys yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
	{#if canManage}
		<form method="post" action="?/createKey" class="form-grid">
			<div class="field">
				<label for="key-name">Key name</label>
				<input id="key-name" name="name" required maxlength="80" placeholder="e.g. ERP system" />
			</div>
			<fieldset class="field" style="border: 0; padding: 0; margin: 0">
				<legend class="label">Permissions</legend>
				{#each scopes as s (s.key)}
					<label class="row small" style="--gap: 6px"
						><input type="checkbox" name="scopes" value={s.key} checked /> {s.label}</label
					>
				{/each}
			</fieldset>
			<div class="span-2"><button class="btn btn-primary btn-small">Create key</button></div>
		</form>
	{/if}
</section>
