<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { photoQuality, setInputFile, shrinkPhoto } from '#lib/client/images.ts';
	import { fmt } from '#lib/i18n.ts';

	let { data, form }: PageProps = $props();
	const t = $derived(data.t);
	const p = $derived(t.packaging);

	const sides = ['front', 'back', 'label'] as const;
	type Side = (typeof sides)[number];
	let status: Record<
		Side,
		{
			state: 'empty' | 'checking' | 'ok' | 'unchecked' | 'retake';
			preview?: string;
			message?: string;
		}
	> = $state({
		front: { state: 'empty' },
		back: { state: 'empty' },
		label: { state: 'empty' }
	});
	let sending = $state(false);
	const ready = $derived(sides.every((s) => status[s].state === 'ok'));

	async function chosen(side: Side, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		status[side] = { state: 'checking' };
		try {
			const small = await shrinkPhoto(file, { maxEdge: 1280, targetBytes: 250_000 });
			const q = await photoQuality(small);
			const preview = URL.createObjectURL(small);
			if (q.brightness < 45)
				status[side] = {
					state: 'retake',
					preview,
					message: p.tooDark
				};
			else if (q.brightness > 248)
				status[side] = {
					state: 'retake',
					preview,
					message: p.glare
				};
			else if (q.sharpness < 60)
				status[side] = {
					state: 'retake',
					preview,
					message: p.blurry
				};
			else status[side] = { state: 'ok', preview };
			setInputFile(input, small, `${side}.jpg`);
		} catch {
			// This phone couldn't read the photo; the server checks it when it's sent.
			status[side] = { state: 'unchecked' };
		}
	}
</script>

<svelte:head><title>{p.photosMetaTitle}</title></svelte:head>

<div class="shell shell-narrow">
	<header class="page-head">
		<a href="/r/{data.from}" class="back" aria-label={p.backAria}><Icon name="back" /></a>
		<span>{p.title}</span>
	</header>

	<p class="notice notice-ok small">
		{fmt(p.serialLine, { serial: data.serial, product: data.product, lot: data.lot })}
	</p>

	<div class="hero-row" style="margin-top: 0">
		<div class="hero-mascot" style="flex-basis: 70px; width: 70px">
			<Mascot mood={form?.message ? 'concerned' : 'wink'} />
		</div>
		<p class="bubble bubble-left">
			{form?.message ?? p.intro}
		</p>
	</div>

	<form
		method="post"
		enctype="multipart/form-data"
		class="stack"
		style="--gap: 12px"
		use:enhance={() => {
			sending = true;
			// If the server asks for a retake, keep all three photos in the form.
			return async ({ result, update }) => {
				sending = false;
				await update({ reset: result.type === 'redirect' });
			};
		}}
	>
		{#each sides as side (side)}
			<div
				class="card row"
				style="--gap: 12px; flex-wrap: nowrap"
				class:retake={status[side].state === 'retake' || form?.side === side}
			>
				<div class="thumb">
					{#if status[side].preview}<img src={status[side].preview} alt="" />{:else}<Icon
							name="camera"
							size={24}
							color="#6A6F7E"
						/>{/if}
				</div>
				<div style="flex: 1 1 auto">
					<p style="font-weight: 700">{p.sides[side]}</p>
					<p class="small muted">{p.notes[side]}</p>
					{#if status[side].state === 'ok'}<p
							class="small"
							style="color: var(--lime-ink); font-weight: 700"
						>
							{p.clear}
						</p>{/if}
					{#if status[side].state === 'checking'}<p class="small muted">{p.checkingPhoto}</p>{/if}
					{#if status[side].state === 'unchecked'}<p class="small muted">
							{p.unchecked}
						</p>{/if}
					{#if status[side].message}<p class="error-text small">{status[side].message}</p>{/if}
				</div>
				<label class="btn btn-small" for="photo-{side}"
					>{status[side].state === 'empty' ? p.takePhoto : p.retake}</label
				>
				<input
					id="photo-{side}"
					name={side}
					type="file"
					accept="image/*"
					capture="environment"
					class="visually-hidden"
					required
					onchange={(e) => chosen(side, e)}
				/>
			</div>
		{/each}

		<p class="help">
			{p.photoRules}. {p.sizeNote}
			{p.provider}
		</p>
		<label class="row small" style="--gap: 8px; align-items: flex-start"
			><input type="checkbox" name="retain" style="margin-top: 3px" />
			<span>{p.retain}</span></label
		>
		<button
			class="btn btn-primary btn-block"
			disabled={sending || (!ready && sides.some((s) => status[s].state === 'retake'))}
		>
			{sending ? p.sending : p.submit}
		</button>
	</form>
	<p class="footer-note">{p.beta}</p>
</div>

<style>
	.thumb {
		flex: 0 0 64px;
		width: 64px;
		height: 64px;
		border-radius: 12px;
		background: var(--grey-100);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.retake {
		border-color: var(--red);
	}
</style>
