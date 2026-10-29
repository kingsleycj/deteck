import { and, eq, gt } from 'drizzle-orm';
import type { FormatProblem, PublicResult, VerificationResult } from '../../verify/types.ts';
import { ctx } from '../context.ts';
import { deviceDayHash, randomId, serialKeyHmac } from '../crypto.ts';
import { batch, checkEvent, verificationResult } from '../db/schema.ts';
import { checkLimits, consume } from '../rate-limit.ts';
import { lookup, parseCheckInput, resolveByBatch } from './lookup.ts';

const RESULT_TTL_MS = 30 * 60 * 1000;

export interface Requester {
	deviceId: string;
	ip: string;
	/** Approximate state from IP geolocation, if known. */
	state: string | null;
	/** Whether this browser may see the packaging scan (pilot or public). */
	packagingEnabled: boolean;
	/** Passed the "are you human?" check today, which raises the device limits. */
	human?: boolean;
	/** This request came without a device cookie. */
	newDevice?: boolean;
}

export type CheckOutcome =
	| { ok: true; id: string; result: VerificationResult }
	| { ok: false; kind: 'format'; problem: FormatProblem }
	| { ok: false; kind: 'rate_limited'; retryAfterSeconds: number };

export type BatchChoiceOutcome = CheckOutcome | { ok: false; kind: 'batch_not_matched' };

type CheckEventInput = Omit<typeof checkEvent.$inferInsert, 'id' | 'createdAt'>;

/** Writes the anonymous check event without slowing the response. */
export function recordCheckEvent(event: CheckEventInput): Promise<void> {
	return ctx()
		.db.insert(checkEvent)
		.values(event)
		.then(
			() => undefined,
			(error) => console.error('[check_event] failed to record', error)
		);
}

async function saveResult(result: VerificationResult): Promise<string> {
	const id = randomId(12);
	await ctx()
		.db.insert(verificationResult)
		.values({ id, result, expiresAt: new Date(Date.now() + RESULT_TTL_MS) });
	return id;
}

export async function loadResult(id: string): Promise<VerificationResult | null> {
	if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
	const [row] = await ctx()
		.db.select({ result: verificationResult.result })
		.from(verificationResult)
		.where(and(eq(verificationResult.id, id), gt(verificationResult.expiresAt, new Date())))
		.limit(1);
	const result = (row?.result as VerificationResult | undefined) ?? null;
	return result ? withCurrentRecall(result) : null;
}

/**
 * Results are kept for 30 minutes. If the batch was recalled or withdrawn in that time, the
 * saved Valid result must not keep saying Valid: it becomes the recall.
 */
async function withCurrentRecall(result: VerificationResult): Promise<VerificationResult> {
	if (result.code !== 'VALID' || !result.batch) return result;
	const [now] = await ctx()
		.db.select({
			status: batch.status,
			statusReason: batch.statusReason,
			statusSource: batch.statusSource,
			statusEffectiveAt: batch.statusEffectiveAt
		})
		.from(batch)
		.where(eq(batch.id, result.batch.id));
	if (!now || now.status === 'active') return result;
	return {
		...result,
		code: 'RECALLED',
		flags: result.flags.filter((f) => f !== 'EXPIRED'),
		batch: { ...result.batch, ...now },
		journeyAvailable: false,
		packagingAvailable: false
	};
}

/** Drops internal ids and candidate packs before a result is sent to the browser. */
export function publicView(r: VerificationResult): PublicResult {
	const {
		packId: _packId,
		candidates: _candidates,
		serialKey: _serialKey,
		manufacturer,
		product,
		batch,
		...rest
	} = r;
	return {
		...rest,
		manufacturer: manufacturer && {
			name: manufacturer.name,
			state: manufacturer.state,
			town: manufacturer.town
		},
		product: product && (({ id: _id, ...p }) => p)(product),
		batch: batch && (({ id: _id, ...b }) => b)(batch)
	};
}

/** The public "check a serial" operation (F-01), used by typed and scanned input. */
export async function runCheck(raw: string, requester: Requester): Promise<CheckOutcome> {
	const input = parseCheckInput(raw);
	if (!input.ok) return { ok: false, kind: 'format', problem: input.problem };

	const limited = await consume(
		checkLimits(requester.deviceId, requester.ip, requester.human, requester.newDevice)
	);
	if (!limited.ok)
		return { ok: false, kind: 'rate_limited', retryAfterSeconds: limited.retryAfterSeconds };

	const lookedUp = await lookup(input, { packagingEnabled: requester.packagingEnabled });
	const serial = input.kind === 'typed' ? input.key : input.serial;
	const result: VerificationResult = {
		...lookedUp,
		serialKey: serial ? serialKeyHmac(serial).toString('hex') : undefined
	};
	const id = await saveResult(result);

	void recordCheckEvent({
		kind: input.kind === 'typed' ? 'serial' : 'scan',
		result: result.flags.includes('EXPIRED') ? `${result.code}:EXPIRED` : result.code,
		productId: result.product?.id,
		batchId: result.batch?.id,
		serialKeyHmac: serial ? serialKeyHmac(serial) : null,
		deviceDayHash: deviceDayHash(requester.deviceId),
		state: requester.state
	});
	return { ok: true, id, result };
}

/**
 * A check made through the REST API: the same lookup and stored result as the website, but without
 * the per-device limits (the API has its own) and without the packaging check.
 */
export async function apiCheck(
	raw: string,
	options: { state?: string | null; lot?: string } = {}
): Promise<
	| { ok: true; id: string; result: VerificationResult }
	| { ok: false; problem: FormatProblem | 'batch_not_matched' }
> {
	const input = parseCheckInput(raw);
	if (!input.ok) return { ok: false, problem: input.problem };
	let lookedUp = await lookup(input, { packagingEnabled: false });
	// The website asks "which batch is on the pack?" as a second step; the API takes it up front.
	if (lookedUp.code === 'NEEDS_BATCH' && lookedUp.reason !== 'needs_scan' && options.lot?.trim()) {
		const narrowed = await resolveByBatch(lookedUp, options.lot, { packagingEnabled: false });
		if (narrowed.reason === 'batch_not_matched') return { ok: false, problem: 'batch_not_matched' };
		lookedUp = narrowed;
	}
	const serial = input.kind === 'typed' ? input.key : input.serial;
	const result: VerificationResult = {
		...lookedUp,
		serialKey: serial ? serialKeyHmac(serial).toString('hex') : undefined
	};
	const id = await saveResult(result);
	void recordCheckEvent({
		kind: 'api',
		result: result.flags.includes('EXPIRED') ? `${result.code}:EXPIRED` : result.code,
		productId: result.product?.id,
		batchId: result.batch?.id,
		serialKeyHmac: serial ? serialKeyHmac(serial) : null,
		state: options.state ?? null
	});
	return { ok: true, id, result };
}

/** Narrows a NEEDS_BATCH result with the batch number printed on the pack. */
export async function runBatchChoice(
	previousId: string,
	lot: string,
	requester: Requester
): Promise<BatchChoiceOutcome | null> {
	const previous = await loadResult(previousId);
	if (!previous || previous.code !== 'NEEDS_BATCH') return null;
	const limited = await consume(
		checkLimits(requester.deviceId, requester.ip, requester.human, requester.newDevice)
	);
	if (!limited.ok)
		return { ok: false, kind: 'rate_limited', retryAfterSeconds: limited.retryAfterSeconds };
	const result = await resolveByBatch(previous, lot, {
		packagingEnabled: requester.packagingEnabled
	});
	// A batch that matches none of the candidates is most likely a typo: ask again rather than
	// showing a warning about a serial that is on record.
	if (result.reason === 'batch_not_matched') return { ok: false, kind: 'batch_not_matched' };
	const id = await saveResult({ ...result, serialKey: previous.serialKey });
	void recordCheckEvent({
		kind: 'serial',
		result: result.flags.includes('EXPIRED') ? `${result.code}:EXPIRED` : result.code,
		productId: result.product?.id,
		batchId: result.batch?.id,
		// Counted for unusual-check signals like any other check of this serial.
		serialKeyHmac: previous.serialKey ? Buffer.from(previous.serialKey, 'hex') : null,
		deviceDayHash: deviceDayHash(requester.deviceId),
		state: requester.state
	});
	return { ok: true, id, result };
}
