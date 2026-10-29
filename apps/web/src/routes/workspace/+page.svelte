<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import {
		IMPORT_KIND,
		IMPORT_STATUS,
		MANUFACTURER_STATUS,
		PACKAGING_STATUS,
		formatDateTime,
		formatNumber,
		quoted
	} from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const status = $derived(data.company.status);
	const s = $derived(MANUFACTURER_STATUS[status]);
	const stepIndex = $derived(
		{
			pending: 1,
			info_requested: 1,
			rejected: 1,
			approved: 2,
			changes_requested: 2,
			in_review: 3,
			live: 4,
			suspended: 4
		}[status] ?? 1
	);
</script>

<svelte:head><title>Overview · {data.company.name} · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Manufacturer workspace</p>
		<h1>
			{data.company.name}
			<span class="chip {s.chip}" style="vertical-align: middle">{s.label}</span>
		</h1>
		<p class="small muted">{[data.company.town, data.company.state].filter(Boolean).join(', ')}</p>
	</div>
	{#if ['approved', 'changes_requested', 'live'].includes(status)}
		<a href="/workspace/import" class="btn btn-primary">Import data</a>
	{/if}
</div>

{#if status === 'pending'}
	<div class="notice notice-info">
		<strong>Your application is with a DETECK reviewer.</strong> We check your company details and
		NAFDAC certificate. You'll get an email with the decision. Meanwhile you can check your
		<a href="/workspace/company">company details and documents</a>.
	</div>
{:else if status === 'info_requested'}
	<div class="notice">
		<strong>DETECK needs more information.</strong> Reviewer's note: {quoted(
			data.company.statusReason
		)}
		{#if data.access.isAdmin}Upload any documents they asked for and send your application back on
			<a href="/workspace/company">Company and documents</a>. To change company details, add a note
			there saying what to change.{:else}Your company admin can answer it on Company and documents.{/if}
	</div>
{:else if status === 'rejected'}
	<div class="notice notice-error">
		<strong>Your application wasn't approved.</strong> Reason: {quoted(data.company.statusReason)} If
		you think this is a mistake, contact DETECK{data.contactEmail
			? ` at ${data.contactEmail}`
			: ''}. DETECK can reopen the application.
	</div>
{:else if status === 'changes_requested'}
	<div class="notice">
		<strong>Changes requested before going live.</strong> Reviewer's note: "{data.company
			.statusReason}"
	</div>
{:else if status === 'in_review'}
	<div class="notice notice-info">
		<strong>Your data is being reviewed.</strong> A DETECK reviewer is checking it before your records
		go live.
	</div>
{:else if status === 'suspended'}
	<div class="notice notice-error">
		<strong>Your records are paused.</strong> Checks of your serials show "can't be confirmed right
		now". Reason: {quoted(data.company.statusReason)} You can still import and correct data while paused,
		and none of it is public. When it's fixed, contact DETECK{data.contactEmail
			? ` at ${data.contactEmail}`
			: ''} to check it and reinstate your records.
	</div>
{:else if status === 'approved'}
	<div class="notice notice-info">
		<strong>Approved.</strong> Import your data, add packaging photos if you can, then submit it for a
		go-live review.
	</div>
{:else if status === 'live'}
	<div class="notice notice-ok">
		<strong>Your records are live.</strong> Anyone who checks one of your serials gets a real answer.
		New imports go live straight away.
	</div>
{/if}

<section class="stats" aria-label="Your data">
	<div class="stat">
		<span class="k">Drugs</span><span class="n">{formatNumber(data.counts.products)}</span>
	</div>
	<div class="stat">
		<span class="k">Batches</span><span class="n">{formatNumber(data.counts.batches)}</span>
	</div>
	<div class="stat">
		<span class="k">Serials on record</span><span class="n"
			>{formatNumber(data.counts.serials)}</span
		>
	</div>
	<div class="stat">
		<span class="k">Supply chain records</span><span class="n"
			>{formatNumber(data.counts.events)}</span
		>
	</div>
	<div class="stat dark">
		<span class="k">Checks of your drugs</span><span class="n">{formatNumber(data.checks)}</span
		><span class="d">Last 30 days</span>
	</div>
</section>

<div class="two-col">
	<section class="stack" style="--gap: 14px">
		<h2>Drugs</h2>
		{#if data.products.length === 0}
			<div class="empty">
				<div style="width: 110px"><Mascot mood="thinking" /></div>
				<h3>No drugs yet</h3>
				<p class="muted small">
					Import in this order: drugs first, because batches, serials and supply chain records point
					to them.
				</p>
				{#if ['approved', 'changes_requested', 'live'].includes(status)}<a
						href="/workspace/import"
						class="btn btn-primary">Import your data</a
					>{/if}
			</div>
		{:else}
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
									><a href="/workspace/products/{p.id}"
										><strong>{p.brandName} {p.strength}</strong></a
									><span class="sub">{p.dosageForm} · {p.packSize}</span></td
								>
								<td class="mono">{p.nafdacRegNo}</td>
								<td>{formatNumber(p.batches)}</td>
								<td>{formatNumber(p.serials)}</td>
								<td>
									{#if p.batches > 0 && p.batchesWithoutSupply === 0}Complete
									{:else if p.batchesWithoutSupply > 0}<span style="color: var(--peach-ink)"
											>{p.batchesWithoutSupply}
											{p.batchesWithoutSupply === 1 ? 'batch' : 'batches'} missing</span
										>
									{:else}—{/if}
								</td>
								<td
									><a
										href="/workspace/packaging/{p.id}"
										class="chip {PACKAGING_STATUS[p.packaging].chip}"
										>{PACKAGING_STATUS[p.packaging].label}</a
									></td
								>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>

	<aside class="stack" style="--gap: 14px">
		<!-- The go-live steps matter until the records are live; after that they would only confuse. -->
		{#if !['live', 'suspended'].includes(status)}<section class="panel panel-dark">
				<h3 style="color: var(--lime); font-size: 13px; letter-spacing: 0.06em">HOW YOU GO LIVE</h3>
				<ol class="steps">
					<li class:done={stepIndex > 1} class:current={stepIndex === 1}>
						<span
							><strong>Get approved</strong><br /><span class="muted small"
								>Company details and NAFDAC certificate</span
							></span
						>
					</li>
					<li class:done={stepIndex > 2} class:current={stepIndex === 2}>
						<span
							><strong>Import your data</strong><br /><span class="muted small"
								>Drugs, batches, serials, supply chain</span
							></span
						>
					</li>
					<li class:done={stepIndex > 2} class:current={stepIndex === 2}>
						<span
							><strong>Add packaging photos</strong><br /><span class="muted small"
								>Optional: for the packaging check (beta)</span
							></span
						>
					</li>
					<li class:done={stepIndex > 3} class:current={stepIndex === 3}>
						<span
							><strong>Review and go live</strong><br /><span class="muted small"
								>A DETECK reviewer approves</span
							></span
						>
					</li>
				</ol>
				{#if ['approved', 'changes_requested'].includes(status)}
					<a href="/workspace/review" class="btn btn-primary btn-small"
						>Check readiness and submit</a
					>
				{/if}
			</section>{/if}
		<section class="panel">
			<h3>Recent imports</h3>
			{#if data.imports.length === 0}<p class="small muted">No imports yet.</p>{/if}
			{#each data.imports as i (i.id)}
				<a href="/workspace/import/{i.id}" style="text-decoration: none">
					<p class="small"><strong>{i.fileName}</strong></p>
					<p class="tiny muted">
						{IMPORT_KIND[i.kind]} ·
						<span class="chip {IMPORT_STATUS[i.status].chip}">{IMPORT_STATUS[i.status].label}</span>
						· {formatDateTime(i.createdAt)}
					</p>
				</a>
			{/each}
		</section>
	</aside>
</div>
