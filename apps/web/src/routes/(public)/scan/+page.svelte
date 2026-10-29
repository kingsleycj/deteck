<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { setInputFile, shrinkPhoto } from '#lib/client/images.ts';

	let { data, form }: PageProps = $props();
	const t = $derived(data.t);

	type State = 'idle' | 'starting' | 'scanning' | 'blocked' | 'unsupported' | 'sending';
	let mode: State = $state('idle');
	let hasDetector = $state(false);
	let video: HTMLVideoElement | undefined = $state();
	let codeForm: HTMLFormElement | undefined = $state();
	let codeInput: HTMLInputElement | undefined = $state();
	let photoForm: HTMLFormElement | undefined = $state();
	let photoInput: HTMLInputElement | undefined = $state();
	let stream: MediaStream | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;

	interface Detector {
		detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
	}

	onMount(async () => {
		const BD = (
			globalThis as unknown as {
				BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> };
			}
		).BarcodeDetector;
		if (BD) {
			const formats = await BD.getSupportedFormats().catch(() => [] as string[]);
			hasDetector = formats.includes('data_matrix');
		}
	});

	function stop() {
		clearInterval(timer);
		stream?.getTracks().forEach((t) => t.stop());
		stream = undefined;
	}
	onDestroy(stop);

	async function start() {
		if (!navigator.mediaDevices?.getUserMedia) {
			mode = 'unsupported';
			return;
		}
		mode = 'starting';
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
				audio: false
			});
		} catch (error) {
			mode = (error as DOMException)?.name === 'NotAllowedError' ? 'blocked' : 'unsupported';
			return;
		}
		mode = 'scanning';
		await Promise.resolve();
		video!.srcObject = stream;
		await video!.play().catch(() => undefined);
		if (hasDetector) {
			const BD = (globalThis as unknown as { BarcodeDetector: new (o: object) => Detector })
				.BarcodeDetector;
			const detector = new BD({ formats: ['data_matrix', 'qr_code'] });
			timer = setInterval(async () => {
				if (!video || video.readyState < 2) return;
				const found = await detector.detect(video).catch(() => []);
				if (found[0]?.rawValue) {
					clearInterval(timer);
					codeInput!.value = found[0].rawValue;
					mode = 'sending';
					stop();
					codeForm!.submit();
				}
			}, 300);
		}
	}

	/** Takes a still from the camera and lets the server read the code. */
	async function capture() {
		if (!video) return;
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext('2d')!.drawImage(video, 0, 0);
		const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.9));
		mode = 'sending';
		stop();
		setInputFile(
			photoInput!,
			await shrinkPhoto(blob, { maxEdge: 1600, targetBytes: 400_000 }),
			'code.jpg'
		);
		photoForm!.submit();
	}

	/** Shrinks a chosen photo before it is sent, when JavaScript is available. */
	async function chosen(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		mode = 'sending';
		try {
			setInputFile(
				input,
				await shrinkPhoto(file, { maxEdge: 1600, targetBytes: 400_000 }),
				'code.jpg'
			);
		} catch {
			// Send the original if the browser can't shrink it.
		}
		photoForm!.submit();
	}
</script>

<svelte:head><title>{t.scan.metaTitle}</title></svelte:head>

<div class="shell shell-narrow">
	<header class="page-head">
		<a href="/check" class="back" aria-label={t.scan.closeAria}><Icon name="close" /></a>
		<span>{t.scan.title}</span>
	</header>

	{#if form?.message}<p class="notice" role="alert">{form.message}</p>{/if}

	{#if mode === 'blocked'}
		<div class="hero hero-warn">
			<div class="hero-row" style="margin-top: 0">
				<div class="hero-mascot"><Mascot mood="concerned" /></div>
				<p class="bubble bubble-left">{t.scan.blockedBubble}</p>
			</div>
		</div>
		<section class="card stack" style="--gap: 10px">
			<h2>{t.scan.turnOnTitle}</h2>
			<ol class="reasons">
				<li><span>{t.scan.turnOn1}</span></li>
				<li><span>{t.scan.turnOn2}</span></li>
				<li><span>{t.scan.turnOn3}</span></li>
			</ol>
		</section>
		<button class="btn btn-primary btn-block" onclick={start}>{t.scan.turnedOn}</button>
	{:else if mode === 'scanning' || mode === 'starting'}
		<section class="viewfinder">
			<video bind:this={video} playsinline muted aria-label={t.scan.cameraAria}></video>
			<div class="frame" aria-hidden="true"></div>
		</section>
		<div class="hero-row" style="margin-top: 0">
			<div class="hero-mascot" style="flex-basis: 70px; width: 70px"><Mascot mood="wink" /></div>
			<p class="bubble bubble-left">
				{hasDetector ? t.scan.holdAuto : t.scan.holdPhoto}
			</p>
		</div>
		<button class="btn btn-primary btn-block" onclick={capture}
			><Icon name="camera" />{t.scan.takePhoto}</button
		>
	{:else if mode === 'sending'}
		<section class="stack center" style="--gap: 14px; align-items: center; padding: 40px 0">
			<div style="width: 140px"><Mascot mood="thinking" /></div>
			<h2>{t.scan.reading}</h2>
			<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
		</section>
	{:else}
		<div class="hero hero-info">
			<div class="hero-row" style="margin-top: 0">
				<div class="hero-mascot"><Mascot mood="wink" /></div>
				<p class="bubble bubble-left">{t.scan.intro}</p>
			</div>
		</div>
		{#if mode === 'unsupported'}<p class="notice small">
				{t.scan.unsupported}
			</p>{/if}
		{#if mode !== 'unsupported'}
			<button class="btn btn-primary btn-block" onclick={start}
				><Icon name="scan" />{t.scan.scanButton}</button
			>
		{/if}
	{/if}

	<form
		method="post"
		action="?/decode"
		enctype="multipart/form-data"
		bind:this={photoForm}
		class="stack"
		style="--gap: 10px"
	>
		<label class="btn btn-block" for="photo"
			><Icon name="camera" />{mode === 'idle' || mode === 'unsupported' || mode === 'blocked'
				? t.scan.photoIdle
				: t.scan.photoGallery}</label
		>
		<input
			id="photo"
			name="photo"
			type="file"
			accept="image/*"
			capture="environment"
			class="visually-hidden"
			bind:this={photoInput}
			onchange={chosen}
		/>
		<noscript><button class="btn btn-primary btn-block">{t.scan.readPhoto}</button></noscript>
	</form>
	<form method="post" action="?/code" bind:this={codeForm} hidden>
		<input name="code" bind:this={codeInput} />
	</form>

	<a href="/check" class="btn btn-block">{t.scan.typeInstead}</a>
	<p class="footer-note">{t.scan.footer}</p>
</div>

<style>
	.viewfinder {
		position: relative;
		border-radius: var(--radius-xl);
		overflow: hidden;
		background: var(--ink);
		aspect-ratio: 3 / 4;
	}
	.viewfinder video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.frame {
		position: absolute;
		inset: 22% 18%;
		border: 3px solid var(--lime);
		border-radius: 18px;
		box-shadow: 0 0 0 999px rgba(11, 11, 15, 0.35);
	}
</style>
