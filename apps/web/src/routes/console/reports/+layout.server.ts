import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { serverContext } from '#lib/server/app.ts';

/** Reports of fakes are switched off for now (FEATURE_REPORTS): these pages don't exist then. */
export const load: LayoutServerLoad = () => {
	if (!serverContext.config.reportsEnabled) error(404, 'Not found');
	return {};
};
