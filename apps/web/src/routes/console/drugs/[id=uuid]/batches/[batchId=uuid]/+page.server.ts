import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	batchContext,
	correctBatch,
	CorrectionError,
	custodyRecords,
	partyChoices,
	replaceCustodyRecord,
	restoreSerial,
	voidCustodyRecord,
	voidedSerials,
	voidSerial
} from '@deteck/core/server/corrections.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	const isAdmin = requireStaff(event).role === 'admin';
	const row = await batchContext(event.params.batchId).catch(() => null);
	if (!row || row.productId !== event.params.id) error(404, 'Batch not found.');
	const [voided, records, parties] = await Promise.all([
		voidedSerials(row.batch.id),
		custodyRecords(row.batch.id),
		isAdmin ? partyChoices() : Promise.resolve([])
	]);
	return { row, voided, records, parties };
};

/** Admin-only: every correction needs a reason and is emailed to the manufacturer. */
async function correction(
	event: Parameters<Actions[string]>[0],
	run: (actor: ReturnType<typeof requireStaff>['actor'], d: FormData) => Promise<unknown>,
	done: string
) {
	const { actor } = requireStaff(event, ['admin']);
	const d = await event.request.formData();
	try {
		const result = await run(actor, d);
		return { done: result === false ? 'Nothing changed.' : done };
	} catch (err) {
		if (err instanceof CorrectionError) return fail(400, { message: err.message });
		throw err;
	}
}

const text = (d: FormData, key: string) => String(d.get(key) ?? '');

export const actions: Actions = {
	batch: (event) =>
		correction(
			event,
			(actor, d) =>
				correctBatch(
					actor,
					event.params.batchId,
					{
						lot: text(d, 'lot'),
						manufactureDate: text(d, 'manufactureDate'),
						expiryDate: text(d, 'expiryDate'),
						quantity: text(d, 'quantity')
					},
					text(d, 'reason')
				),
			'Batch corrected. Checks show the new details now, and the manufacturer has been told.'
		),
	voidSerial: (event) =>
		correction(
			event,
			(actor, d) => voidSerial(actor, event.params.batchId, text(d, 'serial'), text(d, 'reason')),
			'Serial voided. Checks of it now show "Unrecognised".'
		),
	restoreSerial: (event) =>
		correction(
			event,
			(actor, d) =>
				restoreSerial(actor, event.params.batchId, Number(d.get('packId')), text(d, 'reason')),
			'Serial restored. It checks normally again.'
		),
	voidRecord: (event) =>
		correction(
			event,
			(actor, d) =>
				voidCustodyRecord(actor, event.params.batchId, Number(d.get('eventId')), text(d, 'reason')),
			'Record cancelled. Journeys no longer show it.'
		),
	replaceRecord: (event) =>
		correction(
			event,
			(actor, d) =>
				replaceCustodyRecord(
					actor,
					event.params.batchId,
					Number(d.get('eventId')),
					{
						fromPartyId: text(d, 'fromPartyId'),
						toPartyId: text(d, 'toPartyId'),
						eventDate: text(d, 'eventDate')
					},
					text(d, 'reason')
				),
			'Record corrected. Journeys show the new version.'
		)
};
