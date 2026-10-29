<script lang="ts">
	/** Cloudflare's "are you human?" widget. Renders nothing when Turnstile isn't set up. */
	let { siteKey }: { siteKey: string | null } = $props();
</script>

<svelte:head>
	{#if siteKey}<script
			src="https://challenges.cloudflare.com/turnstile/v0/api.js"
			async
			defer
		></script>{/if}
</svelte:head>

{#if siteKey}<div class="cf-turnstile" data-sitekey={siteKey}></div>{/if}
