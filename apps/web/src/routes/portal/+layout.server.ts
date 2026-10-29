import type { LayoutServerLoad } from './$types';
import { BUSINESS_ROLES } from '@deteck/core/server/business.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { requireBusiness } from '#lib/server/guards.ts';

export const load: LayoutServerLoad = async (event) => {
	const access = await requireBusiness(event);
	const b = access.business;
	return {
		contactEmail: ctx().config.contactEmail ?? null,
		access: {
			userName: access.user.name,
			roleLabel: access.onBehalf ? 'DETECK staff (on behalf)' : access.isAdmin ? 'Admin' : 'Staff',
			isAdmin: access.isAdmin,
			onBehalf: access.onBehalf
		},
		business: {
			id: b.id,
			name: b.name,
			role: b.role,
			roleLabel: BUSINESS_ROLES[b.role as keyof typeof BUSINESS_ROLES] ?? b.role,
			status: b.status,
			statusReason: b.statusReason,
			state: b.state,
			town: b.town,
			/** Team invites and API keys: only while approved (not pending, not paused). */
			toolsOpen: b.status === 'approved'
		}
	};
};
