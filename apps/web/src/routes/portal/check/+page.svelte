<script lang="ts">
	import Upload from '#lib/ui/Upload.svelte';
	import type { PageProps } from './$types';
	import { formatMonth } from '#lib/ui/status.ts';
	import { lagosToday } from '@deteck/core/dates.ts';

	let { data, form }: PageProps = $props();
	const today = lagosToday();
	type Line = {
		input: string;
		problem: string | null;
		code: string | null;
		flags: string[];
		drug: string | null;
		maker: string | null;
		lot: string | null;
		expiry: string | null;
		heldElsewhere: string | null;
		alreadyHere: boolean;
	};
	const checked: Line[] = $derived((form && 'checked' in form && form.checked) || []);
	const received = $derived(form && 'received' in form ? form.received : undefined);
	/** A pack whose batch or expiry differs from the record may carry a copied code. */
	const mismatched = (c: Line) =>
		c.flags.includes('LOT_MISMATCH') || c.flags.includes('EXPIRY_MISMATCH');
	const receivable = $derived(checked.filter((c) => c.code === 'VALID' && !mismatched(c)));
	/** Only clean packs start ticked; expired ones, or ones another pharmacy has, need a decision. */
	const clean = (c: Line) => c.flags.length === 0 && !c.heldElsewhere && !c.alreadyHere;
	const typed = $derived(form && 'typed' in form ? (form.typed ?? '') : '');
	const left = $derived(form && 'left' in form ? (form.left ?? 0) : 0);
	const label = (c: Line) => {
		if (c.problem) return { text: c.problem, chip: 'chip-bad' };
		if (c.code === 'VALID' && c.flags.includes('EXPIRED'))
			return { text: 'Valid · expired', chip: 'chip-warn' };
		if (c.code === 'VALID' && mismatched(c))
			return { text: "Pack doesn't match the record: don't accept it", chip: 'chip-bad' };
		if (c.code === 'VALID') return { text: 'Valid', chip: 'chip-ok' };
		if (c.code === 'RECALLED') return { text: 'Recalled or withdrawn', chip: 'chip-bad' };
		if (c.code === 'NEEDS_BATCH')
			return { text: 'On two products: check by batch on the checker', chip: 'chip-warn' };
		if (c.code === 'CANT_CONFIRM') return { text: "Can't confirm", chip: 'chip-warn' };
		if (c.code === 'NOT_COVERED') return { text: 'Not on DETECK yet', chip: '' };
		return { text: 'Unrecognised', chip: 'chip-bad' };
	};
</script>

<svelte:head><title>Check a delivery · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/portal">Overview</a> / Check a delivery</p>
		<h1>Check a delivery</h1>
	</div>
</div>

{#if form && 'message' in form}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
{#if received}
	<p class="toast">
		Recorded {received.recorded} pack{received.recorded === 1 ? '' : 's'} as received.{received
			.skipped.length
			? ` ${received.skipped.length} skipped (already recorded, recalled or not on record).`
			: ''}
	</p>
{/if}

{#if data.business.status !== 'approved'}
	<p class="notice notice-info">
		{data.business.status === 'suspended'
			? 'Your account is paused, so deliveries can’t be checked for now. The overview page says why.'
			: 'You can check deliveries once DETECK approves your business. The overview page shows where your application is.'}
	</p>
{:else}<form
		method="post"
		action="?/check"
		enctype="multipart/form-data"
		class="panel stack"
		style="--gap: 12px"
	>
		<div class="field">
			<label for="codes">Serials or scanned codes, one per line</label>
			<textarea
				id="codes"
				name="codes"
				rows="8"
				placeholder="7K4M9QX2TB8D&#10;(01)09506000990019(21)H2R5W8C1N6PZ"
				defaultValue={typed}></textarea>
		</div>
		<Upload
			id="file"
			name="file"
			title="Or upload a CSV"
			hint="Serials or codes in the first column"
			accept=".csv,text/csv,text/plain"
		/>
		<p class="help">
			Up to 500 at a time. A barcode scanner that types into the box works too: scan each pack, one
			per line. Each check is counted, without any personal data.
		</p>
		<button class="btn btn-primary">Check them</button>
	</form>{/if}

{#if left > 0}<p class="notice" role="status">
		Only the first 500 were checked. Check the other {left} in another round.
	</p>{/if}
{#if checked.length}
	<form method="post" action="?/receive" class="stack" style="--gap: 12px">
		<div class="table-wrap">
			<table class="data">
				<thead
					><tr
						><th>Receive</th><th>Serial or code</th><th>Result</th><th>Drug</th><th>Batch</th><th
							>Expires</th
						></tr
					></thead
				>
				<tbody>
					{#each checked as c, i (i)}
						{@const l = label(c)}
						<tr>
							<td
								>{#if c.code === 'VALID' && !mismatched(c)}<input
										type="checkbox"
										name="code"
										value={c.input}
										checked={clean(c)}
										aria-label="Received {c.input}"
									/>{/if}</td
							>
							<td class="mono small">{c.input}</td>
							<td
								><span class="chip {l.chip}">{l.text}</span>{#if c.alreadyHere}<span class="sub"
										>Already recorded with you</span
									>{:else if c.heldElsewhere}<span class="sub"
										>Already recorded with {c.heldElsewhere}</span
									>{/if}</td
							>
							<td
								>{c.drug ?? '—'}{#if c.maker}<span class="sub">{c.maker}</span>{/if}</td
							>
							<td class="mono">{c.lot ?? '—'}</td>
							<td>{c.expiry ? formatMonth(c.expiry) : '—'}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if receivable.length}
			<section class="panel form-grid">
				<div class="field">
					<label for="receivedOn">Received on</label>
					<input id="receivedOn" name="receivedOn" type="date" value={today} max={today} />
				</div>
				<div class="field">
					<label for="supplier">From (supplier name, optional)</label>
					<input id="supplier" name="supplier" maxlength="160" />
				</div>
				<p class="help span-2">
					Confirming adds your business, "Verified by DETECK", to these packs' journeys. Only Valid
					packs can be confirmed; expired packs and packs already recorded with another pharmacy
					aren't ticked for you, so look at them first. {data.business.name} is shown by name and town
					only.
				</p>
				<div class="span-2">
					{#if data.access.onBehalf}
						<p class="notice small">
							Only {data.business.name} can confirm what it received, so DETECK staff can't.
						</p>
					{:else}
						<button class="btn btn-primary">Confirm the ticked packs as received</button>
					{/if}
				</div>
			</section>
		{/if}
	</form>
{/if}
