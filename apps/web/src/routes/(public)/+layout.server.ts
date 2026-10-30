import type { LayoutServerLoad } from './$types';
import { languageChoices, messages } from '@deteck/core/messages/i18n.ts';
import { serverContext } from '#lib/server/app.ts';

/** The visitor's language, its dictionary and the language menu, for every public page. */
export const load: LayoutServerLoad = ({ locals }) => ({
	lang: locals.lang,
	t: messages(locals.lang),
	languages: languageChoices(serverContext.config.languages),
	features: { reports: serverContext.config.reportsEnabled }
});
