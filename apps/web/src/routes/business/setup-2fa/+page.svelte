<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';
	import PasswordInput from '#lib/ui/PasswordInput.svelte';

	let { data, form }: PageProps = $props();
	const verifying = $derived(form?.step === 'verify');
</script>

<svelte:head><title>Set up two-step sign-in · DETECK</title></svelte:head>

<AuthShell
	bubble="Two-step sign-in keeps the records safe even if a password leaks. It takes a minute."
	mood="happy"
>
	<div>
		<p class="small muted">Signed in as {data.email}</p>
		<h1 style="font-size: 30px; margin-top: 6px">Set up two-step sign-in</h1>
		<p class="muted" style="margin-top: 6px">
			Every DETECK business account uses an authenticator app (such as Google Authenticator or
			Microsoft Authenticator). No SMS needed.
		</p>
	</div>

	{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
			{form.message}
		</p>{/if}

	{#if !verifying}
		<form method="post" action="?/start" class="stack" style="--gap: 14px">
			<div class="field">
				<label for="password">Confirm your password</label>
				<PasswordInput id="password" name="password" autocomplete="current-password" required />
			</div>
			<button class="btn btn-primary btn-block">Continue</button>
		</form>
	{:else if form && 'uri' in form}
		<ol class="steps">
			<li>
				<div class="stack" style="--gap: 10px">
					<p><strong>Scan this code</strong> with your authenticator app.</p>
					{#if form.qr}<div class="qr" aria-label="QR code for your authenticator app">
							<!-- eslint-disable-next-line svelte/no-at-html-tags -- SVG generated on the server by the qrcode package -->
							{@html form.qr}
						</div>{/if}
					<p class="small muted">
						Can't scan? Enter this key: <span class="mono" style="word-break: break-all"
							>{form.secret}</span
						>
					</p>
				</div>
			</li>
			{#if form.backupCodes?.length}
				<li>
					<div class="stack" style="--gap: 10px">
						<p>
							<strong>Save these backup codes</strong> somewhere safe. Each works once if you lose your
							phone. They are shown only now.
						</p>
						<div class="backup-codes">
							{#each form.backupCodes as code (code)}<span>{code}</span>{/each}
						</div>
					</div>
				</li>
			{/if}
			<li>
				<form method="post" action="?/verify" class="stack" style="--gap: 10px; width: 100%">
					<input type="hidden" name="uri" value={form.uri} />
					<input type="hidden" name="backup" value={form.backupCodes?.join(',') ?? ''} />
					<label for="code"><strong>Enter the 6-digit code</strong> your app shows.</label>
					<input
						id="code"
						name="code"
						class="input code-input"
						inputmode="numeric"
						autocomplete="one-time-code"
						maxlength="6"
						required
					/>
					<button class="btn btn-primary btn-block">Turn on two-step sign-in</button>
				</form>
			</li>
		</ol>
	{/if}
</AuthShell>
