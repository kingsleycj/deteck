import type { PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';

// No shared cache: the page's header and menus are in the visitor's language.
export const load: PageServerLoad = () => ({ contactEmail: ctx().config.contactEmail ?? null });
