import type { LayoutServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { MANUFACTURER_OK } from '@deteck/core/server/owner-status.ts';
import { editBlockedReason, requireManufacturer } from '#lib/server/guards.ts';

export const load: LayoutServerLoad = async (event) => {
	const access = await requireManufacturer(event);
	const m = access.manufacturer;
	return {
		contactEmail: ctx().config.contactEmail ?? null,
		access: {
			userName: access.user.name,
			roleLabel: access.onBehalf
				? 'DETECK staff (on behalf)'
				: access.isAdmin
					? 'Admin'
					: 'Uploader',
			isAdmin: access.isAdmin,
			onBehalf: access.onBehalf,
			staffRole: access.staffRole
		},
		company: {
			id: m.id,
			name: m.companyName,
			status: m.status,
			statusReason: m.statusReason,
			state: m.state,
			town: m.factoryTown,
			/** Why imports and edits are closed right now, or null. */
			editBlocked: editBlockedReason(m.status),
			/** Team invites, API keys and webhooks: from DETECK's approval on. */
			toolsOpen: MANUFACTURER_OK.has(m.status)
		}
	};
};
