<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import PageHead from '#lib/ui/PageHead.svelte';
	import Rich from '#lib/ui/Rich.svelte';
	import Upload from '#lib/ui/Upload.svelte';
	import CodeScan from './CodeScan.svelte';
	import { photoQuality, setInputFile, shrinkPhoto } from '#lib/client/images.ts';
	import { fmt } from '#lib/i18n.ts';

	let { data, form }: PageProps = $props();
	const t = $derived(data.t);
	const s = $derived(t.scan);
	const p = $derived(t.packaging);
	const back = $derived(data.from ? `/r/${data.from}` : '/check');

	// ---- "Verify further by scan" (the designs D5, D10, D12, D16; M6, M11, M17, M18)
	const sides = ['front', 'back', 'label'] as const;
	type Side = (typeof sides)[number];
	interface Shot {
		state: 'empty' | 'checking' | 'ok' | 'unchecked' | 'retake';
		preview?: string;
		message?: string;
	}
	let shots: Record<Side, Shot> = $state({
		front: { state: 'empty' },
		back: { state: 'empty' },
		label: { state: 'empty' }
	});
	// Upload first, so the page works without JavaScript; the camera takes over once it loads.
	let method: 'camera' | 'upload' = $state('upload');
	let ready = $state(false);
	// What the server said about the last send (rendered on the server too, so it shows without
	// JavaScript), until that photo is taken again.
	let dismissed: object | null = $state(null);
	const serverSide = $derived(
		form && form !== dismissed && 'side' in form ? ((form.side as Side | null) ?? null) : null
	);
	const serverMessage = $derived(form && form !== dismissed ? (form.message ?? null) : null);
	let camera: 'idle' | 'starting' | 'live' | 'blocked' | 'unsupported' = $state('idle');
	let code = $state('');
	let sending = $state(false);
	let video: HTMLVideoElement | undefined = $state();
	let stream: MediaStream | undefined;
	let timer: ReturnType<typeof setInterval> | undefined;

	const done = (side: Side) => shots[side].state === 'ok' || shots[side].state === 'unchecked';
	const count = $derived(sides.filter(done).length);
	const current = $derived(sides.find((side) => !done(side)) ?? null);
	const review = $derived(count === 3);
	const problemSide = $derived(
		serverSide ?? sides.find((side) => shots[side].state === 'retake') ?? null
	);
	const bubble = $derived(
		serverMessage ??
			(problemSide && shots[problemSide].message) ??
			(method === 'upload'
				? s.uploadBubble
				: current === 'back'
					? `${code || data.serial ? s.gotCode + ' ' : ''}${s.sayBack}`
					: current === 'label'
						? s.sayLabel
						: s.sayFront)
	);
	const codeChip = $derived(
		data.serial ? fmt(s.serialValid, { serial: data.serial }) : code ? s.gotCode : null
	);

	interface Detector {
		detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
	}

	function stop() {
		clearInterval(timer);
		stream?.getTracks().forEach((track) => track.stop());
		stream = undefined;
		if (camera === 'live' || camera === 'starting') camera = 'idle';
	}
	onDestroy(stop);

	onMount(() => {
		ready = true;
		// No camera API (or a desktop without one): stay on the upload tab.
		if (typeof navigator.mediaDevices?.getUserMedia === 'function') method = 'camera';
		else camera = 'unsupported';
	});

	async function start() {
		if (!navigator.mediaDevices?.getUserMedia) {
			camera = 'unsupported';
			method = 'upload';
			return;
		}
		camera = 'starting';
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 } },
				audio: false
			});
		} catch (error) {
			camera = (error as DOMException)?.name === 'NotAllowedError' ? 'blocked' : 'unsupported';
			method = 'upload';
			return;
		}
		camera = 'live';
		await Promise.resolve();
		video!.srcObject = stream;
		await video!.play().catch(() => undefined);
		// Read the square code while the photos are taken, where the browser can.
		const BD = (
			globalThis as unknown as {
				BarcodeDetector?: { new (o: object): Detector; getSupportedFormats(): Promise<string[]> };
			}
		).BarcodeDetector;
		if (BD && !data.serial) {
			const formats = await BD.getSupportedFormats().catch(() => [] as string[]);
			if (formats.includes('data_matrix')) {
				const detector = new BD({ formats: ['data_matrix', 'qr_code'] });
				timer = setInterval(async () => {
					if (code || !video || video.readyState < 2) return;
					const found = await detector.detect(video).catch(() => []);
					if (found[0]?.rawValue) code = found[0].rawValue;
				}, 400);
			}
		}
	}

	function inputFor(side: Side) {
		return document.getElementById(`photo-${side}`) as HTMLInputElement | null;
	}

	/** Shrinks a photo, checks it is sharp and bright enough, and puts it in the form. */
	async function take(side: Side, blob: Blob) {
		shots[side] = { state: 'checking' };
		try {
			// The back carries the square code: keep it a little larger so it can be read.
			const small = await shrinkPhoto(blob, {
				maxEdge: side === 'back' ? 1600 : 1280,
				targetBytes: side === 'back' ? 350_000 : 250_000
			});
			const q = await photoQuality(small);
			const preview = URL.createObjectURL(small);
			const input = inputFor(side);
			if (input) setInputFile(input, small, `${side}.jpg`);
			if (q.brightness < 45) shots[side] = { state: 'retake', preview, message: p.tooDark };
			else if (q.brightness > 248) shots[side] = { state: 'retake', preview, message: p.glare };
			else if (q.sharpness < 60) shots[side] = { state: 'retake', preview, message: p.blurry };
			else shots[side] = { state: 'ok', preview };
		} catch {
			// This browser couldn't read the photo; the server checks it when it's sent.
			shots[side] = { state: 'unchecked' };
		}
		if (review) stop();
	}

	async function capture() {
		const side = problemSide ?? current;
		if (!video || !side) return;
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		canvas.getContext('2d')!.drawImage(video, 0, 0);
		const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), 'image/jpeg', 0.92));
		await take(side, blob);
	}

	async function chosen(side: Side, event: Event) {
		const file = (event.currentTarget as HTMLInputElement).files?.[0];
		if (file) await take(side, file);
	}

	function retake(side: Side) {
		if (serverSide === side || !serverSide) dismissed = form;
		shots[side] = { state: 'empty' };
		const input = inputFor(side);
		if (input) input.value = '';
		if (method === 'camera' && camera !== 'live') start();
	}

	function useMethod(next: 'camera' | 'upload') {
		method = next;
		if (next === 'upload') stop();
	}

	const label = (side: Side) =>
		done(side)
			? s.taken
			: shots[side].state === 'retake'
				? p.retake
				: side === current
					? s.takingNow
					: s.next;
</script>

<svelte:head><title>{s.metaTitle}</title></svelte:head>

<div class="shell app-frame">
	<PageHead {back} backLabel={t.scan.closeAria} title={s.title} close>
		{#snippet aside()}
			<a href={back} class="btn btn-small cancel">{s.cancel}</a>
		{/snippet}
	</PageHead>

	{#if data.mode === 'code'}
		<main><CodeScan {form} /></main>
	{:else}
		<main class="scan" class:is-review={review}>
			<section class="scan-main">
				<!-- The tabs need JavaScript (the camera does), so they appear once it runs. -->
				{#if !review && ready && camera !== 'unsupported'}
					<div class="tabs" role="tablist" aria-label={s.methodAria}>
						<button
							type="button"
							role="tab"
							aria-selected={method === 'camera'}
							aria-controls="scan-method"
							onclick={() => useMethod('camera')}>{s.tabCamera}</button
						>
						<button
							type="button"
							role="tab"
							aria-selected={method === 'upload'}
							aria-controls="scan-method"
							onclick={() => useMethod('upload')}>{s.tabUpload}</button
						>
					</div>
				{/if}

				{#if method === 'upload' && (camera === 'blocked' || (ready && camera === 'unsupported')) && !review}
					<p class="blocked" role="status">
						<Icon name="alert" size={20} color="#8A3B00" /><span><Rich text={s.blocked} /></span>
					</p>
				{/if}

				{#if method === 'camera' && !review}
					<div class="viewfinder" id="scan-method" role="tabpanel">
						{#if camera === 'live' || camera === 'starting'}
							<video bind:this={video} playsinline muted aria-label={t.scan.cameraAria}></video>
						{:else}
							<div class="vf-start">
								<div class="vf-mascot"><Mascot mood="wink" /></div>
								<button type="button" class="btn btn-primary" onclick={start}
									><Icon name="camera" />{s.startCamera}</button
								>
							</div>
						{/if}
						<span class="corner tl" aria-hidden="true"></span>
						<span class="corner tr" aria-hidden="true"></span>
						<span class="corner bl" aria-hidden="true"></span>
						<span class="corner br" aria-hidden="true"></span>
						{#if camera === 'live'}<span class="scanline" aria-hidden="true"></span>{/if}
						{#if codeChip}<span class="chip-code"
								><Icon name="check" size={14} stroke={3} />{codeChip}</span
							>{/if}
						{#if current || problemSide}
							{@const side = problemSide ?? current!}
							<span class="chip-step"
								>{fmt(s.photoOf, { n: sides.indexOf(side) + 1, side: p.sides[side] })}</span
							>
						{/if}
						{#if camera === 'live'}
							<button type="button" class="shutter" aria-label={s.capture} onclick={capture}
								><span></span></button
							>
						{/if}
					</div>
				{/if}

				<form
					method="post"
					action="?/photos"
					enctype="multipart/form-data"
					class="photos-form"
					use:enhance={() => {
						sending = true;
						stop();
						// If the server asks for a retake, keep all three photos in the form.
						return async ({ result, update }) => {
							sending = false;
							await update({ reset: result.type === 'redirect' });
						};
					}}
				>
					{#if data.from}<input type="hidden" name="from" value={data.from} />{/if}
					{#if code}<input type="hidden" name="code" value={code} />{/if}
					{#if review}
						<!-- D16 / M18: the three photos, large, each marked clear. -->
						<div class="review-grid">
							{#each sides as side (side)}
								{@const st = shots[side]}
								<figure class:is-bad={problemSide === side}>
									<div class="rv-photo">
										{#if st.preview}<img src={st.preview} alt={p.sides[side]} />{/if}
									</div>
									<figcaption>
										<span class="rv-text"
											><strong>{p.sides[side]}</strong><span>{p.notes[side]}</span></span
										>
										{#if problemSide === side}
											<button type="button" class="btn btn-small" onclick={() => retake(side)}
												>{p.retake}</button
											>
										{:else}
											<span class="rv-clear">{st.state === 'ok' ? p.clear : p.unchecked}</span>
										{/if}
									</figcaption>
								</figure>
							{/each}
						</div>
					{/if}
					<div
						class="slots"
						class:slots-hidden={review || method === 'camera'}
						id={method === 'upload' ? 'scan-method' : undefined}
						role={method === 'upload' && ready ? 'tabpanel' : undefined}
					>
						{#each sides as side (side)}
							{@const st = shots[side]}
							<Upload
								id="photo-{side}"
								name={side}
								title={p.sides[side]}
								hint={p.notes[side]}
								accept="image/*"
								size="tile"
								required
								preview={st.preview}
								phase={st.state === 'checking'
									? 'busy'
									: st.state === 'retake' || problemSide === side
										? 'error'
										: st.state === 'empty'
											? 'empty'
											: 'done'}
								status={st.state === 'checking'
									? p.checkingPhoto
									: st.state === 'ok'
										? p.clear
										: st.state === 'unchecked'
											? p.unchecked
											: (st.message ?? null)}
								onchange={(e) => chosen(side, e)}
							/>
						{/each}
					</div>
					<label class="option"
						><input type="checkbox" name="retain" />
						<span>{p.retain}</span></label
					>
					<div class="form-foot">
						{#if review}
							<button
								type="button"
								class="btn"
								onclick={() => {
									method = camera === 'blocked' || camera === 'unsupported' ? 'upload' : method;
									retake(problemSide ?? 'front');
								}}>{s.retakeOne}</button
							>
						{:else if ready}
							<span class="small muted" aria-live="polite">{fmt(s.added, { n: count })}</span>
						{/if}
						<button class="btn btn-dark submit" disabled={ready && (sending || !review)}>
							{sending ? p.sending : p.submit}
						</button>
					</div>
				</form>
			</section>

			<aside class="scan-side">
				{#if review}
					<div class="review-panel" class:review-warn={serverMessage}>
						<p class="review-eyebrow">{s.reviewEyebrow}</p>
						<h1>{serverMessage && problemSide ? s.retakeOne : s.reviewTitle}</h1>
						{#if !serverMessage}<p>{s.reviewText}</p>{/if}
						<div class="say">
							<div class="say-mascot">
								<Mascot mood={serverMessage ? 'concerned' : 'happy'} color="#FFFFFF" />
							</div>
							<p class="bubble bubble-left" role={serverMessage ? 'alert' : undefined}>
								{serverMessage ?? s.reviewBubble}
							</p>
						</div>
					</div>
				{:else}
					<h1 class="visually-hidden">{s.title}</h1>
					<div class="guide" class:guide-warn={problemSide || serverMessage}>
						<div class="say-mascot">
							<Mascot mood={problemSide || serverMessage ? 'concerned' : 'wink'} />
						</div>
						<p class="bubble bubble-left" role="status">{bubble}</p>
					</div>
					<section class="card list" aria-labelledby="photos-title">
						<p id="photos-title" class="list-title">{s.photosTitle}</p>
						<ol>
							{#each sides as side (side)}
								{@const st = shots[side]}
								<li
									class:is-done={done(side)}
									class:is-now={side === current && !done(side)}
									class:is-bad={st.state === 'retake'}
								>
									<span class="thumb" aria-hidden="true">
										{#if st.preview}<img src={st.preview} alt="" />{/if}
										{#if done(side)}<Icon name="check" size={18} stroke={3} />{/if}
									</span>
									<span class="list-text">
										<strong>{p.sides[side]}</strong>
										<span>{label(side)}</span>
									</span>
									{#if done(side) || st.state === 'retake'}
										<button type="button" class="btn btn-small" onclick={() => retake(side)}
											>{p.retake}</button
										>
									{/if}
								</li>
							{/each}
						</ol>
					</section>
					{#if method === 'camera'}
						<div class="help-card">
							<p class="help-title">{s.noCameraTitle}</p>
							<p><Rich text={s.noCameraText} /></p>
						</div>
					{:else}
						<div class="card help-rules">
							<p class="help-title">{s.rulesTitle}</p>
							<ul>
								<li>{s.rule1}</li>
								<li>{s.rule2}</li>
								<li>{s.rule3}</li>
							</ul>
						</div>
					{/if}
				{/if}
				<p class="fine">{p.disclaimer} {p.provider}</p>
				<a href="/check" class="btn btn-block type-instead">{t.scan.typeInstead}</a>
			</aside>
		</main>
	{/if}
</div>

<style>
	.cancel {
		display: none;
	}
	.scan {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.scan-main,
	.scan-side {
		display: flex;
		flex-direction: column;
		gap: 14px;
		min-width: 0;
	}
	.tabs {
		display: flex;
		gap: 6px;
		padding: 5px;
		border-radius: 999px;
		background: var(--grey-150);
		align-self: flex-start;
	}
	.tabs button {
		height: 40px;
		padding: 0 18px;
		border: 0;
		border-radius: 999px;
		background: none;
		font: 600 14px var(--font);
		color: var(--ink);
		cursor: pointer;
	}
	.tabs button[aria-selected='true'] {
		background: var(--ink);
		color: var(--white);
		font-weight: 700;
	}
	.blocked {
		margin: 0;
		display: flex;
		gap: 12px;
		padding: 14px 16px;
		border-radius: 16px;
		background: var(--peach);
		color: var(--peach-text);
		font-size: 14px;
		line-height: 1.45;
	}
	.viewfinder {
		position: relative;
		aspect-ratio: 3 / 4;
		border-radius: var(--radius-xl);
		background: radial-gradient(at 50% 40%, #3b3d46 0%, #16171c 75%);
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.viewfinder video {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.vf-start {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}
	.vf-mascot {
		width: 110px;
	}
	.corner {
		position: absolute;
		width: 54px;
		height: 54px;
		border: 0 solid var(--lime);
	}
	.tl {
		left: 14%;
		top: 12%;
		border-left-width: 5px;
		border-top-width: 5px;
		border-top-left-radius: 18px;
	}
	.tr {
		right: 14%;
		top: 12%;
		border-right-width: 5px;
		border-top-width: 5px;
		border-top-right-radius: 18px;
	}
	.bl {
		left: 14%;
		bottom: 12%;
		border-left-width: 5px;
		border-bottom-width: 5px;
		border-bottom-left-radius: 18px;
	}
	.br {
		right: 14%;
		bottom: 12%;
		border-right-width: 5px;
		border-bottom-width: 5px;
		border-bottom-right-radius: 18px;
	}
	.scanline {
		position: absolute;
		left: 15%;
		right: 15%;
		top: 50%;
		height: 3px;
		background: var(--lime);
		box-shadow: 0 0 14px 3px rgba(220, 252, 126, 0.55);
		animation: sweep 2.6s ease-in-out infinite;
	}
	@keyframes sweep {
		0%,
		100% {
			top: 22%;
		}
		50% {
			top: 76%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.scanline {
			animation: none;
		}
	}
	.chip-code,
	.chip-step {
		position: absolute;
		top: 14px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		max-width: calc(50% - 24px);
		padding: 8px 14px;
		border-radius: 999px;
		font-size: 13px;
		font-weight: 600;
	}
	.chip-code {
		left: 14px;
		background: rgba(220, 252, 126, 0.95);
		font-weight: 700;
	}
	.chip-step {
		right: 14px;
		background: rgba(0, 0, 0, 0.55);
		color: var(--white);
	}
	.photos-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}
	.slots {
		display: grid;
		gap: 12px;
	}
	/* While the camera takes the photos (and during the review), the slots stay in the form, out of
	   sight and out of the way of screen readers; their files are still sent. */
	.slots-hidden {
		display: none;
	}
	.review-grid {
		display: grid;
		gap: 14px;
	}
	.review-grid figure {
		margin: 0;
		display: flex;
		flex-direction: column;
		border-radius: 24px;
		background: var(--white);
		border: 2px solid #9bd43a;
		overflow: hidden;
	}
	.review-grid figure.is-bad {
		border-color: var(--red);
	}
	.rv-photo {
		flex: 1 1 auto;
		min-height: 200px;
		background: var(--ink-2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.rv-photo img {
		display: block;
		width: 100%;
		height: 100%;
		max-height: 420px;
		object-fit: contain;
	}
	figcaption {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 16px;
	}
	.rv-text {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		font-size: 12px;
		color: var(--text-3);
	}
	.rv-text strong {
		font-size: 15px;
		color: var(--ink);
	}
	.rv-clear {
		flex: 0 0 auto;
		padding: 5px 10px;
		border-radius: 999px;
		background: var(--lime-tint);
		font-size: 12px;
		font-weight: 700;
	}
	.form-foot {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
	}
	.is-review .form-foot {
		justify-content: space-between;
	}
	.guide,
	.say {
		display: flex;
		align-items: flex-end;
		gap: 12px;
	}
	.guide {
		padding: 18px 18px 0;
		border-radius: 24px;
		background: var(--peri);
		overflow: hidden;
	}
	.guide-warn {
		background: var(--peach);
	}
	.say-mascot {
		flex: 0 0 90px;
		width: 90px;
		margin-bottom: -6px;
	}
	.guide .bubble {
		margin: 0 0 18px;
		font-size: 14px;
	}
	.list {
		padding: 20px 22px;
	}
	.list-title,
	.help-title {
		margin: 0;
		font-size: 13px;
		font-weight: 700;
	}
	.list ol {
		margin: 14px 0 0;
		padding: 0;
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.list li {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.thumb {
		position: relative;
		flex: 0 0 52px;
		width: 52px;
		height: 52px;
		border-radius: 12px;
		border: 2px dashed #c9cdd6;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}
	.thumb img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.55;
	}
	.thumb :global(svg) {
		position: relative;
	}
	.is-done .thumb {
		border: 2px solid var(--ink);
		background: #e7ecf2;
	}
	.is-now .thumb {
		border-color: var(--ink);
		background: var(--lime);
	}
	.is-bad .thumb {
		border: 2px solid var(--red);
	}
	.list-text {
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		font-size: 12px;
		color: var(--text-3);
	}
	.list-text strong {
		font-size: 14px;
		color: var(--ink);
	}
	li:not(.is-done):not(.is-now) .list-text strong {
		color: var(--text-3);
	}
	.is-bad .list-text span {
		color: var(--red);
		font-weight: 700;
	}
	.help-card {
		padding: 16px 18px;
		border-radius: 20px;
		background: var(--grey-100);
		font-size: 13px;
		line-height: 1.55;
		color: #2e3242;
	}
	.help-card p {
		margin: 4px 0 0;
	}
	.help-card .help-title,
	.help-rules .help-title {
		margin: 0;
		color: var(--ink);
	}
	.help-rules {
		padding: 18px 20px;
		font-size: 13px;
		line-height: 1.6;
	}
	.help-rules ul {
		margin: 8px 0 0;
		padding-left: 18px;
	}
	.fine {
		margin: 0;
		font-size: 12px;
		line-height: 1.5;
		color: var(--text-3);
	}
	.review-panel {
		display: flex;
		flex-direction: column;
		padding: 24px 24px 0;
		border-radius: 28px;
		background: var(--lime);
		overflow: hidden;
	}
	/* Phones: after the photos are taken, the answer (or what to retake) comes first. */
	.is-review .scan-side {
		order: -1;
	}
	.review-warn {
		background: var(--peach);
	}
	.review-warn .review-eyebrow {
		color: var(--peach-ink);
	}
	.review-eyebrow {
		margin: 0;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--lime-ink);
	}
	.review-panel h1 {
		margin-top: 10px;
		font-size: 32px;
		letter-spacing: -0.045em;
	}
	.review-panel > p {
		margin: 10px 0 0;
		font-size: 15px;
		line-height: 1.5;
	}
	.say {
		margin-top: 16px;
	}
	.say .bubble {
		margin: 0 0 40px;
	}

	/* ---- the desktop designs: the camera (or the photos) on the left, the guide on the right */
	@media (min-width: 700px) {
		.slots,
		.review-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}
	@media (min-width: 1024px) {
		.cancel {
			display: inline-flex;
		}
		.scan {
			display: grid;
			grid-template-columns: 7fr 4fr;
			gap: 20px;
		}
		.is-review .scan-side {
			order: 0;
		}
		/* Tall enough to frame a pack, short enough that the shutter and the button under it stay
		   on screen on a 720px-high laptop. */
		.viewfinder {
			flex: 1 1 auto;
			aspect-ratio: auto;
			min-height: clamp(340px, calc(100dvh - 370px), 540px);
		}
		.corner.tl,
		.corner.bl {
			left: 30%;
		}
		.corner.tr,
		.corner.br {
			right: 30%;
		}
		.scanline {
			left: 31%;
			right: 31%;
		}
		.chip-code {
			left: 18px;
			top: 18px;
		}
		.chip-step {
			right: 18px;
			top: 18px;
		}
		.slots,
		.review-grid {
			flex: 1 1 auto;
		}
		.rv-photo {
			min-height: 360px;
		}
		.slots :global(.upload) {
			min-height: 320px;
		}
		.scan-side {
			gap: 16px;
		}
		.say-mascot {
			flex-basis: 96px;
			width: 96px;
		}
		.fine {
			margin-top: auto;
		}
		.type-instead {
			display: none;
		}
		.review-panel {
			flex: 1 1 auto;
			padding: 28px 28px 0;
		}
		.review-panel h1 {
			font-size: 44px;
			line-height: 1;
		}
		.review-panel > p {
			margin-top: 12px;
			font-size: 16px;
		}
		.review-panel .say {
			margin-top: auto;
			gap: 14px;
		}
		.review-panel .say-mascot {
			flex-basis: 150px;
			width: 150px;
			margin-bottom: -8px;
		}
		.review-panel .bubble {
			margin-bottom: 70px;
			font-size: 15px;
		}
		.form-foot .submit {
			min-height: 56px;
			padding: 0 30px;
			font-size: 16px;
		}
	}
</style>
