<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Join the DETECK team</title></svelte:head>

{#if data.state !== 'ok'}
	<AuthShell
		bubble="This invite has expired. Ask the admin who invited you to send a new one."
		mood="thinking"
	>
		<h1 style="font-size: 28px">This invite no longer works</h1>
		<p class="muted">
			Invites work once and expire after 7 days. Admins can resend one from the Team page.
		</p>
		<a href="/business/sign-in" class="btn btn-block">Already have an account? Sign in</a>
	</AuthShell>
{:else}
	<AuthShell bubble="Welcome to the team. Your invite tells me which role you have." mood="happy">
		<div>
			<h1 style="font-size: 30px">Create your team account</h1>
			<p class="muted" style="margin-top: 6px">
				{data.name}, you're joining the DETECK team as <strong>{data.role}</strong> with {data.email}.
			</p>
		</div>
		{#if data.note}<p class="notice notice-info">"{data.note}"</p>{/if}
		{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}
		<form method="post" class="stack" style="--gap: 14px">
			<div class="field">
				<label for="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					required
					minlength="10"
					autocomplete="new-password"
				/>
			</div>
			<div class="field">
				<label for="confirm">Confirm password</label>
				<input id="confirm" name="confirm" type="password" required autocomplete="new-password" />
			</div>
			<p class="help">
				At least 10 characters, with a number and a symbol. Next, you'll set up two-step sign-in.
			</p>
			<button class="btn btn-primary btn-block">Create account</button>
		</form>
	</AuthShell>
{/if}
