import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireStaff } from '#lib/server/guards.ts';
import { listParties, mergeParty, PartyError, verifyParty } from '@deteck/core/server/parties.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const q = event.url.searchParams.get('q') ?? '';
	const unverifiedOnly = event.url.searchParams.get('show') !== 'all';
	return {
		q,
		unverifiedOnly,
		rows: [...(await listParties({ q, unverifiedOnly }))],
		all: [...(await listParties({}))].map((p) => ({
			id: p.id,
			name: p.name,
			place: [p.city, p.state].filter(Boolean).join(', ')
		}))
	};
};

async function run(fn: () => Promise<void>, done: string) {
	try {
		await fn();
	} catch (error) {
		if (error instanceof PartyError) return fail(400, { message: error.message });
		throw error;
	}
	return { done };
}

export const actions: Actions = {
	verify: async (event) => {
		const { actor } = requireStaff(event);
		const d = await event.request.formData();
		return run(
			() =>
				verifyParty(actor, String(d.get('id')), {
					pcnLicence: String(d.get('pcn') ?? ''),
					cacRc: String(d.get('cac') ?? ''),
					gln: String(d.get('gln') ?? '')
				}),
			'Verified. Journeys now show "Verified by DETECK" for this business.'
		);
	},
	unverify: async (event) => {
		const { actor } = requireStaff(event, ['admin']);
		const d = await event.request.formData();
		return run(
			() => verifyParty(actor, String(d.get('id')), { unverify: true }),
			'Verification removed.'
		);
	},
	merge: async (event) => {
		const { actor } = requireStaff(event);
		const d = await event.request.formData();
		return run(
			() => mergeParty(actor, String(d.get('id')), String(d.get('into'))),
			'Merged. Journeys now show the surviving business.'
		);
	}
};
