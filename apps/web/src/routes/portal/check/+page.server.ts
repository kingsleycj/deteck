import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import {
	BusinessError,
	checkDelivery,
	MAX_BATCH_CHECK,
	recordReceipts,
	splitCodes
} from '@deteck/core/server/business.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { formatProblem } from '@deteck/core/messages/en.ts';
import { assertBusinessApproved, requireBusiness } from '#lib/server/guards.ts';

/** A spreadsheet's header cell ("Serial number", "Code", "SN"), not a code to check. */
const HEADER = /^(serial(\s*(number|no\.?))?|codes?|sn|s\/n|gtin|scanned codes?)$/i;

/** Codes from the text box, plus the first column of an uploaded CSV (without its header). */
async function codesFrom(data: FormData) {
	const typed = splitCodes(String(data.get('codes') ?? ''));
	const file = await readFile(data.get('file'));
	const fromFile = file
		? new TextDecoder()
				.decode(file.bytes)
				.split(/\r?\n/)
				.map((line) =>
					line
						.split(/[,;\t]/)[0]
						?.replace(/^"|"$/g, '')
						.trim()
				)
				.filter((v): v is string => Boolean(v))
		: [];
	if (fromFile.length && HEADER.test(fromFile[0])) fromFile.shift();
	const all = [...typed, ...fromFile];
	return { codes: all.slice(0, MAX_BATCH_CHECK), left: Math.max(0, all.length - MAX_BATCH_CHECK) };
}

export const actions: Actions = {
	check: async (event) => {
		const access = await requireBusiness(event);
		assertBusinessApproved(access);
		const data = await event.request.formData();
		const typed = String(data.get('codes') ?? '').slice(0, 200_000);
		const { codes, left } = await codesFrom(data);
		if (codes.length === 0)
			return fail(400, { typed, message: 'Paste or upload at least one serial.' });
		const lines = await checkDelivery(access.business, codes);
		return {
			// Kept in the box, and saying when some lines weren't checked.
			typed,
			left,
			checked: lines.map((l) => ({
				input: l.input,
				problem: l.problem ? formatProblem[l.problem as keyof typeof formatProblem] : null,
				code: l.result?.code ?? null,
				flags: l.result?.flags ?? [],
				drug: l.result?.product
					? `${l.result.product.brandName} ${l.result.product.strength}`
					: null,
				maker: l.result?.manufacturer?.name ?? null,
				lot: l.result?.batch?.lot ?? null,
				expiry: l.result?.batch?.expiryDate ?? null,
				heldElsewhere: l.heldElsewhere ?? null,
				alreadyHere: l.alreadyHere ?? false
			}))
		};
	},
	receive: async (event) => {
		const access = await requireBusiness(event);
		assertBusinessApproved(access);
		// A receipt says "this business has these packs in hand": only the business can say that.
		if (access.onBehalf)
			return fail(403, { message: 'Only the business itself can confirm what it received.' });
		const data = await event.request.formData();
		const codes = data.getAll('code').map(String).slice(0, MAX_BATCH_CHECK);
		if (codes.length === 0) return fail(400, { message: 'Choose the packs you received.' });
		try {
			const result = await recordReceipts(access.actor, access.business, codes, {
				receivedOn: String(data.get('receivedOn') ?? ''),
				supplierName: String(data.get('supplier') ?? '')
			});
			return { received: result };
		} catch (error) {
			if (error instanceof BusinessError) return fail(400, { message: error.message });
			throw error;
		}
	}
};
