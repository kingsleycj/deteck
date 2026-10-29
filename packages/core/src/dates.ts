/** DETECK shows dates in West Africa Time (UTC+1, no daylight saving). Safe in the browser too. */
const WAT_OFFSET_MS = 60 * 60 * 1000;

/** Today's date in Nigeria as YYYY-MM-DD, whatever the computer's own time zone. */
export function lagosToday(now = new Date()): string {
	return new Date(now.getTime() + WAT_OFFSET_MS).toISOString().slice(0, 10);
}
