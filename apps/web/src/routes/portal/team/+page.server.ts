import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireBusiness } from '#lib/server/guards.ts';
import {
	cancelManufacturerInvite,
	changeManufacturerRole,
	inviteToManufacturer,
	listManufacturerTeam,
	removeManufacturerMember,
	resetTwoFactor,
	TeamError
} from '@deteck/core/server/team.ts';

export const load: PageServerLoad = async (event) => {
	const { business: b, user } = await requireBusiness(event);
	const team = await listManufacturerTeam(b.organizationId);
	return { ...team, me: user.id };
};

async function adminAction(
	event: Parameters<Actions[string]>[0],
	run: (access: Awaited<ReturnType<typeof requireBusiness>>, data: FormData) => Promise<unknown>,
	done: string
) {
	const access = await requireBusiness(event);
	if (!access.isAdmin) return fail(403, { message: 'Only admins can manage the team.' });
	if (access.onBehalf)
		return fail(403, { message: "DETECK staff can't change a business's team." });
	const data = await event.request.formData();
	try {
		await run(access, data);
	} catch (error) {
		// The email typed for an invite stays in the box when it needs fixing.
		if (error instanceof TeamError)
			return fail(400, { message: error.message, email: String(data.get('email') ?? '') });
		throw error;
	}
	return { done };
}

export const actions: Actions = {
	invite: (event) =>
		adminAction(
			event,
			(a, d) =>
				inviteToManufacturer(
					a.actor,
					{ id: null, organizationId: a.business.organizationId, companyName: a.business.name },
					{
						email: String(d.get('email') ?? ''),
						role: String(d.get('role') ?? 'member')
					}
				),
			'Invite sent. It works once and expires in 7 days.'
		),
	role: (event) =>
		adminAction(
			event,
			(a, d) =>
				changeManufacturerRole(
					a.actor,
					null,
					a.business.organizationId,
					String(d.get('memberId')),
					String(d.get('role'))
				),
			'Role saved.'
		),
	remove: (event) =>
		adminAction(
			event,
			(a, d) =>
				removeManufacturerMember(
					a.actor,
					null,
					a.business.organizationId,
					String(d.get('memberId'))
				),
			'Removed from the team. Their past actions stay in the audit trail.'
		),
	cancel: (event) =>
		adminAction(
			event,
			(a, d) =>
				cancelManufacturerInvite(
					a.actor,
					null,
					a.business.organizationId,
					String(d.get('email') ?? '')
				),
			'Invite cancelled.'
		),
	reset2fa: (event) =>
		adminAction(
			event,
			(a, d) =>
				resetTwoFactor(a.actor, {
					userId: String(d.get('userId')),
					organizationId: a.business.organizationId
				}),
			"Two-step sign-in reset. They've been signed out and will set it up again at their next sign-in."
		)
};
