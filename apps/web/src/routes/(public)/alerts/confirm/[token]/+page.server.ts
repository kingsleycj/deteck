import type { Actions, PageServerLoad } from './$types';
import { confirmAlert, previewAlert } from '@deteck/core/server/alerts.ts';

// Opening the link only shows what it's for; a button confirms it. Email scanners that open
// every link can't sign someone up.
export const load: PageServerLoad = async ({ params }) => ({
	alert: await previewAlert(params.token)
});

export const actions: Actions = {
	default: async ({ params }) => ({ confirmed: await confirmAlert(params.token) })
};
