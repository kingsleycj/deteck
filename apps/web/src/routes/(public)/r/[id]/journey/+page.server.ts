import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { deviceDayHash } from '@deteck/core/server/crypto.ts';
import { buildJourney } from '@deteck/core/server/journey/build.ts';
import { requester } from '#lib/server/requester.ts';
import { loadResult, publicView, recordCheckEvent } from '@deteck/core/server/verify/check.ts';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });
	const result = await loadResult(event.params.id);
	if (!result) return { id: event.params.id, result: null, journey: null };
	// Only Valid results have a journey; anything else goes back to its own result page.
	if (result.code !== 'VALID') redirect(303, `/r/${event.params.id}`);
	const journey = await buildJourney(result);
	const who = requester(event);
	void recordCheckEvent({
		kind: 'journey',
		result: journey.state,
		productId: result.product?.id,
		batchId: result.batch?.id,
		deviceDayHash: deviceDayHash(who.deviceId),
		state: who.state
	});
	const enabled = who.packagingEnabled && result.packagingAvailable;
	return { id: event.params.id, result: publicView(result), journey, canCheckPackaging: enabled };
};
