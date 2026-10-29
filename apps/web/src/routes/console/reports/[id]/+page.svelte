<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDate, formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const r = $derived(data.report);
</script>

<svelte:head><title>Report · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">
			<a href="/console/reports">Reports</a> / {r.productDescription ?? 'Report'}
		</p>
		<h1>{r.productDescription ?? 'Medicine not named'}</h1>
		<p class="small muted">
			Received {formatDateTime(r.createdAt)} · check said <span class="mono">{r.resultCode}</span>
			{#if data.manufacturerName}· {data.manufacturerName}{/if}
		</p>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
{#if data.otherReportsOfSerial}<p class="notice">
		{data.otherReportsOfSerial}
		{data.otherReportsOfSerial === 1 ? 'other report mentions' : 'other reports mention'} the same serial
		(reference <span class="mono">{r.serialRef}</span>). Check Unusual checks too.
	</p>{/if}

<div class="two-col">
	<section class="panel stack" style="--gap: 12px">
		<h2>What they told us</h2>
		<dl class="facts">
			<div>
				<dt>Bought at</dt>
				<dd>{r.placeName ?? '—'}</dd>
			</div>
			<div>
				<dt>Where</dt>
				<dd>{[r.town, r.state].filter(Boolean).join(', ') || '—'}</dd>
			</div>
			<div>
				<dt>When</dt>
				<dd>{r.boughtOn ? formatDate(r.boughtOn) : '—'}</dd>
			</div>
			<div>
				<dt>May share with NAFDAC and the manufacturer</dt>
				<dd>{r.shareConsent ? 'Yes' : 'No'}</dd>
			</div>
		</dl>
		{#if r.details}<p class="notice">"{r.details}"</p>{/if}
		<h3>Photos</h3>
		{#if r.photoKeys.length}
			<div class="row" style="--gap: 10px; flex-wrap: wrap">
				{#each r.photoKeys as _key, i (i)}
					<a href="/console/reports/{r.id}/photo/{i}" target="_blank" rel="noopener"
						><img
							src="/console/reports/{r.id}/photo/{i}"
							alt="Photo {i + 1} from the report"
							style="width: 180px; height: 140px; object-fit: cover; border-radius: 10px"
						/></a
					>
				{/each}
			</div>
		{:else}
			<p class="small muted">No photos.</p>
		{/if}
		<h3>Contact (DETECK only)</h3>
		{#if r.contactName || r.contactEmail || r.contactPhone}
			<p>
				{r.contactName ?? ''}
				{#if r.contactEmail}<a href="mailto:{r.contactEmail}">{r.contactEmail}</a>{/if}
				{r.contactPhone ?? ''}
			</p>
		{:else}
			<p class="small muted">They didn't leave contact details.</p>
		{/if}
	</section>

	<form method="post" class="panel stack" style="--gap: 12px">
		<h2>Follow-up</h2>
		<p class="small muted">
			{data.assignee ? `Assigned to ${data.assignee}.` : 'Not assigned yet.'}
			{#if r.closedAt}Closed {formatDateTime(r.closedAt)}.{/if}
		</p>
		<div class="field">
			<label for="status">Status</label>
			<select id="status" name="status">
				<option value="new" selected={r.status === 'new'}>New</option>
				<option value="investigating" selected={r.status === 'investigating'}>Investigating</option>
				<option value="referred" selected={r.status === 'referred'}>Referred to NAFDAC</option>
				<option value="closed" selected={r.status === 'closed'}>Closed</option>
			</select>
		</div>
		<div class="field">
			<label for="resolution">Findings and actions (needed to close)</label>
			<textarea
				id="resolution"
				name="resolution"
				maxlength="2000"
				aria-describedby="resolution-help">{r.resolution ?? ''}</textarea
			>
			<p class="help" id="resolution-help">
				{!data.manufacturerName
					? "Only DETECK staff see this: the report doesn't name a drug on DETECK, so no manufacturer sees it."
					: r.shareConsent
						? 'Shared word for word with the manufacturer, because the person agreed to share this report. Keep internal notes out of it.'
						: 'Only DETECK staff see this: the person did not agree to share the report with the manufacturer.'}
			</p>
		</div>
		<label class="row small" style="--gap: 8px"
			><input type="checkbox" name="assignToMe" /> Assign to me</label
		>
		<button class="btn btn-primary">Save</button>
		<p class="help">
			NAFDAC's pharmacovigilance and counterfeit desk takes reports by email and phone. Record the
			reference they give you in the findings.
		</p>
	</form>
</div>
