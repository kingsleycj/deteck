import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { randomId } from './crypto.ts';
import {
	auditLog,
	member,
	organization,
	session,
	twoFactor,
	user,
	verification
} from './db/schema.ts';
import { sentEmails } from './email/index.ts';
import type { Actor } from './audit.ts';
import { changeStaffRole, listStaff, resetTwoFactor, restoreStaff, TeamError } from './team.ts';
import { resetDb } from '../../tests/helpers/db.ts';

const later = () => new Date(Date.now() + 86_400_000);

async function makeUser(
	id: string,
	values: { twoFactorEnabled?: boolean; platformRole?: string | null } = {}
) {
	await ctx()
		.db.insert(user)
		.values({ id, name: `Person ${id}`, email: `${id}@example.com`, ...values });
}

async function makeSession(userId: string) {
	await ctx().db.insert(session).values({
		id: randomId(),
		token: randomId(),
		userId,
		expiresAt: later(),
		updatedAt: new Date()
	});
}

async function makeOrg(memberIds: string[]) {
	const orgId = randomId();
	await ctx()
		.db.insert(organization)
		.values({
			id: orgId,
			name: 'Northbridge',
			slug: `org-${orgId.toLowerCase()}`,
			createdAt: new Date()
		});
	for (const userId of memberIds)
		await ctx().db.insert(member).values({
			id: randomId(),
			organizationId: orgId,
			userId,
			role: 'admin',
			createdAt: new Date()
		});
	return orgId;
}

const actorFor = (userId: string, role = 'Manufacturer admin'): Actor => ({
	userId,
	label: `Person ${userId}`,
	role
});

describe('two-step sign-in reset', () => {
	let orgId: string;

	beforeEach(async () => {
		await resetDb();
		sentEmails.length = 0;
		await makeUser('admin', { twoFactorEnabled: true });
		await makeUser('ada', { twoFactorEnabled: true });
		await makeUser('bola', { twoFactorEnabled: true });
		await makeUser('chidi', { twoFactorEnabled: false });
		orgId = await makeOrg(['admin', 'ada', 'chidi']);
		const db = ctx().db;
		for (const userId of ['ada', 'bola'])
			await db
				.insert(twoFactor)
				.values({ id: randomId(), userId, secret: 'secret', backupCodes: 'codes' });
		await makeSession('ada');
		await makeSession('ada');
		await makeSession('bola');
		const v = (identifier: string, value: string) => ({
			id: randomId(),
			identifier,
			value,
			expiresAt: later()
		});
		await db
			.insert(verification)
			.values([
				v('trust-device-one', 'ada'),
				v('trust-device-two', 'ada'),
				v('trust-device-three', 'bola'),
				v('email-otp-ada', 'ada')
			]);
	});

	it('refuses a self-reset, people outside the team and people without two-step sign-in', async () => {
		await expect(
			resetTwoFactor(actorFor('admin'), { userId: 'admin', organizationId: orgId })
		).rejects.toThrow("You can't reset your own two-step sign-in");
		await expect(
			resetTwoFactor(actorFor('admin'), { userId: 'bola', organizationId: orgId })
		).rejects.toThrow('Member not found.');
		await expect(
			resetTwoFactor(actorFor('admin'), { userId: 'chidi', organizationId: orgId })
		).rejects.toThrow("hasn't set up two-step sign-in yet");
		await expect(resetTwoFactor(actorFor('admin'), { userId: 'nobody' })).rejects.toBeInstanceOf(
			TeamError
		);
		expect(await ctx().db.$count(twoFactor)).toBe(2);
		expect(await ctx().db.$count(auditLog)).toBe(0);
	});

	it('clears the authenticator, sessions and trusted browsers of that person only', async () => {
		await resetTwoFactor(actorFor('admin'), {
			userId: 'ada',
			organizationId: orgId,
			manufacturerId: null
		});
		const db = ctx().db;
		expect(await db.$count(twoFactor, eq(twoFactor.userId, 'ada'))).toBe(0);
		expect(await db.$count(twoFactor, eq(twoFactor.userId, 'bola'))).toBe(1);
		const [ada] = await db.select().from(user).where(eq(user.id, 'ada'));
		expect(ada.twoFactorEnabled).toBe(false);
		expect(await db.$count(session, eq(session.userId, 'ada'))).toBe(0);
		expect(await db.$count(session, eq(session.userId, 'bola'))).toBe(1);
		const left = (await db.select({ id: verification.identifier }).from(verification))
			.map((r) => r.id)
			.sort();
		expect(left).toEqual(['email-otp-ada', 'trust-device-three']);

		const [entry] = await db.select().from(auditLog);
		expect(entry).toMatchObject({
			action: 'two_factor_reset',
			itemType: 'user',
			itemId: 'ada',
			actorUserId: 'admin'
		});
		expect(sentEmails.map((e) => [e.to, e.subject])).toEqual([
			['ada@example.com', 'Your DETECK two-step sign-in was reset']
		]);
	});

	it('lets a DETECK admin reset anyone', async () => {
		await resetTwoFactor(actorFor('admin', 'DETECK admin'), { userId: 'bola' });
		expect(await ctx().db.$count(twoFactor, eq(twoFactor.userId, 'bola'))).toBe(0);
	});
});

describe('removed DETECK team members', () => {
	const admin = actorFor('admin', 'DETECK admin');

	beforeEach(async () => {
		await resetDb();
		sentEmails.length = 0;
		await makeUser('admin', { platformRole: 'admin' });
		await makeUser('kemi', { platformRole: 'reviewer' });
		await makeSession('kemi');
	});

	it('lists a removed person and restores them with the chosen role', async () => {
		await changeStaffRole(admin, 'kemi', 'remove');
		expect(await ctx().db.$count(session, eq(session.userId, 'kemi'))).toBe(0);
		let team = await listStaff();
		expect(team.staff.map((s) => s.id)).toEqual(['admin']);
		expect(team.removed).toEqual([
			expect.objectContaining({
				id: 'kemi',
				email: 'kemi@example.com',
				removedAt: expect.any(Date)
			})
		]);

		await restoreStaff(admin, 'kemi', 'admin');
		team = await listStaff();
		expect(team.removed).toEqual([]);
		expect(team.staff.find((s) => s.id === 'kemi')?.role).toBe('admin');
		expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'staff_restore'))).toBe(1);
		expect(
			sentEmails.some(
				(e) => e.to === 'kemi@example.com' && e.subject === 'Your DETECK team access is back'
			)
		).toBe(true);
		await expect(restoreStaff(admin, 'kemi', 'admin')).rejects.toThrow(
			'Removed team member not found.'
		);
	});

	it('does not list people who joined a manufacturer since, or were never removed', async () => {
		await changeStaffRole(admin, 'kemi', 'remove');
		await makeOrg(['kemi']);
		await makeUser('plain');
		const { removed } = await listStaff();
		expect(removed).toEqual([]);
		await expect(restoreStaff(admin, 'kemi', 'reviewer')).rejects.toBeInstanceOf(TeamError);
		await expect(restoreStaff(admin, 'plain', 'reviewer')).rejects.toBeInstanceOf(TeamError);
	});

	it("won't remove the last admin or let someone change their own role", async () => {
		await expect(changeStaffRole(admin, 'admin', 'remove')).rejects.toThrow(
			"You can't change your own role."
		);
		await expect(
			changeStaffRole(actorFor('kemi', 'DETECK reviewer'), 'admin', 'reviewer')
		).rejects.toThrow("You can't remove the last admin.");
	});
});
