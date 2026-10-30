<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDate, formatDateTime } from '#lib/ui/status.ts';

	let { data }: PageProps = $props();
	const r = $derived(data.report);
</script>

<svelte:head><title>Report · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/workspace/reports">Reports</a> / {r.productDescription}</p>
		<h1>{r.productDescription}</h1>
		<p class="small muted">
			Received {formatDateTime(r.createdAt)} · the check said
			<span class="mono">{r.resultCode}</span>
		</p>
	</div>
</div>

<section class="panel stack" style="--gap: 12px; max-width: 760px">
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
			<dt>Photos</dt>
			<dd>{r.photoKeys.length}</dd>
		</div>
	</dl>
	{#if r.details}<p class="notice">"{r.details}"</p>{/if}
	{#if r.resolution}<p class="small"><strong>DETECK's findings:</strong> {r.resolution}</p>{/if}
	<p class="help">
		The person's contact details stay with DETECK. If you need the photos for an investigation, ask
		DETECK, quoting this report.
	</p>
</section>
