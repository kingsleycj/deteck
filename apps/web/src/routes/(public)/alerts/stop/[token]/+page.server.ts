import type { Actions, PageServerLoad } from './$types';
import { unsubscribeAlert } from '@deteck/core/server/alerts.ts';

// Stopping happens on a button press, so link previews in email apps can't unsubscribe anyone.
export const load: PageServerLoad = () => ({});

export const actions: Actions = {
	default: async ({ params }) => ({ stopped: await unsubscribeAlert(params.token) })
};
