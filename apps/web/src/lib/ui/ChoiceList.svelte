<script lang="ts">
	/**
	 * A group of checkboxes with a clear heading: each choice is a row with a normal-sized box, what
	 * it allows in plain words, and its technical name for developers (a scope or an event).
	 */
	let {
		name,
		legend,
		help,
		options,
		checked = 'all'
	}: {
		name: string;
		legend: string;
		help?: string;
		options: { value: string; label: string; code?: string }[];
		/** Which start ticked: all of them, or the values listed. */
		checked?: 'all' | string[];
	} = $props();
	const isChecked = (value: string) => checked === 'all' || checked.includes(value);
</script>

<fieldset class="choices">
	<legend>{legend}</legend>
	{#if help}<p class="choices-help">{help}</p>{/if}
	<div class="choices-grid">
		{#each options as o (o.value)}
			<label class="choice">
				<input type="checkbox" {name} value={o.value} checked={isChecked(o.value)} />
				<span class="choice-text">
					<span class="choice-label">{o.label}</span>
					{#if o.code}<code>{o.code}</code>{/if}
				</span>
			</label>
		{/each}
	</div>
</fieldset>

<style>
	.choices {
		border: 0;
		padding: 0;
		margin: 0;
		min-width: 0;
	}
	legend {
		padding: 0;
		font-family: var(--font-display);
		font-size: 16px;
		font-weight: 800;
		letter-spacing: -0.02em;
	}
	.choices-help {
		margin: 4px 0 0;
		font-size: 13px;
		color: var(--text-3);
	}
	.choices-grid {
		margin-top: 10px;
		display: grid;
		gap: 8px;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
	}
	.choice {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		border: 1px solid var(--line);
		border-radius: 12px;
		background: var(--white);
		cursor: pointer;
	}
	.choice:has(input:checked) {
		border-color: var(--ink);
		background: var(--lime-tint);
	}
	input {
		flex: 0 0 auto;
		width: 18px;
		height: 18px;
		min-height: 0;
		margin: 1px 0 0;
		accent-color: var(--ink);
	}
	.choice-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}
	.choice-label {
		font-size: 14px;
		font-weight: 600;
		line-height: 1.35;
	}
	code {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--text-3);
		overflow-wrap: anywhere;
	}
</style>
