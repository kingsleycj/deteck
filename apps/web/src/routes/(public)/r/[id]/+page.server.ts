import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { rateLimited } from '@deteck/core/messages/copy.ts';
import { messages } from '@deteck/core/messages/i18n.ts';
import { AlertError, subscribeToRecalls, type AlertChannel } from '@deteck/core/server/alerts.ts';
import { consume } from '@deteck/core/server/rate-limit.ts';
import { whatsappEnabled } from '@deteck/core/server/whatsapp.ts';
import { buildJourney } from '@deteck/core/server/journey/build.ts';
import { requester } from '#lib/server/requester.ts';
import { loadResult, publicView, runBatchChoice } from '@deteck/core/server/verify/check.ts';

export const load: PageServerLoad = async (event) => {
	event.setHeaders({ 'cache-control': 'private, no-store' });
	const { params } = event;
	const result = await loadResult(params.id);
	if (!result)
		return {
			id: params.id,
			result: null,
			journey: null,
			canCheckPackaging: false,
			whatsappAlerts: false
		};
	const journey =
		result.code === 'VALID' && result.journeyAvailable ? await buildJourney(result) : null;
	// Offer the packaging check only if this browser can use it now (the flag may have changed,
	// or the result link may have been opened somewhere else).
	const canCheckPackaging =
		result.code === 'VALID' && result.packagingAvailable && requester(event).packagingEnabled;
	return {
		id: params.id,
		result: publicView(result),
		journey,
		canCheckPackaging,
		whatsappAlerts: whatsappEnabled()
	};
};

export const actions: Actions = {
	/** Sign up to hear if this pack's batch is recalled later. */
	alert: async (event) => {
		const data = await event.request.formData();
		const channel = (data.get('channel') === 'whatsapp' ? 'whatsapp' : 'email') as AlertChannel;
		const address = String(data.get('address') ?? '').slice(0, 200);
		const t = messages(event.locals.lang);
		if (data.get('consent') !== 'on')
			return fail(400, {
				alertMessage: t.alerts.needConsent,
				alertAddress: address
			});
		const who = requester(event);
		const limited = await consume([
			{ key: `alert:d:${who.deviceId}:day`, windowSeconds: 86_400, max: 10 },
			// who.ip is already per network for IPv6; this stops one address signing up the world.
			{ key: `alert:ip:${who.ip}:day`, windowSeconds: 86_400, max: 30 }
		]);
		if (!limited.ok)
			return fail(429, {
				alertMessage: t.alerts.errors.daily_limit,
				alertAddress: address
			});
		try {
			const result = await subscribeToRecalls({
				verificationId: event.params.id,
				channel,
				address,
				locale: event.locals.lang
			});
			return {
				alertDone: result.alreadySubscribed
					? t.alerts.already
					: channel === 'email'
						? t.alerts.checkEmail
						: t.alerts.whatsappDone
			};
		} catch (error) {
			if (error instanceof AlertError)
				return fail(400, {
					alertMessage: error.code ? t.alerts.errors[error.code] : error.message,
					alertAddress: address
				});
			throw error;
		}
	},
	batch: async (event) => {
		const data = await event.request.formData();
		const lot = String(data.get('lot') ?? '')
			.trim()
			.slice(0, 40);
		const t = messages(event.locals.lang);
		if (lot.length === 0) return fail(400, { lot, message: t.result.batchMissing });
		const outcome = await runBatchChoice(event.params.id, lot, requester(event));
		// The batch question has expired: the result page explains and offers a new check.
		if (!outcome) redirect(303, `/r/${event.params.id}`);
		if (!outcome.ok) {
			if (outcome.kind === 'rate_limited')
				return fail(429, { lot, message: rateLimited(outcome.retryAfterSeconds, t) });
			if (outcome.kind === 'batch_not_matched')
				return fail(400, { lot, message: t.result.batchNotMatched });
			return fail(400, { lot, message: t.result.batchMissing });
		}
		redirect(303, `/r/${outcome.id}`);
	}
};
