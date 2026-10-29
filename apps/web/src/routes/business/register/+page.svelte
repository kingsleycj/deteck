<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';
	import Turnstile from '#lib/ui/Turnstile.svelte';
	import { NIGERIAN_STATES } from '@deteck/core/nigeria.ts';

	let { data, form }: PageProps = $props();
	const v = $derived(form?.values ?? ({} as Record<string, string>));
	const e = $derived((form?.errors ?? {}) as Record<string, string>);
	const errorCount = $derived(Object.keys(e).length);
</script>

<svelte:head><title>Register your company · DETECK</title></svelte:head>

{#snippet err(name: string)}
	{#if e[name]}<p class="error-text" id="{name}-error">{e[name]}</p>{/if}
{/snippet}

<AuthShell
	bubble="Everything you add is recorded under your company's name, so I can tell people who made each pack."
	wide
>
	<p><a href="/business">← DETECK for business</a></p>
	<div>
		<h1 style="font-size: 32px">Register your company</h1>
		<p class="muted" style="margin-top: 6px">
			A DETECK reviewer checks every application before you can add data. You'll get an email with
			the decision.
		</p>
		<p class="notice small" style="margin-top: 10px">
			This form is for drug manufacturers. Running a pharmacy, hospital or distributor?
			<a href="/business/register/pharmacy">Register it here</a>.
		</p>
	</div>

	{#if errorCount > 0}
		<p class="notice notice-error" role="alert">
			<strong>{errorCount} {errorCount === 1 ? 'thing' : 'things'} to fix</strong> before we can create
			your account. They're marked below. Attach your files again too: browsers clear them when a form
			comes back.
		</p>
	{/if}

	<form method="post" enctype="multipart/form-data" class="stack" style="--gap: 20px" novalidate>
		<section class="panel">
			<h2>Company</h2>
			<div class="form-grid">
				<div class="field span-2" class:field-error={e.companyName}>
					<label for="companyName">Manufacturer name</label>
					<input
						id="companyName"
						name="companyName"
						required
						value={v.companyName ?? ''}
						autocomplete="organization"
					/>
					{@render err('companyName')}
				</div>
				<div class="field span-2" class:field-error={e.address}>
					<label for="address">Address</label>
					<input
						id="address"
						name="address"
						required
						value={v.address ?? ''}
						autocomplete="street-address"
					/>
					{@render err('address')}
				</div>
				<div class="field" class:field-error={e.state}>
					<label for="state">State</label>
					<select id="state" name="state" required>
						<option value="">Choose a state</option>
						{#each NIGERIAN_STATES as s (s)}<option value={s} selected={v.state === s}>{s}</option
							>{/each}
					</select>
					{@render err('state')}
				</div>
				<div class="field">
					<label for="factoryTown">Factory town</label>
					<input
						id="factoryTown"
						name="factoryTown"
						value={v.factoryTown ?? ''}
						placeholder="e.g. Ota"
					/>
				</div>
				<div class="field" class:field-error={e.nafdacCompanyReg}>
					<label for="nafdacCompanyReg">NAFDAC company reg. no.</label>
					<input
						id="nafdacCompanyReg"
						name="nafdacCompanyReg"
						class="mono"
						required
						value={v.nafdacCompanyReg ?? ''}
						placeholder="From your certificate"
					/>
					{@render err('nafdacCompanyReg')}
				</div>
				<div class="field">
					<label for="cacRc">CAC reg. no.</label>
					<input
						id="cacRc"
						name="cacRc"
						class="mono"
						value={v.cacRc ?? ''}
						placeholder="RC 000000"
					/>
				</div>
			</div>
		</section>

		<section class="panel">
			<h2>You (the account admin)</h2>
			<p class="small muted">
				You can invite colleagues as Admins or Uploaders once you're approved.
			</p>
			<div class="form-grid">
				<div class="field" class:field-error={e.contactName}>
					<label for="contactName">Full name</label>
					<input
						id="contactName"
						name="contactName"
						required
						value={v.contactName ?? ''}
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
						value={v.contactEmail ?? ''}
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
						value={v.contactPhone ?? ''}
						placeholder="+234"
						autocomplete="tel"
					/>
				</div>
				<div></div>
				<div class="field" class:field-error={e.password}>
					<label for="password">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="10"
						autocomplete="new-password"
						aria-describedby="password-help"
					/>
					<p id="password-help" class="help">At least 10 characters, with a number and a symbol.</p>
					{@render err('password')}
				</div>
				<div class="field" class:field-error={e.confirm}>
					<label for="confirm">Confirm password</label>
					<input id="confirm" name="confirm" type="password" required autocomplete="new-password" />
					{@render err('confirm')}
				</div>
			</div>
		</section>

		<section class="panel">
			<h2>Documents</h2>
			<div class="form-grid">
				<div class="field" class:field-error={e.nafdacCertificate}>
					<label for="nafdacCertificate">NAFDAC certificate</label>
					<div class="file-drop">
						<input
							id="nafdacCertificate"
							name="nafdacCertificate"
							type="file"
							accept="application/pdf,image/jpeg,image/png"
							required
						/>
					</div>
					<p class="help">PDF, JPG or PNG, under 10 MB.</p>
					{@render err('nafdacCertificate')}
				</div>
				<div class="field" class:field-error={e.agreement}>
					<label for="agreement">Signed data-sharing agreement</label>
					<div class="file-drop">
						<input
							id="agreement"
							name="agreement"
							type="file"
							accept="application/pdf,image/jpeg,image/png"
						/>
					</div>
					<p class="help">
						Required before your first import. You can add it later.{#if data.agreementTemplate}
							<a href="/files/site/agreement_template">Download the blank agreement</a> to sign.{/if}
					</p>
					{@render err('agreement')}
				</div>
			</div>
		</section>

		<label class="row small" style="--gap: 10px; align-items: flex-start">
			<input
				type="checkbox"
				name="consent"
				required
				checked={v.consent === 'on'}
				style="margin-top: 3px"
			/>
			<span
				>I'm authorised to register this company, and I agree to DETECK's <a href="/terms">terms</a>
				and <a href="/privacy">privacy notice</a>.</span
			>
		</label>
		{@render err('consent')}

		<Turnstile siteKey={data.turnstile} />
		{#if e.form}<p class="error-text" role="alert">{e.form}</p>{/if}
		<button class="btn btn-primary">Submit application</button>
	</form>
</AuthShell>
