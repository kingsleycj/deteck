<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/ui/status.ts';
	import { formatDate } from '@deteck/core/messages/en.ts';
	import { lagosToday } from '@deteck/core/dates.ts';

	let { data, form }: PageProps = $props();
	const b = $derived(data.row.batch);
	const isAdmin = $derived(data.staff.isAdmin);

	const SOURCE: Record<string, string> = {
		manufacturer_import: 'Manufacturer upload',
		staff_import: 'DETECK upload',
		manufacturer_api: 'Manufacturer API',
		business_receipt: 'Receipt confirmed by business',
		staff_correction: 'DETECK correction'
	};
	const STATE: Record<string, { label: string; chip: string }> = {
		current: { label: 'Current', chip: 'chip-ok' },
		replaced: { label: 'Replaced', chip: 'chip-warn' },
		cancelled: { label: 'Cancelled', chip: 'chip-bad' },
		correction: { label: 'Cancels a record', chip: '' }
	};
	const today = lagosToday();
</script>

<svelte:head><title>Batch {b.lot} · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">
			<a href="/console/drugs">Drugs</a> /
			<a href="/console/drugs/{data.row.productId}">{data.row.drug}</a> / Batch {b.lot}
		</p>
		<h1>Batch <span class="mono">{b.lot}</span></h1>
		<p class="small muted">
			{data.row.drug} · GTIN <span class="mono">{data.row.gtin}</span> · expires {formatDate(
				b.expiryDate
			)}
		</p>
	</div>
	{#if b.status !== 'active'}<span class="chip chip-bad">{b.status}</span>{/if}
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<p class="notice small">
	Corrections never delete anything. Serials and supply chain records are cancelled or replaced by a
	new record, every change needs a reason, and the manufacturer is told by email and webhook.
	{#if !isAdmin}Only DETECK admins can make corrections.{/if}
</p>

<div class="grid-2">
	<section class="panel stack" style="--gap: 12px">
		<h2>Batch details</h2>
		{#if isAdmin}
			<form method="post" action="?/batch" class="form-grid">
				<div class="field">
					<label for="lot">Lot</label>
					<input id="lot" name="lot" value={b.lot} required maxlength="20" class="mono" />
				</div>
				<div class="field">
					<label for="quantity">Quantity (optional)</label>
					<input
						id="quantity"
						name="quantity"
						inputmode="numeric"
						value={b.quantity ?? ''}
						pattern="\d*"
					/>
				</div>
				<div class="field">
					<label for="manufactureDate">Manufacture date</label>
					<input
						id="manufactureDate"
						name="manufactureDate"
						type="date"
						value={b.manufactureDate ?? ''}
					/>
				</div>
				<div class="field">
					<label for="expiryDate">Expiry date</label>
					<input id="expiryDate" name="expiryDate" type="date" value={b.expiryDate} required />
				</div>
				<div class="field span-2">
					<label for="b-reason">Reason (sent to the manufacturer)</label>
					<textarea
						id="b-reason"
						name="reason"
						required
						minlength="3"
						placeholder="For example: expiry was uploaded as 2027 but the pack says 2028"
					></textarea>
				</div>
				<div class="span-2"><button class="btn btn-primary">Save correction</button></div>
			</form>
		{:else}
			<dl class="small">
				<dt>Made</dt>
				<dd>{formatDate(b.manufactureDate)}</dd>
				<dt>Expires</dt>
				<dd>{formatDate(b.expiryDate)}</dd>
				<dt>Quantity</dt>
				<dd>{b.quantity ?? '—'}</dd>
			</dl>
		{/if}
	</section>

	<section class="panel stack" style="--gap: 12px">
		<h2>Void a serial</h2>
		<p class="small muted">
			For a serial sent by mistake (for example, a pack that was never released). Checks of it then
			show "Unrecognised", as if it had never been sent.
		</p>
		{#if isAdmin}
			<form method="post" action="?/voidSerial" class="stack" style="--gap: 10px">
				<div class="field">
					<label for="serial">Serial, as printed on the pack</label>
					<input id="serial" name="serial" class="mono" required autocomplete="off" />
				</div>
				<div class="field">
					<label for="v-reason">Reason (sent to the manufacturer)</label>
					<textarea id="v-reason" name="reason" required minlength="3"></textarea>
				</div>
				<div><button class="btn btn-small btn-danger">Void serial</button></div>
			</form>
		{/if}
		<h3>Voided serials in this batch</h3>
		{#each data.voided as v (v.packId)}
			<div class="small">
				<strong>Pack #{v.packId}</strong> · {formatDateTime(v.voidedAt)}{v.by
					? ` by ${v.by}`
					: ''}<br /><span class="muted">"{v.reason}"</span>
				{#if isAdmin}
					<details style="margin-top: 4px">
						<summary class="small">Restore</summary>
						<form
							method="post"
							action="?/restoreSerial"
							class="stack"
							style="--gap: 8px; margin-top: 6px"
						>
							<input type="hidden" name="packId" value={v.packId} />
							<input
								name="reason"
								class="input"
								required
								minlength="3"
								placeholder="Why it should check again"
								aria-label="Reason for restoring"
							/>
							<div><button class="btn btn-small">Restore serial</button></div>
						</form>
					</details>
				{/if}
			</div>
		{:else}
			<p class="small muted">
				None. (Serials are stored only as codes we can't read back, so voided packs show by number.)
			</p>
		{/each}
	</section>
</div>

<section class="stack" style="--gap: 12px; margin-top: 24px">
	<h2>Supply chain records</h2>
	<p class="small muted">
		Newest first. "Replaced" and "Cancelled" records stay here for the audit trail but journeys no
		longer show them.
	</p>
	<div class="table-wrap">
		<table class="data">
			<thead
				><tr
					><th>Record</th><th>Date</th><th>From → to</th><th>Covers</th><th>Source</th><th>State</th
					>{#if isAdmin}<th>Correct</th>{/if}</tr
				></thead
			>
			<tbody>
				{#each data.records as r (r.id)}
					<tr>
						<td class="mono"
							>{r.id}{#if r.supersedesId}<span class="sub">corrects {r.supersedesId}</span>{/if}</td
						>
						<td>{formatDate(r.eventDate)}</td>
						<td
							>{r.fromName ?? 'Manufacturer'} →
							<strong>{r.toName}</strong>{#if r.eventType === 'received'}
								<span class="sub">confirmed received</span>{/if}</td
						>
						<td>{r.level === 'pack' ? `Pack #${r.packId}` : 'Whole batch'}</td>
						<td>{SOURCE[r.source] ?? r.source}</td>
						<td><span class="chip {STATE[r.state].chip}">{STATE[r.state].label}</span></td>
						{#if isAdmin}
							<td>
								{#if r.state === 'current'}
									<details>
										<summary class="small">Correct or cancel</summary>
										<form
											method="post"
											action="?/replaceRecord"
											class="stack"
											style="--gap: 8px; margin-top: 8px; min-width: 280px"
										>
											<input type="hidden" name="eventId" value={r.id} />
											<label class="label" for="from-{r.id}">From</label>
											<select id="from-{r.id}" name="fromPartyId" class="input">
												<option value="" selected={!r.fromPartyId}>The manufacturer</option>
												{#each data.parties as p (p.id)}
													<option value={p.id} selected={p.id === r.fromPartyId}
														>{p.name}{p.state ? ` (${p.state})` : ''}</option
													>
												{/each}
											</select>
											<label class="label" for="to-{r.id}">To</label>
											<select id="to-{r.id}" name="toPartyId" class="input" required>
												{#each data.parties as p (p.id)}
													<option value={p.id} selected={p.id === r.toPartyId}
														>{p.name}{p.state ? ` (${p.state})` : ''}</option
													>
												{/each}
											</select>
											<label class="label" for="date-{r.id}">Date</label>
											<input
												id="date-{r.id}"
												name="eventDate"
												type="date"
												class="input"
												value={r.eventDate}
												max={today}
												required
											/>
											<input
												name="reason"
												class="input"
												required
												minlength="3"
												placeholder="Reason (sent to the manufacturer)"
												aria-label="Reason"
											/>
											<div><button class="btn btn-small">Save corrected record</button></div>
										</form>
										<form
											method="post"
											action="?/voidRecord"
											class="stack"
											style="--gap: 8px; margin-top: 12px"
										>
											<input type="hidden" name="eventId" value={r.id} />
											<input
												name="reason"
												class="input"
												required
												minlength="3"
												placeholder="Why this record is wrong"
												aria-label="Reason for cancelling"
											/>
											<div>
												<button class="btn btn-small btn-danger">Cancel this record</button>
											</div>
										</form>
									</details>
								{/if}
							</td>
						{/if}
					</tr>
				{:else}
					<tr><td colspan={isAdmin ? 7 : 6} class="muted">No supply chain records yet.</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
