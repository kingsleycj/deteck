import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';
import {
	acceptStaffInvite,
	getStaffInvite,
	STAFF_ROLE_NAME,
	TeamError
} from '@deteck/core/server/team.ts';
import type { StaffRole } from '#lib/server/guards.ts';

export const load: PageServerLoad = async ({ params }) => {
	const found = await getStaffInvite(params.id);
	if (found.state !== 'ok') return { state: found.state };
	return {
		state: 'ok' as const,
		name: found.invite.name,
		email: found.invite.email,
		role: STAFF_ROLE_NAME[found.invite.role as StaffRole],
		note: found.invite.note
	};
};

export const actions: Actions = {
	default: async (event) => {
		const data = await event.request.formData();
		const password = String(data.get('password') ?? '');
		if (password !== String(data.get('confirm') ?? ''))
			return fail(400, { message: "The two passwords don't match." });
		try {
			await acceptStaffInvite(
				auth,
				event.params.id,
				{ password },
				{ ip: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') }
			);
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { message: error.message });
			throw error;
		}
		redirect(303, '/business/sign-in?notice=joined');
	}
};
