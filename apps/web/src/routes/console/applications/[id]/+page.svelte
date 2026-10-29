<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateTime, MANUFACTURER_STATUS } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const m = $derived(data.m);
	const s = $derived(MANUFACTURER_STATUS[m.status]);
	const decidable = $derived(['pending', 'info_requested', 'rejected'].includes(m.status));
	const labels: Record<string, string> = {
		nafdac_certificate: 'NAFDAC certificate',
		data_sharing_agreement: 'Signed data-sharing agreement',
		other: 'Other document'
	};
	const done: Record<string, string> = {
		approve: 'Approved. The manufacturer has been emailed.',
		reject: 'Rejected. The manufacturer has been emailed.',
		request_info: 'Information requested. The manufacturer has been emailed.'
	};
</script>

<svelte:head><title>{m.companyName} · Application · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/console/applications">Applications</a> / {m.companyName}</p>
		<h1>
			{m.companyName} <span class="chip {s.chip}" style="vertical-align: middle">{s.label}</span>
		</h1>
		<p class="small muted">Registered {formatDateTime(m.createdAt)}</p>
	</div>
	<a class="btn btn-small" href="/console/manufacturers/{m.id}">Open manufacturer</a>
</div>

{#if form && 'decided' in form && form.decided}<p class="toast">{done[form.decided]}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<div class="two-col">
	<div class="stack" style="--gap: 16px">
		<section class="panel">
			<h2>Submitted details</h2>
			<dl class="facts">
				<div class="wide">
					<dt>Address</dt>
					<dd>{m.address}</dd>
				</div>
				<div>
					<dt>State</dt>
					<dd>{m.state}</dd>
				</div>
				<div>
					<dt>Factory town</dt>
					<dd>{m.factoryTown ?? '—'}</dd>
				</div>
				<div>
					<dt>NAFDAC company reg. no.</dt>
					<dd class="mono">{m.nafdacCompanyReg}</dd>
				</div>
				<div>
					<dt>CAC reg. no.</dt>
					<dd class="mono">{m.cacRc ?? '—'}</dd>
				</div>
				<div>
					<dt>Contact</dt>
					<dd>{m.contactName}</dd>
				</div>
				<div>
					<dt>Contact email</dt>
					<dd>{m.contactEmail}</dd>
				</div>
				<div>
					<dt>Phone</dt>
					<dd>{m.contactPhone ?? '—'}</dd>
				</div>
				<div>
					<dt>Team members</dt>
					<dd>{data.team.length}</dd>
				</div>
			</dl>
			{#if m.reviewNote}<p class="notice notice-info small">
					Manufacturer's note: "{m.reviewNote}"
				</p>{/if}
			{#if m.statusReason}<p class="small muted">Last decision reason: "{m.statusReason}"</p>{/if}
		</section>
		<section class="panel">
			<h2>Documents</h2>
			{#each data.documents as d (d.id)}
				<p>
					<a href="/files/{d.id}" target="_blank" rel="noopener">{labels[d.kind]}</a>
					<span class="small muted">· {d.fileName} · {formatDateTime(d.createdAt)}</span>
				</p>
			{:else}
				<p class="muted small">No documents uploaded.</p>
			{/each}
			<p class="help">Check the certificate against NAFDAC's Green Book before approving.</p>
		</section>
	</div>

	<aside class="panel">
		<h2>Decision</h2>
		{#if m.status === 'rejected'}<p class="small muted">
				This application was rejected. A new decision reopens it.
			</p>{/if}
		{#if decidable}
			<form method="post" action="?/decide" class="stack" style="--gap: 12px">
				<fieldset class="stack" style="--gap: 8px; border: 0; padding: 0; margin: 0">
					<legend class="label">Outcome</legend>
					<label class="row" style="--gap: 8px"
						><input type="radio" name="decision" value="approve" required /> Approve: they can add data</label
					>
					<label class="row" style="--gap: 8px"
						><input type="radio" name="decision" value="request_info" /> Request more information</label
					>
					<label class="row" style="--gap: 8px"
						><input type="radio" name="decision" value="reject" /> Reject</label
					>
				</fieldset>
				<div class="field">
					<label for="reason">Reason (required, sent to the manufacturer)</label>
					<textarea id="reason" name="reason" required minlength="3" maxlength="1000"
						>{form && 'reason' in form ? form.reason : ''}</textarea
					>
				</div>
				<button class="btn btn-primary">Save decision</button>
				<p class="help">Every decision is recorded in the audit trail.</p>
			</form>
		{:else}
			<p class="muted small">
				This application is {s.label.toLowerCase()}. Manage it from the manufacturer page.
			</p>
		{/if}
	</aside>
</div>
