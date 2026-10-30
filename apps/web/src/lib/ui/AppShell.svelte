<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import Logo from './Logo.svelte';

	interface NavItem {
		href: string;
		label: string;
		/** Match sub-pages too (default true, except for the area root). */
		exact?: boolean;
	}

	let {
		title,
		sections,
		userName,
		userRole,
		banner,
		children
	}: {
		title: string;
		sections: { label: string; items: NavItem[] }[];
		userName: string;
		userRole: string;
		banner?: Snippet;
		children: Snippet;
	} = $props();

	function current(item: NavItem) {
		const path = page.url.pathname;
		return item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
	}
	const here = $derived(sections.flatMap((s) => s.items).find(current)?.label);
</script>

<div class="app">
	<aside class="sidebar">
		<div class="side-top">
			<a href="/business/home" class="brand"><Logo height={28} inverse /><span>{title}</span></a>
			<!-- Phones: the sections fold away behind this, so the page starts at the top. A checkbox
			     and its label work without JavaScript. Wide screens always show the sections. -->
			<label for="nav-open" class="nav-button">Menu{here ? ` · ${here}` : ''}</label>
		</div>
		<input id="nav-open" class="nav-open" type="checkbox" aria-label="Show the sections" />
		<nav aria-label="Sections">
			{#each sections as section (section.label)}
				<span class="section">{section.label.toUpperCase()}</span>
				{#each section.items as item (item.href)}
					<a href={item.href} aria-current={current(item) ? 'page' : undefined}>{item.label}</a>
				{/each}
			{/each}
		</nav>
		<div class="who">
			<strong>{userName}</strong>
			<div class="role">{userRole}</div>
			<form method="post" action="/business/sign-out">
				<button class="link-button">Sign out</button>
			</form>
		</div>
	</aside>
	<main class="app-main">
		{#if banner}{@render banner()}{/if}
		{@render children()}
	</main>
</div>
