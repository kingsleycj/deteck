import { error, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { manufacturer, user } from '@deteck/core/server/db/schema.ts';
import { requireStaff } from '#lib/server/guards.ts';
import {
	decideGoLive,
	sharedSerialCount,
	spotCheck
} from '@deteck/core/server/manufacturers/golive.ts';
import { ReviewError } from '@deteck/core/server/manufacturers/review.ts';
import { goLiveChecklist } from '@deteck/core/server/manufacturers/summary.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const [m] = await ctx()
		.db.select()
		.from(manufacturer)
		.where(eq(manufacturer.id, event.params.id));
	if (!m) error(404, 'Manufacturer not found.');
	const [checklist, spot, shared, submitter] = await Promise.all([
		goLiveChecklist(m.id),
		spotCheck(m.id),
		sharedSerialCount(m.id),
		m.submittedForReviewBy
			? ctx().db.select({ name: user.name }).from(user).where(eq(user.id, m.submittedForReviewBy))
			: Promise.resolve([])
	]);
	return { m, checklist, spot, shared, submittedBy: submitter[0]?.name ?? null };
};

export const actions: Actions = {
	decide: async (event) => {
		const { actor } = requireStaff(event);
		const data = await event.request.formData();
		const decision = data.get('decision') === 'approve' ? 'approve' : 'send_back';
		const note = String(data.get('note') ?? '');
		try {
			await decideGoLive(actor, event.params.id, decision, note);
		} catch (err) {
			if (err instanceof ReviewError) return fail(400, { message: err.message, note });
			throw err;
		}
		redirect(303, `/console/manufacturers/${event.params.id}?decided=${decision}`);
	}
};
