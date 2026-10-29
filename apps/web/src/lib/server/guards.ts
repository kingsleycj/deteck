import { error, redirect, type RequestEvent } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { ctx } from '@deteck/core/server/context.ts';
import {
	businessAccount,
	manufacturer,
	member,
	user as userTable
} from '@deteck/core/server/db/schema.ts';
import type { Actor } from '@deteck/core/server/audit.ts';

import { STAFF_ROLE_LABEL, type StaffRole } from '@deteck/core/server/roles.ts';
export { STAFF_ROLE_LABEL, type StaffRole };

type SignedIn = NonNullable<App.Locals['user']>;

const AS_COOKIE = 'dtk_as';

function clientIp(event: RequestEvent): string | null {
	try {
		return event.getClientAddress();
	} catch {
		return null;
	}
}

/** Any signed-in business user who has finished two-factor set-up. */
export function requireUser(event: RequestEvent): SignedIn {
	const user = event.locals.user;
	if (!user)
		redirect(
			303,
			`/business/sign-in?next=${encodeURIComponent(event.url.pathname + event.url.search)}`
		);
	if (!user.twoFactorEnabled) redirect(303, '/business/setup-2fa');
	return user;
}

/** "DETECK admin", "DETECK reviewer" or "Business user": who signed in, for the audit trail. */
export async function roleLabelFor(userId: string): Promise<string> {
	const [row] = await ctx()
		.db.select({ role: userTable.platformRole })
		.from(userTable)
		.where(eq(userTable.id, userId));
	return row?.role === 'admin' || row?.role === 'reviewer'
		? STAFF_ROLE_LABEL[row.role]
		: 'Business user';
}

export function staffRole(user: SignedIn | undefined): StaffRole | null {
	const role = user?.platformRole;
	return role === 'admin' || role === 'reviewer' ? role : null;
}

export function actorFor(
	event: RequestEvent,
	user: SignedIn,
	role: string,
	onBehalf = false
): Actor {
	return {
		userId: user.id,
		label: user.name,
		role,
		onBehalf,
		ip: clientIp(event),
		userAgent: event.request.headers.get('user-agent')
	};
}

/**
 * Staff on behalf: a save must carry the company its page was opened for (`_company`, added by
 * tag-company.ts). Without it, or with another company, a tab opened earlier could save into
 * whichever company this browser switched to last.
 */
function checkTabCompany(event: RequestEvent, id: string, name: string) {
	if (event.request.method === 'GET' || event.request.method === 'HEAD') return;
	const tabCompany = event.url.searchParams.get('_company');
	if (tabCompany === id) return;
	error(
		409,
		tabCompany
			? `You opened ${name} in another tab since this page loaded. Reload this page before saving.`
			: 'Reload this page before saving (it needs to know which company it belongs to).'
	);
}

/** DETECK staff only. Reviewers can review; some actions need an admin. */
export function requireStaff(event: RequestEvent, roles: StaffRole[] = ['admin', 'reviewer']) {
	const user = requireUser(event);
	const role = staffRole(user);
	if (!role) error(403, 'This area is for DETECK staff.');
	if (!roles.includes(role)) error(403, 'You need a DETECK admin role for this.');
	return { user, role, actor: actorFor(event, user, STAFF_ROLE_LABEL[role]) };
}

export type ManufacturerAccess = Awaited<ReturnType<typeof requireManufacturer>>;

/**
 * A manufacturer workspace user, or DETECK staff working inside a workspace
 * ("on behalf", always audited, D-01).
 */
export async function requireManufacturer(event: RequestEvent) {
	const user = requireUser(event);
	const { db } = ctx();
	const role = staffRole(user);

	if (role) {
		const asId = event.url.searchParams.get('as') ?? event.cookies.get(AS_COOKIE);
		if (!asId) redirect(303, '/console/manufacturers');
		const [m] = await db.select().from(manufacturer).where(eq(manufacturer.id, asId)).limit(1);
		if (!m) redirect(303, '/console/manufacturers');
		// The company is remembered per browser. Forms carry the company their page was opened for,
		// so a tab left open on another company can't save into this one (audit decision 6).
		checkTabCompany(event, m.id, m.companyName);
		if (event.url.searchParams.get('as')) {
			event.cookies.set(AS_COOKIE, m.id, {
				path: '/workspace',
				httpOnly: true,
				sameSite: 'lax',
				secure: event.url.protocol === 'https:'
			});
		}
		return {
			user,
			manufacturer: m,
			memberRole: 'admin' as const,
			isAdmin: true,
			onBehalf: true,
			staffRole: role as StaffRole | null,
			actor: actorFor(event, user, STAFF_ROLE_LABEL[role], true)
		};
	}

	const [row] = await db
		.select({ m: manufacturer, role: member.role })
		.from(member)
		.innerJoin(manufacturer, eq(manufacturer.organizationId, member.organizationId))
		.where(and(eq(member.userId, user.id)))
		.limit(1);
	if (!row) error(403, 'Your account is not linked to a manufacturer.');
	const isAdmin = row.role === 'admin' || row.role === 'owner';
	return {
		user,
		manufacturer: row.m,
		memberRole: isAdmin ? ('admin' as const) : ('member' as const),
		isAdmin,
		onBehalf: false,
		staffRole: null as StaffRole | null,
		actor: actorFor(event, user, isAdmin ? 'Manufacturer admin' : 'Manufacturer uploader')
	};
}

/** Statuses in which a manufacturer may add or change data. */
/**
 * Statuses in which a manufacturer may add or change data. Suspended companies can fix their
 * records too: nothing they change is public until DETECK reinstates them (audit decision 2).
 */
export const CAN_EDIT_DATA = ['approved', 'changes_requested', 'live', 'suspended'] as const;

/** Why data can't be changed in this status, or null when it can. */
export function editBlockedReason(status: string): string | null {
	if ((CAN_EDIT_DATA as readonly string[]).includes(status)) return null;
	switch (status) {
		case 'in_review':
			return "Your data is with a DETECK reviewer, so it can't be changed right now. You can change it again if they send it back, and after you go live.";
		case 'rejected':
			return "Your application wasn't approved, so data can't be added.";
		default:
			return 'You can add data once DETECK approves your company.';
	}
}

export function assertCanEditData(access: ManufacturerAccess) {
	const reason = editBlockedReason(access.manufacturer.status);
	if (reason) error(403, reason);
}

const BUSINESS_AS_COOKIE = 'dtk_bas';

export type BusinessAccess = Awaited<ReturnType<typeof requireBusiness>>;

/**
 * A pharmacy, hospital or distributor account user, or DETECK staff working inside a business
 * portal on its behalf (always audited).
 */
export async function requireBusiness(event: RequestEvent) {
	const user = requireUser(event);
	const { db } = ctx();
	const role = staffRole(user);
	if (role) {
		const asId = event.url.searchParams.get('as') ?? event.cookies.get(BUSINESS_AS_COOKIE);
		if (!asId) redirect(303, '/console/business-accounts');
		const [b] = await db
			.select()
			.from(businessAccount)
			.where(eq(businessAccount.id, asId))
			.limit(1);
		if (!b) redirect(303, '/console/business-accounts');
		checkTabCompany(event, b.id, b.name);
		if (event.url.searchParams.get('as'))
			event.cookies.set(BUSINESS_AS_COOKIE, b.id, {
				path: '/portal',
				httpOnly: true,
				sameSite: 'lax',
				secure: event.url.protocol === 'https:'
			});
		return {
			user,
			business: b,
			isAdmin: true,
			onBehalf: true,
			actor: actorFor(event, user, STAFF_ROLE_LABEL[role], true)
		};
	}
	const [row] = await db
		.select({ b: businessAccount, role: member.role })
		.from(member)
		.innerJoin(businessAccount, eq(businessAccount.organizationId, member.organizationId))
		.where(eq(member.userId, user.id))
		.limit(1);
	if (!row) error(403, 'Your account is not linked to a pharmacy, hospital or distributor.');
	const isAdmin = row.role === 'admin' || row.role === 'owner';
	return {
		user,
		business: row.b,
		isAdmin,
		onBehalf: false,
		actor: actorFor(event, user, isAdmin ? 'Business admin' : 'Business staff')
	};
}

export function assertBusinessApproved(access: BusinessAccess) {
	if (access.business.status !== 'approved')
		error(403, 'DETECK needs to approve your business before you can check deliveries.');
}
