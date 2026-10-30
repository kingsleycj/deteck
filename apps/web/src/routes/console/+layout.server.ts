import type { LayoutServerLoad } from './$types';
import { serverContext } from '#lib/server/app.ts';
import { requireStaff, STAFF_ROLE_LABEL } from '#lib/server/guards.ts';

export const load: LayoutServerLoad = (event) => {
	const { user, role } = requireStaff(event);
	return {
		features: { reports: serverContext.config.reportsEnabled },
		staff: {
			name: user.name,
			role,
			roleLabel: STAFF_ROLE_LABEL[role],
			isAdmin: role === 'admin',
			userId: user.id
		}
	};
};
