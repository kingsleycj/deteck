<script lang="ts">
	/**
	 * The upload box from the designs: a dashed periwinkle area that says what to add, and turns
	 * into a solid box with a tick, the file's name and its size once a file is chosen.
	 *
	 * The real file input fills the whole box, so clicking anywhere or dropping a file on it works
	 * in every browser. Public pages run without JavaScript: there the browser's own "Choose file"
	 * control stays visible under the text, so people still see what they picked.
	 */
	import { onMount } from 'svelte';

	let {
		id,
		name,
		title,
		hint = 'Drop a file here, or choose one',
		accept,
		multiple = false,
		required = false,
		capture,
		size = 'wide',
		error,
		describedby,
		status,
		phase,
		preview,
		onchange
	}: {
		id: string;
		name: string;
		/** What to add, e.g. "NAFDAC certificate" or "Back of the pack". */
		title: string;
		/** Shown until a file is chosen: the formats and size limit. */
		hint?: string;
		accept?: string;
		multiple?: boolean;
		required?: boolean;
		capture?: 'environment' | 'user';
		/** "wide" for forms; "tile" for photo slots side by side. */
		size?: 'wide' | 'tile';
		error?: string | null;
		describedby?: string;
		/** A page's own line about the file (e.g. "Checking the photo…"), instead of name and size. */
		status?: string | null;
		/** A page's own state for the box, e.g. a photo it has checked. */
		phase?: 'empty' | 'done' | 'busy' | 'error';
		/** A small picture of the chosen photo, shown in place of the tick. */
		preview?: string | null;
		onchange?: (event: Event & { currentTarget: HTMLInputElement }) => void;
	} = $props();

	let enhanced = $state(false);
	let dragging = $state(false);
	let picked = $state<{ name: string; bytes: number; count: number } | null>(null);

	onMount(() => (enhanced = true));

	function describe(event: Event & { currentTarget: HTMLInputElement }) {
		const files = [...(event.currentTarget.files ?? [])];
		picked = files.length
			? {
					name: files.length === 1 ? files[0].name : `${files.length} files`,
					bytes: files.reduce((n, f) => n + f.size, 0),
					count: files.length
				}
			: null;
		dragging = false;
		onchange?.(event);
	}

	const kb = (bytes: number) =>
		bytes >= 1024 * 1024
			? `${(bytes / 1024 / 1024).toFixed(1)} MB`
			: `${Math.ceil(bytes / 1024)} KB`;
	const shown = $derived(phase ?? (error ? 'error' : picked ? 'done' : 'empty'));
	const line = $derived(status ?? (picked ? `${picked.name} · ${kb(picked.bytes)}` : hint));
	const errorId = $derived(error ? `${id}-upload-error` : undefined);
</script>

<div
	class="upload {size} {shown}"
	class:enhanced
	class:dragging
	ondragenter={() => (dragging = true)}
	ondragleave={() => (dragging = false)}
	ondrop={() => (dragging = false)}
	role="presentation"
>
	<span class="mark" class:has-preview={preview} aria-hidden="true">
		{#if preview}
			<img src={preview} alt="" />
		{:else if shown === 'done'}
			<svg viewBox="0 0 24 24" width="18" height="18"
				><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#0B0B0F" stroke-width="2.6" /></svg
			>
		{:else if shown === 'busy'}
			<span class="spinner"></span>
		{:else if shown === 'error'}
			<svg viewBox="0 0 24 24" width="18" height="18"
				><path d="M12 7v6M12 17h.01" fill="none" stroke="#B42318" stroke-width="2.6" /></svg
			>
		{:else}
			<svg viewBox="0 0 24 24" width="22" height="22"
				><path
					d="M12 16V5M7 9.5L12 4.5l5 5M5 19.5h14"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/></svg
			>
		{/if}
	</span>
	<label class="title" for={id}>{title}</label>
	<span class="line" aria-live="polite">{line}</span>
	{#if error}<span class="error" id={errorId}>{error}</span>{/if}
	<input
		{id}
		{name}
		type="file"
		{accept}
		{multiple}
		{required}
		{capture}
		aria-describedby={[describedby, errorId].filter(Boolean).join(' ') || undefined}
		aria-invalid={error ? 'true' : undefined}
		onchange={describe}
	/>
</div>

<style>
	.upload {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 22px 18px;
		min-height: 132px;
		text-align: center;
		border-radius: var(--radius-m);
		border: 1.5px dashed var(--peri);
		background: #f5f8ff;
		color: var(--peri-ink);
		transition:
			border-color 0.15s,
			background-color 0.15s;
	}
	.upload.tile {
		min-height: 220px;
		height: 100%;
	}
	.upload.dragging,
	.upload.enhanced:hover {
		border-color: var(--peri-ink);
		background: var(--peri-tint);
	}
	.upload:focus-within {
		outline: 3px solid var(--peri-ink);
		outline-offset: 2px;
	}
	.upload.done {
		border: 2px solid var(--ink);
		background: var(--white);
	}
	.upload.error {
		border: 1.5px solid var(--red);
		background: var(--red-tint);
	}
	.upload.busy {
		border-style: solid;
		background: var(--white);
	}
	.mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
	}
	.done .mark {
		border-radius: 50%;
		background: var(--lime);
	}
	.mark.has-preview {
		width: 72px;
		height: 72px;
		border-radius: 14px;
		overflow: hidden;
		background: var(--grey-100);
	}
	.mark img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.error .mark {
		border-radius: 50%;
		background: var(--white);
	}
	.title {
		font-weight: 700;
		font-size: 15px;
		color: var(--ink);
	}
	.line {
		font-size: 13px;
		color: var(--text-3);
		overflow-wrap: anywhere;
	}
	.error {
		font-size: 13px;
		font-weight: 600;
		color: var(--red);
	}
	/* Without JavaScript the browser's own control stays visible, so the chosen file shows. */
	input {
		margin-top: 6px;
		max-width: 100%;
		font-size: 13px;
		color: var(--text-2);
	}
	/* With JavaScript the whole box is the input: click anywhere or drop a file. */
	.enhanced input {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		margin: 0;
		opacity: 0;
		cursor: pointer;
	}
	.spinner {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 2.5px solid var(--line);
		border-top-color: var(--ink);
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spinner {
			animation: none;
		}
	}
</style>
