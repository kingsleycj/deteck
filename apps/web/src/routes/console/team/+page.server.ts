import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaff } from '#lib/server/guards.ts';
import {
	cancelStaffInvite,
	changeStaffRole,
	inviteStaff,
	listStaff,
	resetTwoFactor,
	restoreStaff,
	TeamError
} from '@deteck/core/server/team.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const { staff, invites, removed } = await listStaff();
	return { members: staff, invites, removed };
};

export const actions: Actions = {
	invite: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			const { url } = await inviteStaff(actor, {
				email: String(data.get('email') ?? ''),
				name: String(data.get('name') ?? ''),
				role: String(data.get('role') ?? 'reviewer'),
				note: String(data.get('note') ?? '')
			});
			return { done: 'Invite sent. It works once and expires in 7 days.', url };
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { message: error.message });
			throw error;
		}
	},
	cancelInvite: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			await cancelStaffInvite(actor, String(data.get('email') ?? ''));
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { message: error.message });
			throw error;
		}
		return { done: 'Invite cancelled. Its link no longer works.' };
	},
	role: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			await changeStaffRole(actor, String(data.get('userId')), String(data.get('role')));
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { message: error.message });
			throw error;
		}
		return { done: 'Saved.' };
	},
	reset2fa: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			await resetTwoFactor(actor, { userId: String(data.get('userId')) });
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { message: error.message });
			throw error;
		}
		return {
			done: "Two-step sign-in reset. They've been signed out and will set it up again at their next sign-in."
		};
	},
	restore: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const data = await event.request.formData();
		try {
			await restoreStaff(actor, String(data.get('userId')), String(data.get('role')));
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { message: error.message });
			throw error;
		}
		return { done: 'Restored. We emailed them to say their access is back.' };
	}
};
