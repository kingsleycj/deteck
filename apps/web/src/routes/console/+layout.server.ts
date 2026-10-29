import type { LayoutServerLoad } from './$types';
import { requireStaff, STAFF_ROLE_LABEL } from '#lib/server/guards.ts';

export const load: LayoutServerLoad = (event) => {
	const { user, role } = requireStaff(event);
	return {
		staff: {
			name: user.name,
			role,
			roleLabel: STAFF_ROLE_LABEL[role],
			isAdmin: role === 'admin',
			userId: user.id
		}
	};
};
