<script lang="ts">
	import { confirmSubmit } from '#lib/ui/confirm.ts';
	import SearchField from '#lib/ui/SearchField.svelte';
	import type { PageProps } from './$types';
	import { formatNumber } from '#lib/ui/status.ts';
	import { ROLE_LABEL } from '@deteck/core/messages/en.ts';
	import type { PartyRoleName } from '@deteck/core/verify/journey-types.ts';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Supply chain businesses · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">DETECK team console</p>
		<h1>Supply chain businesses</h1>
	</div>
	<form method="get" class="page-search" role="search">
		{#if !data.unverifiedOnly}<input type="hidden" name="show" value="all" />{/if}
		<SearchField value={data.q} label="Search businesses" placeholder="Name, place, PCN or CAC" />
	</form>
</div>

<nav class="tabs" aria-label="Filter">
	<a href="?q={encodeURIComponent(data.q)}" aria-current={data.unverifiedOnly ? 'page' : undefined}
		>Not yet verified</a
	>
	<a
		href="?show=all&q={encodeURIComponent(data.q)}"
		aria-current={!data.unverifiedOnly ? 'page' : undefined}>All businesses</a
	>
</nav>

<p class="small muted">
	Businesses are added as "Not yet verified by DETECK" when a manufacturer's records name them.
	Verify a business after checking its PCN premises licence or CAC registration. Merge duplicates so
	journeys show one name.
</p>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<div class="table-wrap">
	<table class="data">
		<thead
			><tr
				><th>Business</th><th>Role</th><th>Identifiers</th><th>Records</th><th>Status</th><th
					>Actions</th
				></tr
			></thead
		>
		<tbody>
			{#each data.rows as p (p.id)}
				<tr>
					<td
						><strong>{p.name}</strong><span class="sub"
							>{[p.city, p.state].filter(Boolean).join(', ')}{p.created_by
								? ` · first recorded by ${p.created_by}`
								: ''}</span
						></td
					>
					<td>{ROLE_LABEL[p.role as PartyRoleName]}</td>
					<td class="small"
						>{#if p.pcn_licence}PCN {p.pcn_licence}<br />{/if}{#if p.cac_rc}CAC {p.cac_rc}<br
							/>{/if}{#if p.gln}GLN {p.gln}{/if}{#if !p.pcn_licence && !p.cac_rc && !p.gln}—{/if}</td
					>
					<td
						>{formatNumber(p.events)}<span class="sub"
							>{p.manufacturers} manufacturer{p.manufacturers === 1 ? '' : 's'}</span
						></td
					>
					<td
						>{#if p.verified_at}<span class="chip chip-ok">Verified</span>{:else}<span class="chip"
								>Not yet verified</span
							>{/if}</td
					>
					<td>
						<details>
							<summary class="small">Review</summary>
							<div class="stack" style="--gap: 10px; margin-top: 8px; min-width: 280px">
								{#if !p.verified_at}
									<form method="post" action="?/verify" class="stack" style="--gap: 6px">
										<input type="hidden" name="id" value={p.id} />
										<input
											class="input"
											name="pcn"
											aria-label="PCN premises licence"
											placeholder="PCN premises licence"
											value={p.pcn_licence ?? ''}
											style="min-height: 40px"
										/>
										<input
											class="input"
											name="cac"
											aria-label="CAC RC number"
											placeholder="CAC RC number"
											value={p.cac_rc ?? ''}
											style="min-height: 40px"
										/>
										<input
											class="input"
											name="gln"
											aria-label="GLN, 13 digits"
											placeholder="GLN (13 digits)"
											value={p.gln ?? ''}
											style="min-height: 40px"
										/>
										<button class="btn btn-small">Verify business</button>
									</form>
								{:else if data.staff.isAdmin}
									<form method="post" action="?/unverify">
										<input type="hidden" name="id" value={p.id} /><button class="btn btn-small"
											>Remove verification</button
										>
									</form>
								{/if}
								{#if data.staff.isAdmin}<form
										method="post"
										action="?/merge"
										class="stack"
										style="--gap: 6px"
										use:confirmSubmit={{
											message: `Merge ${p.name} into the business you chose? Its records move there and journeys change at once. This can't be undone.`
										}}
									>
										<input type="hidden" name="id" value={p.id} />
										<label class="small" for="into-{p.id}">Merge this duplicate into</label>
										<!-- Nothing chosen to start with: one click must never merge by accident. -->
										<select
											id="into-{p.id}"
											name="into"
											class="input"
											style="min-height: 40px"
											required
										>
											<option value="" selected disabled>Choose the business to keep…</option>
											{#each data.all.filter((x) => x.id !== p.id) as other (other.id)}<option
													value={other.id}
													>{other.name}{other.place ? ` (${other.place})` : ''}</option
												>{/each}
										</select>
										<button class="btn btn-small">Merge</button>
									</form>{/if}
							</div>
						</details>
					</td>
				</tr>
			{:else}
				<tr
					><td colspan="6" class="muted"
						>{data.unverifiedOnly ? 'Every business has been reviewed.' : 'No businesses yet.'}</td
					></tr
				>
			{/each}
		</tbody>
	</table>
</div>
