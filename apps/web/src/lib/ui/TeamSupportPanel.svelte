<script lang="ts">
	import { confirmFirst } from '#lib/ui/confirm.ts';
	/**
	 * A company's team, for DETECK staff. Admins can reset a member's two-step sign-in when they've
	 * lost their phone and backup codes and their company has no other admin to do it.
	 */
	let {
		members,
		canReset
	}: {
		members: {
			userId: string;
			name: string;
			email: string;
			role: string;
			twoFactor: boolean | null;
		}[];
		canReset: boolean;
	} = $props();
</script>

<section class="panel">
	<h3>Team</h3>
	{#each members as m (m.userId)}
		<div class="small" style="margin-top: 10px">
			<strong>{m.name}</strong> · {m.role === 'member' ? 'Member' : 'Admin'}<br /><span
				class="tiny muted"
				>{m.email} · two-step sign-in {m.twoFactor ? 'on' : 'not set up yet'}</span
			>
			{#if canReset && m.twoFactor}
				<form method="post" action="?/reset2fa" style="margin-top: 4px">
					<input type="hidden" name="userId" value={m.userId} />
					<button
						class="btn btn-small"
						use:confirmFirst={`Reset ${m.name}'s two-step sign-in? They're signed out and set it up again at their next sign-in.`}
						>Reset two-step sign-in</button
					>
				</form>
			{/if}
		</div>
	{:else}
		<p class="small muted">No members.</p>
	{/each}
	{#if canReset}
		<p class="tiny muted" style="margin-top: 10px">
			Reset only after confirming who's asking, for example by calling the number on their
			application. They're signed out and set it up again at their next sign-in.
		</p>
	{/if}
</section>
