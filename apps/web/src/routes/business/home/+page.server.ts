import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { businessAccount, member } from '@deteck/core/server/db/schema.ts';
import { requireUser, staffRole } from '#lib/server/guards.ts';

/** Sends each signed-in user to the right area. */
export const load: PageServerLoad = async (event) => {
	const user = requireUser(event);
	if (staffRole(user)) redirect(303, '/console');
	const [membership] = await ctx()
		.db.select({ id: member.id, business: businessAccount.id })
		.from(member)
		.leftJoin(businessAccount, eq(businessAccount.organizationId, member.organizationId))
		.where(eq(member.userId, user.id))
		.limit(1);
	if (membership) redirect(303, membership.business ? '/portal' : '/workspace');
	return { name: user.name };
};
