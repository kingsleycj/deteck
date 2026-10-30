<script lang="ts">
	import type { PageProps } from './$types';
	import PublicTop from '#lib/ui/PublicTop.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Terms of use · DETECK</title>
	<meta
		name="description"
		content="What a DETECK check can and can't tell you, and the rules for using the service."
	/>
</svelte:head>

<div class="shell">
	<PublicTop />
	{#if data.lang !== 'en'}<p class="notice small" lang={data.lang}>
			{data.t.common.englishOnly}
		</p>{/if}
	<main class="prose" lang="en">
		<p class="notice small">Draft for legal review before the pilot (OQ-06).</p>
		<h1>Terms of use</h1>
		<p class="muted small">Last updated 25 October 2026</p>

		<h2>What a check tells you</h2>
		<p>
			A DETECK check compares the serial number on a pack with the records its manufacturer shared
			with DETECK, and shows the journey those records describe. "Valid" means the serial matches
			those records. It does not test what is inside the pack, and it can't prove a pack hasn't been
			copied or tampered with. "Unrecognised" means we couldn't find the serial. That can happen
			because the manufacturer hasn't joined DETECK yet, or because the number was typed wrongly. It
			doesn't by itself mean the medicine is fake.
		</p>
		<p>
			The packaging check is a beta. It compares your photos with the manufacturer's photos and can
			miss differences or report differences that aren't there. When it isn't sure, it says so.
		</p>
		<p>
			<strong>Always follow the directions of your doctor or pharmacist.</strong> If a result worries
			you, show it to a pharmacist before you use the medicine, and report suspected fake medicines to
			NAFDAC.
		</p>

		<h2>Using the service</h2>
		<ul>
			<li>The public checker has no DETECK charge. Your mobile network may charge for data.</li>
			<li>
				Don't use automated tools to check serials in bulk, try to get around rate limits, or
				interfere with the service.
			</li>
			<li>
				Don't use DETECK to make public claims about a product or company without checking with them
				or with NAFDAC first.
			</li>
		</ul>

		<h2>Business accounts</h2>
		<p>
			Manufacturers are responsible for the accuracy of the records they upload and must have the
			right to share them. DETECK reviews each company before its records go live, may suspend
			records that look wrong, and records every change in an audit trail. Further terms for
			manufacturers are in the data-sharing agreement each company signs.
		</p>

		<h2>Availability and liability</h2>
		<p>
			We work to keep DETECK available and accurate, but we provide it as it is. To the extent the
			law allows, DETECK isn't liable for decisions made only on the basis of a check. Nothing in
			these terms limits rights you have under Nigerian consumer protection law.
		</p>

		<h2>Contact</h2>
		<p>
			{#if data.contactEmail}Questions about these terms: <a href="mailto:{data.contactEmail}"
					>{data.contactEmail}</a
				>.{:else}A contact address will be published here before the service opens to the public.{/if}
		</p>
	</main>
	<SiteFooter />
</div>
