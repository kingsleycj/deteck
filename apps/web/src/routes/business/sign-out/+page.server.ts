import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { auth } from '#lib/server/app.ts';

export const load: PageServerLoad = () => redirect(303, '/business/sign-in');

export const actions: Actions = {
	default: async (event) => {
		await auth.api.signOut({ headers: event.request.headers }).catch(() => undefined);
		event.cookies.delete('dtk_as', { path: '/workspace' });
		event.cookies.delete('dtk_bas', { path: '/portal' });
		redirect(303, '/business/sign-in?notice=signed-out');
	}
};
