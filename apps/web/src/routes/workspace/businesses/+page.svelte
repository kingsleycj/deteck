<script lang="ts">
	import type { PageProps } from './$types';
	import { ROLE_LABEL } from '@deteck/core/messages/en.ts';
	import type { PartyRoleName } from '@deteck/core/verify/journey-types.ts';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Supply chain businesses · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Businesses</p>
		<h1>Supply chain businesses</h1>
	</div>
</div>
<p class="small muted">
	Businesses your supply chain records name. People checking your medicines see each one as
	"Verified by DETECK" or "Not yet verified by DETECK". Adding PCN or CAC numbers to your supply
	chain file helps DETECK match and verify them.
</p>

<div class="table-wrap">
	<table class="data">
		<thead><tr><th>Business</th><th>Role</th><th>Records</th><th>Status</th></tr></thead>
		<tbody>
			{#each data.rows as p (p.id)}
				<tr>
					<td
						><strong>{p.name}</strong><span class="sub"
							>{[p.city, p.state].filter(Boolean).join(', ')}</span
						></td
					>
					<td>{ROLE_LABEL[p.role as PartyRoleName]}</td>
					<td>{p.events}</td>
					<td
						>{#if p.verified_at}<span class="chip chip-ok">Verified by DETECK</span>{:else}<span
								class="chip">Not yet verified</span
							>{/if}</td
					>
				</tr>
			{:else}
				<tr
					><td colspan="4" class="muted"
						>No businesses yet. They appear when you import supply chain records.</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
