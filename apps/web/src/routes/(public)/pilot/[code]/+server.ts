import { error, redirect } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from './$types';
import { ctx } from '@deteck/core/server/context.ts';
import { consume, ipKey } from '@deteck/core/server/rate-limit.ts';
import { grantPilotAccess } from '#lib/server/requester.ts';

/** Opening /pilot/<PILOT_ACCESS_CODE> unlocks pilot-only features in this browser (D-10). */
export const GET: RequestHandler = async (event) => {
	// Attempts are counted per network, so the code can't be found by trying many.
	let address = 'unknown';
	try {
		address = ipKey(event.getClientAddress());
	} catch {
		// Not available in some test set-ups.
	}
	const limited = await consume([{ key: `pilot:ip:${address}:h`, windowSeconds: 3600, max: 20 }]);
	if (!limited.ok) error(429, 'Too many tries. Please wait an hour.');
	const expected = ctx().config.pilotAccessCode;
	const given = event.params.code;
	if (
		!expected ||
		given.length !== expected.length ||
		!timingSafeEqual(Buffer.from(given), Buffer.from(expected))
	) {
		error(404, 'Not found');
	}
	grantPilotAccess(event);
	redirect(303, '/check?pilot=on');
};
