/**
 * The visitor's dictionary on public pages (from the public layout). Import only types and the
 * small helpers here: the dictionaries themselves stay on the server.
 */
import { page } from '$app/state';
import type { Messages } from '@deteck/core/messages/dict/en.ts';

export { fmt, plural, richParts } from '@deteck/core/messages/format.ts';
export type { Messages };

/** Use inside $derived so it follows the current page. */
export const useT = (): Messages => page.data.t as Messages;
