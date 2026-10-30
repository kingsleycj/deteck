<script lang="ts">
	import type { PageProps } from './$types';
	import PublicTop from '#lib/ui/PublicTop.svelte';
	import SiteFooter from '#lib/ui/SiteFooter.svelte';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Privacy notice · DETECK</title>
	<meta
		name="description"
		content="What DETECK collects when you check a medicine or use a business account, why, and how long it is kept."
	/>
</svelte:head>

<div class="shell">
	<PublicTop />
	{#if data.lang !== 'en'}<p class="notice small" lang={data.lang}>
			{data.t.common.englishOnly}
		</p>{/if}
	<main class="prose" lang="en">
		<p class="notice small">
			Draft for legal review before the pilot (OQ-06). It describes how the service is built today.
		</p>
		<h1>Privacy notice</h1>
		<p class="muted small">Last updated 26 October 2026</p>

		<h2>The short version</h2>
		<ul>
			<li>
				You don't need an account to check a medicine, and we don't ask for your name, phone number
				or email.
			</li>
			<li>
				We never store the serial numbers you type in a readable form. We keep a one-way code so we
				can count checks.
			</li>
			<li>
				Photos you take for the packaging check are deleted within 24 hours unless you choose to let
				us keep them for 90 days.
			</li>
			<li>
				If you report a suspected fake or sign up for recall alerts, you choose what to give us, and
				we use it only for that.
			</li>
			<li>We don't sell data and we don't show adverts.</li>
		</ul>

		<h2>Who we are</h2>
		<p>
			DETECK runs this website. Under the Nigeria Data Protection Act 2023 we are the data
			controller for the information described here.
			{#if data.contactEmail}Contact us at <a href="mailto:{data.contactEmail}"
					>{data.contactEmail}</a
				>.{:else}Our contact address will be published here before the service opens to the public.{/if}
		</p>

		<h2>When you check a medicine</h2>
		<div class="table-scroll">
			<table>
				<thead><tr><th>What</th><th>Why</th><th>How long</th></tr></thead>
				<tbody>
					<tr
						><td>The serial number you type or scan</td><td
							>To look it up in the manufacturer's records. It is stored only as a one-way code (a
							keyed hash), never as the number itself, and never appears in a web address.</td
						><td>The result page works for 30 minutes</td></tr
					>
					<tr
						><td
							>A record that a check happened: the result, the product and batch, the date, and your
							state if your network provider reveals it</td
						><td
							>To show manufacturers and DETECK where checks happen and to spot unusual patterns,
							such as one serial checked in many places</td
						><td>13 months</td></tr
					>
					<tr
						><td>A random device code in a cookie (<span class="mono">dtk_d</span>)</td><td
							>To stop automated abuse with rate limits, and to count devices. For counting we
							change it into a different code every day, so days can't be linked</td
						><td>The cookie lasts a year; you can delete it at any time</td></tr
					>
					<tr
						><td>Your IP address</td><td>Rate limits that protect the service from abuse</td><td
							>Up to a day</td
						></tr
					>
					<tr
						><td>Your language choice in a cookie (<span class="mono">dtk_lang</span>)</td><td
							>To show the site in the language you picked</td
						><td>A year</td></tr
					>
					<tr
						><td
							>If you check many packs: Cloudflare's "are you human?" check, and a cookie saying you
							passed it (<span class="mono">dtk_human</span>)</td
						><td
							>To let people carry on checking while stopping automated abuse. Cloudflare looks at
							signals from your browser to tell people from programs</td
						><td>Up to a day</td></tr
					>
				</tbody>
			</table>
		</div>

		<h2>When you use the packaging check (beta)</h2>
		<p>
			If you take photos of a pack, we send them to our AI provider, Anthropic, which compares them
			with photos the manufacturer supplied and sends back a short answer. Anthropic processes the
			photos on our behalf under its commercial terms. We delete your photos within 24 hours. If you
			tick the box to help us measure accuracy, we keep them for 90 days and then delete them. Try
			not to include people, faces or prescriptions in the photos.
		</p>

		<h2>When you report a suspected fake</h2>
		<p>
			A report holds what you tell us: the medicine, where and when you bought it, what worried you,
			up to three photos, and, only if you choose, your name, email and phone number so a DETECK
			reviewer can ask follow-up questions. If you tick the box, we may share the report and photos
			with NAFDAC and the manufacturer. We never share your contact details with them or with the
			seller. We delete the photos and your contact details 12 months after the report is closed,
			and keep what was found.
		</p>
		<h2>When you sign up for recall alerts</h2>
		<p>
			You give us an email address or a WhatsApp number to hear if one batch is recalled or
			withdrawn. We use it only for that alert. Emails are confirmed by a link first. We delete the
			address 30 days after the batch expires, or straight away when you tap "stop alerts". WhatsApp
			messages are sent through Meta's WhatsApp Business Platform, so Meta processes the number and
			the message.
		</p>
		<h2>If you have a business account</h2>
		<p>
			Manufacturers, pharmacies, hospitals, distributors, wholesalers and DETECK staff sign in with
			a work email, a password and two-step sign-in. We keep your name, work email, role, company
			details, the documents you upload for review, and a record of what each account does (the
			audit trail). We keep the audit trail for as long as the company uses DETECK and for six years
			after, because it is how we show who changed which records. Other account details are deleted
			within 90 days of an account being closed, unless the law requires us to keep them.
		</p>
		<p>
			Supply chain records that manufacturers upload, and receipts that pharmacies and distributors
			confirm, include the names, roles and locations of businesses that handled a medicine. We show
			the public only the business name, role and town or state, never contact details.
		</p>
		<p>
			Businesses and partner apps can use DETECK's API with a key. We store only a one-way code of
			each key, and a record of what each key did (the audit trail). Manufacturers can ask DETECK to
			send notices to their own systems (webhooks); these carry drug and batch details, never the
			personal details of people who checked or reported a pack.
		</p>

		<h2>Who else handles data</h2>
		<ul>
			<li>
				Render (hosting and database, in Frankfurt, Germany) and Cloudflare (network, security and
				file storage)
			</li>
			<li>Resend (emails: business accounts, report follow-ups and recall alerts)</li>
			<li>Anthropic (the packaging check photos, only if you use it)</li>
			<li>Meta (WhatsApp recall alerts, only if you choose WhatsApp)</li>
			<li>
				Sentry (reports of errors in our software; we switch off its collection of IP addresses,
				cookies and form contents)
			</li>
		</ul>
		<p>
			Some of these providers process data outside Nigeria. We rely on their contractual safeguards
			for those transfers.
		</p>

		<h2>Your rights</h2>
		<p>
			You can ask to see, correct or delete personal data we hold about you, or object to how we use
			it. Because the public checker doesn't know who you are, we usually can't link checks to you,
			and deleting the <span class="mono">dtk_d</span> cookie is the quickest way to start fresh. If you're
			unhappy with how we handle your data, you can complain to the Nigeria Data Protection Commission.
		</p>
	</main>
	<SiteFooter />
</div>
