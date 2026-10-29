import type { RequestHandler } from './$types';
import { resultCopy } from '@deteck/core/messages/copy.ts';
import { messages } from '@deteck/core/messages/i18n.ts';
import { apiCheck, publicView } from '@deteck/core/server/verify/check.ts';
import { ApiProblem, body, caller, handler, json, OPTIONS } from '#lib/server/api.ts';

/**
 * POST /api/v1/checks: check a typed serial ({ "serial": "…" }) or a scanned code ({ "code": "…" }).
 * A serial on more than one product needs the batch number from the pack: send it as "lot", with
 * the first request or again after a NEEDS_BATCH answer.
 * The summary is in the language asked for with Accept-Language or ?lang= (English by default).
 */
export const POST: RequestHandler = handler(async (event) => {
	await caller(event);
	const input = await body<{ serial?: unknown; code?: unknown; lot?: unknown }>(event);
	const raw =
		typeof input.code === 'string'
			? input.code
			: typeof input.serial === 'string'
				? input.serial
				: '';
	if (!raw)
		throw new ApiProblem(400, 'missing_serial', 'Send { "serial": "…" } or { "code": "…" }.');
	const outcome = await apiCheck(raw.slice(0, 200), {
		state: event.request.headers.get('cf-region'),
		lot: typeof input.lot === 'string' ? input.lot.slice(0, 40) : undefined
	});
	const t = messages(event.locals.lang);
	if (!outcome.ok) {
		if (outcome.problem === 'batch_not_matched')
			throw new ApiProblem(
				422,
				'batch_not_matched',
				'No product with this serial has that batch number. Check the batch number printed on the pack.'
			);
		throw new ApiProblem(422, `format_${outcome.problem}`, t.format[outcome.problem]);
	}
	const result = publicView(outcome.result);
	const copy = resultCopy(result, t);
	return json(
		{
			id: outcome.id,
			expiresInSeconds: 1800,
			result,
			// What to send next: "lot" when the batch number is needed, "code" when only a scan of
			// the pack's square code can tell the products apart.
			needs:
				result.code === 'NEEDS_BATCH' ? (result.reason === 'needs_scan' ? 'code' : 'lot') : null,
			summary: {
				language: event.locals.lang,
				title: copy.title ?? copy.badges.join(' · '),
				message: copy.bubble,
				nextStep: copy.nextStep ?? null
			},
			links: {
				self: `/api/v1/checks/${outcome.id}`,
				journey: result.journeyAvailable ? `/api/v1/checks/${outcome.id}/journey` : null,
				page: `/r/${outcome.id}`
			}
		},
		201,
		{ 'content-language': event.locals.lang }
	);
});

export { OPTIONS };
