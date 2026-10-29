<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Set a new password · DETECK</title></svelte:head>

<AuthShell bubble="Choose a password you don't use anywhere else." mood="thinking">
	<h1 style="font-size: 30px">Set a new password</h1>
	{#if !data.token || (form && 'expired' in form && form.expired)}
		<p class="notice notice-error">
			{form?.message ?? 'This reset link is missing or has expired.'}
		</p>
		<a href="/business/forgot" class="btn btn-block">Send a new link</a>
	{:else}
		{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
		<form method="post" class="stack" style="--gap: 14px">
			<input type="hidden" name="token" value={data.token} />
			<div class="field">
				<label for="password">New password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					minlength="10"
					required
					aria-describedby="pw-rules"
				/>
			</div>
			<div class="field">
				<label for="confirm">Confirm new password</label>
				<input id="confirm" name="confirm" type="password" autocomplete="new-password" required />
			</div>
			<p id="pw-rules" class="help">At least 10 characters, with a number and a symbol.</p>
			<button class="btn btn-primary btn-block">Save new password</button>
		</form>
	{/if}
</AuthShell>
