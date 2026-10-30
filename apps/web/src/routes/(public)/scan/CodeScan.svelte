<script lang="ts">
	/** Code mode of "Verify further by scan": the camera (or a photo) reads the square code. */
	import { onDestroy, onMount } from 'svelte';
	import Icon from '#lib/ui/Icon.svelte';
	import Upload from '#lib/ui/Upload.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { setInputFile, shrinkPhoto } from '#lib/client/images.ts';
	import { useT } from '#lib/i18n.ts';

	let { form }: { form: { message?: string } | null } = $props();
	const t = $derived(useT());

	type State = 'idle' | 'starting' | 'scanning' | 'blocked' | 'unsupported' | 'sending';
	let mode: State = $state('idle');
	let hasDetector = $state(false);
	let video: HTMLVideoElement | undefined = $state();
	let codeForm: HTMLFormElement | undefined = $state();
	let codeInput: HTMLInputElement | undefined = $state();
	let photoForm: HTMLFormElement | undefined = $state();
	let stream: MediaStream | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;

	interface Detector {
		detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
	}

	let ready = $state(false);
	onMount(async () => {
		ready = true;
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
			photoForm!.querySelector<HTMLInputElement>('input[name=photo]')!,
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

<!-- Reading the code only: the page used when the packaging check is switched off. -->
<h1 class="visually-hidden">{t.scan.title}</h1>

{#snippet hold()}
	<div class="hero-row" style="margin-top: 0">
		<div class="hero-mascot" style="flex-basis: 70px; width: 70px"><Mascot mood="wink" /></div>
		<p class="bubble bubble-left">{hasDetector ? t.scan.holdAuto : t.scan.holdPhoto}</p>
	</div>
{/snippet}
{#if form?.message}<p class="notice" role="alert">{form.message}</p>{/if}

<!-- Wide screens, as in the desktop designs: the camera (or the guide) on the left, the other
	     ways to check on the right. Phones: one column. -->
<div class="scan-layout">
	<div class="stack" style="--gap: 14px">
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
				{#if mode === 'scanning'}
					<button type="button" class="shutter" aria-label={t.scan.takePhoto} onclick={capture}
						><span></span></button
					>
				{/if}
			</section>
			<div class="phone-only">{@render hold()}</div>
		{:else if mode === 'sending'}
			<section class="stack center" style="--gap: 14px; align-items: center; padding: 40px 0">
				<div style="width: 140px"><Mascot mood="thinking" /></div>
				<h2>{t.scan.reading}</h2>
				<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			</section>
		{:else}
			<div class="hero hero-info scan-intro">
				<div class="hero-row" style="margin-top: 0">
					<div class="hero-mascot"><Mascot mood="wink" /></div>
					<p class="bubble bubble-left">{t.scan.intro}</p>
				</div>
			</div>
			{#if mode === 'unsupported'}<p class="notice small">
					{t.scan.unsupported}
				</p>{/if}
			<!-- The camera needs JavaScript: without it, the photo box below does the job. -->
			{#if mode !== 'unsupported' && ready}
				<button class="btn btn-primary btn-block" onclick={start}
					><Icon name="scan" />{t.scan.scanButton}</button
				>
			{/if}
		{/if}
	</div>

	<div class="stack" style="--gap: 12px">
		{#if mode === 'scanning' || mode === 'starting'}
			<div class="hero hero-info desk-only">{@render hold()}</div>
		{/if}
		<form
			method="post"
			action="?/decode"
			enctype="multipart/form-data"
			bind:this={photoForm}
			class="stack"
			style="--gap: 10px"
		>
			<Upload
				id="photo"
				name="photo"
				title={mode === 'idle' || mode === 'unsupported' || mode === 'blocked'
					? t.scan.photoIdle
					: t.scan.photoGallery}
				hint={t.scan.footer}
				accept="image/*"
				onchange={chosen}
			/>
			<noscript><button class="btn btn-primary btn-block">{t.scan.readPhoto}</button></noscript>
		</form>
		<form method="post" action="?/code" bind:this={codeForm} hidden>
			<input name="code" bind:this={codeInput} />
		</form>

		<a href="/check" class="btn btn-block">{t.scan.typeInstead}</a>
	</div>
</div>

<style>
	.scan-layout {
		display: grid;
		gap: 14px;
	}
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
	/* The square to hold the code in, clear of the shutter below it. */
	.frame {
		position: absolute;
		inset: 16% 18% 28%;
		border: 3px solid var(--lime);
		border-radius: 18px;
		box-shadow: 0 0 0 999px rgba(11, 11, 15, 0.35);
	}
	@media (min-width: 1024px) {
		.scan-layout {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			align-items: start;
			gap: 28px;
		}
		.scan-intro {
			min-height: 360px;
			display: flex;
			flex-direction: column;
			justify-content: flex-end;
			padding: 24px 24px 0;
		}
		/* As in the desktop design: a landscape camera that fits on the screen, shutter included,
		   with no scrolling to reach it. */
		.viewfinder {
			aspect-ratio: auto;
			height: clamp(360px, calc(100dvh - 200px), 640px);
		}
		.frame {
			inset: 12% auto 120px 50%;
			transform: translateX(-50%);
			aspect-ratio: 1;
		}
	}
</style>
