<script lang="ts">
	import type { PageProps } from './$types';
	import Checklist from '#lib/ui/Checklist.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const m = $derived(data.m);
	const spotItem = $derived({
		key: 'spot',
		label: data.spot.sampled
			? `Spot check: ${data.spot.found} of ${data.spot.sampled} random serials from ${data.spot.fileName} are on record`
			: data.spot.fileDeleted
				? `Spot check: ${data.spot.fileName} can't be read any more (import files are kept for 90 days)`
				: 'Spot check: no serial file to sample yet',
		state: (data.spot.sampled && data.spot.found === data.spot.sampled ? 'ok' : 'warn') as
			'ok' | 'warn' | 'bad',
		detail:
			data.spot.sampled && data.spot.found < data.spot.sampled
				? 'Some sampled serials are not on record, although the import accepted them. Check the import report and the serial counts before approving.'
				: undefined
	});
	const sharedItem = $derived({
		key: 'shared',
		label: data.shared
			? `${data.shared.toLocaleString('en-NG')} ${data.shared === 1 ? 'serial is' : 'serials are'} also used by another manufacturer`
			: 'No serials shared with another manufacturer',
		state: (data.shared ? 'warn' : 'ok') as 'ok' | 'warn' | 'bad',
		detail: data.shared
			? "Allowed, but check they weren't copied from another company's file. Typed checks of these serials ask which batch is on the pack."
			: undefined
	});
</script>

<svelte:head><title>Review {m.companyName} · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">
			<a href="/console/manufacturers">Manufacturers</a> /
			<a href="/console/manufacturers/{m.id}">{m.companyName}</a> / Review
		</p>
		<h1>Review before going live</h1>
	</div>
	{#if data.submittedBy}<span class="chip chip-progress"
			>Submitted by {data.submittedBy} · {formatDateTime(m.submittedForReviewAt)}</span
		>{/if}
</div>

{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}

{#if m.status !== 'in_review'}
	<p class="notice notice-info">{m.companyName} is not waiting for a go-live review.</p>
{:else}
	<div class="two-col">
		<section class="panel">
			<h2>Checklist</h2>
			<Checklist items={[...data.checklist.items, spotItem, sharedItem]} />
			<p class="help">
				Warnings don't block going live. People will see only the manufacturer's record (no supply
				chain steps), or "Packaging check not available yet" for those drugs.
			</p>
		</section>
		<aside class="stack" style="--gap: 14px">
			<form method="post" action="?/decide" class="panel">
				<div class="field">
					<label for="note">Note for {m.companyName} (needed to send back)</label>
					<textarea id="note" name="note" maxlength="1000">{form?.note ?? ''}</textarea>
				</div>
				<button
					class="btn btn-primary btn-block"
					name="decision"
					value="approve"
					disabled={data.checklist.blocking}>Approve and go live</button
				>
				<button class="btn btn-block" name="decision" value="send_back">Send back with note</button>
			</form>
			<div class="hero hero-info" style="padding: 14px 14px 0">
				<div class="hero-row" style="margin-top: 0">
					<div class="hero-mascot" style="flex-basis: 64px; width: 64px">
						<Mascot mood="wink" />
					</div>
					<p class="bubble bubble-left small">
						Only a different person from the one who prepared the data can approve it.
					</p>
				</div>
			</div>
		</aside>
	</div>
{/if}
