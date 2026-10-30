<script lang="ts">
	import { markInvalidFields } from '#lib/client/fields.ts';
	import Upload from '#lib/ui/Upload.svelte';
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';
	import PasswordInput from '#lib/ui/PasswordInput.svelte';
	import Turnstile from '#lib/ui/Turnstile.svelte';
	import { NIGERIAN_STATES } from '@deteck/core/nigeria.ts';

	let { data, form }: PageProps = $props();
	const v = $derived(form?.values ?? ({} as Record<string, string>));
	const e = $derived((form?.errors ?? {}) as Record<string, string>);
	const errorCount = $derived(Object.keys(e).length);
	const roles = [
		['pharmacy', 'Pharmacy'],
		['hospital', 'Hospital or clinic'],
		['distributor', 'Distributor'],
		['wholesaler', 'Wholesaler']
	] as const;

	// Each time the form comes back with problems, point screen readers (and the focus) at them.
	$effect(() => {
		if (form) markInvalidFields();
	});
</script>

<svelte:head><title>Register a pharmacy, hospital or distributor · DETECK</title></svelte:head>

{#snippet err(name: string)}
	{#if e[name]}<p class="error-text" id="{name}-error">{e[name]}</p>{/if}
{/snippet}

<AuthShell
	bubble="Once DETECK checks your licence, you can check a whole delivery at once and confirm what you received."
	wide
>
	<p><a href="/business">← DETECK for business</a></p>
	<div>
		<h1 style="font-size: 32px">Register a pharmacy, hospital or distributor</h1>
		<p class="muted" style="margin-top: 6px">
			A DETECK reviewer checks your PCN premises licence before your account opens. Your business
			then shows as "Verified by DETECK" in the journeys of the medicines you stock.
		</p>
	</div>

	{#if errorCount > 0}
		<p class="notice notice-error" role="alert">
			<strong>{errorCount} {errorCount === 1 ? 'thing' : 'things'} to fix.</strong> They're marked below.
			Attach your files again too: browsers clear them when a form comes back.
		</p>
	{/if}

	<form method="post" enctype="multipart/form-data" class="stack" style="--gap: 20px" novalidate>
		<section class="panel">
			<h2>Business</h2>
			<div class="form-grid">
				<div class="field span-2" class:field-error={e.name}>
					<label for="name">Business name</label>
					<input
						id="name"
						name="name"
						required
						defaultValue={v.name ?? ''}
						autocomplete="organization"
					/>
					{@render err('name')}
				</div>
				<div class="field" class:field-error={e.role}>
					<label for="role">Type of business</label>
					<!-- defaultValue, not value: a type picked before the script loads is kept. -->
					<select id="role" name="role" required defaultValue={v.role ?? data.role}>
						<option value="">Choose one</option>
						{#each roles as [value, label] (value)}<option {value}>{label}</option>{/each}
					</select>
					{@render err('role')}
				</div>
				<div class="field" class:field-error={e.pcnLicence}>
					<label for="pcnLicence">PCN premises licence no.</label>
					<input id="pcnLicence" name="pcnLicence" required defaultValue={v.pcnLicence ?? ''} />
					{@render err('pcnLicence')}
				</div>
				<div class="field span-2" class:field-error={e.address}>
					<label for="address">Address</label>
					<input
						id="address"
						name="address"
						required
						defaultValue={v.address ?? ''}
						autocomplete="street-address"
					/>
					{@render err('address')}
				</div>
				<div class="field" class:field-error={e.state}>
					<label for="state">State</label>
					<!-- Untouched when the page's script loads, as on the manufacturer form: no value
					     attributes, and defaultValue only marks the server's choice. -->
					<select id="state" name="state" required defaultValue={v.state ?? ''}>
						<option label="Choose a state"></option>
						{#each NIGERIAN_STATES as s (s)}<option>{s}</option>{/each}
					</select>
					{@render err('state')}
				</div>
				<div class="field">
					<label for="town">Town or area</label>
					<input id="town" name="town" defaultValue={v.town ?? ''} />
				</div>
				<div class="field">
					<label for="cacRc">CAC reg. no. (optional)</label>
					<input id="cacRc" name="cacRc" defaultValue={v.cacRc ?? ''} />
				</div>
				<div class="field" class:field-error={e.gln}>
					<label for="gln">GS1 GLN (optional)</label>
					<input id="gln" name="gln" inputmode="numeric" defaultValue={v.gln ?? ''} />
					{@render err('gln')}
				</div>
				<div class="field span-2">
					<Upload
						id="pcnLicenceFile"
						name="pcnLicenceFile"
						title="PCN premises licence"
						hint="PDF, JPG or PNG, under 10 MB"
						accept="application/pdf,image/jpeg,image/png"
						required
						error={e.pcnLicenceFile}
					/>
				</div>
			</div>
		</section>

		<section class="panel">
			<h2>You (the account admin)</h2>
			<div class="form-grid">
				<div class="field" class:field-error={e.contactName}>
					<label for="contactName">Full name</label>
					<input
						id="contactName"
						name="contactName"
						required
						defaultValue={v.contactName ?? ''}
						autocomplete="name"
					/>
					{@render err('contactName')}
				</div>
				<div class="field" class:field-error={e.contactEmail}>
					<label for="contactEmail">Work email</label>
					<input
						id="contactEmail"
						name="contactEmail"
						type="email"
						required
						defaultValue={v.contactEmail ?? ''}
						autocomplete="email"
					/>
					{@render err('contactEmail')}
				</div>
				<div class="field">
					<label for="contactPhone">Phone</label>
					<input
						id="contactPhone"
						name="contactPhone"
						type="tel"
						defaultValue={v.contactPhone ?? ''}
						autocomplete="tel"
					/>
				</div>
				<div></div>
				<div class="field" class:field-error={e.password}>
					<label for="password">Password</label>
					<PasswordInput
						id="password"
						name="password"
						required
						minlength={10}
						autocomplete="new-password"
					/>
					<p class="help">At least 10 characters, with a number and a symbol.</p>
					{@render err('password')}
				</div>
				<div class="field" class:field-error={e.confirm}>
					<label for="confirm">Confirm password</label>
					<PasswordInput id="confirm" name="confirm" required autocomplete="new-password" />
					{@render err('confirm')}
				</div>
			</div>
		</section>

		<label class="option" class:field-error={e.consent}
			><input type="checkbox" name="consent" checked={v.consent === 'on'} />
			<span
				>I'm authorised to register this business, and I agree to DETECK's <a href="/terms">terms</a
				>
				and
				<a href="/privacy">privacy notice</a>.</span
			></label
		>
		{@render err('consent')}
		<Turnstile siteKey={data.turnstile} />
		{#if e.form}<p class="error-text" role="alert">{e.form}</p>{/if}
		<button class="btn btn-primary btn-block">Submit application</button>
	</form>
</AuthShell>
