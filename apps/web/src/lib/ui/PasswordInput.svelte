<script lang="ts">
	/**
	 * A password box with a Show/Hide button inside it, so people can check what they typed. The
	 * button appears once the page's script runs (it does nothing without it), and the password is
	 * hidden again when the form is sent, so the browser offers to save it as a password.
	 */
	import type { HTMLInputAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	let { id, ...rest }: { id: string } & Omit<HTMLInputAttributes, 'id' | 'type'> = $props();
	let input: HTMLInputElement;
	let ready = $state(false);
	let shown = $state(false);
	let toggled = $state(false);

	$effect(() => {
		ready = true;
		const form = input.form;
		if (!form) return;
		const hide = () => (shown = false);
		form.addEventListener('submit', hide);
		return () => form.removeEventListener('submit', hide);
	});
</script>

<div class="password-input">
	<input
		bind:this={input}
		{id}
		type={shown ? 'text' : 'password'}
		autocapitalize="off"
		spellcheck="false"
		{...rest}
	/>
	{#if ready}
		<button
			type="button"
			class="password-toggle"
			aria-controls={id}
			aria-label={shown ? 'Hide password' : 'Show password'}
			onclick={() => {
				shown = !shown;
				toggled = true;
			}}
		>
			<Icon name={shown ? 'eye-off' : 'eye'} size={18} />
			<span>{shown ? 'Hide' : 'Show'}</span>
		</button>
	{/if}
</div>
<p class="visually-hidden" aria-live="polite">
	{toggled ? (shown ? 'Your password is visible.' : 'Your password is hidden.') : ''}
</p>

<style>
	.password-input {
		position: relative;
	}
	/* Room for the button, kept before it appears so nothing moves. */
	.password-input input {
		padding-right: 96px;
	}
	/* Edge's own reveal button would sit next to ours. */
	.password-input input::-ms-reveal {
		display: none;
	}
	.password-toggle {
		position: absolute;
		top: 50%;
		right: 6px;
		transform: translateY(-50%);
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 40px;
		padding: 0 12px;
		border: 0;
		border-radius: 999px;
		background: transparent;
		color: var(--ink);
		font: 700 13px var(--font);
		cursor: pointer;
	}
	.password-toggle:hover {
		background: var(--grey-150);
	}
	.password-toggle:focus-visible {
		outline: 2px solid var(--ink);
		outline-offset: 1px;
	}
</style>
