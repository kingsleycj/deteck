<script lang="ts">
	import '#lib/styles/business.css';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';
	import AppShell from '#lib/ui/AppShell.svelte';
	import { tagCompany } from '#lib/ui/tag-company.ts';

	let { data, children }: LayoutProps = $props();

	const sections = $derived([
		{
			label: data.company.name,
			items: [
				{ href: '/workspace', label: 'Overview', exact: true },
				{ href: '/workspace/products', label: 'Products and batches' },
				{ href: '/workspace/import', label: 'Import data' },
				{ href: '/workspace/packaging', label: 'Packaging photos' },
				{ href: '/workspace/businesses', label: 'Supply chain businesses' },
				...(data.features.reports
					? [{ href: '/workspace/reports', label: 'Reports of fakes' }]
					: []),
				{ href: '/workspace/company', label: 'Company and documents' },
				{ href: '/workspace/team', label: 'Team' },
				{ href: '/workspace/developers', label: 'API and webhooks' }
			]
		}
	]);
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>
<svelte:document onsubmitcapture={(e) => data.access.onBehalf && tagCompany(e, data.company.id)} />

<AppShell
	title="Manufacturer workspace"
	{sections}
	userName={data.access.userName}
	userRole={data.access.roleLabel}
>
	{#snippet banner()}
		{#if data.access.onBehalf}
			<p class="banner-on-behalf">
				You're working inside {data.company.name}'s workspace as DETECK staff. Everything you do
				here is recorded in the audit trail as on behalf of {data.company.name}.
				<a href="/console/manufacturers/{data.company.id}">Back to the console</a>
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
