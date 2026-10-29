/**
 * Which companies may use self-service tools (API keys, webhooks, team invites). A company DETECK
 * hasn't approved, or has rejected, gets none of them: otherwise anyone could register and use
 * DETECK's API, its webhooks or its invite emails. A suspended manufacturer keeps them, so it can
 * fix its data (audit decision 2); a suspended business doesn't.
 */
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { businessAccount, manufacturer } from './db/schema.ts';

/** Every status from DETECK's approval on: preparing data, in go-live review, sent back, live. */
export const MANUFACTURER_OK = new Set([
	'approved',
	'in_review',
	'changes_requested',
	'live',
	'suspended'
]);
export const BUSINESS_OK = new Set(['approved']);

export type CompanyRef =
	| { type: 'manufacturer'; manufacturerId: string }
	| { type: 'business'; businessId: string }
	| { type: 'partner' };

export async function companyActive(owner: CompanyRef): Promise<boolean> {
	if (owner.type === 'partner') return true;
	if (owner.type === 'manufacturer') {
		const [m] = await ctx()
			.db.select({ status: manufacturer.status })
			.from(manufacturer)
			.where(eq(manufacturer.id, owner.manufacturerId));
		return Boolean(m && MANUFACTURER_OK.has(m.status));
	}
	const [b] = await ctx()
		.db.select({ status: businessAccount.status })
		.from(businessAccount)
		.where(eq(businessAccount.id, owner.businessId));
	return Boolean(b && BUSINESS_OK.has(b.status));
}

/** The same rule, for a company known by its sign-in organisation (team invites). */
export async function organizationActive(organizationId: string): Promise<boolean> {
	const [m] = await ctx()
		.db.select({ status: manufacturer.status })
		.from(manufacturer)
		.where(eq(manufacturer.organizationId, organizationId));
	if (m) return MANUFACTURER_OK.has(m.status);
	const [b] = await ctx()
		.db.select({ status: businessAccount.status })
		.from(businessAccount)
		.where(eq(businessAccount.organizationId, organizationId));
	return Boolean(b && BUSINESS_OK.has(b.status));
}

export const NOT_ACTIVE_MESSAGE =
	"This is available once DETECK has approved your company. A pharmacy or distributor account can't use it while DETECK has paused it.";
