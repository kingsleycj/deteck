import { and, eq, inArray, max } from 'drizzle-orm';
import { ctx } from './context.ts';
import type { DbOrTx } from './db/client.ts';
import { auditLog } from './db/schema.ts';

export interface Actor {
	userId: string | null;
	label: string;
	/** e.g. "DETECK admin", "Manufacturer admin", "System" */
	role: string;
	/** True when DETECK staff act inside a manufacturer's workspace. */
	onBehalf?: boolean;
	ip?: string | null;
	userAgent?: string | null;
}

export const SYSTEM_ACTOR: Actor = { userId: null, label: 'System', role: 'System' };

export type AuditArea =
	| 'Manufacturer board'
	| 'Business accounts'
	| 'Team and sign-in'
	| 'Console'
	| 'Public app'
	| 'API'
	| 'System';

export interface AuditEntry {
	area: AuditArea;
	action: string;
	itemType: string;
	itemId?: string | number | null;
	manufacturerId?: string | null;
	summary: string;
	before?: unknown;
	after?: unknown;
}

/**
 * Appends an audit entry (PRD US-06.3). Pass the transaction that makes the
 * change so the entry is written atomically with it (TRD 4.4).
 */
export async function audit(actor: Actor, entry: AuditEntry, db: DbOrTx = ctx().db): Promise<void> {
	await db.insert(auditLog).values({
		actorUserId: actor.userId,
		actorLabel: actor.label,
		actorRole: actor.role,
		onBehalf: actor.onBehalf ?? false,
		manufacturerId: entry.manufacturerId ?? null,
		area: entry.area,
		action: entry.action,
		itemType: entry.itemType,
		itemId: entry.itemId === undefined || entry.itemId === null ? null : String(entry.itemId),
		summary: entry.summary,
		before: entry.before ?? null,
		after: entry.after ?? null,
		ip: actor.ip ?? null,
		userAgent: actor.userAgent?.slice(0, 300) ?? null
	});
}

/**
 * When each item last had this action, for example when DETECK last asked an applicant for more
 * information (`application_request_info`, `business_request_info`). Items without one are left out.
 */
export async function lastActionAt(action: string, itemIds: string[]): Promise<Map<string, Date>> {
	if (itemIds.length === 0) return new Map();
	const rows = await ctx()
		.db.select({ itemId: auditLog.itemId, at: max(auditLog.createdAt) })
		.from(auditLog)
		.where(and(eq(auditLog.action, action), inArray(auditLog.itemId, itemIds)))
		.groupBy(auditLog.itemId);
	return new Map(rows.flatMap((r) => (r.itemId && r.at ? [[r.itemId, r.at] as const] : [])));
}
