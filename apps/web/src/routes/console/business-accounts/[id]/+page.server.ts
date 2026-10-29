import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	businessDocuments,
	BusinessError,
	decideBusiness,
	getBusiness,
	listReceipts,
	setBusinessSuspended
} from '@deteck/core/server/business.ts';
import { requireStaff } from '#lib/server/guards.ts';
import { listManufacturerTeam, resetTwoFactor, TeamError } from '@deteck/core/server/team.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const b = await getBusiness(event.params.id);
	if (!b) error(404, 'Business not found.');
	const [documents, receipts, team] = await Promise.all([
		businessDocuments(b.id),
		listReceipts(b, 10),
		listManufacturerTeam(b.organizationId)
	]);
	return { b, documents, receipts, team: team.members };
};

async function run(fn: () => Promise<unknown>, done: string) {
	try {
		await fn();
	} catch (err) {
		if (err instanceof BusinessError || err instanceof TeamError)
			return fail(400, { message: err.message });
		throw err;
	}
	return { done };
}

export const actions: Actions = {
	reset2fa: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		const b = await getBusiness(event.params.id);
		if (!b) error(404, 'Business not found.');
		return run(
			() =>
				resetTwoFactor(actor, {
					userId: String(d.get('userId')),
					organizationId: b.organizationId
				}),
			"Two-step sign-in reset. They've been signed out and emailed."
		);
	},
	decide: async (event) => {
		const { actor } = requireStaff(event);
		const d = await event.request.formData();
		const decision = String(d.get('decision')) as 'approve' | 'request_info' | 'reject';
		return run(
			() => decideBusiness(actor, event.params.id, decision, String(d.get('reason') ?? '')),
			'Decision saved. The business has been emailed.'
		);
	},
	suspend: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		return run(
			() => setBusinessSuspended(actor, event.params.id, true, String(d.get('reason') ?? '')),
			'Suspended.'
		);
	},
	reinstate: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		return run(
			() => setBusinessSuspended(actor, event.params.id, false, String(d.get('reason') ?? '')),
			'Reinstated.'
		);
	}
};
