import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { rateLimited } from '@deteck/core/messages/copy.ts';
import { messages } from '@deteck/core/messages/i18n.ts';
import { consume } from '@deteck/core/server/rate-limit.ts';
import { requester } from '#lib/server/requester.ts';
import { decodeCode } from '@deteck/core/server/scan/decode.ts';
import { readFile } from '@deteck/core/server/uploads.ts';
import { loadResult, runCheck } from '@deteck/core/server/verify/check.ts';

export const load: PageServerLoad = async ({ url }) => {
	const from = url.searchParams.get('from');
	const previous = from ? await loadResult(from) : null;
	// Coming from a Valid result with packaging available: go straight to the photos.
	if (from && previous?.code === 'VALID' && previous.packagingAvailable)
		redirect(303, `/scan/photos?from=${encodeURIComponent(from)}`);
	return {};
};

async function check(event: Parameters<Actions[string]>[0], code: string) {
	const outcome = await runCheck(code, requester(event));
	const t = messages(event.locals.lang);
	if (!outcome.ok) {
		if (outcome.kind === 'rate_limited')
			return fail(429, { message: rateLimited(outcome.retryAfterSeconds, t) });
		return fail(400, { message: t.format[outcome.problem] });
	}
	// The result comes first (journey, expiry, recall alerts); it offers the packaging check.
	redirect(303, `/r/${outcome.id}`);
}

export const actions: Actions = {
	/** The browser read the code itself (BarcodeDetector). */
	code: async (event) => {
		const data = await event.request.formData();
		const code = String(data.get('code') ?? '').slice(0, 300);
		if (!code) return fail(400, { message: messages(event.locals.lang).format.bad_code });
		return check(event, code);
	},
	/** A photo of the code, read on the server. */
	decode: async (event) => {
		const data = await event.request.formData();
		const photo = await readFile(data.get('photo'));
		const t = messages(event.locals.lang);
		// Reading a code from a photo is the expensive part: count it before doing it.
		const who = requester(event);
		const limited = await consume([
			{ key: `decode:d:${who.deviceId}:h`, windowSeconds: 3600, max: 60 },
			{ key: `decode:ip:${who.ip}:h`, windowSeconds: 3600, max: 600 }
		]);
		if (!limited.ok) return fail(429, { message: rateLimited(limited.retryAfterSeconds, t) });
		if (!photo) return fail(400, { message: t.scan.noPhoto });
		if (photo.bytes.length > 12 * 1024 * 1024) return fail(400, { message: t.scan.tooLarge });
		const text = await decodeCode(photo.bytes);
		if (!text) return fail(400, { message: t.scan.unreadable });
		return check(event, text);
	}
};
