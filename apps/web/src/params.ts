import type { ParamMatcher } from '@sveltejs/kit/params';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Route ids that are UUIDs in the database (`[id=uuid]`): anything else is "not found" before
 * a query runs, instead of a database error.
 */
const uuid: ParamMatcher<string> = {
	'~standard': {
		version: 1,
		vendor: 'deteck',
		validate: (value) =>
			typeof value === 'string' && UUID.test(value)
				? { value }
				: { issues: [{ message: 'Not an id' }] }
	}
};

export const params = { uuid };
