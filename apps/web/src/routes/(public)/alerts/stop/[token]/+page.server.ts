import type { Actions, PageServerLoad } from './$types';
import { isStopToken, unsubscribeAlert } from '@deteck/core/server/alerts.ts';

// Stopping happens on a button press, so link previews in email apps can't unsubscribe anyone.
// A broken link says so straight away, instead of asking first.
export const load: PageServerLoad = ({ params }) => ({ valid: isStopToken(params.token) });

export const actions: Actions = {
	default: async ({ params }) => ({ stopped: await unsubscribeAlert(params.token) })
};
