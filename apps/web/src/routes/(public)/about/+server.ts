import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** The landing page moved to the root; keep old links working. */
export const GET: RequestHandler = () => redirect(301, '/');
