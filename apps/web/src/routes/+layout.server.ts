import type { LayoutServerLoad } from './$types';
import { messages } from '@deteck/core/messages/i18n.ts';

/** Pages that don't exist (404) have no group layout, so the error page gets its words here. */
export const load: LayoutServerLoad = ({ locals, route }) =>
	route.id ? {} : { t: messages(locals.lang) };
