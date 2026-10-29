<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Join your team · DETECK</title></svelte:head>

{#if data.state !== 'ok'}
	<AuthShell
		bubble="This invite has expired. Ask the admin who invited you to send a new one."
		mood="thinking"
	>
		<h1 style="font-size: 28px">This invite no longer works</h1>
		<p class="muted">
			Invites work once and expire after 7 days. Admins can send a new one from their Team page.
		</p>
		<a href="/business/sign-in" class="btn btn-block">Already have an account? Sign in</a>
	</AuthShell>
{:else}
	<AuthShell bubble="Welcome. Your invite tells me which company and role you have." mood="happy">
		<div>
			<h1 style="font-size: 30px">Join {data.company}</h1>
			<p class="muted" style="margin-top: 6px">
				You've been invited as <strong>{data.role}</strong> with {data.email}.
			</p>
		</div>
		{#if form?.message}<p class="notice notice-error" role="alert">{form.message}</p>{/if}

		{#if data.hasAccount}
			{#if data.signedInAs === data.email}
				<form method="post" action="?/accept">
					<button class="btn btn-primary btn-block">Accept and join</button>
				</form>
			{:else if data.signedInAs}
				<!-- Signed in as someone else: sign-in would bounce straight back here, so sign out first. -->
				<p>
					You're signed in as {data.signedInAs}. Sign out, then sign in as {data.email} to accept.
				</p>
				<form method="post" action="/business/sign-out">
					<button class="btn btn-primary btn-block">Sign out</button>
				</form>
			{:else}
				<p>You already have a DETECK account. Sign in as {data.email} to accept.</p>
				<a
					class="btn btn-primary btn-block"
					href="/business/sign-in?next={encodeURIComponent(`/business/join/${data.id}`)}">Sign in</a
				>
			{/if}
		{:else}
			<form method="post" action="?/create" class="stack" style="--gap: 14px">
				<div class="field">
					<label for="name">Full name</label>
					<input id="name" name="name" required autocomplete="name" value={form?.name ?? ''} />
				</div>
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
		{/if}
	</AuthShell>
{/if}
