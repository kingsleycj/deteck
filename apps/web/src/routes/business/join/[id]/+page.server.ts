import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';
import { ctx } from '@deteck/core/server/context.ts';
import { user } from '@deteck/core/server/db/schema.ts';
import {
	acceptManufacturerInvite,
	getManufacturerInvite,
	TeamError
} from '@deteck/core/server/team.ts';

export const load: PageServerLoad = async ({ params, locals }) => {
	const found = await getManufacturerInvite(params.id);
	if (found.state !== 'ok')
		return {
			id: params.id,
			state: found.state,
			company: 'company' in found ? found.company : null
		};
	const [existing] = await ctx()
		.db.select({ id: user.id })
		.from(user)
		.where(eq(user.email, found.invite.email))
		.limit(1);
	return {
		id: params.id,
		state: 'ok' as const,
		company: found.company,
		email: found.invite.email,
		role: found.invite.role === 'admin' ? 'Admin' : 'Uploader',
		hasAccount: Boolean(existing),
		signedInAs: locals.user?.email ?? null
	};
};

export const actions: Actions = {
	create: async (event) => {
		const data = await event.request.formData();
		const name = String(data.get('name') ?? '');
		const password = String(data.get('password') ?? '');
		if (password !== String(data.get('confirm') ?? ''))
			return fail(400, { name, message: "The two passwords don't match." });
		try {
			await acceptManufacturerInvite(
				auth,
				event.params.id,
				{ kind: 'new', name, password },
				{ ip: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') }
			);
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { name, message: error.message });
			throw error;
		}
		redirect(303, '/business/sign-in?notice=joined');
	},
	accept: async (event) => {
		const u = event.locals.user;
		if (!u)
			redirect(
				303,
				`/business/sign-in?next=${encodeURIComponent(`/business/join/${event.params.id}`)}`
			);
		try {
			await acceptManufacturerInvite(
				auth,
				event.params.id,
				{ kind: 'existing', userId: u.id, email: u.email },
				{ ip: event.getClientAddress(), userAgent: event.request.headers.get('user-agent') }
			);
		} catch (error) {
			if (error instanceof TeamError) return fail(400, { name: '', message: error.message });
			throw error;
		}
		redirect(303, '/business/home');
	}
};
