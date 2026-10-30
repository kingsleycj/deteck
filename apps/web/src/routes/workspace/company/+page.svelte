<script lang="ts">
	import Upload from '#lib/ui/Upload.svelte';
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const labels: Record<string, string> = {
		nafdac_certificate: 'NAFDAC certificate',
		data_sharing_agreement: 'Signed data-sharing agreement',
		other: 'Other document'
	};
	const d = $derived(data.details);
	const missingAgreement = $derived(
		!data.documents.some((x) => x.kind === 'data_sharing_agreement')
	);
</script>

<svelte:head><title>Company and documents · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Company</p>
		<h1>Company and documents</h1>
	</div>
</div>

{#if form && 'uploaded' in form}<p class="toast">
		Document uploaded. It's saved to your company's documents.
	</p>{/if}
{#if form && 'resubmitted' in form}<p class="toast">
		Sent back to DETECK. A reviewer will look at it again.
	</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

{#if data.company.status === 'info_requested'}
	<section class="panel" style="border-color: var(--peach)">
		<h2>DETECK asked for more information</h2>
		<p class="notice">"{data.company.statusReason}"</p>
		<p class="small muted">
			Upload anything they asked for below, then send your application back with a short note.
		</p>
		{#if data.access.isAdmin}
			<form method="post" action="?/resubmit" class="stack" style="--gap: 10px">
				<div class="field">
					<label for="note">Note for the reviewer</label><textarea
						id="note"
						name="note"
						maxlength="1000"></textarea>
				</div>
				<button class="btn btn-primary">Send for review again</button>
			</form>
		{/if}
	</section>
{/if}

<div class="two-col">
	<section class="panel">
		<h2>Company details</h2>
		<dl class="facts">
			<div class="wide">
				<dt>Manufacturer name</dt>
				<dd>{d.companyName}</dd>
			</div>
			<div class="wide">
				<dt>Address</dt>
				<dd>{d.address}</dd>
			</div>
			<div>
				<dt>State</dt>
				<dd>{d.state}</dd>
			</div>
			<div>
				<dt>Factory town</dt>
				<dd>{d.factoryTown ?? '—'}</dd>
			</div>
			<div>
				<dt>NAFDAC company reg. no.</dt>
				<dd class="mono">{d.nafdacCompanyReg}</dd>
			</div>
			<div>
				<dt>CAC reg. no.</dt>
				<dd class="mono">{d.cacRc ?? '—'}</dd>
			</div>
			<div>
				<dt>Contact</dt>
				<dd>{d.contactName}</dd>
			</div>
			<div>
				<dt>Email</dt>
				<dd>{d.contactEmail}</dd>
			</div>
		</dl>
		<p class="help">
			To change company details, contact DETECK, or say what to change in your note when you answer
			an information request. DETECK checks changes against your NAFDAC certificate.
		</p>
	</section>

	<aside class="stack" style="--gap: 14px">
		<section class="panel">
			<h3>Documents</h3>
			{#if missingAgreement}<p class="notice small">
					The signed data-sharing agreement is needed before you import serials or supply chain
					records.
				</p>{/if}
			{#if data.agreementTemplate}<p class="small">
					<a href="/files/site/agreement_template">Download the data-sharing agreement</a> to sign.
				</p>{/if}
			{#each data.documents as doc (doc.id)}
				<p class="small">
					<a href="/files/{doc.id}" target="_blank" rel="noopener"
						><strong>{labels[doc.kind]}</strong></a
					><br /><span class="tiny muted">{doc.fileName} · {formatDateTime(doc.createdAt)}</span>
				</p>
			{:else}
				<p class="small muted">No documents yet.</p>
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
						<label for="kind">Type of document</label>
						<select id="kind" name="kind">
							<option value="data_sharing_agreement" selected={missingAgreement}
								>Signed data-sharing agreement</option
							>
							<option value="nafdac_certificate">NAFDAC certificate</option>
							<option value="other">Other document</option>
						</select>
					</div>
					<Upload
						id="document-file"
						name="file"
						title="The file"
						hint="PDF, JPG or PNG, under 10 MB"
						accept="application/pdf,image/jpeg,image/png"
						required
					/>
					<button class="btn btn-small">Upload</button>
				</form>
			{/if}
		</section>
	</aside>
</div>
