import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad, RequestEvent } from './$types';
import { rateLimited } from '@deteck/core/messages/copy.ts';
import { messages } from '@deteck/core/messages/i18n.ts';
import { consume } from '@deteck/core/server/rate-limit.ts';
import { requester } from '#lib/server/requester.ts';
import { DecodeBusyError, decodeCode } from '@deteck/core/server/scan/decode.ts';
import { startScan } from '@deteck/core/server/scan/session.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { loadResult, runCheck } from '@deteck/core/server/verify/check.ts';

/**
 * "Verify further by scan", as in Akuabata's design (B-83): three photos of the pack (front, back,
 * label). The code is read from the photos (or live by the browser) to find the pack, then the
 * packaging is compared with the manufacturer's. Coming from a Valid result (`?from=`), the serial
 * is already known. When the packaging check is off for this browser (FEATURE_PACKAGING_AI), the
 * photos still find the pack and the person gets its serial result, saying the check isn't open yet.
 */
export const load: PageServerLoad = async (event) => {
	const from = event.url.searchParams.get('from');
	const enabled = requester(event).packagingEnabled;
	if (from) {
		const previous = await loadResult(from);
		if (previous?.code === 'VALID' && previous.packagingAvailable && enabled)
			return {
				from,
				serial: previous.serialDisplay,
				product: `${previous.product!.brandName} ${previous.product!.strength}`
			};
		// This result can't use the packaging check: back to it, saying why for a Valid one.
		if (previous)
			redirect(
				303,
				previous.code !== 'VALID' ? `/r/${from}` : `/r/${from}?scan=${enabled ? 'noref' : 'off'}`
			);
	}
	return { from: null, serial: null, product: null };
};

/** Reading a code from a photo is the expensive part: count each photo before reading it. */
async function decodeAllowed(event: RequestEvent) {
	const who = requester(event);
	return consume([
		{ key: `decode:d:${who.deviceId}:h`, windowSeconds: 3600, max: 30 },
		{ key: `decode:ip:${who.ip}:h`, windowSeconds: 3600, max: 240 }
	]);
}

/** Reads the code in a photo, or says the server is busy reading others. */
async function read(bytes: Uint8Array): Promise<string | null | 'busy'> {
	try {
		return await decodeCode(bytes);
	} catch (error) {
		if (error instanceof DecodeBusyError) return 'busy';
		throw error;
	}
}

export const actions: Actions = {
	/** The three photos: find the serial, then start the packaging check. */
	photos: async (event) => {
		const t = messages(event.locals.lang);
		const who = requester(event);
		const data = await event.request.formData();
		const photos = {
			front: await readFile(data.get('front')),
			back: await readFile(data.get('back')),
			label: await readFile(data.get('label'))
		};
		let id = String(data.get('from') ?? '');
		if (!id) {
			let code = String(data.get('code') ?? '').slice(0, 300);
			if (!code) {
				// The square code is usually on the back; try the label and the front too.
				for (const side of ['back', 'label', 'front'] as const) {
					const photo = photos[side];
					if (!photo || photo.bytes.length > 12 * 1024 * 1024) continue;
					const limited = await decodeAllowed(event);
					if (!limited.ok) return fail(429, { message: rateLimited(limited.retryAfterSeconds, t) });
					const text = await read(photo.bytes);
					if (text === 'busy') return fail(503, { message: t.scan.busy });
					code = text ?? '';
					if (code) break;
				}
			}
			if (!code) return fail(400, { side: 'back', message: t.scan.noCode });
			const outcome = await runCheck(code, who);
			if (!outcome.ok) {
				if (outcome.kind === 'rate_limited')
					return fail(429, { message: rateLimited(outcome.retryAfterSeconds, t) });
				return fail(400, { message: t.format[outcome.problem] });
			}
			id = outcome.id;
		}
		const result = await loadResult(id);
		if (!result) redirect(303, '/scan');
		// Not Valid (unrecognised, recalled…): the result page explains. The photos aren't kept.
		if (result.code !== 'VALID') redirect(303, `/r/${id}`);
		// Valid, but the check is off for this browser, or the manufacturer hasn't shared its
		// packaging: say which on the result.
		if (!who.packagingEnabled) redirect(303, `/r/${id}?scan=off`);
		if (!result.packagingAvailable) redirect(303, `/r/${id}?scan=noref`);
		const outcome = await startScan(who, id, photos, data.get('retain') === 'on', t);
		if (!outcome.ok)
			return fail(outcome.status, { side: outcome.side ?? null, message: outcome.message });
		redirect(303, `/scan/${outcome.id}`);
	}
};
