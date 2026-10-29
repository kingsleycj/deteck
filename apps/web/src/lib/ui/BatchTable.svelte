<script lang="ts">
	import { formatNumber } from './status.ts';
	import { formatDate, formatMonth } from '@deteck/core/messages/en.ts';
	import { lagosToday } from '@deteck/core/dates.ts';

	interface Batch {
		id: string;
		lot: string;
		manufacture_date: string | null;
		expiry_date: string;
		status: string;
		status_reason: string | null;
		status_source: string | null;
		status_effective_at: string | null;
		serials: number;
		events: number;
	}
	let {
		batches,
		canChangeStatus = false,
		canReactivate = canChangeStatus,
		batchHref
	}: {
		batches: Batch[];
		canChangeStatus?: boolean;
		canReactivate?: boolean;
		/** When set, each lot links to its batch page (DETECK's corrections). */
		batchHref?: (id: string) => string;
	} = $props();
	const today = lagosToday();
</script>

<div class="table-wrap">
	<table class="data">
		<thead
			><tr
				><th>Batch</th><th>Made</th><th>Expires</th><th>Serials</th><th>Supply chain records</th><th
					>Status</th
				></tr
			></thead
		>
		<tbody>
			{#each batches as b (b.id)}
				<tr>
					<td class="mono"
						>{#if batchHref}<a href={batchHref(b.id)}><strong>{b.lot}</strong></a>{:else}<strong
								>{b.lot}</strong
							>{/if}</td
					>
					<td>{formatMonth(b.manufacture_date)}</td>
					<td
						>{formatMonth(b.expiry_date)}{#if b.expiry_date < today}
							<span class="chip chip-warn">Expired</span>{/if}</td
					>
					<td>{formatNumber(b.serials)}</td>
					<td>{b.events ? formatNumber(b.events) : 'None'}</td>
					<td>
						{#if b.status === 'active'}
							<span class="chip chip-ok">Active</span>
						{:else}
							<span class="chip chip-bad">{b.status === 'recalled' ? 'Recalled' : 'Withdrawn'}</span
							>
							<span class="sub"
								>{b.status_source} · {formatDate(b.status_effective_at)} · {b.status_reason}</span
							>
						{/if}
						{#if canChangeStatus && b.status !== 'active' && !canReactivate}
							<p class="small muted" style="margin-top: 6px">Only DETECK can reactivate it.</p>
						{:else if canChangeStatus}
							<details style="margin-top: 6px">
								<summary class="small"
									>{b.status === 'active' ? 'Recall or withdraw' : 'Reactivate'}</summary
								>
								<form
									method="post"
									action="?/batchStatus"
									class="stack"
									style="--gap: 8px; margin-top: 8px; min-width: 260px"
								>
									<input type="hidden" name="batchId" value={b.id} />
									{#if b.status === 'active'}
										<select
											name="status"
											class="input"
											style="min-height: 40px"
											aria-label="New status"
										>
											<option value="recalled">Recalled</option>
											<option value="withdrawn">Withdrawn</option>
										</select>
										<input
											name="source"
											class="input"
											style="min-height: 40px"
											placeholder="Issued by (e.g. NAFDAC)"
											required
										/>
										<input
											name="effectiveAt"
											type="date"
											class="input"
											style="min-height: 40px"
											aria-label="Effective date"
										/>
									{:else}
										<input type="hidden" name="status" value="active" />
										<input type="hidden" name="source" value="" />
									{/if}
									<input
										name="reason"
										class="input"
										style="min-height: 40px"
										placeholder="Reason (shown to the public for recalls)"
										required
										minlength="3"
									/>
									<button class="btn btn-small {b.status === 'active' ? 'btn-danger' : ''}"
										>{b.status === 'active' ? 'Save recall' : 'Reactivate batch'}</button
									>
								</form>
							</details>
						{/if}
					</td>
				</tr>
			{:else}
				<tr><td colspan="6" class="muted">No batches yet. Import batches and serials.</td></tr>
			{/each}
		</tbody>
	</table>
</div>
