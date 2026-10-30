import type { PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';

// No shared cache: the page is in the visitor's language (cookie or browser setting), and a cached
// copy would show the old language for minutes after someone switches.
export const load: PageServerLoad = () => {
	const config = ctx().config;
	return { contactEmail: config.contactEmail ?? null, showreel: config.showreel ?? null };
};
