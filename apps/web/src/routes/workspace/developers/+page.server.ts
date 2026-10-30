import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import {
	API_SCOPES,
	ApiKeyError,
	createApiKey,
	listApiKeys,
	revokeApiKey,
	SCOPES_FOR
} from '@deteck/core/server/api-keys.ts';
import {
	createEndpoint,
	listEndpoints,
	removeEndpoint,
	sendTest,
	WEBHOOK_EVENTS,
	WebhookError
} from '@deteck/core/server/webhooks.ts';
import { requireManufacturer } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const [keys, endpoints] = await Promise.all([
		listApiKeys({ type: 'manufacturer', manufacturerId: m.id }),
		listEndpoints({ manufacturerId: m.id })
	]);
	return {
		keys,
		endpoints: endpoints.map(({ secret: _s, ...e }) => e),
		scopes: SCOPES_FOR.manufacturer.map((key) => ({ key, label: API_SCOPES[key] })),
		// Reports of fakes are switched off for now (FEATURE_REPORTS), so their event isn't offered.
		events: Object.entries(WEBHOOK_EVENTS)
			.filter(([key]) => key !== 'report.received' || ctx().config.reportsEnabled)
			.map(([key, label]) => ({ key, label }))
	};
};

async function admin(event: Parameters<Actions[string]>[0]) {
	const access = await requireManufacturer(event);
	if (!access.isAdmin || access.onBehalf)
		return { access, denied: fail(403, { message: 'Only company admins can manage API access.' }) };
	return { access, denied: null };
}

export const actions: Actions = {
	createKey: async (event) => {
		const { access, denied } = await admin(event);
		if (denied) return denied;
		const d = await event.request.formData();
		try {
			const { key } = await createApiKey(
				access.actor,
				{ type: 'manufacturer', manufacturerId: access.manufacturer.id },
				{ name: String(d.get('name') ?? ''), scopes: d.getAll('scopes').map(String) },
				access.manufacturer.id
			);
			return { newKey: key };
		} catch (error) {
			if (error instanceof ApiKeyError) return fail(400, { message: error.message });
			throw error;
		}
	},
	revokeKey: async (event) => {
		const { access, denied } = await admin(event);
		if (denied) return denied;
		const d = await event.request.formData();
		await revokeApiKey(
			access.actor,
			{ type: 'manufacturer', manufacturerId: access.manufacturer.id },
			String(d.get('id')),
			access.manufacturer.id
		).catch((e) => {
			if (!(e instanceof ApiKeyError)) throw e;
		});
		return { done: 'Key revoked. Requests with it now fail.' };
	},
	createWebhook: async (event) => {
		const { access, denied } = await admin(event);
		if (denied) return denied;
		const d = await event.request.formData();
		try {
			const row = await createEndpoint(
				access.actor,
				{ manufacturerId: access.manufacturer.id },
				{ url: String(d.get('url') ?? ''), events: d.getAll('events').map(String) },
				access.manufacturer.id
			);
			return { newSecret: row.secret };
		} catch (error) {
			if (error instanceof WebhookError) return fail(400, { message: error.message });
			throw error;
		}
	},
	removeWebhook: async (event) => {
		const { access, denied } = await admin(event);
		if (denied) return denied;
		const d = await event.request.formData();
		await removeEndpoint(
			access.actor,
			{ manufacturerId: access.manufacturer.id },
			String(d.get('id')),
			access.manufacturer.id
		);
		return { done: 'Webhook removed.' };
	},
	testWebhook: async (event) => {
		const { access, denied } = await admin(event);
		if (denied) return denied;
		const d = await event.request.formData();
		try {
			await sendTest({ manufacturerId: access.manufacturer.id }, String(d.get('id')));
		} catch (error) {
			if (error instanceof WebhookError) return fail(400, { message: error.message });
			throw error;
		}
		return { done: 'Test event sent. Its delivery appears below within a minute.' };
	}
};
