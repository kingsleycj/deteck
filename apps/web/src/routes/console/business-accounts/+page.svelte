<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { BUSINESS_STATUS, formatDateTime } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const ROLE: Record<string, string> = {
		pharmacy: 'Pharmacy',
		hospital: 'Hospital or clinic',
		distributor: 'Distributor',
		wholesaler: 'Wholesaler'
	};
</script>

<svelte:head><title>Pharmacies and distributors · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">DETECK team console</p>
		<h1>Pharmacies, hospitals and distributors</h1>
	</div>
	<nav class="tabs" aria-label="Status">
		{#each [['', 'All'], ['pending', 'Waiting'], ['info_requested', 'Info requested'], ['approved', 'Approved'], ['suspended', 'Suspended'], ['rejected', 'Rejected']] as [key, label] (key)}<a
				href="?status={key}"
				aria-current={data.status === key ? 'page' : undefined}>{label}</a
			>{/each}
	</nav>
</div>

<p class="small muted" style="max-width: 760px">
	Businesses that registered their own DETECK account. Check each PCN premises licence against the
	Pharmacists Council of Nigeria register before approving. Approving links the account to its
	supply chain record and marks it "Verified by DETECK".
</p>

{#if data.rows.length === 0}
	<div class="empty">
		<div style="width: 90px"><Mascot mood="thinking" /></div>
		<h3>None yet</h3>
	</div>
{:else}
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr
					><th>Business</th><th>Type</th><th>PCN licence</th><th>Registered</th><th>Status</th></tr
				></thead
			>
			<tbody>
				{#each data.rows as b (b.id)}
					<tr>
						<td
							><a href="/console/business-accounts/{b.id}"><strong>{b.name}</strong></a><span
								class="sub">{[b.town, b.state].filter(Boolean).join(', ')}</span
							></td
						>
						<td>{ROLE[b.role] ?? b.role}</td>
						<td class="mono small">{b.pcnLicence}</td>
						<td>{formatDateTime(b.createdAt)}</td>
						<td
							><span class="chip {BUSINESS_STATUS[b.status].chip}"
								>{BUSINESS_STATUS[b.status].label}</span
							></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
