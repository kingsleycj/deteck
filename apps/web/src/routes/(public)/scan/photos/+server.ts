import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** The photos are now taken in "Verify further by scan"; old links land there. */
export const GET: RequestHandler = ({ url }) => {
	const from = url.searchParams.get('from');
	redirect(308, from ? `/scan?from=${encodeURIComponent(from)}` : '/scan');
};
