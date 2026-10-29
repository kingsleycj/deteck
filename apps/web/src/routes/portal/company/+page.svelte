<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const labels: Record<string, string> = {
		pcn_premises_licence: 'PCN premises licence',
		cac_certificate: 'CAC certificate',
		other: 'Other document'
	};
</script>

<svelte:head><title>Business and documents · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/portal">Overview</a> / Business</p>
		<h1>Business and documents</h1>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}

{#if data.business.status === 'info_requested' && data.access.isAdmin}
	<section class="panel" style="border-color: var(--peach)">
		<h2>DETECK asked for more information</h2>
		<p class="notice">"{data.business.statusReason}"</p>
		<form method="post" action="?/resubmit" class="stack" style="--gap: 10px">
			<div class="field">
				<label for="note">Note for the reviewer</label>
				<textarea id="note" name="note" maxlength="1000"></textarea>
			</div>
			<button class="btn btn-primary">Send for review again</button>
		</form>
	</section>
{/if}

<div class="two-col">
	<section class="panel">
		<h2>Details</h2>
		<dl class="facts">
			<div>
				<dt>Name</dt>
				<dd>{data.business.name}</dd>
			</div>
			<div>
				<dt>Type</dt>
				<dd>{data.business.roleLabel}</dd>
			</div>
			<div class="wide">
				<dt>Address</dt>
				<dd>{data.details.address}</dd>
			</div>
			<div>
				<dt>PCN premises licence</dt>
				<dd class="mono">{data.details.pcnLicence}</dd>
			</div>
			<div>
				<dt>CAC reg. no.</dt>
				<dd>{data.details.cacRc ?? '—'}</dd>
			</div>
			<div>
				<dt>GLN</dt>
				<dd>{data.details.gln ?? '—'}</dd>
			</div>
			<div>
				<dt>Contact</dt>
				<dd>{data.details.contactName} · {data.details.contactEmail}</dd>
			</div>
		</dl>
		<p class="help">
			To change these details, contact DETECK. Changes are checked against your licence.
		</p>
	</section>
	<aside class="panel stack" style="--gap: 10px">
		<h2>Documents</h2>
		{#each data.documents as d (d.id)}
			<p class="small">
				<a href="/files/{d.id}" target="_blank" rel="noopener">{labels[d.kind] ?? d.kind}</a>
				<span class="muted">· {d.fileName} · {formatDateTime(d.createdAt)}</span>
			</p>
		{/each}
		{#if data.access.isAdmin}
			<form
				method="post"
				action="?/upload"
				enctype="multipart/form-data"
				class="stack"
				style="--gap: 10px"
			>
				<div class="field">
					<label for="kind">Kind</label>
					<select id="kind" name="kind">
						<option value="pcn_premises_licence">PCN premises licence</option>
						<option value="cac_certificate">CAC certificate</option>
						<option value="other">Other document</option>
					</select>
				</div>
				<label for="doc-file" class="visually-hidden">Choose a file</label>
				<input
					id="doc-file"
					name="file"
					type="file"
					accept="application/pdf,image/jpeg,image/png"
					required
				/>
				<button class="btn btn-small">Upload</button>
			</form>
		{/if}
	</aside>
</div>
