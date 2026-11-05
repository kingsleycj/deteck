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
	<aside class="auth-side smiles-lime">
		<svg class="auth-swoosh" viewBox="12 28 40 22" aria-hidden="true"
			><path d="M15 31 C 18 53, 46 53, 49 31 C 43 46, 21 46, 15 31 Z" /></svg
		>
		<a href="/" style="display: inline-flex"><Logo height={30} inverse /></a>
		<p class="small" style="color: #c9cbd4">DETECK for business</p>
		<!-- A tagline, not the page title: each page has its own h1 in the card beside it. -->
		<p class="auth-tagline">The records behind every check.</p>
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
