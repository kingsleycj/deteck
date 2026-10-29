/** DETECK staff roles, shared by the web app's guards and the team logic. */
export type StaffRole = 'admin' | 'reviewer';

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
	admin: 'DETECK admin',
	reviewer: 'DETECK reviewer'
};
