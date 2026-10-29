import type { PageServerLoad } from './$types';
import { requireManufacturer } from '#lib/server/guards.ts';
import { listParties } from '@deteck/core/server/parties.ts';

export const load: PageServerLoad = async (event) => {
	const { manufacturer: m } = await requireManufacturer(event);
	const rows = await listParties({ manufacturerId: m.id });
	// Only what this page shows: no other manufacturer's names or counts.
	return {
		rows: rows.map((r) => ({
			id: r.id,
			name: r.name,
			role: r.role,
			state: r.state,
			city: r.city,
			verified_at: r.verified_at,
			events: r.events
		}))
	};
};
