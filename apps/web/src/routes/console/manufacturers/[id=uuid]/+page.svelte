<script lang="ts">
	import { confirmFirst } from '#lib/ui/confirm.ts';
	import TeamSupportPanel from '#lib/ui/TeamSupportPanel.svelte';
	import type { PageProps } from './$types';
	import {
		formatDateTime,
		formatNumber,
		IMPORT_KIND,
		IMPORT_STATUS,
		MANUFACTURER_STATUS,
		PACKAGING_STATUS
	} from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const m = $derived(data.m);
	const s = $derived(MANUFACTURER_STATUS[m.status]);
	const labels: Record<string, string> = {
		nafdac_certificate: 'NAFDAC certificate',
		data_sharing_agreement: 'Signed data-sharing agreement',
		other: 'Other document'
	};
</script>

<svelte:head><title>{m.companyName} · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/console/manufacturers">Manufacturers</a> / {m.companyName}</p>
		<h1>
			{m.companyName} <span class="chip {s.chip}" style="vertical-align: middle">{s.label}</span>
		</h1>
		<p class="small muted">
			{[m.factoryTown, m.state].filter(Boolean).join(', ')} · Contact: {m.contactName} ({m.contactEmail})
		</p>
	</div>
	<div class="row">
		{#if ['pending', 'info_requested'].includes(m.status)}<a
				class="btn btn-small"
				href="/console/applications/{m.id}">Review application</a
			>{/if}
		{#if m.status === 'in_review'}<a
				class="btn btn-primary btn-small"
				href="/console/manufacturers/{m.id}/review">Review before going live</a
			>{/if}
		{#if !['pending', 'info_requested', 'rejected'].includes(m.status)}
			<a class="btn btn-small" href="/workspace?as={m.id}">Open their workspace</a>
		{/if}
	</div>
</div>

{#if data.decided === 'approve'}<p class="toast">
		{m.companyName} is live. Anyone who checks one of their serials now gets a real answer.
	</p>{/if}
{#if data.decided === 'send_back'}<p class="toast">
		Sent back with your note. The manufacturer has been emailed.
	</p>{/if}
{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}
{#if m.statusReason}<p class="small muted">Last status reason: "{m.statusReason}"</p>{/if}

<section class="stats">
	<div class="stat">
		<span class="k">Drugs</span><span class="n">{formatNumber(data.counts.products)}</span>
	</div>
	<div class="stat">
		<span class="k">Batches</span><span class="n">{formatNumber(data.counts.batches)}</span>
	</div>
	<div class="stat">
		<span class="k">Serials</span><span class="n">{formatNumber(data.counts.serials)}</span>
	</div>
	<div class="stat">
		<span class="k">Supply chain records</span><span class="n"
			>{formatNumber(data.counts.events)}</span
		>
	</div>
	<div class="stat dark">
		<span class="k">Checks of these drugs</span><span class="n">{formatNumber(data.checks)}</span
		><span class="d">Last 30 days</span>
	</div>
</section>

<div class="two-col">
	<section class="stack" style="--gap: 12px">
		<h2>Drugs</h2>
		<div class="table-wrap">
			<table class="data">
				<thead
					><tr
						><th>Drug</th><th>NAFDAC no.</th><th>Batches</th><th>Serials</th><th>Supply chain</th
						><th>Packaging</th></tr
					></thead
				>
				<tbody>
					{#each data.products as p (p.id)}
						<tr>
							<td
								><a href="/console/drugs/{p.id}"><strong>{p.brandName} {p.strength}</strong></a
								><span class="sub">{p.dosageForm} · GTIN <span class="mono">{p.gtin}</span></span
								></td
							>
							<td class="mono">{p.nafdacRegNo}</td>
							<td>{formatNumber(p.batches)}</td>
							<td>{formatNumber(p.serials)}</td>
							<td
								>{p.batchesWithoutSupply > 0
									? `${p.batchesWithoutSupply} missing`
									: p.batches > 0
										? 'Complete'
										: '—'}</td
							>
							<td
								><span class="chip {PACKAGING_STATUS[p.packaging].chip}"
									>{PACKAGING_STATUS[p.packaging].label}</span
								></td
							>
						</tr>
					{:else}
						<tr><td colspan="6" class="muted">No drugs yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<aside class="stack" style="--gap: 14px">
		<section class="panel">
			<h3>Documents</h3>
			{#each data.documents as d (d.id)}
				<p class="small">
					<a href="/files/{d.id}" target="_blank" rel="noopener">{labels[d.kind]}</a><br /><span
						class="tiny muted">{d.fileName}</span
					>
				</p>
			{:else}
				<p class="small muted">None.</p>
			{/each}
		</section>
		<section class="panel">
			<h3>Imports</h3>
			{#each data.imports as i (i.id)}
				<p class="small">
					<strong>{i.fileName}</strong><br /><span class="tiny muted"
						>{IMPORT_KIND[i.kind]} · {IMPORT_STATUS[i.status].label} · {formatDateTime(
							i.createdAt
						)}</span
					>
				</p>
			{:else}
				<p class="small muted">None.</p>
			{/each}
		</section>
		<TeamSupportPanel members={data.team} canReset={data.staff.isAdmin} />
		{#if data.staff.isAdmin}
			<section class="panel">
				{#if m.status === 'suspended'}
					<h3>Reinstate</h3>
					<form method="post" action="?/reinstate" class="stack" style="--gap: 10px">
						<div class="field">
							<label for="r-reason">Reason (sent to the manufacturer)</label><textarea
								id="r-reason"
								name="reason"
								required
								minlength="3"></textarea>
						</div>
						<button class="btn btn-small">Reinstate</button>
					</form>
				{:else if !['pending', 'info_requested', 'rejected'].includes(m.status)}
					<h3>Suspend</h3>
					<p class="small muted">
						{m.status === 'live'
							? 'Suspension stops Valid results: checks show "can\'t be confirmed right now".'
							: "They aren't live, so the public sees none of their records either way. They can still fix their data, but it can't go live until they're reinstated."}
					</p>
					<form method="post" action="?/suspend" class="stack" style="--gap: 10px">
						<div class="field">
							<label for="s-reason">Reason (sent to the manufacturer)</label><textarea
								id="s-reason"
								name="reason"
								required
								minlength="3"></textarea>
						</div>
						<button
							class="btn btn-danger btn-small"
							use:confirmFirst={`Suspend ${m.companyName}? ${m.status === 'live' ? 'Checks of its packs show "can\'t be confirmed right now" until it\'s reinstated.' : 'It is emailed the reason.'}`}
							>Suspend manufacturer</button
						>
					</form>
				{/if}
			</section>
			<details class="panel">
				<summary><strong>Correct company details</strong></summary>
				<form method="post" action="?/details" class="stack" style="--gap: 10px; margin-top: 12px">
					{#each data.detailFields as f (f.key)}
						<div class="field">
							<label for="d-{f.key}">{f.label}</label>
							<input id="d-{f.key}" name={f.key} value={m[f.key] ?? ''} />
						</div>
					{/each}
					<div class="field">
						<label for="d-reason">Reason (recorded in the audit trail)</label>
						<input id="d-reason" name="reason" required minlength="3" />
					</div>
					<p class="help">The contact email is the admin's sign-in, so it can't be changed here.</p>
					<button class="btn btn-small">Save details</button>
				</form>
			</details>
		{/if}
	</aside>
</div>
