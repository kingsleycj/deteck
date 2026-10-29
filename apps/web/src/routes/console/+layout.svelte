<script lang="ts">
	import '#lib/styles/business.css';
	import type { LayoutProps } from './$types';
	import AppShell from '#lib/ui/AppShell.svelte';

	let { data, children }: LayoutProps = $props();

	// Reviewers don't see pages only an admin can open.
	const sections = $derived([
		{
			label: 'Manufacturers',
			items: [
				{ href: '/console/applications', label: 'Applications' },
				{ href: '/console/manufacturers', label: 'Manufacturers' },
				{ href: '/console/drugs', label: 'Drugs and batches' },
				{ href: '/console/businesses', label: 'Supply chain businesses' },
				{ href: '/console/business-accounts', label: 'Pharmacy accounts' }
			]
		},
		{
			label: 'Admin and monitoring',
			items: [
				{ href: '/console', label: 'Overview', exact: true },
				{ href: '/console/reports', label: 'Reports of fakes' },
				{ href: '/console/signals', label: 'Unusual checks' },
				{ href: '/console/scans', label: 'Packaging scans' },
				{ href: '/console/audit', label: 'Audit trail' },
				{ href: '/console/team', label: 'Team' },
				...(data.staff.isAdmin
					? [
							{ href: '/console/api-keys', label: 'Partner API keys' },
							{ href: '/console/settings', label: 'Settings' }
						]
					: [])
			]
		}
	]);
</script>

<svelte:head><meta name="robots" content="noindex" /></svelte:head>

<AppShell
	title="DETECK team console"
	{sections}
	userName={data.staff.name}
	userRole={data.staff.roleLabel}
>
	{@render children()}
</AppShell>
