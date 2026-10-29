import type { PageServerLoad } from './$types';
import { ctx } from '@deteck/core/server/context.ts';

export const load: PageServerLoad = ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'public, max-age=300' });
	return { contactEmail: ctx().config.contactEmail ?? null };
};
