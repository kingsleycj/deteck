import { error, fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { manufacturer } from '@deteck/core/server/db/schema.ts';
import { requireStaff } from '#lib/server/guards.ts';
import {
	decideApplication,
	ReviewError,
	type Decision
} from '@deteck/core/server/manufacturers/review.ts';
import { documentsFor } from '@deteck/core/server/manufacturers/summary.ts';
import { listManufacturerTeam } from '@deteck/core/server/team.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const [m] = await ctx()
		.db.select()
		.from(manufacturer)
		.where(eq(manufacturer.id, event.params.id));
	if (!m) error(404, 'Application not found.');
	const [documents, team] = await Promise.all([
		documentsFor(m.id),
		listManufacturerTeam(m.organizationId)
	]);
	return { m, documents, team: team.members };
};

export const actions: Actions = {
	decide: async (event) => {
		const { actor } = requireStaff(event);
		const data = await event.request.formData();
		const decision = String(data.get('decision')) as Decision;
		const reason = String(data.get('reason') ?? '');
		if (!['approve', 'reject', 'request_info'].includes(decision))
			return fail(400, { reason, message: 'Choose a decision.' });
		try {
			await decideApplication(actor, event.params.id, decision, reason);
		} catch (err) {
			if (err instanceof ReviewError) return fail(400, { reason, message: err.message });
			throw err;
		}
		return { decided: decision };
	}
};
