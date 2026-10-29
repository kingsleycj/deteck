<script lang="ts">
	import '#lib/styles/business.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import AppShell from '#lib/ui/AppShell.svelte';
	import { tagCompany } from '#lib/ui/tag-company.ts';

	let { data, children }: LayoutProps = $props();

	const sections = $derived([
		{
			label: data.business.name,
			items: [
				{ href: '/portal', label: 'Overview', exact: true },
				{ href: '/portal/check', label: 'Check a delivery' },
				{ href: '/portal/receipts', label: 'Received stock' },
				{ href: '/portal/company', label: 'Business and documents' },
				{ href: '/portal/team', label: 'Team' },
				{ href: '/portal/api', label: 'API keys' }
			]
		}
	]);
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<svelte:document onsubmitcapture={(e) => data.access.onBehalf && tagCompany(e, data.business.id)} />

<AppShell
	title="{data.business.roleLabel} portal"
	{sections}
	userName={data.access.userName}
	userRole={data.access.roleLabel}
>
	{#snippet banner()}
		{#if data.access.onBehalf}
			<p class="banner-on-behalf">
				You're working inside {data.business.name}'s portal as DETECK staff. Everything you do here
				is recorded in the audit trail.
				<a href="/console/business-accounts/{data.business.id}">Back to the console</a>
			</p>
		{/if}
		{#if page.url.searchParams.has('readonly')}
			<p class="notice notice-error" role="alert">
				Nothing was saved: DETECK reviewers can look at a company's data but not change it. Ask a
				DETECK admin.
			</p>
		{/if}
	{/snippet}
	{@render children()}
</AppShell>
