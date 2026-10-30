<script lang="ts">
	import { confirmFirst } from '#lib/ui/confirm.ts';
	import { MAX_PROBLEM_ROWS } from '@deteck/core/imports/fields.ts';
	import type { PageProps } from './$types';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { countOf, formatDateTime, formatNumber, IMPORT_KIND } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const job = $derived(data.job);
	const c = $derived(job.counts as Record<string, number>);
	const running = $derived(job.status === 'validating' || job.status === 'committing');
	const step = $derived(job.status === 'uploaded' || job.status === 'failed' ? 2 : 3);
	const sampleFor = (header: string) => {
		const i = job.headers.indexOf(header);
		return i < 0
			? ''
			: job.sample
					.map((r) => r[i])
					.filter(Boolean)
					.slice(0, 2)
					.join(' · ');
	};
	const detail = $derived(
		job.kind === 'products'
			? [
					`${formatNumber(c.created)} new`,
					`${formatNumber(c.updated)} updated`,
					...(c.pendingReview
						? [
								c.pendingReview === 1
									? '1 new drug waits for DETECK review before people can check it'
									: `${formatNumber(c.pendingReview)} new drugs wait for DETECK review before people can check them`
							]
						: [])
				]
			: job.kind === 'batches_serials'
				? [
						countOf(c.serialsAdded, 'serial', 'serials'),
						countOf(c.batchesCreated, 'new batch', 'new batches')
					]
				: [
						countOf(c.packEvents, 'pack record', 'pack records'),
						countOf(c.batchEvents, 'batch record', 'batch records'),
						countOf(c.newBusinesses, 'new business', 'new businesses')
					]
	);
</script>

{#snippet problemCap()}
	{#if c.problems > MAX_PROBLEM_ROWS}<span class="small muted"
			>The download has the first {formatNumber(MAX_PROBLEM_ROWS)} of {formatNumber(c.problems)} problem
			rows. Fix those, upload again, and the rest will show.</span
		>{/if}
{/snippet}

<svelte:head>
	<title>{job.fileName} · Import · DETECK</title>
	{#if running}<meta http-equiv="refresh" content="2" />{/if}
</svelte:head>

{#snippet problemTable()}
	{#if job.problems.length}
		<section class="stack" style="--gap: 10px">
			<h2>
				Problem rows{c.problems > job.problems.length
					? ` (first ${job.problems.length} of ${formatNumber(c.problems)})`
					: ''}
			</h2>
			<div class="table-wrap">
				<table class="data">
					<thead><tr><th>Row</th><th>Problem</th><th>Values in that row</th></tr></thead>
					<tbody>
						{#each job.problems as p, i (i)}
							<tr
								><td class="mono">{p.row}</td><td>{p.problem}</td><td class="mono small"
									>{p.values}</td
								></tr
							>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
{/snippet}

<div class="page-title">
	<div>
		<p class="crumbs">
			<a href="/workspace">Overview</a> / <a href="/workspace/import">Import</a> / {job.fileName}
		</p>
		<h1>{job.status === 'committed' ? 'Import results' : `Import ${data.company.name}'s data`}</h1>
		<p class="small muted">
			{IMPORT_KIND[job.kind]} · {countOf(c.rows, 'row', 'rows')} · uploaded {formatDateTime(
				job.createdAt
			)}
		</p>
	</div>
	<ol class="tabs" aria-label="Steps" style="list-style: none; padding: 0">
		<li><span class="chip chip-ok">✓ Upload</span></li>
		<li>
			<span class="chip {step === 2 ? 'chip-progress' : 'chip-ok'}"
				>{step > 2 ? '✓' : '2'} Match columns</span
			>
		</li>
		<li><span class="chip {step === 3 ? 'chip-progress' : ''}">3 Review and import</span></li>
	</ol>
</div>

{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
{#if data.again}<p class="notice">
		You uploaded this file before, so this is that import. Change the file if you meant to add new
		rows.
	</p>{/if}
{#if job.error}<p class="notice notice-error" role="alert">{job.error}</p>{/if}

{#if job.status === 'uploaded' || job.status === 'failed'}
	<form method="post" action="?/map" class="panel">
		<div class="page-title">
			<h2>Match their columns to DETECK fields</h2>
			<span class="small muted"
				>Every row is recorded under <strong>{data.company.name}</strong></span
			>
		</div>
		<div class="table-wrap">
			<table class="data">
				<thead
					><tr><th>DETECK field</th><th>Column in your file</th><th>Sample values</th></tr></thead
				>
				<tbody>
					{#each data.fields as f (f.key)}
						<tr>
							<td
								><label for="field-{f.key}"
									><strong>{f.label}</strong>{#if f.required}
										<span class="error-text">*</span>{/if}</label
								>{#if f.help}<span class="sub">{f.help}</span>{/if}</td
							>
							<td>
								<select
									id="field-{f.key}"
									name="field:{f.key}"
									class="input"
									style="min-height: 40px"
								>
									<option value="">Not in this file</option>
									{#each job.headers as h, i (i)}<option
											value={h}
											selected={job.mapping[f.key] === h}>{h}</option
										>{/each}
								</select>
							</td>
							<td class="mono small">{job.mapping[f.key] ? sampleFor(job.mapping[f.key]) : ''}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.missing.length}<p class="notice small">
				Still to match: {data.missing.join(', ')}.
			</p>{/if}
		<div class="row" style="justify-content: space-between">
			<button
				class="btn btn-small"
				formaction="?/cancel"
				use:confirmFirst={'Cancel this import? Nothing from this file is saved.'}
				>Cancel import</button
			>
			<button class="btn btn-primary">Check the file</button>
		</div>
	</form>
{:else if running}
	<section class="panel" style="align-items: center; text-align: center">
		<div style="width: 120px"><Mascot mood="thinking" /></div>
		<h2>
			{job.status === 'validating'
				? 'Checking every row…'
				: `Importing ${countOf(c.ready, 'row', 'rows')}…`}
		</h2>
		<p class="muted">
			{countOf(c.progressRows ?? 0, 'row', 'rows')} done so far. You can leave this page; the import keeps
			going.
		</p>
		<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
	</section>
{:else if job.status === 'ready'}
	<section class="stats">
		<div class="stat" style="background: var(--lime-tint)">
			<span class="k">Ready to import</span><span class="n">{formatNumber(c.ready)}</span><span
				class="d">{detail.join(' · ')}</span
			>
		</div>
		<div class="stat" style="background: var(--peach)">
			<span class="k">Problems found</span><span class="n">{formatNumber(c.problems)}</span><span
				class="d">Held back, not imported</span
			>
		</div>
		{#if c.sequentialSerials}<div class="stat">
				<span class="k">Warning</span><span class="d"
					>{countOf(c.sequentialSerials, 'serial follows', 'serials follow')} another in sequence. Random
					serials are harder to guess.</span
				>
			</div>{/if}
		{#if c.expiryOnThe1st}<div class="stat">
				<span class="k">Warning</span><span class="d"
					>Every new batch expires on the 1st of a month. If the packs show only a month (EXP
					04/2028), put the month alone (2028-04) and DETECK uses the last day of that month.</span
				>
			</div>{/if}
		{#if c.shortNumericSerials}<div class="stat">
				<span class="k">Warning</span><span class="d"
					>{formatNumber(c.shortNumericSerials)}
					{c.shortNumericSerials === 1 ? 'serial made of digits is' : 'serials made of digits are'} shorter
					than the others. If the file went through Excel, it may have dropped their leading zeros: format
					the serial column as Text and export again.</span
				>
			</div>{/if}
		{#if c.sharedSerials}<div class="stat">
				<span class="k">Warning</span><span class="d"
					>{formatNumber(c.sharedSerials)}
					{c.sharedSerials === 1 ? 'serial is' : 'serials are'} also used by another manufacturer. They
					can be imported, but someone typing one in will be asked which batch is on the pack.</span
				>
			</div>{/if}
		{#if c.duplicatesSkipped}<div class="stat">
				<span class="k">Already recorded</span><span class="d"
					>{countOf(c.duplicatesSkipped, 'record was', 'records were')} already on DETECK and will be
					skipped.</span
				>
			</div>{/if}
	</section>
	<div class="row" style="justify-content: space-between">
		<form method="post" action="?/cancel">
			<button
				class="btn btn-small"
				use:confirmFirst={'Cancel this import? Nothing from this file is saved.'}
				>Cancel import</button
			>
		</form>
		<div class="row">
			{#if job.hasProblems}<a class="btn btn-small" href="/workspace/import/{job.id}/problems"
					>Download problem rows</a
				>{/if}{@render problemCap()}
			<form method="post" action="?/map">
				{#each Object.entries(job.mapping) as [k, v] (k)}<input
						type="hidden"
						name="field:{k}"
						value={v}
					/>{/each}
				<button class="btn btn-small">Check again</button>
			</form>
			<form method="post" action="?/commit">
				<button class="btn btn-primary" disabled={!c.ready}
					>Import {countOf(c.ready, 'row', 'rows')}</button
				>
			</form>
		</div>
	</div>
	<p class="help">
		Importing saves every ready row at once, or nothing if something goes wrong. Problem rows are
		never imported: fix them in your file and upload it again.
	</p>
	{@render problemTable()}
{:else if job.status === 'committed'}
	<section class="panel" style="border: 2px solid var(--lime-deep)">
		<p class="tiny" style="font-weight: 800; letter-spacing: 0.06em; color: var(--lime-ink)">
			SUCCESS
		</p>
		<h2>{detail[0]} imported</h2>
		<p>Recorded under <strong>{data.company.name}</strong> · {detail.slice(1).join(' · ')}</p>
		<p>
			{countOf(c.problems, 'problem row', 'problem rows')} held back · logged in the audit trail · {formatDateTime(
				job.committedAt
			)}
		</p>
		<div class="row">
			{#if job.hasProblems}<a class="btn btn-small" href="/workspace/import/{job.id}/problems"
					>Download problem rows</a
				>{/if}{@render problemCap()}
			{#if job.kind === 'products'}<a class="btn btn-primary btn-small" href="/workspace/import"
					>Import batches and serials next</a
				>{/if}
			{#if job.kind === 'batches_serials'}<a
					class="btn btn-primary btn-small"
					href="/workspace/import">Import supply chain next</a
				>{/if}
			{#if job.kind === 'distribution'}<a class="btn btn-primary btn-small" href="/workspace/review"
					>Check readiness to go live</a
				>{/if}
		</div>
	</section>
	{@render problemTable()}
{:else}
	<p class="notice notice-info">
		This import was cancelled. <a href="/workspace/import">Upload a file</a>
	</p>
{/if}
