<script lang="ts">
	/** Language choice for the public pages. A plain form, so it works without JavaScript. */
	import { page } from '$app/state';
	import { useT } from '#lib/i18n.ts';

	const t = $derived(useT());
	const languages = $derived((page.data.languages ?? []) as { code: string; name: string }[]);
	const current = $derived(languages.find((l) => l.code === page.data.lang)?.name ?? 'English');
	const next = $derived(
		(() => {
			const u = new URL(page.url.href);
			u.searchParams.delete('lang');
			return u.pathname + u.search;
		})()
	);
</script>

{#if languages.length > 1}
	<!-- Public pages run without JavaScript: the button itself opens and closes the menu. -->
	<details class="lang-menu">
		<summary aria-label="{t.common.language}: {current}">
			<svg
				viewBox="0 0 24 24"
				width="16"
				height="16"
				aria-hidden="true"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				><circle cx="12" cy="12" r="9" /><path
					d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
				/></svg
			>
			<span>{current}</span>
		</summary>
		<form method="post" action="/language">
			<input type="hidden" name="next" value={next} />
			{#each languages as l (l.code)}
				<button
					name="lang"
					value={l.code}
					lang={l.code}
					aria-current={l.code === page.data.lang ? 'true' : undefined}>{l.name}</button
				>
			{/each}
		</form>
	</details>
{/if}

<style>
	.lang-menu {
		position: relative;
	}
	.lang-menu summary {
		list-style: none;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 36px;
		padding: 6px 12px;
		border-radius: 999px;
		border: 1px solid var(--line);
		background: var(--white);
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
	}
	.lang-menu summary::-webkit-details-marker {
		display: none;
	}
	/* On narrow phones the globe alone, so longer page headers stay on one line. */
	@media (max-width: 400px) {
		.lang-menu summary span {
			display: none;
		}
	}
	.lang-menu form {
		position: absolute;
		right: 0;
		top: calc(100% + 6px);
		z-index: 20;
		display: grid;
		min-width: 180px;
		padding: 6px;
		border-radius: 14px;
		border: 1px solid var(--line);
		background: var(--white);
		box-shadow: 0 12px 32px rgba(11, 11, 15, 0.14);
	}
	.lang-menu button {
		text-align: left;
		padding: 10px 12px;
		min-height: 44px;
		border: 0;
		border-radius: 10px;
		background: none;
		font: inherit;
		color: inherit;
		cursor: pointer;
	}
	.lang-menu button:hover,
	.lang-menu button:focus-visible {
		background: var(--grey-100);
	}
	.lang-menu button[aria-current='true'] {
		font-weight: 700;
	}
</style>
