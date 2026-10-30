<script lang="ts">
	/**
	 * A search box with its button on the right, inside the same outline. Used on its own form
	 * (GET), or inside a bigger filter form with `button` off.
	 */
	import Icon from './Icon.svelte';

	let {
		name = 'q',
		value = '',
		label,
		placeholder = '',
		id = 'search',
		button = 'Search',
		wide = false
	}: {
		name?: string;
		value?: string | null;
		/** Read by screen readers; the placeholder shows what can be searched. */
		label: string;
		placeholder?: string;
		id?: string;
		/** The button's text, or false for no button (a filter form's own button submits). */
		button?: string | false;
		wide?: boolean;
	} = $props();
</script>

<div class="search-field" class:wide>
	<span class="search-icon"><Icon name="search" size={18} color="var(--text-3)" /></span>
	<input {id} type="search" {name} value={value ?? ''} {placeholder} aria-label={label} />
	{#if button}<button class="btn btn-primary btn-small">{button}</button>{/if}
</div>

<style>
	.search-field {
		display: flex;
		align-items: center;
		gap: 6px;
		width: 100%;
		max-width: 420px;
		min-height: 48px;
		padding: 4px 4px 4px 14px;
		border: 1.5px solid var(--line);
		border-radius: 999px;
		background: var(--white);
	}
	.search-field.wide {
		max-width: 560px;
	}
	@media (max-width: 700px) {
		.search-field,
		.search-field.wide {
			max-width: none;
		}
	}
	.search-field:focus-within {
		border-color: var(--ink);
		box-shadow: 0 0 0 3px var(--peri-tint);
	}
	.search-icon {
		display: inline-flex;
	}
	input {
		flex: 1;
		min-width: 0;
		border: 0;
		outline: none;
		background: none;
		font: 15px var(--font);
		color: var(--ink);
		padding: 8px 4px;
	}
	input::-webkit-search-cancel-button {
		cursor: pointer;
	}
	button {
		flex: 0 0 auto;
	}
</style>
