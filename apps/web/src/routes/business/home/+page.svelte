<script lang="ts">
	import type { PageProps } from './$types';
	import AuthShell from '#lib/ui/AuthShell.svelte';

	let { data }: PageProps = $props();
</script>

<AuthShell bubble="Your account isn't linked to a company yet." mood="thinking">
	<h1 style="font-size: 28px">Hi {data.name}</h1>
	<p class="muted">
		Your account isn't part of a manufacturer or the DETECK team. If you expected access, ask your
		company admin, or DETECK, to invite you again with this email address.
	</p>
	<p class="small muted">
		To register a new company, sign out and register with a different work email: each email can
		belong to one account.
	</p>
	<form method="post" action="/business/sign-out">
		<button class="btn btn-block">Sign out</button>
	</form>
</AuthShell>
