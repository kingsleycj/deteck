<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Sign in · DETECK</title></svelte:head>

<AuthShell
	bubble={form?.locked
		? "Too many wrong tries, so I've paused sign-in for this account here for 30 minutes to keep it safe."
		: 'Hi again. Sign in and I’ll show you your records.'}
	mood={form?.locked ? 'concerned' : 'wink'}
>
	<div>
		<h1 style="font-size: 32px">Sign in</h1>
		<p class="muted" style="margin-top: 6px">
			For manufacturers, pharmacies, hospitals, distributors and the DETECK team. Use your work
			email.
		</p>
	</div>

	{#if data.notice === 'registered'}
		<p class="notice notice-ok">
			Application received. Sign in to set up two-step sign-in and follow your application.
		</p>
	{:else if data.notice === 'joined'}
		<p class="notice notice-ok">
			Your account is ready. Sign in to finish setting up two-step sign-in.
		</p>
	{:else if data.notice === 'signed-out'}
		<p class="notice notice-info">You're signed out.</p>
	{:else if data.notice === 'password-updated'}
		<p class="notice notice-ok">
			Password updated. You've been signed out on other devices. Sign in with your new password.
		</p>
	{/if}

	{#if form?.locked}
		<div class="notice notice-error" role="alert">
			<p>
				<strong>Sign-in paused.</strong> Too many wrong tries from this network. You can sign in again
				in 30 minutes. If you've forgotten your password, reset it now and use the new one when the lock
				ends.
			</p>
			<p style="margin-top: 8px"><a href="/business/forgot">Reset password</a></p>
		</div>
	{:else if form?.message}
		<p class="notice notice-error" role="alert">{form.message}</p>
	{/if}

	<form method="post" class="stack" style="--gap: 14px">
		<input type="hidden" name="next" value={data.next} />
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
		<div class="field">
			<div class="row" style="justify-content: space-between">
				<label for="password">Password</label>
				<a href="/business/forgot" class="small">Forgot password?</a>
			</div>
			<input
				id="password"
				name="password"
				type="password"
				autocomplete="current-password"
				required
			/>
		</div>
		<label class="row small" style="--gap: 8px"
			><input type="checkbox" name="remember" /> Keep me signed in on this device</label
		>
		<button class="btn btn-primary btn-block">Sign in</button>
		<p class="help">Next, you'll enter a code from your authenticator app to finish signing in.</p>
	</form>

	<p class="small">
		New to DETECK? <a href="/business/register">Register a manufacturer</a> or
		<a href="/business/register/pharmacy">a pharmacy, hospital or distributor</a>
	</p>
</AuthShell>
