<script lang="ts">
	/**
	 * The packaging check's first screen (Akuabata's design, 3 Nov 2026): what it does, then the
	 * camera ("Scan the package") or three uploaded photos. Both buttons are links to the upload
	 * step, so the page still works without JavaScript; with it, they switch the step in place.
	 * The photo is Saul Sampson's on Unsplash (unsplash.com/photos/twhD9bFJd2M, Unsplash licence),
	 * edited for DETECK: a camera frame over Christine Sandu's photo of unlabelled blister strips
	 * (unsplash.com/photos/jwWtZrm67VI) put on the phone's screen, and the pack behind blurred.
	 */
	import Icon from '#lib/ui/Icon.svelte';
	import Mascot from '#lib/ui/Mascot.svelte';
	import { useT } from '#lib/i18n.ts';

	let {
		uploadHref,
		camera,
		onCamera,
		onUpload
	}: {
		uploadHref: string;
		/** False when this browser can't open a camera (or before JavaScript runs). */
		camera: boolean;
		onCamera: () => void;
		onUpload: () => void;
	} = $props();
	const t = $derived(useT());
	const s = $derived(t.scan);
	const p = $derived(t.packaging);

	function go(event: MouseEvent, action: () => void) {
		// Ctrl, Cmd, Shift or a middle click: let the browser open the link in a new tab or window.
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
			return;
		event.preventDefault();
		action();
	}
</script>

<h1 class="visually-hidden">{s.title}</h1>

<div class="start">
	<div class="stack" style="--gap: 14px">
		<div class="hero hero-info start-hero">
			<div class="start-media">
				<img
					src="/img/scan/scan-photo-640.webp"
					srcset="/img/scan/scan-photo-640.webp 640w, /img/scan/scan-photo-1024.webp 1024w"
					sizes="(max-width: 1023px) 90vw, 340px"
					width="640"
					height="427"
					alt={s.startPhotoAlt}
					decoding="async"
				/>
				<div class="how">
					<p class="how-title">{s.howTitle}</p>
					<ol>
						<li>{s.how1}</li>
						<li>{s.how2}</li>
						<li>{s.how3}</li>
						<li>{s.how4}</li>
					</ol>
				</div>
			</div>
			<div class="hero-row">
				<div class="hero-mascot"><Mascot mood="wink" /></div>
				<p class="bubble bubble-left">{s.startBubble}</p>
			</div>
		</div>
		<a
			class="btn btn-primary btn-block"
			href={uploadHref}
			onclick={(e) => go(e, camera ? onCamera : onUpload)}><Icon name="scan" />{s.startButton}</a
		>
	</div>

	<div class="stack" style="--gap: 12px">
		<a class="upload-box" href={uploadHref} onclick={(e) => go(e, onUpload)}>
			<Icon name="upload" size={22} />
			<span class="upload-title">{s.startUpload}</span>
			<span class="upload-note">{s.startUploadNote}</span>
		</a>
		<a href="/check" class="btn btn-block">{s.typeInstead}</a>
		<p class="small muted">{p.disclaimer} {p.provider}</p>
	</div>
</div>

<style>
	.start {
		display: grid;
		gap: 14px;
	}
	.start-hero {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}
	.start-hero .hero-row {
		margin-top: 0;
	}
	.start-media {
		display: grid;
		gap: 14px;
	}
	.start-media img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 3 / 2;
		object-fit: cover;
		border-radius: 16px;
	}
	/* Quiet, as in the design: the steps sit beside the photo without competing with it. */
	.how-title {
		margin: 0 0 6px;
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--peri-ink);
	}
	.how ol {
		margin: 0;
		padding-left: 18px;
		font-size: 13px;
		line-height: 1.5;
		color: #3c4a75;
	}
	.how li + li {
		margin-top: 4px;
	}
	.upload-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 22px 18px;
		min-height: 132px;
		justify-content: center;
		text-align: center;
		text-decoration: none;
		border-radius: var(--radius-m);
		border: 1.5px dashed var(--peri);
		background: #f5f8ff;
		color: var(--peri-ink);
	}
	.upload-box:hover {
		border-color: var(--peri-ink);
		background: var(--peri-tint);
	}
	.upload-title {
		font-weight: 700;
		font-size: 15px;
		color: var(--ink);
	}
	.upload-note {
		font-size: 13px;
		color: var(--text-3);
	}
	@media (min-width: 560px) {
		.start-media {
			grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
			align-items: start;
		}
	}
	@media (min-width: 1024px) {
		.start {
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			align-items: start;
			gap: 28px;
		}
		.start-hero {
			min-height: 360px;
			justify-content: space-between;
			padding: 24px 24px 0;
		}
	}
</style>
