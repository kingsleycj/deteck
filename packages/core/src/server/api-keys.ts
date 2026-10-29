/**
 * Keys for DETECK's REST API (/api/v1). A key looks like `dtk_live_ab12cd34_<secret>`: the start
 * (the prefix) identifies it, and only a SHA-256 hash of the secret part is stored, so the full
 * key is shown once, when it's created.
 */
import { and, desc, eq, getTableColumns, isNull } from 'drizzle-orm';
import { audit, type Actor } from './audit.ts';
import { companyActive, NOT_ACTIVE_MESSAGE, type CompanyRef } from './owner-status.ts';
import { ctx } from './context.ts';
import { randomId, sha256Hex } from './crypto.ts';
import { apiKey } from './db/schema.ts';

/** What a key may do. Each owner type can only be given its own scopes. */
export const API_SCOPES = {
	check: 'Check serials and read journeys',
	'manufacturer:read': "Read your company's drugs, batches and imports",
	'manufacturer:write': 'Send drugs, batches, serials and supply chain records',
	'business:verify': 'Check a delivery of serials',
	'business:receive': 'Record that you received packs'
} as const;
export type ApiScope = keyof typeof API_SCOPES;

export const SCOPES_FOR = {
	manufacturer: ['check', 'manufacturer:read', 'manufacturer:write'],
	business: ['check', 'business:verify', 'business:receive'],
	partner: ['check']
} as const satisfies Record<string, ApiScope[]>;
export type ApiKeyOwner =
	| { type: 'manufacturer'; manufacturerId: string }
	| { type: 'business'; businessId: string }
	| { type: 'partner' };

export class ApiKeyError extends Error {}

export type ApiKeyRow = typeof apiKey.$inferSelect;

function ownerWhere(owner: ApiKeyOwner) {
	if (owner.type === 'manufacturer') return eq(apiKey.manufacturerId, owner.manufacturerId);
	if (owner.type === 'business') return eq(apiKey.businessId, owner.businessId);
	return eq(apiKey.ownerType, 'partner');
}

/** Creates a key and returns it in full. This is the only time the secret is available. */
export async function createApiKey(
	actor: Actor,
	owner: ApiKeyOwner,
	input: { name: string; scopes: string[]; rateLimit?: number },
	auditManufacturerId?: string
) {
	if (!(await companyActive(owner))) throw new ApiKeyError(NOT_ACTIVE_MESSAGE);
	const name = input.name.trim().slice(0, 80);
	if (name.length < 2) throw new ApiKeyError('Give the key a name, such as "ERP system".');
	const allowed = SCOPES_FOR[owner.type] as readonly string[];
	const scopes = input.scopes.filter((s) => allowed.includes(s));
	if (scopes.length === 0) throw new ApiKeyError('Choose at least one permission.');
	const prefix = `dtk_live_${randomId(6).replace(/[-_]/g, 'x').slice(0, 8).toLowerCase()}`;
	const secret = randomId(24);
	const [row] = await ctx()
		.db.insert(apiKey)
		.values({
			name,
			prefix,
			secretHash: sha256Hex(secret),
			ownerType: owner.type,
			manufacturerId: owner.type === 'manufacturer' ? owner.manufacturerId : null,
			businessId: owner.type === 'business' ? owner.businessId : null,
			scopes,
			rateLimit: Math.min(Math.max(input.rateLimit ?? 120, 10), 6000),
			createdBy: actor.userId
		})
		.returning();
	await audit(actor, {
		area:
			owner.type === 'partner'
				? 'Console'
				: owner.type === 'business'
					? 'Business accounts'
					: 'Manufacturer board',
		action: 'api_key_create',
		itemType: 'api_key',
		itemId: row.id,
		manufacturerId: auditManufacturerId,
		summary: `Created the API key "${name}" (${prefix}) with ${scopes.join(', ')}`
	});
	return { row, key: `${prefix}_${secret}` };
}

export async function listApiKeys(owner: ApiKeyOwner) {
	// Everything except the stored hash, which has no business in a browser.
	const { secretHash: _hash, ...columns } = getTableColumns(apiKey);
	return ctx()
		.db.select(columns)
		.from(apiKey)
		.where(and(ownerWhere(owner), isNull(apiKey.revokedAt)))
		.orderBy(desc(apiKey.createdAt));
}

export async function revokeApiKey(
	actor: Actor,
	owner: ApiKeyOwner,
	id: string,
	auditManufacturerId?: string
) {
	const [row] = await ctx()
		.db.update(apiKey)
		.set({ revokedAt: new Date() })
		.where(and(eq(apiKey.id, id), ownerWhere(owner), isNull(apiKey.revokedAt)))
		.returning();
	if (!row) throw new ApiKeyError('Key not found.');
	await audit(actor, {
		area:
			owner.type === 'partner'
				? 'Console'
				: owner.type === 'business'
					? 'Business accounts'
					: 'Manufacturer board',
		action: 'api_key_revoke',
		itemType: 'api_key',
		itemId: id,
		manufacturerId: auditManufacturerId,
		summary: `Revoked the API key "${row.name}" (${row.prefix})`
	});
}

/**
 * Finds the active key for an `Authorization: Bearer …` value, or null. `ownerActive` is false
 * when the key's company is no longer approved: the caller refuses it with a clear message.
 */
export async function verifyApiKey(
	presented: string
): Promise<(ApiKeyRow & { ownerActive: boolean }) | null> {
	const match = /^(dtk_live_[a-z0-9]{8})_([A-Za-z0-9_-]{20,64})$/.exec(presented.trim());
	if (!match) return null;
	const [, prefix, secret] = match;
	const [row] = await ctx().db.select().from(apiKey).where(eq(apiKey.prefix, prefix)).limit(1);
	if (!row || row.revokedAt || row.secretHash !== sha256Hex(secret)) return null;
	// Record use at most once a minute per key.
	if (!row.lastUsedAt || Date.now() - row.lastUsedAt.getTime() > 60_000)
		void ctx()
			.db.update(apiKey)
			.set({ lastUsedAt: new Date() })
			.where(eq(apiKey.id, row.id))
			.catch(() => undefined);
	const owner: CompanyRef =
		row.ownerType === 'manufacturer'
			? { type: 'manufacturer', manufacturerId: row.manufacturerId! }
			: row.ownerType === 'business'
				? { type: 'business', businessId: row.businessId! }
				: { type: 'partner' };
	return { ...row, ownerActive: await companyActive(owner) };
}
