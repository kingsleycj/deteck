import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { ctx } from './context.ts';
import { apiKey, auditLog, businessAccount, organization } from './db/schema.ts';
import { SYSTEM_ACTOR } from './audit.ts';
import { randomId, sha256Hex } from './crypto.ts';
import {
	ApiKeyError,
	createApiKey,
	listApiKeys,
	revokeApiKey,
	SCOPES_FOR,
	verifyApiKey
} from './api-keys.ts';
import { resetDb } from '../../tests/helpers/db.ts';
import { makeManufacturer } from '../../tests/helpers/fixtures.ts';

async function makeBusiness() {
	const orgId = randomId();
	await ctx()
		.db.insert(organization)
		.values({
			id: orgId,
			name: 'Riverside',
			slug: `org-${orgId.toLowerCase()}`,
			createdAt: new Date()
		});
	const [row] = await ctx()
		.db.insert(businessAccount)
		.values({
			organizationId: orgId,
			name: 'Riverside Pharmacy',
			role: 'pharmacy',
			address: '4 Bodija Road',
			state: 'Oyo',
			pcnLicence: 'PCN-RIV-1',
			contactName: 'Ada Obi',
			contactEmail: 'ada@riverside.example',
			status: 'approved'
		})
		.returning();
	return row;
}

describe('API keys', () => {
	let manufacturerId: string;

	beforeEach(async () => {
		await resetDb();
		manufacturerId = (await makeManufacturer()).id;
	});

	const owner = () => ({ type: 'manufacturer' as const, manufacturerId });

	it('shows the full key once and stores only a hash of the secret', async () => {
		const { row, key } = await createApiKey(SYSTEM_ACTOR, owner(), {
			name: 'ERP system',
			scopes: ['check', 'manufacturer:read']
		});
		const match = /^(dtk_live_[a-z0-9]{8})_([A-Za-z0-9_-]+)$/.exec(key);
		expect(match).not.toBeNull();
		const [, prefix, secret] = match!;
		expect(row.prefix).toBe(prefix);
		const [stored] = await ctx().db.select().from(apiKey).where(eq(apiKey.id, row.id));
		expect(stored.secretHash).toBe(sha256Hex(secret));
		expect(JSON.stringify(stored)).not.toContain(secret);
		expect(await ctx().db.$count(auditLog, eq(auditLog.action, 'api_key_create'))).toBe(1);
	});

	it('accepts the key, and rejects a wrong secret, a revoked key and junk', async () => {
		const { row, key } = await createApiKey(SYSTEM_ACTOR, owner(), {
			name: 'ERP system',
			scopes: ['check']
		});
		expect((await verifyApiKey(key))?.id).toBe(row.id);
		expect((await verifyApiKey(`  ${key}  `))?.id).toBe(row.id);

		const wrong = `${row.prefix}_${'A'.repeat(32)}`;
		expect(await verifyApiKey(wrong)).toBeNull();
		expect(await verifyApiKey('dtk_live_short_secret')).toBeNull();
		expect(await verifyApiKey('')).toBeNull();

		await revokeApiKey(SYSTEM_ACTOR, owner(), row.id);
		expect(await verifyApiKey(key)).toBeNull();
		expect(await listApiKeys(owner())).toHaveLength(0);
		await expect(revokeApiKey(SYSTEM_ACTOR, owner(), row.id)).rejects.toBeInstanceOf(ApiKeyError);
	});

	it('only gives each owner type its own scopes', async () => {
		const asked = ['check', 'manufacturer:read', 'manufacturer:write', 'business:verify'];
		const m = await createApiKey(SYSTEM_ACTOR, owner(), { name: 'Maker', scopes: asked });
		expect(m.row.scopes).toEqual(['check', 'manufacturer:read', 'manufacturer:write']);

		const b = await makeBusiness();
		const biz = await createApiKey(
			SYSTEM_ACTOR,
			{ type: 'business', businessId: b.id },
			{ name: 'Till', scopes: [...asked, 'business:receive'] }
		);
		expect(biz.row.scopes).toEqual(['check', 'business:verify', 'business:receive']);
		expect(biz.row.manufacturerId).toBeNull();

		const partner = await createApiKey(
			SYSTEM_ACTOR,
			{ type: 'partner' },
			{ name: 'Health app', scopes: asked }
		);
		expect(partner.row.scopes).toEqual([...SCOPES_FOR.partner]);

		await expect(
			createApiKey(
				SYSTEM_ACTOR,
				{ type: 'partner' },
				{ name: 'Bad', scopes: ['manufacturer:write'] }
			)
		).rejects.toThrow('Choose at least one permission.');
	});

	it('needs a name, clamps the rate limit and keeps owners apart', async () => {
		await expect(
			createApiKey(SYSTEM_ACTOR, owner(), { name: ' x ', scopes: ['check'] })
		).rejects.toBeInstanceOf(ApiKeyError);
		const low = await createApiKey(SYSTEM_ACTOR, owner(), {
			name: 'Low',
			scopes: ['check'],
			rateLimit: 1
		});
		const high = await createApiKey(SYSTEM_ACTOR, owner(), {
			name: 'High',
			scopes: ['check'],
			rateLimit: 1_000_000
		});
		expect([low.row.rateLimit, high.row.rateLimit]).toEqual([10, 6000]);

		const other = await makeManufacturer({ companyName: 'Other Pharma' });
		const otherOwner = { type: 'manufacturer' as const, manufacturerId: other.id };
		expect(await listApiKeys(otherOwner)).toHaveLength(0);
		await expect(revokeApiKey(SYSTEM_ACTOR, otherOwner, low.row.id)).rejects.toThrow(
			'Key not found.'
		);
		expect(await listApiKeys(owner())).toHaveLength(2);
	});
});
