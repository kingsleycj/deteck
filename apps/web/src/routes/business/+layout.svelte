<script lang="ts">
	import '#lib/styles/business.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

{@render children()}
