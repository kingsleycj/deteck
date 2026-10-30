<script lang="ts">
	import { confirmFirst } from '#lib/ui/confirm.ts';
	import TeamSupportPanel from '#lib/ui/TeamSupportPanel.svelte';
	import type { PageProps } from './$types';
	import {
		BUSINESS_STATUS,
		DOCUMENT_KIND,
		PARTY_ROLE,
		formatDate,
		formatDateTime,
		quoted
	} from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const b = $derived(data.b);
	const s = $derived(BUSINESS_STATUS[b.status]);
	const decidable = $derived(['pending', 'info_requested', 'rejected'].includes(b.status));
</script>

<svelte:head><title>{b.name} · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">
			<a href="/console/business-accounts">Pharmacies and distributors</a> / {b.name}
		</p>
		<h1>{b.name} <span class="chip {s.chip}" style="vertical-align: middle">{s.label}</span></h1>
		<p class="small muted">Registered {formatDateTime(b.createdAt)}</p>
	</div>
	<a class="btn btn-small" href="/portal?as={b.id}">Open their portal</a>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
{#if b.reviewNote}<p class="notice notice-info small">Their note: "{b.reviewNote}"</p>{/if}
{#if b.statusReason && !decidable}<p class="small muted">
		Last decision reason: {quoted(b.statusReason)}
	</p>{/if}

<div class="two-col">
	<section class="panel stack" style="--gap: 12px">
		<h2>Submitted details</h2>
		<dl class="facts">
			<div>
				<dt>Type</dt>
				<dd>{PARTY_ROLE[b.role] ?? b.role}</dd>
			</div>
			<div>
				<dt>PCN premises licence</dt>
				<dd class="mono">{b.pcnLicence}</dd>
			</div>
			<div class="wide">
				<dt>Address</dt>
				<dd>{b.address}, {[b.town, b.state].filter(Boolean).join(', ')}</dd>
			</div>
			<div>
				<dt>CAC reg. no.</dt>
				<dd>{b.cacRc ?? '—'}</dd>
			</div>
			<div>
				<dt>GLN</dt>
				<dd>{b.gln ?? '—'}</dd>
			</div>
			<div class="wide">
				<dt>Contact</dt>
				<dd>{b.contactName} · {b.contactEmail} · {b.contactPhone ?? '—'}</dd>
			</div>
		</dl>
		<h3>Documents</h3>
		{#each data.documents as d (d.id)}
			<p class="small">
				<a href="/files/{d.id}" target="_blank" rel="noopener">{DOCUMENT_KIND[d.kind] ?? d.kind}</a>
				· {d.fileName}
			</p>
		{:else}
			<p class="small muted">None.</p>
		{/each}
		<p class="help">Check the licence on the Pharmacists Council of Nigeria premises register.</p>
		<h3>Recently confirmed received</h3>
		{#each data.receipts as r (r.id)}
			<p class="small">{r.drug} · <span class="mono">{r.lot}</span> · {formatDate(r.eventDate)}</p>
		{:else}
			<p class="small muted">Nothing yet.</p>
		{/each}
	</section>
	<aside class="stack" style="--gap: 14px">
		{#if decidable}
			<form method="post" action="?/decide" class="panel stack" style="--gap: 12px">
				<h2>Decision</h2>
				{#if b.status === 'info_requested'}
					<div class="notice stack" style="--gap: 6px">
						<p><strong>Waiting for {b.name}.</strong></p>
						<p class="small">
							You asked for more information{data.askedAt
								? ` on ${formatDateTime(data.askedAt)}`
								: ''}: {quoted(b.statusReason)}
						</p>
						<p class="small">
							They were emailed and can send the application back from their portal. It then returns
							to the queue. You can still decide now.
						</p>
					</div>
				{:else if b.status === 'rejected'}
					<p class="small muted">
						This application was rejected{b.statusReason ? `: ${quoted(b.statusReason)}` : '.'} A new
						decision reopens it.
					</p>
				{/if}
				<fieldset class="stack" style="--gap: 8px; border: 0; padding: 0; margin: 0">
					<legend class="label">Outcome</legend>
					<label class="option"
						><input type="radio" name="decision" value="approve" required /> Approve</label
					>
					<label class="option"
						><input type="radio" name="decision" value="request_info" />
						{b.status === 'info_requested'
							? 'Ask for something else'
							: 'Request more information'}</label
					>
					<label class="option"><input type="radio" name="decision" value="reject" /> Reject</label>
				</fieldset>
				<div class="field">
					<label for="reason">Reason (required, sent to the business)</label>
					<textarea
						id="reason"
						name="reason"
						required
						minlength="3"
						defaultValue={form && 'reason' in form ? (form.reason ?? '') : ''}></textarea>
				</div>
				<button class="btn btn-primary">Save decision</button>
			</form>
		{/if}
		<TeamSupportPanel members={data.team} canReset={data.staff.isAdmin} />
		{#if data.staff.isAdmin && (b.status === 'approved' || b.status === 'suspended')}
			<form
				method="post"
				action={b.status === 'approved' ? '?/suspend' : '?/reinstate'}
				class="panel stack"
				style="--gap: 10px"
			>
				<h3>{b.status === 'approved' ? 'Suspend' : 'Reinstate'}</h3>
				<div class="field">
					<label for="s-reason">Reason</label>
					<textarea id="s-reason" name="reason" required minlength="3"></textarea>
				</div>
				<button
					class="btn btn-small {b.status === 'approved' ? 'btn-danger' : ''}"
					use:confirmFirst={b.status === 'approved'
						? `Suspend ${b.name}? It can't check or confirm deliveries until it's reinstated.`
						: `Reinstate ${b.name}?`}
					>{b.status === 'approved' ? 'Suspend business' : 'Reinstate'}</button
				>
			</form>
		{/if}
	</aside>
</div>
