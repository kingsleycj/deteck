<script lang="ts">
	import '../app.css';
	import { afterNavigate } from '$app/navigation';
	import favicon from '#lib/assets/favicon.svg';
	import { markScrollRegions } from '#lib/ui/scroll-regions.ts';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	afterNavigate(() => markScrollRegions());
	$effect(() => {
		let timer: ReturnType<typeof setTimeout>;
		const onResize = () => {
			clearTimeout(timer);
			timer = setTimeout(() => markScrollRegions(), 200);
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#FBFBF9" />
</svelte:head>

{@render children()}
