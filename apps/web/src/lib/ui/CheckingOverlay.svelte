<script lang="ts">
	/**
	 * "Checking the records…" and "I couldn't reach the records", as in the designs. Shown by
	 * /js/check.js while a serial check is on its way (progressive enhancement: without
	 * JavaScript the browser's own loading state shows instead). The script fills in the serial.
	 */
	import Mascot from './Mascot.svelte';
	import { useT } from '#lib/i18n.ts';

	const t = $derived(useT());
</script>

<div class="checking-overlay" data-checking hidden>
	<div class="co">
		<div class="co-art co-when-busy" aria-hidden="true">
			<svg viewBox="0 0 600 300" preserveAspectRatio="none"
				><path
					d="M40 170 C 110 240 160 290 220 270 C 290 250 360 110 600 40"
					fill="none"
					stroke="#DCFC7E"
					stroke-width="18"
					stroke-linecap="round"
				/></svg
			>
			<div class="co-mascot co-bob"><Mascot mood="thinking" /></div>
		</div>
		<div class="co-art co-art-off co-when-off" aria-hidden="true">
			<div class="co-mascot"><Mascot mood="concerned" /></div>
		</div>

		<section class="co-text co-when-busy" role="status">
			<p class="co-eyebrow co-dot">{t.check.checkingEyebrow}</p>
			<h2>{t.check.checkingTitle}</h2>
			<p class="co-body">{t.check.checkingBody}</p>
			<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="co-serial">{t.check.label} <span class="mono" data-serial></span></p>
			<div class="co-slow" data-slow hidden>
				<p>{t.network.slow}</p>
				<button type="button" class="btn btn-dark btn-small" data-retry>{t.check.retry}</button>
			</div>
		</section>

		<section class="co-text co-when-off" role="alert">
			<p class="co-eyebrow">{t.network.offlineEyebrow}</p>
			<h2>{t.network.offlineTitle}</h2>
			<p class="co-body">
				{t.network.offlineBody}
				<span class="mono co-off-serial" data-serial></span>
			</p>
			<div class="co-actions">
				<button type="button" class="btn btn-dark" data-retry>{t.check.tryAgain}</button>
				<button type="button" class="btn" data-edit>{t.network.editSerial}</button>
			</div>
			<p class="co-note">{t.network.offlineNote}</p>
		</section>
	</div>
</div>

<style>
	.co {
		width: 100%;
		max-width: 980px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 22px;
	}
	.co-art {
		position: relative;
		width: 220px;
		height: 220px;
		border-radius: 50%;
		background: var(--peri);
		display: flex;
		align-items: flex-end;
		justify-content: center;
		overflow: hidden;
	}
	.co-art svg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
	}
	.co-art-off {
		background: var(--grey-100);
	}
	.co-mascot {
		position: relative;
		width: 62%;
		margin-bottom: -4%;
	}
	.co-text {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 14px;
		max-width: 520px;
	}
	.co-text h2 {
		font-size: 28px;
	}
	.co-eyebrow {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		font-weight: 800;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--text-3);
	}
	.co-dot {
		font-size: 14px;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		color: var(--ink);
	}
	.co-dot::before {
		content: '';
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #2d4fe0;
	}
	.co-body {
		margin: 0;
		color: var(--text-2);
		line-height: 1.55;
	}
	.co-serial {
		margin: 0;
		display: inline-flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 18px;
		background: var(--white);
		border: 1px solid var(--line);
		font-size: 13px;
		color: var(--text-3);
	}
	.co-serial .mono {
		font-size: 16px;
		color: var(--ink);
	}
	.co-off-serial {
		color: var(--ink);
	}
	.co-slow {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 14px 16px;
		border-radius: 20px;
		background: var(--peach);
		color: var(--peach-text);
		text-align: left;
	}
	.co-slow[hidden] {
		display: none;
	}
	.co-slow p {
		margin: 0;
		flex: 1 1 auto;
	}
	.co-actions {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
	}
	.co-note {
		margin: 4px 0 0;
		padding: 14px 18px;
		border-radius: 18px;
		background: var(--grey-100);
		font-size: 14px;
		line-height: 1.5;
	}
	/* Busy or offline: check.js sets .offline on the overlay. */
	.co-when-off,
	:global(.checking-overlay.offline) .co-when-busy {
		display: none;
	}
	:global(.checking-overlay.offline) .co-when-off {
		display: flex;
	}
	.co-bob {
		animation: bob 2.4s ease-in-out infinite;
	}
	@keyframes bob {
		50% {
			transform: translateY(-6px);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.co-bob {
			animation: none;
		}
	}
	/* The desktop designs (D3, D15): the picture on the left, the words on the right. */
	@media (min-width: 1024px) {
		.co {
			flex-direction: row;
			justify-content: center;
			gap: 72px;
		}
		.co-art {
			flex: 0 0 380px;
			width: 380px;
			height: 380px;
		}
		.co-art-off {
			flex-basis: 340px;
			width: 340px;
			height: 340px;
		}
		.co-text {
			align-items: flex-start;
			text-align: left;
			gap: 18px;
		}
		.co-text h2 {
			font-size: clamp(44px, 4.2vw, 60px);
			letter-spacing: -0.05em;
			line-height: 0.98;
		}
		.co-body {
			font-size: 18px;
		}
		.co-actions {
			justify-content: flex-start;
		}
		.co-actions .btn {
			min-height: 56px;
			padding: 0 28px;
		}
	}
</style>
