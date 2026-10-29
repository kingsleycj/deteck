import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	API_SCOPES,
	ApiKeyError,
	createApiKey,
	listApiKeys,
	revokeApiKey,
	SCOPES_FOR
} from '@deteck/core/server/api-keys.ts';
import { requireBusiness } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { business: b } = await requireBusiness(event);
	return {
		keys: await listApiKeys({ type: 'business', businessId: b.id }),
		scopes: SCOPES_FOR.business.map((key) => ({ key, label: API_SCOPES[key] }))
	};
};

export const actions: Actions = {
	createKey: async (event) => {
		const access = await requireBusiness(event);
		if (!access.isAdmin || access.onBehalf)
			return fail(403, { message: 'Only admins can create API keys.' });
		if (access.business.status !== 'approved')
			return fail(403, { message: 'DETECK needs to approve your business first.' });
		const d = await event.request.formData();
		try {
			const { key } = await createApiKey(
				access.actor,
				{ type: 'business', businessId: access.business.id },
				{ name: String(d.get('name') ?? ''), scopes: d.getAll('scopes').map(String) }
			);
			return { newKey: key };
		} catch (error) {
			if (error instanceof ApiKeyError) return fail(400, { message: error.message });
			throw error;
		}
	},
	revokeKey: async (event) => {
		const access = await requireBusiness(event);
		if (!access.isAdmin || access.onBehalf)
			return fail(403, { message: 'Only admins can revoke API keys.' });
		const d = await event.request.formData();
		await revokeApiKey(
			access.actor,
			{ type: 'business', businessId: access.business.id },
			String(d.get('id'))
		).catch((e) => {
			if (!(e instanceof ApiKeyError)) throw e;
		});
		return { done: 'Key revoked.' };
	}
};
