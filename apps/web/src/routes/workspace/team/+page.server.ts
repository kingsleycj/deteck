import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
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
	const { manufacturer: m, user } = await requireManufacturer(event);
	const team = await listManufacturerTeam(m.organizationId);
	return { ...team, me: user.id };
};

async function adminAction(
	event: Parameters<Actions[string]>[0],
	run: (
		access: Awaited<ReturnType<typeof requireManufacturer>>,
		data: FormData
	) => Promise<unknown>,
	done: string
) {
	const access = await requireManufacturer(event);
	if (!access.isAdmin) return fail(403, { message: 'Only company admins can manage the team.' });
	if (access.onBehalf)
		return fail(403, { message: "DETECK staff can't change a manufacturer's team." });
	const data = await event.request.formData();
	try {
		await run(access, data);
	} catch (error) {
		if (error instanceof TeamError) return fail(400, { message: error.message });
		throw error;
	}
	return { done };
}

export const actions: Actions = {
	invite: (event) =>
		adminAction(
			event,
			(a, d) =>
				inviteToManufacturer(a.actor, a.manufacturer, {
					email: String(d.get('email') ?? ''),
					role: String(d.get('role') ?? 'member')
				}),
			'Invite sent. It works once and expires in 7 days.'
		),
	role: (event) =>
		adminAction(
			event,
			(a, d) =>
				changeManufacturerRole(
					a.actor,
					a.manufacturer.id,
					a.manufacturer.organizationId,
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
					a.manufacturer.id,
					a.manufacturer.organizationId,
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
					a.manufacturer.id,
					a.manufacturer.organizationId,
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
					organizationId: a.manufacturer.organizationId,
					manufacturerId: a.manufacturer.id
				}),
			"Two-step sign-in reset. They've been signed out and will set it up again at their next sign-in."
		)
};
