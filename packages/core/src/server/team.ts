import { and, eq, gt, inArray, like, sql } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { MANUFACTURER_ROLE_LABEL, type Auth } from './auth-factory.ts';
import { ctx } from './context.ts';
import { randomId, sha256Hex } from './crypto.ts';
import {
	auditLog,
	invitation,
	manufacturer,
	member,
	organization,
	session,
	staffInvitation,
	twoFactor,
	user,
	verification
} from './db/schema.ts';
import { sendEmail } from './email/index.ts';
import { emailTemplates } from './email/templates.ts';
import type { StaffRole } from './roles.ts';
import { NOT_ACTIVE_MESSAGE, organizationActive } from './owner-status.ts';
import { consume } from './rate-limit.ts';

const INVITE_DAYS = 7;

/** Invite ids are the secret in the link; the audit trail records a one-way reference instead. */
const inviteRef = (id: string) => `ref-${sha256Hex(id).slice(0, 12)}`;
const expiry = () => new Date(Date.now() + INVITE_DAYS * 24 * 3600 * 1000);

export class TeamError extends Error {}

const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

function passwordProblem(password: string): string | null {
	if (password.length < 10) return 'Use at least 10 characters.';
	if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password))
		return 'Include at least one number and one symbol.';
	return null;
}

// ---------------------------------------------------------------- manufacturer team

export async function listManufacturerTeam(organizationId: string) {
	const { db } = ctx();
	const members = await db
		.select({
			id: member.id,
			role: member.role,
			joinedAt: member.createdAt,
			userId: user.id,
			name: user.name,
			email: user.email,
			twoFactor: user.twoFactorEnabled
		})
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(eq(member.organizationId, organizationId))
		.orderBy(member.createdAt);
	// An invite's id is the secret in its link, so it never leaves the server: anyone on the team
	// could otherwise accept an admin invite meant for someone else.
	const invites = await db
		.select({ email: invitation.email, role: invitation.role, expiresAt: invitation.expiresAt })
		.from(invitation)
		.where(
			and(
				eq(invitation.organizationId, organizationId),
				eq(invitation.status, 'pending'),
				gt(invitation.expiresAt, new Date())
			)
		)
		.orderBy(invitation.createdAt);
	return { members, invites };
}

export async function inviteToManufacturer(
	actor: Actor,
	m: { id: string | null; organizationId: string; companyName: string },
	input: { email: string; role: string }
) {
	const email = input.email.trim().toLowerCase();
	if (!emailOk(email)) throw new TeamError('Enter a valid work email.');
	// Invites are emails from DETECK naming the company: only approved companies send them, and
	// only so many a day, so nobody can use them as a mailing tool.
	if (!(await organizationActive(m.organizationId))) throw new TeamError(NOT_ACTIVE_MESSAGE);
	const limited = await consume([
		{ key: `invite:org:${m.organizationId}:day`, windowSeconds: 86_400, max: 20 }
	]);
	if (!limited.ok) throw new TeamError('You can send up to 20 invites a day. Try again tomorrow.');
	const role = input.role === 'admin' ? 'admin' : 'member';
	const { db } = ctx();
	const [already] = await db
		.select({ id: member.id })
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(and(eq(member.organizationId, m.organizationId), eq(user.email, email)))
		.limit(1);
	if (already) throw new TeamError('This person is already on your team.');

	const id = randomId(16);
	await db.transaction(async (tx) => {
		// Re-inviting cancels the previous invite (one live invite per email).
		await tx
			.update(invitation)
			.set({ status: 'canceled' })
			.where(
				and(
					eq(invitation.organizationId, m.organizationId),
					eq(invitation.email, email),
					eq(invitation.status, 'pending')
				)
			);
		await tx.insert(invitation).values({
			id,
			organizationId: m.organizationId,
			email,
			role,
			status: 'pending',
			expiresAt: expiry(),
			inviterId: actor.userId!
		});
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'invite',
				itemType: 'invitation',
				itemId: inviteRef(id),
				manufacturerId: m.id,
				summary: `Invited ${email} as ${MANUFACTURER_ROLE_LABEL[role]}`,
				after: { email, role }
			},
			tx
		);
	});
	await sendEmail(
		emailTemplates.manufacturerInvite({
			to: email,
			inviter: actor.label,
			company: m.companyName,
			role: MANUFACTURER_ROLE_LABEL[role],
			url: `${ctx().config.origin}/business/join/${id}`
		})
	);
	return id;
}

export async function cancelManufacturerInvite(
	actor: Actor,
	manufacturerId: string | null,
	organizationId: string,
	email: string
) {
	await ctx().db.transaction(async (tx) => {
		const rows = await tx
			.update(invitation)
			.set({ status: 'canceled' })
			.where(
				and(
					eq(invitation.email, email.trim().toLowerCase()),
					eq(invitation.organizationId, organizationId),
					eq(invitation.status, 'pending')
				)
			)
			.returning({ id: invitation.id, email: invitation.email });
		if (rows.length === 0) throw new TeamError('That invite no longer exists.');
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'invite_cancel',
				itemType: 'invitation',
				itemId: inviteRef(rows[0].id),
				manufacturerId,
				summary: `Cancelled the invite for ${rows[0].email}`
			},
			tx
		);
	});
}

async function adminCount(organizationId: string) {
	const [row] = await ctx()
		.db.select({ n: sql<number>`count(*)::int` })
		.from(member)
		.where(
			and(eq(member.organizationId, organizationId), inArray(member.role, ['admin', 'owner']))
		);
	return row.n;
}

export async function changeManufacturerRole(
	actor: Actor,
	manufacturerId: string | null,
	organizationId: string,
	memberId: string,
	role: string
) {
	const newRole = role === 'admin' ? 'admin' : 'member';
	const { db } = ctx();
	const [target] = await db
		.select({ id: member.id, role: member.role, userId: member.userId, name: user.name })
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)));
	if (!target) throw new TeamError('Member not found.');
	if (target.role !== 'member' && newRole === 'member' && (await adminCount(organizationId)) <= 1) {
		throw new TeamError("You can't remove the last admin.");
	}
	await db.transaction(async (tx) => {
		await tx.update(member).set({ role: newRole }).where(eq(member.id, memberId));
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'role_change',
				itemType: 'member',
				itemId: memberId,
				manufacturerId,
				summary: `${target.name} is now ${MANUFACTURER_ROLE_LABEL[newRole]}`,
				before: { role: target.role },
				after: { role: newRole }
			},
			tx
		);
	});
}

export async function removeManufacturerMember(
	actor: Actor,
	manufacturerId: string | null,
	organizationId: string,
	memberId: string
) {
	const { db } = ctx();
	const [target] = await db
		.select({ id: member.id, role: member.role, userId: member.userId, name: user.name })
		.from(member)
		.innerJoin(user, eq(user.id, member.userId))
		.where(and(eq(member.id, memberId), eq(member.organizationId, organizationId)));
	if (!target) throw new TeamError('Member not found.');
	if (target.userId === actor.userId) throw new TeamError("You can't remove yourself.");
	if (target.role !== 'member' && (await adminCount(organizationId)) <= 1)
		throw new TeamError("You can't remove the last admin.");
	await db.transaction(async (tx) => {
		await tx.delete(member).where(eq(member.id, memberId));
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'member_remove',
				itemType: 'member',
				itemId: memberId,
				manufacturerId,
				summary: `Removed ${target.name} from the team. Their past actions stay in the audit trail.`
			},
			tx
		);
	});
}

// ---------------------------------------------------------------- two-step sign-in reset

/**
 * Clears someone's two-step sign-in after they lose their phone and backup codes (emailed codes
 * are switched off, so this is the only way back in). It signs them out everywhere and forgets
 * every trusted browser; they set up a new authenticator app at their next sign-in.
 * Company admins reset teammates (pass `organizationId`); DETECK admins can reset anyone.
 */
export async function resetTwoFactor(
	actor: Actor,
	target: { userId: string; organizationId?: string; manufacturerId?: string | null }
) {
	if (target.userId === actor.userId)
		throw new TeamError("You can't reset your own two-step sign-in. Ask another admin.");
	const { db } = ctx();
	if (target.organizationId) {
		const [inTeam] = await db
			.select({ id: member.id })
			.from(member)
			.where(
				and(eq(member.userId, target.userId), eq(member.organizationId, target.organizationId))
			);
		if (!inTeam) throw new TeamError('Member not found.');
	}
	const [person] = await db
		.select({ name: user.name, email: user.email, enabled: user.twoFactorEnabled })
		.from(user)
		.where(eq(user.id, target.userId));
	if (!person) throw new TeamError('Person not found.');
	if (!person.enabled) throw new TeamError(`${person.name} hasn't set up two-step sign-in yet.`);
	await db.transaction(async (tx) => {
		await tx.delete(twoFactor).where(eq(twoFactor.userId, target.userId));
		await tx.update(user).set({ twoFactorEnabled: false }).where(eq(user.id, target.userId));
		await tx
			.delete(verification)
			.where(
				and(like(verification.identifier, 'trust-device-%'), eq(verification.value, target.userId))
			);
		await tx.delete(session).where(eq(session.userId, target.userId));
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'two_factor_reset',
				itemType: 'user',
				itemId: target.userId,
				manufacturerId: target.manufacturerId ?? null,
				summary: `Reset ${person.name}'s two-step sign-in. They set it up again at their next sign-in.`
			},
			tx
		);
	});
	await sendEmail(
		emailTemplates.twoFactorReset({ to: person.email, name: person.name, by: actor.label })
	).catch((e) => console.error('[email] two-step reset', e));
}

/** A pending, unexpired invite with its company name, for the join page. */
export async function getManufacturerInvite(id: string) {
	const [row] = await ctx()
		.db.select({ invite: invitation, company: organization.name, manufacturerId: manufacturer.id })
		.from(invitation)
		.innerJoin(organization, eq(organization.id, invitation.organizationId))
		.leftJoin(manufacturer, eq(manufacturer.organizationId, invitation.organizationId))
		.where(eq(invitation.id, id))
		.limit(1);
	if (!row) return { state: 'missing' as const };
	if (row.invite.status !== 'pending' || row.invite.expiresAt < new Date())
		return { state: 'used' as const, company: row.company };
	return { state: 'ok' as const, ...row };
}

/** Accepts an invite: creates the account if needed, then adds the membership. */
export async function acceptManufacturerInvite(
	auth: Auth,
	id: string,
	account:
		| { kind: 'new'; name: string; password: string }
		| { kind: 'existing'; userId: string; email: string },
	meta: Pick<Actor, 'ip' | 'userAgent'>
) {
	const found = await getManufacturerInvite(id);
	if (found.state !== 'ok')
		throw new TeamError(
			'This invite no longer works. Ask the admin who invited you to send a new one.'
		);
	const { invite, manufacturerId } = found;
	const { db } = ctx();

	let userId: string;
	let name: string;
	if (account.kind === 'new') {
		const problem = passwordProblem(account.password);
		if (problem) throw new TeamError(problem);
		if (account.name.trim().length < 2) throw new TeamError('Enter your full name.');
		const [exists] = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, invite.email))
			.limit(1);
		if (exists)
			throw new TeamError(
				'An account with this email already exists. Sign in to accept the invite.'
			);
		const created = await auth.api.signUpEmail({
			body: { name: account.name.trim(), email: invite.email, password: account.password }
		});
		userId = created.user.id;
		name = created.user.name;
	} else {
		if (account.email.toLowerCase() !== invite.email)
			throw new TeamError(`This invite is for ${invite.email}. Sign in with that email.`);
		userId = account.userId;
		const [u] = await db
			.select({ name: user.name, platformRole: user.platformRole })
			.from(user)
			.where(eq(user.id, userId));
		if (u.platformRole)
			throw new TeamError(
				'DETECK team accounts cannot join a manufacturer. Use a different email.'
			);
		// One company per account, so nobody lands in the wrong company (audit decision 8).
		const [elsewhere] = await db
			.select({ org: member.organizationId })
			.from(member)
			.where(eq(member.userId, userId))
			.limit(1);
		if (elsewhere && elsewhere.org !== invite.organizationId)
			throw new TeamError(
				'This account already belongs to another company. Ask for the invite to be sent to a different work email.'
			);
		if (elsewhere) throw new TeamError("You're already a member of this company.");
		name = u.name;
	}

	await db.transaction(async (tx) => {
		await tx.insert(member).values({
			id: randomId(16),
			organizationId: invite.organizationId,
			userId,
			role: invite.role ?? 'member',
			createdAt: new Date()
		});
		await tx.update(invitation).set({ status: 'accepted' }).where(eq(invitation.id, id));
		await audit(
			{ userId, label: name, role: 'Manufacturer user', ...meta },
			{
				area: 'Team and sign-in',
				action: 'invite_accept',
				itemType: 'member',
				itemId: userId,
				manufacturerId,
				summary: `${name} joined the team as ${MANUFACTURER_ROLE_LABEL[invite.role ?? 'member']}`
			},
			tx
		);
	});
}

// ---------------------------------------------------------------- DETECK staff

export const STAFF_ROLE_NAME: Record<StaffRole, string> = { admin: 'Admin', reviewer: 'Reviewer' };

export async function inviteStaff(
	actor: Actor,
	input: { email: string; name: string; role: string; note?: string }
) {
	const email = input.email.trim().toLowerCase();
	if (!emailOk(email)) throw new TeamError('Enter a valid work email.');
	if (input.name.trim().length < 2) throw new TeamError('Enter their full name.');
	const role: StaffRole = input.role === 'admin' ? 'admin' : 'reviewer';
	const { db } = ctx();
	const [exists] = await db
		.select({ id: user.id, role: user.platformRole })
		.from(user)
		.where(eq(user.email, email))
		.limit(1);
	if (exists?.role) throw new TeamError('This person is already on the DETECK team.');
	if (exists) {
		const [membership] = await db
			.select({ id: member.id })
			.from(member)
			.where(eq(member.userId, exists.id))
			.limit(1);
		throw new TeamError(
			membership
				? 'This email already has a manufacturer account. Use a different work email.'
				: 'This person was removed from the DETECK team before. Restore them from "Removed team members" instead.'
		);
	}
	const id = randomId(16);
	await db.transaction(async (tx) => {
		await tx
			.update(staffInvitation)
			.set({ cancelledAt: new Date() })
			.where(and(eq(staffInvitation.email, email), sql`${staffInvitation.acceptedAt} is null`));
		await tx.insert(staffInvitation).values({
			id,
			email,
			name: input.name.trim(),
			role,
			note: input.note?.trim() || null,
			invitedBy: actor.userId,
			expiresAt: expiry()
		});
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'staff_invite',
				itemType: 'staff_invitation',
				itemId: inviteRef(id),
				summary: `Invited ${input.name.trim()} (${email}) to the DETECK team as ${STAFF_ROLE_NAME[role]}`,
				after: { email, role }
			},
			tx
		);
	});
	const url = `${ctx().config.origin}/business/staff-join/${id}`;
	await sendEmail(
		emailTemplates.staffInvite({
			to: email,
			inviter: actor.label,
			role: STAFF_ROLE_NAME[role],
			note: input.note,
			url
		})
	);
	return { id, url };
}

/** Withdraws a staff invite nobody has accepted yet: its link stops working. */
export async function cancelStaffInvite(actor: Actor, email: string) {
	await ctx().db.transaction(async (tx) => {
		const rows = await tx
			.update(staffInvitation)
			.set({ cancelledAt: new Date() })
			.where(
				and(
					eq(staffInvitation.email, email.trim().toLowerCase()),
					sql`${staffInvitation.acceptedAt} is null and ${staffInvitation.cancelledAt} is null`
				)
			)
			.returning({ id: staffInvitation.id, email: staffInvitation.email });
		if (rows.length === 0) throw new TeamError('That invite no longer exists.');
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'invite_cancel',
				itemType: 'staff_invitation',
				itemId: inviteRef(rows[0].id),
				summary: `Cancelled the DETECK team invite for ${rows[0].email}`
			},
			tx
		);
	});
}

export async function getStaffInvite(id: string) {
	const [row] = await ctx()
		.db.select()
		.from(staffInvitation)
		.where(eq(staffInvitation.id, id))
		.limit(1);
	if (!row) return { state: 'missing' as const };
	if (row.acceptedAt || row.cancelledAt || row.expiresAt < new Date())
		return { state: 'used' as const };
	return { state: 'ok' as const, invite: row };
}

export async function acceptStaffInvite(
	auth: Auth,
	id: string,
	account: { password: string },
	meta: Pick<Actor, 'ip' | 'userAgent'>
) {
	const found = await getStaffInvite(id);
	if (found.state !== 'ok')
		throw new TeamError(
			'This invite no longer works. Ask the admin who invited you to send a new one.'
		);
	const problem = passwordProblem(account.password);
	if (problem) throw new TeamError(problem);
	const { invite } = found;
	const { db } = ctx();
	const [exists] = await db
		.select({ id: user.id })
		.from(user)
		.where(eq(user.email, invite.email))
		.limit(1);
	if (exists) throw new TeamError('An account with this email already exists.');
	const created = await auth.api.signUpEmail({
		body: { name: invite.name, email: invite.email, password: account.password }
	});
	await db.transaction(async (tx) => {
		await tx.update(user).set({ platformRole: invite.role }).where(eq(user.id, created.user.id));
		await tx
			.update(staffInvitation)
			.set({ acceptedAt: new Date() })
			.where(eq(staffInvitation.id, id));
		await audit(
			{ userId: created.user.id, label: invite.name, role: `DETECK ${invite.role}`, ...meta },
			{
				area: 'Team and sign-in',
				action: 'staff_join',
				itemType: 'user',
				itemId: created.user.id,
				summary: `${invite.name} joined the DETECK team as ${STAFF_ROLE_NAME[invite.role as StaffRole]}`
			},
			tx
		);
	});
}

export async function listStaff() {
	const { db } = ctx();
	const staff = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			role: user.platformRole,
			twoFactor: user.twoFactorEnabled,
			createdAt: user.createdAt
		})
		.from(user)
		.where(sql`${user.platformRole} is not null`)
		.orderBy(user.createdAt);
	// Never the id: it's the secret in the invite link (see listManufacturerTeam).
	const invites = await db
		.select({
			email: staffInvitation.email,
			name: staffInvitation.name,
			role: staffInvitation.role,
			expiresAt: staffInvitation.expiresAt
		})
		.from(staffInvitation)
		.where(
			and(
				sql`${staffInvitation.acceptedAt} is null`,
				sql`${staffInvitation.cancelledAt} is null`,
				gt(staffInvitation.expiresAt, new Date())
			)
		);
	// People removed from the team: they keep their account (and their audit history) and can be
	// restored by an admin.
	const removed = await db
		.selectDistinctOn([user.id], {
			id: user.id,
			name: user.name,
			email: user.email,
			removedAt: auditLog.createdAt
		})
		.from(user)
		.innerJoin(auditLog, and(eq(auditLog.itemId, user.id), eq(auditLog.action, 'staff_remove')))
		.where(
			and(
				sql`${user.platformRole} is null`,
				sql`not exists (select 1 from ${member} where ${member.userId} = ${user.id})`
			)
		)
		.orderBy(user.id, sql`${auditLog.createdAt} desc`);
	return { staff, invites, removed };
}

/** Gives a removed DETECK team member their access back, with the role chosen. */
export async function restoreStaff(actor: Actor, userId: string, role: string) {
	const newRole: StaffRole = role === 'admin' ? 'admin' : 'reviewer';
	const { removed } = await listStaff();
	const target = removed.find((r) => r.id === userId);
	if (!target) throw new TeamError('Removed team member not found.');
	await ctx().db.transaction(async (tx) => {
		await tx.update(user).set({ platformRole: newRole }).where(eq(user.id, userId));
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: 'staff_restore',
				itemType: 'user',
				itemId: userId,
				summary: `Restored ${target.name} to the DETECK team as ${STAFF_ROLE_NAME[newRole]}`,
				after: { role: newRole }
			},
			tx
		);
	});
	await sendEmail(
		emailTemplates.staffRestored({
			to: target.email,
			name: target.name,
			by: actor.label,
			role: STAFF_ROLE_NAME[newRole],
			url: `${ctx().config.origin}/business/sign-in`
		})
	).catch((e) => console.error('[email] staff restore', e));
}

export async function changeStaffRole(actor: Actor, userId: string, role: string) {
	const newRole = role === 'admin' ? 'admin' : role === 'reviewer' ? 'reviewer' : null;
	if (userId === actor.userId) throw new TeamError("You can't change your own role.");
	const { db } = ctx();
	const [target] = await db
		.select({ name: user.name, role: user.platformRole })
		.from(user)
		.where(eq(user.id, userId));
	if (!target?.role) throw new TeamError('Team member not found.');
	if (target.role === 'admin' && newRole !== 'admin') {
		const [admins] = await db
			.select({ n: sql<number>`count(*)::int` })
			.from(user)
			.where(eq(user.platformRole, 'admin'));
		if (admins.n <= 1) throw new TeamError("You can't remove the last admin.");
	}
	await db.transaction(async (tx) => {
		await tx.update(user).set({ platformRole: newRole }).where(eq(user.id, userId));
		if (!newRole) await tx.delete(session).where(eq(session.userId, userId));
		await audit(
			actor,
			{
				area: 'Team and sign-in',
				action: newRole ? 'staff_role_change' : 'staff_remove',
				itemType: 'user',
				itemId: userId,
				summary: newRole
					? `${target.name} is now ${STAFF_ROLE_NAME[newRole]}`
					: `Removed ${target.name} from the DETECK team`,
				before: { role: target.role },
				after: { role: newRole }
			},
			tx
		);
	});
}
