import { lagosToday } from '../dates.ts';

/** Today's date in Nigeria as YYYY-MM-DD. */
export function today(now = new Date()): string {
	return lagosToday(now);
}
