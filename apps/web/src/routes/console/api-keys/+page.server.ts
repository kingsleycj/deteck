import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	API_SCOPES,
	ApiKeyError,
	createApiKey,
	listApiKeys,
	revokeApiKey
} from '@deteck/core/server/api-keys.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event, ['admin']);
	return {
		keys: await listApiKeys({ type: 'partner' }),
		scopes: [{ key: 'check', label: API_SCOPES.check }]
	};
};

export const actions: Actions = {
	createKey: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		try {
			const { key } = await createApiKey(
				actor,
				{ type: 'partner' },
				{
					name: String(d.get('name') ?? ''),
					scopes: d.getAll('scopes').map(String),
					rateLimit: Number(d.get('rateLimit') ?? 600)
				}
			);
			return { newKey: key };
		} catch (error) {
			if (error instanceof ApiKeyError) return fail(400, { message: error.message });
			throw error;
		}
	},
	revokeKey: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		await revokeApiKey(actor, { type: 'partner' }, String(d.get('id'))).catch((e) => {
			if (!(e instanceof ApiKeyError)) throw e;
		});
		return { done: 'Key revoked.' };
	}
};
