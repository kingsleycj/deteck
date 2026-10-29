<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	let { data, form }: PageProps = $props();
	const method = $derived(form?.method ?? 'totp');
</script>

<svelte:head><title>Enter your code · DETECK</title></svelte:head>

<AuthShell bubble="One more step. This keeps the records safe even if a password leaks.">
	<p><a href="/business/sign-in">← Back</a></p>
	<div>
		<h1 style="font-size: 30px">
			{method === 'backup' ? 'Enter a backup code' : 'Enter your 6-digit code'}
		</h1>
		<p class="muted" style="margin-top: 6px">
			{#if method === 'backup'}
				Each backup code works once.
			{:else}
				Open your authenticator app and enter the code for DETECK.
			{/if}
		</p>
	</div>

	{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
			{form.message}
		</p>{/if}

	<form method="post" action="?/{method}" class="stack" style="--gap: 14px">
		<input type="hidden" name="next" value={data.next} />
		<div class="field">
			<label for="code">{method === 'backup' ? 'Backup code' : 'Sign-in code'}</label>
			<input
				id="code"
				name="code"
				class="code-input"
				inputmode={method === 'backup' ? 'text' : 'numeric'}
				autocomplete="one-time-code"
				maxlength={method === 'backup' ? 20 : 6}
				required
			/>
		</div>
		<label class="row small" style="--gap: 8px"
			><input type="checkbox" name="trust" /> Trust this device for 30 days</label
		>
		<button class="btn btn-primary btn-block">Verify and sign in</button>
	</form>

	<details>
		<summary>Can't use your authenticator app?</summary>
		<div class="stack" style="--gap: 10px; margin-top: 12px">
			<form method="post" action="?/backup" class="row">
				<input type="hidden" name="next" value={data.next} />
				<input
					name="code"
					class="input"
					placeholder="Backup code"
					style="max-width: 220px"
					autocomplete="off"
				/>
				<button class="btn btn-small">Use backup code</button>
			</form>
			<p class="small muted">
				Lost your phone and your backup codes? Ask your company admin, or DETECK, to reset your
				two-step sign-in. You'll set it up again next time you sign in.
			</p>
		</div>
	</details>
</AuthShell>
