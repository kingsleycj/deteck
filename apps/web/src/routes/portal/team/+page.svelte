<script lang="ts">
	import { confirmFirst } from '#lib/ui/confirm.ts';
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const roleLabel = (r: string) => (r === 'admin' || r === 'owner' ? 'Admin' : 'Staff');
</script>

<svelte:head><title>Team · DETECK</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs"><a href="/portal">Overview</a> / Team</p>
		<h1>Team</h1>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<section class="stats">
	<div class="stat">
		<span class="k">Admin</span><span class="d">Everything, including the team and API keys</span>
	</div>
	<div class="stat">
		<span class="k">Staff</span><span class="d">Checks deliveries and confirms received stock</span>
	</div>
</section>

<div class="table-wrap">
	<table class="data">
		<thead
			><tr
				><th>Member</th><th>Role</th><th>Two-step sign-in</th><th>Joined</th
				>{#if data.access.isAdmin && !data.access.onBehalf}<th>Actions</th>{/if}</tr
			></thead
		>
		<tbody>
			{#each data.members as m (m.id)}
				<tr>
					<td
						><strong>{m.name}</strong>{#if m.userId === data.me}<span class="muted"
								>&nbsp;(you)</span
							>{/if}<span class="sub">{m.email}</span></td
					>
					<td>{roleLabel(m.role)}</td>
					<td>{m.twoFactor ? 'On' : 'Not set up yet'}</td>
					<td>{formatDateTime(m.joinedAt)}</td>
					{#if data.access.isAdmin && !data.access.onBehalf}
						<td>
							{#if m.userId !== data.me}
								<div class="row" style="--gap: 6px">
									<form method="post" action="?/role" class="row" style="--gap: 6px">
										<input type="hidden" name="memberId" value={m.id} />
										<select
											name="role"
											class="input"
											style="min-height: 40px; width: auto"
											aria-label="Role for {m.name}"
										>
											<option value="admin" selected={m.role === 'admin'}>Admin</option>
											<option value="member" selected={m.role === 'member'}>Staff</option>
										</select>
										<button class="btn btn-small">Save</button>
									</form>
									<form method="post" action="?/remove">
										<input type="hidden" name="memberId" value={m.id} />
										<button
											class="btn btn-small"
											use:confirmFirst={`Remove ${m.name} from the team? They won't be able to sign in to this company any more.`}
											>Remove</button
										>
									</form>
									{#if m.twoFactor}
										<form method="post" action="?/reset2fa">
											<input type="hidden" name="userId" value={m.userId} />
											<button
												class="btn btn-small"
												title="For a teammate who lost their phone and backup codes"
												use:confirmFirst={`Reset ${m.name}'s two-step sign-in? They're signed out and set it up again at their next sign-in.`}
												>Reset two-step sign-in</button
											>
										</form>
									{/if}
								</div>
							{/if}
						</td>
					{/if}
				</tr>
			{/each}
			{#each data.invites as i (i.email)}
				<tr>
					<td
						><strong>{i.email}</strong><span class="sub"
							>Invite pending · expires {formatDateTime(i.expiresAt)}</span
						></td
					>
					<td>{roleLabel(i.role ?? 'member')}</td>
					<td>—</td>
					<td>—</td>
					{#if data.access.isAdmin && !data.access.onBehalf}
						<td
							><form method="post" action="?/cancel">
								<input type="hidden" name="email" value={i.email} /><button
									class="btn btn-small"
									use:confirmFirst={`Cancel the invite to ${i.email}? Its link stops working.`}
									>Cancel invite</button
								>
							</form></td
						>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if data.access.isAdmin && !data.access.onBehalf && !data.business.toolsOpen}
	<p class="notice notice-info">
		You can invite your team once DETECK has approved your business{data.business.status ===
		'suspended'
			? ' and lifted the pause on your account'
			: ''}.
	</p>
{:else if data.access.isAdmin && !data.access.onBehalf}
	<section class="panel" style="max-width: 640px">
		<h2>Invite a team member</h2>
		<form method="post" action="?/invite" class="form-grid">
			<div class="field">
				<label for="email">Work email</label><input
					id="email"
					name="email"
					type="email"
					required
					defaultValue={form && 'email' in form ? (form.email ?? '') : ''}
				/>
			</div>
			<div class="field">
				<label for="role">Role</label>
				<select id="role" name="role"
					><option value="member">Staff</option><option value="admin">Admin</option></select
				>
			</div>
			<p class="help span-2">
				The invite works once and expires in 7 days. They'll set a password and two-step sign-in
				before they can see anything.
			</p>
			<div class="span-2"><button class="btn btn-primary">Send invite</button></div>
		</form>
	</section>
{/if}
