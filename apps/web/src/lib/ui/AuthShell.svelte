<script lang="ts">
	import type { Snippet } from 'svelte';
	import Logo from './Logo.svelte';
	import Mascot from './Mascot.svelte';

	let {
		bubble,
		mood = 'wink',
		wide = false,
		children
	}: {
		bubble: string;
		mood?: 'wink' | 'happy' | 'thinking' | 'concerned';
		wide?: boolean;
		children: Snippet;
	} = $props();
</script>

<div class="auth">
	<aside class="auth-side">
		<a href="/" style="display: inline-flex"><Logo height={30} inverse /></a>
		<p class="small" style="color: #c9cbd4">DETECK for business</p>
		<h1>The records behind every check.</h1>
		<p>
			Manufacturers share their products, serials, supply chain records and packaging photos so
			people can check medicines against them. DETECK reviews every company before its records go
			live.
		</p>
		<div class="hero-row" style="margin-top: auto">
			<div class="hero-mascot" style="flex-basis: 110px; width: 110px"><Mascot {mood} /></div>
			<p class="bubble bubble-left">{bubble}</p>
		</div>
	</aside>
	<main class="auth-main">
		<div class="auth-card" class:wide>
			{@render children()}
		</div>
	</main>
</div>
