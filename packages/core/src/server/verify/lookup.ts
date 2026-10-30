import { and, eq, inArray, lte, ne, sql } from 'drizzle-orm';
import { looksLikeGs1, parseGs1 } from '../../gs1/element-string.ts';
import {
	checkTypedSerial,
	looksLikeBatchNumber,
	looksLikeNafdacNumber,
	normaliseSerialKey
} from '../../gs1/serial.ts';
import type {
	FormatProblem,
	PublicBatch,
	PublicProduct,
	ResultFlag,
	VerificationResult
} from '../../verify/types.ts';
import { ctx } from '../context.ts';
import { serialExactHmac, serialKeyHmac } from '../crypto.ts';
import {
	batch,
	custodyEvent,
	manufacturer,
	pack,
	packagingReference,
	packVoid,
	product
} from '../db/schema.ts';
import { notSuperseded } from '../db/current.ts';
import { today } from '../time.ts';

/**
 * Whose records public checks can see: live manufacturers, and suspended ones that were live
 * before the suspension (they show "can't confirm"). A manufacturer suspended before it ever
 * went live stays invisible, so unreviewed data never reaches the public.
 */
function isVisible(m: { status: string; statusBeforeSuspension: string | null }) {
	return m.status === 'live' || (m.status === 'suspended' && m.statusBeforeSuspension === 'live');
}

/** Drugs the public never sees: waiting for DETECK's review, or rejected by it. */
const HIDDEN_PRODUCT = ['pending_review', 'rejected'];

/**
 * The same rule as `visible()`, in SQL, so hidden packs are dropped before any limit: ten
 * packs of companies that aren't live must not push a live pack with the same serial out.
 */
const visibleSql = sql`(${manufacturer.status} = 'live' or (${manufacturer.status} = 'suspended' and ${manufacturer.statusBeforeSuspension} = 'live'))
	and ${product.status} not in ('pending_review', 'rejected')
	and not exists (select 1 from ${packVoid} v where v.pack_id = ${pack}.id)`;

export type CheckInput =
	| {
			ok: true;
			kind: 'typed';
			key: string;
			display: string;
			/**
			 * The serial without a label typed in front of it ("SN 7K4M…"). Tried when `key` finds
			 * nothing; lookup() then makes it the key, so callers record the serial that matched.
			 */
			altKey?: string;
	  }
	| {
			ok: true;
			kind: 'scanned';
			gtin: string;
			serial?: string;
			lot?: string;
			expiry?: string;
			display: string;
	  }
	| { ok: false; problem: FormatProblem };

/**
 * Shows only the end of the serial ("…TB8D"): enough to recognise the pack, never enough to copy
 * the code. Short serials show at most half their characters.
 */
export function displaySerial(serial: string): string {
	const s = normaliseSerialKey(serial);
	const shown = s.length >= 8 ? 4 : Math.max(1, Math.floor(s.length / 2));
	return `…${s.slice(-shown)}`;
}

/** Turns what the person typed (or what a scanner read) into a lookup input. */
export function parseCheckInput(raw: string): CheckInput {
	const input = raw.trim();
	if (looksLikeGs1(input)) {
		const parsed = parseGs1(input);
		if (!parsed.ok || !parsed.data.gtin) return { ok: false, problem: 'bad_code' };
		const { gtin, serial, lot, expiry } = parsed.data;
		return {
			ok: true,
			kind: 'scanned',
			gtin,
			serial,
			lot,
			expiry,
			display: serial ? displaySerial(serial) : gtin
		};
	}
	if (looksLikeNafdacNumber(input)) return { ok: false, problem: 'nafdac_number' };
	if (looksLikeBatchNumber(input)) return { ok: false, problem: 'batch_number' };
	// The pack says "SN 7K4M9QX2TB8D" and people copy the label too. A serial may itself start
	// with SN, so the whole text is tried first.
	const label = SERIAL_LABEL.exec(input);
	const bare =
		label && label[0].length < input.length ? checkTypedSerial(input.slice(label[0].length)) : null;
	const checked = checkTypedSerial(input);
	if (!checked.ok) {
		if (bare?.ok)
			return { ok: true, kind: 'typed', key: bare.key, display: displaySerial(bare.key) };
		return { ok: false, problem: checked.problem };
	}
	return {
		ok: true,
		kind: 'typed',
		key: checked.key,
		display: displaySerial(checked.key),
		...(bare?.ok && bare.key !== checked.key ? { altKey: bare.key } : {})
	};
}

/** "SN", "S/N", "SN:", "Serial", "Serial No." and similar labels in front of a serial. */
const SERIAL_LABEL = /^\s*(?:S\s*\/?\s*N|SERIAL(?:\s*(?:NO|NUMBER|NUM|#))?)\s*[.:#]?\s*[.:#]?\s*/i;

const packColumns = {
	packId: pack.id,
	voided: sql<boolean>`exists (select 1 from ${packVoid} v where v.pack_id = ${pack}.id)`,
	manufacturer: {
		id: manufacturer.id,
		name: manufacturer.companyName,
		state: manufacturer.state,
		town: manufacturer.factoryTown,
		status: manufacturer.status,
		statusBeforeSuspension: manufacturer.statusBeforeSuspension
	},
	product: {
		id: product.id,
		gtin: product.gtin,
		brandName: product.brandName,
		genericName: product.genericName,
		strength: product.strength,
		dosageForm: product.dosageForm,
		packSize: product.packSize,
		nafdacRegNo: product.nafdacRegNo,
		serialHint: product.serialHint,
		status: product.status
	},
	batch: {
		id: batch.id,
		lot: batch.lot,
		manufactureDate: batch.manufactureDate,
		expiryDate: batch.expiryDate,
		status: batch.status,
		statusReason: batch.statusReason,
		statusSource: batch.statusSource,
		statusEffectiveAt: batch.statusEffectiveAt
	}
};

type PackRow = {
	packId: number;
	voided: boolean;
	manufacturer: {
		id: string;
		name: string;
		state: string;
		town: string | null;
		status: string;
		statusBeforeSuspension: string | null;
	};
	product: PublicProduct & { gtin: string; status: string };
	batch: PublicBatch;
};

function packQuery() {
	return ctx()
		.db.select(packColumns)
		.from(pack)
		.innerJoin(product, eq(pack.productId, product.id))
		.innerJoin(batch, eq(pack.batchId, batch.id))
		.innerJoin(manufacturer, eq(product.manufacturerId, manufacturer.id));
}

let coverageCache: { at: number; value: { manufacturers: number; products: number } } | undefined;

/** How many live manufacturers and products DETECK has records for (cached for 5 minutes). */
export async function coverage() {
	if (coverageCache && Date.now() - coverageCache.at < 5 * 60_000) return coverageCache.value;
	const [row] = await ctx().db.execute<{ manufacturers: number; products: number }>(sql`
		select
			(select count(*)::int from ${manufacturer} where ${manufacturer.status} = 'live') as manufacturers,
			(select count(*)::int from ${product} p join ${manufacturer} m on m.id = p.manufacturer_id
				where m.status = 'live' and p.status not in ('deactivated', 'pending_review')) as products`);
	coverageCache = {
		at: Date.now(),
		value: { manufacturers: row.manufacturers, products: row.products }
	};
	return coverageCache.value;
}

export function clearCoverageCache() {
	coverageCache = undefined;
}

export interface LookupOptions {
	packagingEnabled: boolean;
}

async function packagingAvailable(row: PackRow, options: LookupOptions): Promise<boolean> {
	if (!options.packagingEnabled) return false;
	const date = row.batch.manufactureDate ?? today();
	const [ref] = await ctx()
		.db.select({ id: packagingReference.id })
		.from(packagingReference)
		.where(
			and(
				eq(packagingReference.productId, row.product.id),
				eq(packagingReference.status, 'ready'),
				lte(packagingReference.effectiveFrom, date)
			)
		)
		.limit(1);
	return Boolean(ref);
}

async function journeyAvailable(row: PackRow): Promise<boolean> {
	const [event] = await ctx()
		.db.select({ id: custodyEvent.id })
		.from(custodyEvent)
		.where(
			and(
				eq(custodyEvent.batchId, row.batch.id),
				ne(custodyEvent.eventType, 'voided'),
				// Records a correction cancelled or replaced don't count (the replacement does).
				notSuperseded
			)
		)
		.limit(1);
	return Boolean(event);
}

function publicProduct(row: PackRow): PublicProduct {
	const { status: _status, gtin: _gtin, ...rest } = row.product;
	return rest;
}

/** Applies the lifecycle rules to one matched pack (D-08 step 3). */
async function evaluatePack(
	row: PackRow,
	base: Pick<VerificationResult, 'input' | 'serialDisplay'>,
	options: LookupOptions,
	extraFlags: ResultFlag[] = []
): Promise<VerificationResult> {
	const checkedAt = new Date().toISOString();
	const manufacturerInfo = {
		id: row.manufacturer.id,
		name: row.manufacturer.name,
		state: row.manufacturer.state,
		town: row.manufacturer.town
	};
	const common = {
		v: 1 as const,
		...base,
		manufacturer: manufacturerInfo,
		product: publicProduct(row),
		batch: row.batch,
		packId: row.packId,
		checkedAt
	};
	// A recall always wins: even if the company is suspended or the drug paused afterwards,
	// people holding the pack must hear that its batch was recalled (amends D-08 step 3).
	if (row.batch.status !== 'active') {
		return {
			...common,
			code: 'RECALLED',
			flags: extraFlags,
			journeyAvailable: false,
			packagingAvailable: false
		};
	}
	if (row.manufacturer.status === 'suspended' || row.product.status === 'deactivated') {
		return {
			v: 1,
			code: 'CANT_CONFIRM',
			flags: [],
			reason:
				row.manufacturer.status === 'suspended' ? 'manufacturer_suspended' : 'product_deactivated',
			...base,
			journeyAvailable: false,
			packagingAvailable: false,
			checkedAt
		};
	}
	const flags: ResultFlag[] = [...extraFlags];
	if (row.batch.expiryDate < today()) flags.unshift('EXPIRED');
	// The packaging check is only offered on a clean Valid: an expired pack, or a scanned code
	// whose batch or expiry doesn't match the record, must lead with that warning instead.
	const [journey, packaging] = await Promise.all([
		journeyAvailable(row),
		flags.length === 0 ? packagingAvailable(row, options) : false
	]);
	return {
		...common,
		code: 'VALID',
		flags,
		journeyAvailable: journey,
		packagingAvailable: packaging
	};
}

/** Packs the public may see: visible manufacturer, drug not waiting for review, serial not voided. */
function visible(rows: PackRow[]) {
	return rows.filter(
		(r) => isVisible(r.manufacturer) && !HIDDEN_PRODUCT.includes(r.product.status) && !r.voided
	);
}

async function unrecognised(
	base: Pick<VerificationResult, 'input' | 'serialDisplay'>,
	reason: VerificationResult['reason'],
	code: 'UNRECOGNISED' | 'NOT_COVERED' = 'UNRECOGNISED',
	serialHelp?: VerificationResult['serialHelp']
): Promise<VerificationResult> {
	return {
		v: 1,
		code,
		flags: [],
		reason,
		...base,
		...(serialHelp ? { serialHelp } : {}),
		journeyAvailable: false,
		packagingAvailable: false,
		coverage: await coverage(),
		checkedAt: new Date().toISOString()
	};
}

/** Looks up a parsed input and returns a public result. Never throws for "not found". */
export async function lookup(
	input: Extract<CheckInput, { ok: true }>,
	options: LookupOptions
): Promise<VerificationResult> {
	const base = { input: input.kind, serialDisplay: input.display };

	if (input.kind === 'scanned') {
		const [known] = await ctx()
			.db.select({
				id: product.id,
				status: manufacturer.status,
				statusBeforeSuspension: manufacturer.statusBeforeSuspension,
				productStatus: product.status,
				drug: sql<string>`${product.brandName} || ' ' || ${product.strength}`,
				serialHint: product.serialHint
			})
			.from(product)
			.innerJoin(manufacturer, eq(product.manufacturerId, manufacturer.id))
			.where(eq(product.gtin, input.gtin))
			.limit(1);
		const covered = known && isVisible(known) && !HIDDEN_PRODUCT.includes(known.productStatus);
		if (!covered)
			return unrecognised(
				base,
				known?.status === 'live' && known.productStatus === 'pending_review'
					? 'drug_in_review'
					: 'not_found',
				'NOT_COVERED'
			);
		const help = known.serialHint ? { drug: known.drug, hint: known.serialHint } : undefined;
		if (!input.serial) return unrecognised(base, 'no_serial_in_code', 'UNRECOGNISED', help);

		let rows = visible(
			(await packQuery()
				.where(and(eq(pack.serialExactHmac, serialExactHmac(input.gtin, input.serial)), visibleSql))
				.limit(1)) as PackRow[]
		);
		// Typed GS1 text may differ from the printed serial in case, spaces or dashes: try the
		// typed-serial rule within this one drug before calling the pack unknown.
		if (rows.length === 0) {
			const loose = visible(
				(await packQuery()
					.where(
						and(
							eq(product.gtin, input.gtin),
							eq(pack.serialKeyHmac, serialKeyHmac(input.serial)),
							visibleSql
						)
					)
					.limit(2)) as PackRow[]
			);
			if (loose.length === 1) rows = loose;
		}
		if (rows.length === 0) {
			// The company's or the drug's records are paused: don't call a pack unknown while they
			// may be fixing their data.
			if (known.status === 'suspended' || known.productStatus === 'deactivated')
				return {
					v: 1,
					code: 'CANT_CONFIRM',
					flags: [],
					reason: known.status === 'suspended' ? 'manufacturer_suspended' : 'product_deactivated',
					...base,
					journeyAvailable: false,
					packagingAvailable: false,
					checkedAt: new Date().toISOString()
				};
			return unrecognised(base, 'not_found_for_covered_product', 'UNRECOGNISED', help);
		}
		const flags: ResultFlag[] = [];
		if (input.lot && normaliseSerialKey(input.lot) !== normaliseSerialKey(rows[0].batch.lot))
			flags.push('LOT_MISMATCH');
		if (input.expiry && input.expiry.slice(0, 7) !== rows[0].batch.expiryDate.slice(0, 7))
			flags.push('EXPIRY_MISMATCH');
		return evaluatePack(rows[0], base, options, flags);
	}

	const byKey = async (key: string) =>
		visible(
			(await packQuery()
				.where(and(eq(pack.serialKeyHmac, serialKeyHmac(key)), visibleSql))
				.limit(10)) as PackRow[]
		);
	let rows = await byKey(input.key);
	if (rows.length === 0 && input.altKey) {
		rows = await byKey(input.altKey);
		if (rows.length) {
			input.key = input.altKey;
			base.serialDisplay = input.display = displaySerial(input.altKey);
		}
	}
	if (rows.length === 0) {
		// A live manufacturer's new drug that DETECK hasn't reviewed yet: genuine packs exist, so
		// say it isn't checkable yet rather than "we couldn't find this serial".
		const [waiting] = await ctx()
			.db.select({ id: pack.id })
			.from(pack)
			.innerJoin(product, eq(product.id, pack.productId))
			.innerJoin(manufacturer, eq(manufacturer.id, product.manufacturerId))
			.where(
				and(
					eq(pack.serialKeyHmac, serialKeyHmac(input.key)),
					eq(product.status, 'pending_review'),
					eq(manufacturer.status, 'live')
				)
			)
			.limit(1);
		return waiting
			? unrecognised(base, 'drug_in_review', 'NOT_COVERED')
			: unrecognised(base, 'not_found');
	}
	if (rows.length > 1) {
		return {
			v: 1,
			code: 'NEEDS_BATCH',
			flags: [],
			...base,
			candidates: rows.map((r) => r.packId),
			journeyAvailable: false,
			packagingAvailable: false,
			checkedAt: new Date().toISOString()
		};
	}
	return evaluatePack(rows[0], base, options);
}

/** Second step for NEEDS_BATCH: picks the candidate whose batch number matches. */
export async function resolveByBatch(
	previous: VerificationResult,
	lotInput: string,
	options: LookupOptions
): Promise<VerificationResult> {
	const base = { input: previous.input, serialDisplay: previous.serialDisplay };
	const ids = previous.candidates ?? [];
	if (ids.length === 0) return unrecognised(base, 'not_found');
	const rows = visible((await packQuery().where(inArray(pack.id, ids))) as PackRow[]);
	const wanted = normaliseSerialKey(lotInput);
	const match = rows.filter((r) => normaliseSerialKey(r.batch.lot) === wanted);
	if (match.length === 0) return unrecognised(base, 'batch_not_matched');
	if (match.length > 1) {
		// Two drugs share this serial and this batch number: only the scanned code (which
		// carries the product barcode) can tell them apart. Asking for the batch again would loop.
		return {
			v: 1,
			code: 'NEEDS_BATCH',
			reason: 'needs_scan',
			flags: [],
			...base,
			journeyAvailable: false,
			packagingAvailable: false,
			checkedAt: new Date().toISOString()
		};
	}
	return evaluatePack(match[0], base, options);
}
