<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDateTime } from '#lib/ui/status.ts';

	let { data, form }: PageProps = $props();
	const roleName = (r: string | null) =>
		r === 'admin' ? 'Admin' : r === 'reviewer' ? 'Reviewer' : '—';
</script>

<svelte:head><title>Team · DETECK console</title></svelte:head>

<div class="page-title">
	<div>
		<p class="crumbs">Admin and monitoring</p>
		<h1>DETECK team</h1>
	</div>
</div>

{#if form && 'done' in form}<p class="toast">{form.done}</p>{/if}
{#if form && 'message' in form && form.message}<p class="notice notice-error" role="alert">
		{form.message}
	</p>{/if}

<section class="stats">
	<div class="stat">
		<span class="k">Admin</span><span class="d"
			>Everything, including the team, suspensions and approving go-live</span
		>
	</div>
	<div class="stat">
		<span class="k">Reviewer</span><span class="d"
			>Reviews applications and data, approves go-live</span
		>
	</div>
</section>

<div class="table-wrap">
	<table class="data">
		<thead
			><tr
				><th>Member</th><th>Role</th><th>Two-step sign-in</th><th>Joined</th
				>{#if data.staff.isAdmin}<th>Change role</th>{/if}</tr
			></thead
		>
		<tbody>
			{#each data.members as s (s.id)}
				<tr>
					<td><strong>{s.name}</strong><span class="sub">{s.email}</span></td>
					<td>{roleName(s.role)}</td>
					<td>{s.twoFactor ? 'On' : 'Not set up yet'}</td>
					<td>{formatDateTime(s.createdAt)}</td>
					{#if data.staff.isAdmin}
						<td>
							{#if s.id !== data.staff.userId}
								<form method="post" action="?/role" class="row" style="--gap: 6px">
									<input type="hidden" name="userId" value={s.id} />
									<select
										name="role"
										class="input"
										style="min-height: 40px; width: auto"
										aria-label="Role for {s.name}"
									>
										<option value="admin" selected={s.role === 'admin'}>Admin</option>
										<option value="reviewer" selected={s.role === 'reviewer'}>Reviewer</option>
										<option value="remove">Remove from team</option>
									</select>
									<button class="btn btn-small">Save</button>
								</form>
								{#if s.twoFactor}
									<form method="post" action="?/reset2fa" style="margin-top: 6px">
										<input type="hidden" name="userId" value={s.id} />
										<button
											class="btn btn-small"
											title="For a team member who lost their phone and backup codes"
											>Reset two-step sign-in</button
										>
									</form>
								{/if}
							{:else}<span class="small muted">You can't change yourself</span>{/if}
						</td>
					{/if}
				</tr>
			{/each}
			{#each data.invites as i (i.email)}
				<tr
					><td
						><strong>{i.name}</strong><span class="sub"
							>{i.email} · invite pending, expires {formatDateTime(i.expiresAt)}</span
						></td
					><td>{roleName(i.role)}</td><td>—</td><td>—</td>{#if data.staff.isAdmin}<td
							><form method="post" action="?/cancelInvite">
								<input type="hidden" name="email" value={i.email} />
								<button class="btn btn-small">Cancel invite</button>
							</form></td
						>{/if}</tr
				>
			{/each}
		</tbody>
	</table>
</div>

{#if data.staff.isAdmin && data.removed.length}
	<section class="panel">
		<h2>Removed team members</h2>
		<p class="muted">
			Their accounts and audit history are kept. Restoring gives them access again with the role you
			choose; they sign in with their usual password.
		</p>
		<div class="table-scroll">
			<table>
				<thead><tr><th>Person</th><th>Removed</th><th>Restore</th></tr></thead>
				<tbody>
					{#each data.removed as r (r.id)}
						<tr>
							<td><strong>{r.name}</strong><span class="sub">{r.email}</span></td>
							<td>{formatDateTime(r.removedAt)}</td>
							<td>
								<form method="post" action="?/restore" class="row" style="--gap: 6px">
									<input type="hidden" name="userId" value={r.id} />
									<select
										name="role"
										class="input"
										style="min-height: 40px; width: auto"
										aria-label="Role for {r.name}"
									>
										<option value="reviewer">Reviewer</option>
										<option value="admin">Admin</option>
									</select>
									<button class="btn btn-small">Restore</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
{/if}

{#if data.staff.isAdmin}
	<section class="panel" style="max-width: 640px">
		<h2>Invite a team member</h2>
		<form method="post" action="?/invite" class="form-grid">
			<div class="field">
				<label for="name">Full name</label><input id="name" name="name" required />
			</div>
			<div class="field">
				<label for="email">Work email</label><input id="email" name="email" type="email" required />
			</div>
			<div class="field">
				<label for="role">Role</label><select id="role" name="role"
					><option value="reviewer">Reviewer</option><option value="admin">Admin</option></select
				>
			</div>
			<div class="field span-2">
				<label for="note">Note in the email (optional)</label><textarea
					id="note"
					name="note"
					maxlength="500"></textarea>
			</div>
			<p class="help span-2">
				The invite works once and expires in 7 days. They'll set a password and two-step sign-in
				before they can see anything.
			</p>
			<div class="span-2"><button class="btn btn-primary">Send invite</button></div>
		</form>
	</section>
{/if}
