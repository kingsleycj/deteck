<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';
	import Turnstile from '#lib/ui/Turnstile.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Forgot password · DETECK</title></svelte:head>

<AuthShell
	bubble={form && 'sent' in form
		? 'Done. Check your inbox, and your spam folder just in case.'
		: "No worries. I'll send a reset link to your work email."}
	mood={form && 'sent' in form ? 'happy' : 'thinking'}
>
	<p><a href="/business/sign-in">← Back to sign in</a></p>
	{#if form && 'sent' in form}
		<h1 style="font-size: 30px">Check your email</h1>
		<p class="muted">
			If {form.email} belongs to an account, a reset link is on its way. It works once and expires in
			30 minutes.
		</p>
	{:else}
		<h1 style="font-size: 30px">Forgot your password?</h1>
		<p class="muted">Enter your work email and we'll send you a link to set a new one.</p>
		{#if form?.message}<p class="error-text" role="alert">{form.message}</p>{/if}
		<form method="post" class="stack" style="--gap: 14px">
			<div class="field">
				<label for="email">Work email</label>
				<input
					id="email"
					name="email"
					type="email"
					autocomplete="username"
					required
					value={form?.email ?? ''}
				/>
			</div>
			<Turnstile siteKey={data.turnstile} />
			<button class="btn btn-primary btn-block">Send reset link</button>
		</form>
	{/if}
</AuthShell>
