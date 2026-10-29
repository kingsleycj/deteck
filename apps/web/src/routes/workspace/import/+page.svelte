<script lang="ts">
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatDateTime, formatNumber, IMPORT_KIND, IMPORT_STATUS } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Import data · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace">Overview</a> / Import</p>
		<h1>Import {data.company.name}'s data</h1>
	</div>
</div>

{#if data.company.editBlocked}
	<p class="notice">{data.company.editBlocked}</p>
{:else}
	{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
	<div class="two-col">
		<form method="post" action="?/upload" enctype="multipart/form-data" class="panel">
			<h2>Upload a file</h2>
			<fieldset class="stack" style="--gap: 8px; border: 0; padding: 0; margin: 0">
				<legend class="label" style="margin-bottom: 8px">What's in this file?</legend>
				<label class="row" style="--gap: 8px"
					><input type="radio" name="kind" value="products" required /> Drugs (product list)</label
				>
				<label class="row" style="--gap: 8px"
					><input type="radio" name="kind" value="batches_serials" /> Batches and serial numbers</label
				>
				<label class="row" style="--gap: 8px"
					><input type="radio" name="kind" value="distribution" /> Supply chain records</label
				>
			</fieldset>
			<div class="file-drop" style="padding: 28px">
				<label for="import-file" class="visually-hidden">File to import</label>
				<input
					id="import-file"
					name="file"
					type="file"
					accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
					required
				/>
			</div>
			<p class="help">
				CSV or Excel (.xlsx), up to 50 MB, one sheet at a time. Import drugs first, then batches and
				serials, then supply chain records. The original file and its problem rows are kept for 90
				days, then deleted (the counts stay), because they contain your serials in full.
			</p>
			<button class="btn btn-primary">Upload and match columns</button>
		</form>

		<aside class="stack" style="--gap: 14px">
			<section class="panel">
				<h3>Templates</h3>
				<p class="small"><a href="/workspace/import/template/products">Drugs template.csv</a></p>
				<p class="small">
					<a href="/workspace/import/template/batches_serials">Batches and serials template.csv</a>
				</p>
				<p class="small">
					<a href="/workspace/import/template/distribution">Supply chain template.csv</a>
				</p>
				<p class="help">
					Your own format is fine too. You'll match the columns next. In Excel, format serial and
					GTIN columns as Text so leading zeros aren't lost.
				</p>
			</section>
			<section class="hero hero-info" style="padding: 14px 14px 0">
				<div class="hero-row" style="margin-top: 0">
					<div class="hero-mascot" style="flex-basis: 70px; width: 70px">
						<Mascot mood="wink" />
					</div>
					<p class="bubble bubble-left small">
						Every row is recorded under {data.company.name}, so I can tell people who made each
						pack.
					</p>
				</div>
			</section>
		</aside>
	</div>
{/if}

<section class="stack" style="--gap: 12px">
	<h2>Imports</h2>
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr><th>File</th><th>Contents</th><th>Status</th><th>Rows</th><th>Uploaded</th></tr></thead
			>
			<tbody>
				{#each data.imports as i (i.id)}
					<tr>
						<td><a href="/workspace/import/{i.id}"><strong>{i.fileName}</strong></a></td>
						<td>{IMPORT_KIND[i.kind]}</td>
						<td
							><span class="chip {IMPORT_STATUS[i.status].chip}"
								>{IMPORT_STATUS[i.status].label}</span
							></td
						>
						<td>{formatNumber(i.counts?.rows)}</td>
						<td>{formatDateTime(i.createdAt)}</td>
					</tr>
				{:else}
					<tr><td colspan="5" class="muted">No imports yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
