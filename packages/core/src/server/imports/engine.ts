/**
 * Spreadsheet imports (F-05, MF4). Checking an import is a dry run of the real
 * import inside a transaction that is rolled back, so the counts and problem
 * rows shown before importing are exactly what the import will do. The real
 * import runs the same code and commits: all rows or nothing (MF4c).
 */
import { and, eq, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { toGtin14 } from '../../gs1/gtin.ts';
import {
	autoMatch,
	IMPORT_FIELDS,
	MAX_PROBLEM_ROWS,
	missingRequired,
	type ImportKind
} from '../../imports/fields.ts';
import {
	normaliseBusinessName,
	parseDate,
	parseQuantity,
	parseRole,
	sameKind
} from '../../imports/values.ts';
import { toNigerianState } from '../../nigeria.ts';
import { audit, SYSTEM_ACTOR, type Actor } from '../audit.ts';
import { ctx } from '../context.ts';
import { randomId, serialExactHmac, serialKeyHmac, sha256Hex } from '../crypto.ts';
import type { Tx } from '../db/client.ts';
import {
	batch,
	custodyEvent,
	document,
	importJob,
	importMapping,
	manufacturer,
	pack,
	party,
	product
} from '../db/schema.ts';
import { notifyStaff } from '../manufacturers/register.ts';
import { enqueue } from '../jobs.ts';
import { deleteObject, getObject, putObject, storageKey } from '../storage.ts';
import { emitEvent } from '../webhooks.ts';
import { clearCoverageCache } from '../verify/lookup.ts';
import { fileKind, preview, readRows, SpreadsheetTooLarge, UNSAFE_NUMBER } from './read.ts';
import { today } from '../time.ts';

export const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const CHUNK = 1000;
/** GS1 character set 82 (AI 21). */
const SERIAL_CHARS = /^[A-Za-z0-9!"%&'()*+,\-./:;<=>?_]{1,20}$/;
/** What Excel writes when it turns a long number into scientific notation, e.g. 1.23457E+15. */
const SCIENTIFIC_NOTATION = /^\d+(\.\d+)?E[+-]?\d+$/i;

/** Problems with a serial value itself, checked before anything is written for its row. */
function serialProblem(serial: string): string | null {
	if (serial === UNSAFE_NUMBER)
		return 'This serial was stored as a number and lost digits. Format the column as text and export again.';
	if (SCIENTIFIC_NOTATION.test(serial))
		return 'Excel changed this serial into scientific notation (like 1.23E+15). Format the column as text and export again.';
	if (serial && !SERIAL_CHARS.test(serial))
		return 'Serials are up to 20 letters, numbers or GS1 symbols, with no spaces.';
	return null;
}

export class ImportError extends Error {}

type Job = typeof importJob.$inferSelect;
type Counts = Record<string, number>;

interface RowIn {
	rowNumber: number;
	raw: string[];
	v: Record<string, string>;
}

class ProblemLog {
	rows: string[][] = [];
	count = 0;
	/** `maskColumn`: a column holding a serial that is already on DETECK, shown only as "…TB8D". */
	add(row: RowIn, reason: string, maskColumn = -1) {
		this.count++;
		const raw =
			maskColumn >= 0 && row.raw[maskColumn]
				? row.raw.map((cell, i) => (i === maskColumn ? `…${cell.trim().slice(-4)}` : cell))
				: row.raw;
		if (this.rows.length < MAX_PROBLEM_ROWS)
			this.rows.push([String(row.rowNumber), reason, ...raw]);
	}
	toCsv(headers: string[]): string {
		const esc = (s: string) => {
			// Neutralise spreadsheet formulas (CSV injection) and quote every cell.
			const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
			return `"${safe.replace(/"/g, '""')}"`;
		};
		return [['Row', 'Problem', ...headers], ...this.rows]
			.map((r) => r.map(esc).join(','))
			.join('\r\n');
	}
}

// ---------------------------------------------------------------- creating and mapping jobs

/** Identifies a header row, so a manufacturer's column matching can be reused. */
function headerSignature(headers: string[]): string {
	return sha256Hex(headers.map((h) => h.trim().toLowerCase()).join('\u0001'));
}

export async function createImportJob(
	actor: Actor,
	manufacturerId: string,
	kind: ImportKind,
	file: { name: string; type: string; bytes: Uint8Array },
	options: { source?: 'upload' | 'api' } = {}
): Promise<{ job: Job; existing: boolean }> {
	const fk = fileKind(file.name, file.type);
	if (!fk)
		throw new ImportError(`${file.name} can't be imported. Use a CSV or Excel (.xlsx) file.`);
	if (file.bytes.length > MAX_IMPORT_BYTES)
		throw new ImportError(
			'Files can be up to 50 MB. Split larger files, or ask DETECK about an API.'
		);
	const { db } = ctx();

	if (kind !== 'products') {
		const [agreement] = await db
			.select({ id: document.id })
			.from(document)
			.where(
				and(
					eq(document.manufacturerId, manufacturerId),
					eq(document.kind, 'data_sharing_agreement')
				)
			)
			.limit(1);
		if (!agreement)
			throw new ImportError(
				'Upload the signed data-sharing agreement before importing serials or supply chain records.'
			);
	}

	const hash = sha256Hex(file.bytes);
	const [existing] = await db
		.select()
		.from(importJob)
		.where(
			and(
				eq(importJob.manufacturerId, manufacturerId),
				eq(importJob.kind, kind),
				eq(importJob.fileSha256, hash)
			)
		)
		.limit(1);
	if (existing && existing.status !== 'failed' && existing.status !== 'cancelled')
		return { job: existing, existing: true };

	let info;
	try {
		info = await preview(file.bytes, fk);
	} catch (error) {
		if (error instanceof SpreadsheetTooLarge) throw new ImportError(error.message);
		throw new ImportError(
			`We couldn't read ${file.name}. Save it again as CSV or .xlsx and retry.`
		);
	}
	if (info.headers.length === 0 || info.rows === 0)
		throw new ImportError(`${file.name} has no rows under the header row.`);

	const key = storageKey('imports', manufacturerId, file.name, randomId(8));
	await putObject(key, file.bytes, file.type || 'application/octet-stream');
	// Reuse the matching this manufacturer confirmed last time for the same headers.
	const [saved] = await db
		.select({ mapping: importMapping.mapping })
		.from(importMapping)
		.where(
			and(
				eq(importMapping.manufacturerId, manufacturerId),
				eq(importMapping.kind, kind),
				eq(importMapping.headerSignature, headerSignature(info.headers))
			)
		);
	const mapping = saved?.mapping ?? autoMatch(kind, info.headers);

	const job = await db
		.transaction(async (tx) => {
			if (existing) await tx.delete(importJob).where(eq(importJob.id, existing.id));
			const [row] = await tx
				.insert(importJob)
				.values({
					manufacturerId,
					kind,
					fileKey: key,
					fileName: file.name,
					fileSha256: hash,
					sizeBytes: file.bytes.length,
					headers: info.headers,
					sampleRows: info.sample,
					mapping,
					counts: { rows: info.rows },
					status: 'uploaded',
					source: options.source ?? 'upload',
					createdBy: actor.userId,
					onBehalf: actor.onBehalf ?? false
				})
				.returning();
			await audit(
				actor,
				{
					area: 'Manufacturer board',
					action: 'import_upload',
					itemType: 'import',
					itemId: row.id,
					manufacturerId,
					summary: `Uploaded ${file.name} (${info.rows.toLocaleString('en-NG')} rows)`
				},
				tx
			);
			return row;
		})
		.catch(async (error) => {
			// The same file uploaded twice at the same moment: the other upload won, use it.
			const code =
				(error as { code?: string; cause?: { code?: string } })?.code ??
				(error as { cause?: { code?: string } })?.cause?.code;
			if (code !== '23505') throw error;
			const [other] = await db
				.select()
				.from(importJob)
				.where(
					and(
						eq(importJob.manufacturerId, manufacturerId),
						eq(importJob.kind, kind),
						eq(importJob.fileSha256, hash)
					)
				);
			if (!other) throw error;
			return { ...other, duplicateUpload: true as const };
		});
	if ('duplicateUpload' in job) {
		const { duplicateUpload: _d, ...other } = job;
		return { job: other, existing: true };
	}
	return { job, existing: false };
}

export async function loadJob(id: string, manufacturerId?: string): Promise<Job | null> {
	const where = manufacturerId
		? and(eq(importJob.id, id), eq(importJob.manufacturerId, manufacturerId))
		: eq(importJob.id, id);
	const [row] = await ctx().db.select().from(importJob).where(where).limit(1);
	return row ?? null;
}

/** Saves the column matches and moves the job to checking. */
export async function saveMapping(job: Job, mapping: Record<string, string>) {
	if (!['uploaded', 'ready', 'failed'].includes(job.status))
		throw new ImportError('This import is already running.');
	const headers = job.headers ?? [];
	const clean: Record<string, string> = {};
	for (const f of IMPORT_FIELDS[job.kind]) {
		const h = mapping[f.key];
		if (h && headers.includes(h)) clean[f.key] = h;
	}
	const missing = missingRequired(job.kind, clean);
	if (missing.length)
		throw new ImportError(`Match these fields first: ${missing.map((f) => f.label).join(', ')}.`);
	const { db } = ctx();
	await db
		.update(importJob)
		.set({ mapping: clean, status: 'validating', error: null })
		.where(eq(importJob.id, job.id));
	await db
		.insert(importMapping)
		.values({
			manufacturerId: job.manufacturerId,
			kind: job.kind,
			headerSignature: headerSignature(headers),
			mapping: clean
		})
		.onConflictDoUpdate({
			target: [importMapping.manufacturerId, importMapping.kind, importMapping.headerSignature],
			set: { mapping: clean, updatedAt: new Date() }
		});
}

export async function markCommitting(job: Job) {
	if (job.status !== 'ready') throw new ImportError('Check the file before importing it.');
	if ((job.counts?.ready ?? 0) === 0) throw new ImportError('There are no rows ready to import.');
	// One atomic claim, so a double click (or two people) can't commit the same import twice.
	const claimed = await ctx()
		.db.update(importJob)
		.set({ status: 'committing' })
		.where(and(eq(importJob.id, job.id), eq(importJob.status, 'ready')))
		.returning({ id: importJob.id });
	if (claimed.length === 0) throw new ImportError('This import is already running or done.');
}

// ---------------------------------------------------------------- shared lookups

interface ProductInfo {
	id: string;
	gtin: string;
	nafdacRegNo: string;
}

async function manufacturerProducts(tx: Tx, manufacturerId: string) {
	const rows = await tx
		.select({ id: product.id, gtin: product.gtin, nafdacRegNo: product.nafdacRegNo })
		.from(product)
		.where(eq(product.manufacturerId, manufacturerId));
	const byGtin = new Map(rows.map((r) => [r.gtin, r]));
	const byNafdac = new Map<string, ProductInfo | null>();
	for (const r of rows) {
		const k = r.nafdacRegNo.trim().toUpperCase();
		byNafdac.set(k, byNafdac.has(k) ? null : r);
	}
	return { byGtin, byNafdac };
}

function resolveProduct(
	row: RowIn,
	products: Awaited<ReturnType<typeof manufacturerProducts>>
): ProductInfo | string {
	if (row.v.gtin) {
		const gtin = toGtin14(row.v.gtin);
		if (!gtin) return "The GTIN's check digit is wrong, or it isn't a GTIN.";
		return (
			products.byGtin.get(gtin) ?? 'This GTIN is not in your drug list. Import the drug list first.'
		);
	}
	const byNafdac = products.byNafdac.get((row.v.nafdacRegNo ?? '').trim().toUpperCase());
	if (byNafdac === null)
		return 'Several of your drugs share this NAFDAC number. Use the GTIN instead.';
	return byNafdac ?? 'This NAFDAC number is not in your drug list. Import the drug list first.';
}

const lotKey = (productId: string, lot: string) => `${productId}|${lot.trim().toUpperCase()}`;

async function productBatches(tx: Tx, productIds: string[]) {
	const map = new Map<string, { id: string; expiryDate: string; manufactureDate: string | null }>();
	if (productIds.length === 0) return map;
	const rows = await tx
		.select({
			id: batch.id,
			productId: batch.productId,
			lot: batch.lot,
			expiryDate: batch.expiryDate,
			manufactureDate: batch.manufactureDate
		})
		.from(batch)
		.where(inArray(batch.productId, productIds));
	for (const r of rows) map.set(lotKey(r.productId, r.lot), r);
	return map;
}

// ---------------------------------------------------------------- processors

interface Processor {
	chunk(rows: RowIn[]): Promise<void>;
	/** Called once after the last row, for counts that need the whole file. */
	finish?(): void;
}

/**
 * Drugs. A live manufacturer's new drugs wait for DETECK review before the public sees them
 * (audit decision 1); every change to an existing drug is audited field by field.
 */
function productsProcessor(
	tx: Tx,
	job: Job,
	counts: Counts,
	problems: ProblemLog,
	context: { live: boolean; actor: Actor }
): Processor {
	const seen = new Set<string>();
	const required: [string, string][] = [
		['brandName', 'brand name'],
		['genericName', 'generic name'],
		['strength', 'strength'],
		['dosageForm', 'dosage form'],
		['packSize', 'pack size'],
		['nafdacRegNo', 'NAFDAC number']
	];
	return {
		async chunk(rows) {
			const valid: { row: RowIn; gtin: string }[] = [];
			for (const row of rows) {
				const gtin = toGtin14(row.v.gtin ?? '');
				if (!gtin) {
					problems.add(row, 'The GTIN is missing, or its check digit is wrong.');
					continue;
				}
				const missing = required.filter(([k]) => !row.v[k]?.trim()).map(([, label]) => label);
				if (missing.length) {
					problems.add(row, `Missing ${missing.join(', ')}.`);
					continue;
				}
				if (seen.has(gtin)) {
					problems.add(row, 'This GTIN appears more than once in this file.');
					continue;
				}
				seen.add(gtin);
				valid.push({ row, gtin });
			}
			if (valid.length === 0) return;
			const existing = await tx
				.select()
				.from(product)
				.where(
					inArray(
						product.gtin,
						valid.map((x) => x.gtin)
					)
				);
			const byGtin = new Map(existing.map((e) => [e.gtin, e]));
			const clashes = await tx
				.select({ nafdacRegNo: product.nafdacRegNo })
				.from(product)
				.where(
					and(
						ne(product.manufacturerId, job.manufacturerId),
						inArray(
							sql`upper(${product.nafdacRegNo})`,
							valid.map((x) => x.row.v.nafdacRegNo.trim().toUpperCase())
						)
					)
				);
			const clashSet = new Set(clashes.map((c) => c.nafdacRegNo.toUpperCase()));

			for (const { row, gtin } of valid) {
				const found = byGtin.get(gtin);
				if (found && found.manufacturerId !== job.manufacturerId) {
					problems.add(row, 'This GTIN is registered to another manufacturer on DETECK.');
					continue;
				}
				if (clashSet.has(row.v.nafdacRegNo.trim().toUpperCase())) {
					problems.add(
						row,
						'This NAFDAC number is registered to another manufacturer on DETECK. If it is yours, contact DETECK with your NAFDAC certificate.'
					);
					counts.nafdacClashes = (counts.nafdacClashes ?? 0) + 1;
					continue;
				}
				const values = {
					brandName: row.v.brandName.trim(),
					genericName: row.v.genericName.trim(),
					strength: row.v.strength.trim(),
					dosageForm: row.v.dosageForm.trim(),
					packSize: row.v.packSize.trim(),
					nafdacRegNo: row.v.nafdacRegNo.trim(),
					serialHint: row.v.serialHint?.trim() || null
				};
				if (found) {
					const changed = (Object.keys(values) as (keyof typeof values)[]).filter(
						(k) => (found[k] ?? null) !== values[k]
					);
					if (changed.length) {
						await tx.update(product).set(values).where(eq(product.id, found.id));
						await audit(
							context.actor,
							{
								area: 'Manufacturer board',
								action: 'product_import_update',
								itemType: 'product',
								itemId: found.id,
								manufacturerId: job.manufacturerId,
								summary: `Updated ${values.brandName} ${values.strength} from ${job.fileName}: ${changed.join(', ')}`,
								before: Object.fromEntries(changed.map((k) => [k, found[k]])),
								after: Object.fromEntries(changed.map((k) => [k, values[k]]))
							},
							tx
						);
					}
					counts.updated = (counts.updated ?? 0) + 1;
				} else {
					await tx.insert(product).values({
						manufacturerId: job.manufacturerId,
						gtin,
						...values,
						status: context.live ? 'pending_review' : 'active'
					});
					counts.created = (counts.created ?? 0) + 1;
					if (context.live) counts.pendingReview = (counts.pendingReview ?? 0) + 1;
				}
				counts.ready = (counts.ready ?? 0) + 1;
			}
		}
	};
}

async function batchesProcessor(
	tx: Tx,
	job: Job,
	counts: Counts,
	problems: ProblemLog
): Promise<Processor> {
	const products = await manufacturerProducts(tx, job.manufacturerId);
	const batches = await productBatches(
		tx,
		[...products.byGtin.values()].map((p) => p.id)
	);
	const previousNumeric = new Map<string, bigint>();
	let newBatches = 0;
	let newBatchesOnThe1st = 0;
	/** Per drug: how many serials made only of digits have each length. */
	const numericLengths = new Map<string, Map<number, number>>();
	/** product id + serial key → exact serial seen first, to catch "AB-1234" next to "ab1234". */
	const keysSeen = new Map<string, string>();
	return {
		async chunk(rows) {
			const serialRows: {
				row: RowIn;
				productId: string;
				batchId: string;
				exact: Buffer;
				key: Buffer;
				hex: string;
			}[] = [];
			for (const row of rows) {
				const p = resolveProduct(row, products);
				if (typeof p === 'string') {
					problems.add(row, p);
					continue;
				}
				const lot = row.v.lot?.trim();
				if (!lot) {
					problems.add(row, 'The batch number is missing.');
					continue;
				}
				const expiry = parseDate(row.v.expiryDate ?? '');
				if (!expiry) {
					problems.add(
						row,
						"The expiry date is missing, or it isn't a date we can read (use YYYY-MM-DD or DD/MM/YYYY)."
					);
					continue;
				}
				let mfg: string | null = null;
				if (row.v.manufactureDate?.trim()) {
					mfg = parseDate(row.v.manufactureDate);
					if (!mfg) {
						problems.add(
							row,
							"The manufacture date isn't a date we can read (use YYYY-MM-DD or DD/MM/YYYY)."
						);
						continue;
					}
					if (mfg >= expiry) {
						problems.add(row, 'The manufacture date is on or after the expiry date.');
						continue;
					}
				}
				const quantity = parseQuantity(row.v.quantity ?? '');
				if (quantity === 'invalid') {
					problems.add(row, 'The batch quantity is not a whole number.');
					continue;
				}
				// Check the serial before creating a batch, so a held-back row never leaves a batch behind.
				const serial = row.v.serial ?? '';
				const badSerial = serialProblem(serial);
				if (badSerial) {
					problems.add(row, badSerial);
					continue;
				}

				const k = lotKey(p.id, lot);
				let b = batches.get(k);
				if (b && b.expiryDate !== expiry) {
					problems.add(row, `Batch ${lot} is already recorded with expiry ${b.expiryDate}.`);
					continue;
				}
				if (!b) {
					newBatches++;
					if (expiry.endsWith('-01')) newBatchesOnThe1st++;
					// Another import may create the same new batch at the same moment: use theirs.
					const [created] = await tx
						.insert(batch)
						.values({
							productId: p.id,
							lot,
							manufactureDate: mfg,
							expiryDate: expiry,
							quantity: quantity ?? null
						})
						.onConflictDoNothing({ target: [batch.productId, batch.lot] })
						.returning({
							id: batch.id,
							expiryDate: batch.expiryDate,
							manufactureDate: batch.manufactureDate
						});
					b =
						created ??
						(
							await tx
								.select({
									id: batch.id,
									expiryDate: batch.expiryDate,
									manufactureDate: batch.manufactureDate
								})
								.from(batch)
								.where(and(eq(batch.productId, p.id), eq(batch.lot, lot)))
						)[0];
					batches.set(k, b);
					counts.batchesCreated = (counts.batchesCreated ?? 0) + 1;
				}

				if (!serial) {
					counts.ready = (counts.ready ?? 0) + 1;
					continue;
				}
				if (/^\d+$/.test(serial)) {
					const n = BigInt(serial);
					if (previousNumeric.get(p.id) === n - 1n)
						counts.sequentialSerials = (counts.sequentialSerials ?? 0) + 1;
					previousNumeric.set(p.id, n);
					const lengths = numericLengths.get(p.id) ?? new Map<number, number>();
					lengths.set(serial.length, (lengths.get(serial.length) ?? 0) + 1);
					numericLengths.set(p.id, lengths);
				}
				const exact = serialExactHmac(p.gtin, serial);
				serialRows.push({
					row,
					productId: p.id,
					batchId: b.id,
					exact,
					key: serialKeyHmac(serial),
					hex: exact.toString('hex')
				});
			}

			if (serialRows.length === 0) return;
			const already = await tx
				.select({ h: pack.serialExactHmac })
				.from(pack)
				.where(
					and(
						inArray(
							pack.serialExactHmac,
							serialRows.map((r) => r.exact)
						),
						or(sql`${pack.importJobId} is null`, ne(pack.importJobId, job.id))
					)
				);
			const onDeteck = new Set(already.map((a) => a.h.toString('hex')));
			// The file is kept for the manufacturer to fix rows; a serial already on DETECK needs no
			// fixing, so it isn't written out in full.
			const serialColumn = (job.headers ?? []).indexOf(job.mapping?.serial ?? '');
			for (const r of serialRows)
				if (onDeteck.has(r.hex))
					problems.add(r.row, 'This serial is already on DETECK.', serialColumn);
			// People type serials without spaces, dashes or capitals, so two serials of one drug that
			// only differ in those can't be told apart: refuse the second one.
			const sameKey = await tx
				.select({ productId: pack.productId, key: pack.serialKeyHmac, exact: pack.serialExactHmac })
				.from(pack)
				.where(
					and(
						inArray(
							pack.serialKeyHmac,
							serialRows.map((r) => r.key)
						),
						inArray(pack.productId, [...new Set(serialRows.map((r) => r.productId))]),
						or(sql`${pack.importJobId} is null`, ne(pack.importJobId, job.id))
					)
				);
			for (const e of sameKey)
				keysSeen.set(`${e.productId}:${e.key.toString('hex')}`, e.exact.toString('hex'));
			const lookAlike = new Set<(typeof serialRows)[number]>();
			for (const r of serialRows) {
				if (onDeteck.has(r.hex)) continue;
				const k = `${r.productId}:${r.key.toString('hex')}`;
				const first = keysSeen.get(k);
				if (first === undefined) keysSeen.set(k, r.hex);
				else if (first !== r.hex) {
					lookAlike.add(r);
					problems.add(
						r.row,
						"This serial is the same as another serial of this drug once spaces, dashes and capitals are ignored. People type serials without them, so DETECK couldn't tell the two apart."
					);
				}
			}
			const fresh = serialRows.filter((r) => !onDeteck.has(r.hex) && !lookAlike.has(r));
			if (fresh.length === 0) return;
			// Another company may use the same serial. That's allowed (serials are only unique per
			// drug), but a typed check then has to ask which batch is on the pack, so say so.
			const shared = await tx
				.select({ key: pack.serialKeyHmac })
				.from(pack)
				.innerJoin(product, eq(product.id, pack.productId))
				.where(
					and(
						inArray(
							pack.serialKeyHmac,
							fresh.map((r) => r.key)
						),
						ne(product.manufacturerId, job.manufacturerId)
					)
				);
			if (shared.length) {
				const keys = new Set(shared.map((x) => x.key.toString('hex')));
				counts.sharedSerials =
					(counts.sharedSerials ?? 0) + fresh.filter((r) => keys.has(r.key.toString('hex'))).length;
			}
			const inserted = await tx
				.insert(pack)
				.values(
					fresh.map((r) => ({
						productId: r.productId,
						batchId: r.batchId,
						serialExactHmac: r.exact,
						serialKeyHmac: r.key,
						importJobId: job.id
					}))
				)
				.onConflictDoNothing({ target: pack.serialExactHmac })
				.returning({ h: pack.serialExactHmac });
			const added = new Set(inserted.map((i) => i.h.toString('hex')));
			const firstSeen = new Set<string>();
			for (const r of fresh) {
				if (added.has(r.hex) && !firstSeen.has(r.hex)) {
					firstSeen.add(r.hex);
					counts.serialsAdded = (counts.serialsAdded ?? 0) + 1;
					counts.ready = (counts.ready ?? 0) + 1;
				} else {
					problems.add(r.row, 'This serial appears more than once in this file.');
				}
			}
		},
		finish() {
			// Excel drops leading zeros from numbers: 000123 becomes 123. Serials of digits shorter
			// than the usual length for their drug may have lost theirs.
			let short = 0;
			for (const lengths of numericLengths.values()) {
				const usual = [...lengths].sort((a, b) => b[1] - a[1])[0][0];
				for (const [length, n] of lengths) if (length < usual) short += n;
			}
			if (short) counts.shortNumericSerials = short;
			// Packs print "EXP 04/2028", meaning the end of April. A file where every expiry is the 1st
			// was probably converted from month-only dates, which would expire them a month early.
			if (newBatches >= 3 && newBatchesOnThe1st === newBatches) counts.expiryOnThe1st = newBatches;
		}
	};
}

interface PartyInput {
	name: string;
	role: (typeof party.$inferInsert)['role'];
	state: string | null;
	city: string | null;
	cacRc: string | null;
	pcnLicence: string | null;
	gln: string | null;
}

async function distributionProcessor(
	tx: Tx,
	job: Job,
	counts: Counts,
	problems: ProblemLog
): Promise<Processor> {
	const products = await manufacturerProducts(tx, job.manufacturerId);
	const batches = await productBatches(
		tx,
		[...products.byGtin.values()].map((p) => p.id)
	);
	const partyCache = new Map<string, string>();
	const seenEvents = new Set<string>();

	/**
	 * Finds or creates the business a record names. Identifiers (GLN, PCN, CAC) decide first. By name,
	 * a business only matches when no identifier or city contradicts it, so two branches with the
	 * same name stay separate. A sending business has no state in the file, so it matches by name
	 * alone, preferring businesses this manufacturer already uses.
	 */
	async function partyId(input: PartyInput): Promise<string> {
		const normalised = normaliseBusinessName(input.name);
		const pcn = input.pcnLicence?.toUpperCase() ?? null;
		const cac = input.cacRc?.toUpperCase() ?? null;
		const idKeys = [
			input.gln && `gln:${input.gln}`,
			pcn && `pcn:${pcn}`,
			cac && `cac:${cac}`
		].filter(Boolean) as string[];
		// A sender's role isn't in the file; a receiver's is, and a pharmacy is never the
		// distributor with the same name.
		const kinds = input.state ? sameKind(input.role) : undefined;
		const nameKey = `name:${normalised}|${input.state ?? '*'}|${input.city?.toLowerCase() ?? '*'}|${kinds?.[0] ?? '*'}`;
		for (const k of idKeys) if (partyCache.has(k)) return partyCache.get(k)!;
		if (idKeys.length === 0 && partyCache.has(nameKey)) return partyCache.get(nameKey)!;

		const pick = { id: party.id, mergedIntoId: party.mergedIntoId };
		let found: { id: string; mergedIntoId: string | null } | undefined;
		if (idKeys.length) {
			[found] = await tx
				.select(pick)
				.from(party)
				.where(
					or(
						input.gln ? eq(party.gln, input.gln) : undefined,
						pcn ? sql`upper(${party.pcnLicence}) = ${pcn}` : undefined,
						cac ? sql`upper(${party.cacRc}) = ${cac}` : undefined
					)
				)
				.orderBy(sql`${party.verifiedAt} is null`, party.createdAt)
				.limit(1);
		}
		if (!found) {
			[found] = await tx
				.select(pick)
				.from(party)
				.where(
					and(
						eq(party.normalisedName, normalised),
						input.state ? eq(party.state, input.state) : undefined,
						kinds ? inArray(party.role, kinds) : undefined,
						input.city
							? sql`(${party.city} is null or lower(${party.city}) = ${input.city.toLowerCase()})`
							: undefined,
						input.gln ? sql`(${party.gln} is null or ${party.gln} = ${input.gln})` : undefined,
						pcn
							? sql`(${party.pcnLicence} is null or upper(${party.pcnLicence}) = ${pcn})`
							: undefined,
						cac ? sql`(${party.cacRc} is null or upper(${party.cacRc}) = ${cac})` : undefined
					)
				)
				.orderBy(
					sql`${party.createdByManufacturerId} is distinct from ${job.manufacturerId}`,
					sql`${party.verifiedAt} is null`,
					party.createdAt
				)
				.limit(1);
		}
		let id = found ? (found.mergedIntoId ?? found.id) : undefined;
		if (!id) {
			const [created] = await tx
				.insert(party)
				.values({
					...input,
					normalisedName: normalised,
					createdByManufacturerId: job.manufacturerId
				})
				.returning({ id: party.id });
			id = created.id;
			counts.newBusinesses = (counts.newBusinesses ?? 0) + 1;
		}
		for (const k of [...idKeys, nameKey]) partyCache.set(k, id);
		return id;
	}

	return {
		async chunk(rows) {
			type Pending = {
				row: RowIn;
				productId: string;
				gtin: string;
				batchId: string;
				serial?: string;
				date: string;
				to: PartyInput;
				from?: PartyInput;
			};
			const pending: Pending[] = [];
			const today = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
			for (const row of rows) {
				const p = resolveProduct(row, products);
				if (typeof p === 'string') {
					problems.add(row, p);
					continue;
				}
				const lot = row.v.lot?.trim();
				const b = lot ? batches.get(lotKey(p.id, lot)) : undefined;
				if (!b) {
					problems.add(
						row,
						lot
							? `Batch ${lot} isn't recorded for this drug. Import batches and serials first.`
							: 'The batch number is missing.'
					);
					continue;
				}
				const date = parseDate(row.v.eventDate ?? '');
				if (!date) {
					problems.add(
						row,
						"The date shipped is missing, or it isn't a date we can read (use YYYY-MM-DD or DD/MM/YYYY)."
					);
					continue;
				}
				if (date > today) {
					problems.add(row, 'The date shipped is in the future.');
					continue;
				}
				if (b.manufactureDate && date < b.manufactureDate) {
					problems.add(
						row,
						`The date shipped is before batch ${lot} was made (${b.manufactureDate}).`
					);
					continue;
				}
				const toName = row.v.toName?.trim();
				if (!toName) {
					problems.add(row, 'The receiving business is missing.');
					continue;
				}
				const role = parseRole(row.v.toRole ?? '');
				if (!role || role === 'manufacturer') {
					problems.add(row, 'The role must be distributor, wholesaler, pharmacy or hospital.');
					continue;
				}
				const state = toNigerianState(row.v.toState);
				if (!state) {
					problems.add(row, "The state isn't one of Nigeria's 36 states or the FCT.");
					continue;
				}
				const gln = row.v.toGln?.replace(/\s+/g, '') || null;
				if (gln && !/^\d{13}$/.test(gln)) {
					problems.add(row, 'A GLN has 13 digits.');
					continue;
				}
				const serial = row.v.serial ?? '';
				const badSerial = serialProblem(serial);
				if (badSerial) {
					problems.add(row, badSerial);
					continue;
				}
				const fromName = row.v.fromName?.trim();
				pending.push({
					row,
					productId: p.id,
					gtin: p.gtin,
					batchId: b.id,
					serial: serial || undefined,
					date,
					to: {
						name: toName,
						role,
						state,
						city: row.v.toCity?.trim() || null,
						cacRc: row.v.toCac?.trim() || null,
						pcnLicence: row.v.toPcn?.trim() || null,
						gln
					},
					from: fromName
						? {
								name: fromName,
								role: 'distributor',
								state: null,
								city: null,
								cacRc: null,
								pcnLicence: null,
								gln: null
							}
						: undefined
				});
			}

			const serialRows = pending.filter((x) => x.serial);
			const packIds = new Map<string, { id: number; batchId: string }>();
			if (serialRows.length) {
				const found = await tx
					.select({ id: pack.id, h: pack.serialExactHmac, batchId: pack.batchId })
					.from(pack)
					.where(
						inArray(
							pack.serialExactHmac,
							serialRows.map((x) => serialExactHmac(x.gtin, x.serial!))
						)
					);
				for (const f of found) packIds.set(f.h.toString('hex'), { id: f.id, batchId: f.batchId });
			}

			const values: (typeof custodyEvent.$inferInsert)[] = [];
			for (const x of pending) {
				let packId: number | undefined;
				if (x.serial) {
					const found = packIds.get(serialExactHmac(x.gtin, x.serial).toString('hex'));
					if (!found) {
						problems.add(x.row, 'This serial is not recorded for this drug. Import serials first.');
						continue;
					}
					if (found.batchId !== x.batchId) {
						problems.add(
							x.row,
							`This serial is recorded in a different batch, not ${x.row.v.lot?.trim()}. Check the batch number.`
						);
						continue;
					}
					packId = found.id;
				}
				const toId = await partyId(x.to);
				const fromId = x.from ? await partyId(x.from) : null;
				const key = `${packId ?? x.batchId}|${toId}|${fromId ?? ''}|${x.date}`;
				if (seenEvents.has(key)) {
					counts.duplicatesSkipped = (counts.duplicatesSkipped ?? 0) + 1;
					counts.ready = (counts.ready ?? 0) + 1;
					continue;
				}
				seenEvents.add(key);
				values.push({
					manufacturerId: job.manufacturerId,
					level: packId ? 'pack' : 'batch',
					packId: packId ?? null,
					batchId: x.batchId,
					fromPartyId: fromId,
					toPartyId: toId,
					eventType: 'shipped',
					eventDate: x.date,
					source: job.onBehalf ? 'staff_import' : 'manufacturer_import',
					importJobId: job.id
				});
			}
			if (values.length === 0) return;

			// Skip records already on DETECK from an earlier import. Businesses DETECK has merged since
			// then are compared by the business they were merged into. Only this chunk's packs (and
			// its batch-level batches) are read, so a big batch isn't re-read for every chunk.
			const chunkPacks = [...new Set(values.flatMap((v) => (v.packId ? [v.packId] : [])))];
			const batchIds = [...new Set(values.flatMap((v) => (v.packId ? [] : [v.batchId])))];
			const which = [
				...(chunkPacks.length ? [sql`c.pack_id in ${chunkPacks}`] : []),
				...(batchIds.length ? [sql`(c.pack_id is null and c.batch_id in ${batchIds})`] : [])
			];
			const existing = await tx.execute<{
				pack_id: number | null;
				batch_id: string;
				to_id: string;
				from_id: string | null;
				date: string;
			}>(sql`
				select c.pack_id, c.batch_id, c.event_date::text as date,
					coalesce(pt.merged_into_id, c.to_party_id) as to_id,
					coalesce(pf.merged_into_id, c.from_party_id) as from_id
				from ${custodyEvent} c
				join ${party} pt on pt.id = c.to_party_id
				left join ${party} pf on pf.id = c.from_party_id
				where (${sql.join(which, sql` or `)}) and c.import_job_id is distinct from ${job.id}`);
			const existingKeys = new Set(
				existing.map((e) => `${e.pack_id ?? e.batch_id}|${e.to_id}|${e.from_id ?? ''}|${e.date}`)
			);
			const fresh = values.filter(
				(v) =>
					!existingKeys.has(
						`${v.packId ?? v.batchId}|${v.toPartyId}|${v.fromPartyId ?? ''}|${v.eventDate}`
					)
			);
			counts.duplicatesSkipped = (counts.duplicatesSkipped ?? 0) + (values.length - fresh.length);
			counts.ready = (counts.ready ?? 0) + values.length;
			if (fresh.length) await tx.insert(custodyEvent).values(fresh);
			for (const v of fresh) {
				if (v.level === 'pack') counts.packEvents = (counts.packEvents ?? 0) + 1;
				else counts.batchEvents = (counts.batchEvents ?? 0) + 1;
			}
		}
	};
}

// ---------------------------------------------------------------- running

/** Thrown inside the transaction when another run already handled this import. */
const ALREADY_HANDLED = Symbol('already handled');
const DRY_RUN = Symbol('dry-run');

function summaryFor(job: Job, counts: Counts): string {
	const n = (k: string) => (counts[k] ?? 0).toLocaleString('en-NG');
	if (job.kind === 'products')
		return `Imported ${job.fileName}: ${n('created')} new drugs, ${n('updated')} updated, ${n('problems')} problem rows held back`;
	if (job.kind === 'batches_serials')
		return `Imported ${n('serialsAdded')} serials and ${n('batchesCreated')} new batches from ${job.fileName}, ${n('problems')} problem rows held back`;
	return `Imported ${n('packEvents')} pack and ${n('batchEvents')} batch supply chain records from ${job.fileName}, ${n('problems')} problem rows held back`;
}

/**
 * Checks (dry run) or imports (commit) a job. Never leaves partial data: an
 * unexpected error rolls everything back and marks the job failed.
 */
export async function runImport(
	jobId: string,
	mode: 'dry_run' | 'commit',
	actor?: Actor
): Promise<void> {
	const { db } = ctx();
	const job = await loadJob(jobId);
	if (!job) return;
	if (
		(mode === 'dry_run' && job.status !== 'validating') ||
		(mode === 'commit' && job.status !== 'committing')
	)
		return;

	const kind = fileKind(job.fileName, '');
	const headers = job.headers ?? [];
	const mapping = job.mapping ?? {};
	const index = Object.fromEntries(
		Object.entries(mapping).map(([field, header]) => [field, headers.indexOf(header)])
	);
	const counts: Counts = { rows: 0, ready: 0, problems: 0 };
	const problems = new ProblemLog();

	try {
		if (!kind) throw new ImportError('Unsupported file type.');
		const body = await getObject(job.fileKey);
		const [owner] = await db
			.select({ status: manufacturer.status })
			.from(manufacturer)
			.where(eq(manufacturer.id, job.manufacturerId));
		const importActor = actor ?? SYSTEM_ACTOR;
		await db.transaction(async (tx) => {
			// Only one run of an import at a time, across every process: a second run waits here,
			// then finds the status changed and stops.
			await tx.execute(sql`select pg_advisory_xact_lock(4242, hashtext(${job.id}))`);
			const [current] = await tx
				.select({ status: importJob.status })
				.from(importJob)
				.where(eq(importJob.id, job.id));
			if (current?.status !== (mode === 'dry_run' ? 'validating' : 'committing'))
				throw ALREADY_HANDLED;
			const processor =
				job.kind === 'products'
					? productsProcessor(tx, job, counts, problems, {
							live: ['live', 'suspended'].includes(owner?.status ?? ''),
							actor: importActor
						})
					: job.kind === 'batches_serials'
						? await batchesProcessor(tx, job, counts, problems)
						: await distributionProcessor(tx, job, counts, problems);
			let first = true;
			let rowNumber = 1;
			let chunk: RowIn[] = [];
			for await (const raw of readRows(body, kind)) {
				if (first) {
					first = false;
					continue;
				}
				rowNumber++;
				const v: Record<string, string> = {};
				for (const [field, i] of Object.entries(index))
					if (i >= 0) v[field] = (raw[i] ?? '').trim();
				chunk.push({ rowNumber, raw, v });
				if (chunk.length >= CHUNK) {
					await processor.chunk(chunk);
					counts.rows += chunk.length;
					chunk = [];
					// Progress is written on a separate connection so it's visible while the transaction runs.
					// Only the running row count changes, so the checked totals stay on screen.
					await db
						.update(importJob)
						.set({ counts: { ...(job.counts ?? {}), progressRows: counts.rows, processing: 1 } })
						.where(eq(importJob.id, job.id));
				}
			}
			if (chunk.length) {
				await processor.chunk(chunk);
				counts.rows += chunk.length;
			}
			processor.finish?.();
			counts.problems = problems.count;
			if (mode === 'dry_run') throw DRY_RUN;

			const problemsKey = problems.count
				? storageKey(
						'import-problems',
						job.manufacturerId,
						`${job.fileName}-problems.csv`,
						randomId(6)
					)
				: null;
			if (problemsKey)
				await putObject(problemsKey, new TextEncoder().encode(problems.toCsv(headers)), 'text/csv');
			await tx
				.update(importJob)
				// The first rows were kept only to help match columns; they may hold serials.
				.set({
					status: 'committed',
					counts,
					problemsKey,
					committedAt: new Date(),
					error: null,
					sampleRows: null
				})
				.where(eq(importJob.id, job.id));
			if (job.kind !== 'products') {
				await tx
					.update(manufacturer)
					.set({ updatedAt: new Date() })
					.where(eq(manufacturer.id, job.manufacturerId));
			}
			await audit(
				actor ?? {
					userId: job.createdBy,
					label: 'Import',
					role: 'Manufacturer user',
					onBehalf: job.onBehalf
				},
				{
					area: 'Manufacturer board',
					action: 'import_commit',
					itemType: 'import',
					itemId: job.id,
					manufacturerId: job.manufacturerId,
					summary: summaryFor(job, counts),
					after: counts
				},
				tx
			);
		});
		// The check step's problem file is replaced by the one just written; it may hold serials.
		if (job.problemsKey) await deleteObject(job.problemsKey).catch(() => undefined);
		clearCoverageCache();
		if (counts.pendingReview)
			await notifyStaff(
				`${counts.pendingReview} new drug${counts.pendingReview === 1 ? '' : 's'} to review`,
				`A live manufacturer added ${counts.pendingReview} new drug${counts.pendingReview === 1 ? '' : 's'} in ${job.fileName}. People can't check them until a DETECK reviewer approves each one.\n\nReview them: ${ctx().config.origin}/console/drugs`
			).catch((e) => console.error('[email] new drugs', e));
		await emitEvent(job.manufacturerId, 'import.completed', {
			importId: job.id,
			kind: job.kind,
			fileName: job.fileName,
			counts
		});
	} catch (error) {
		if (error === ALREADY_HANDLED) return;
		if (error === DRY_RUN) {
			const problemsKey = problems.count
				? storageKey(
						'import-problems',
						job.manufacturerId,
						`${job.fileName}-problems.csv`,
						randomId(6)
					)
				: null;
			if (problemsKey)
				await putObject(problemsKey, new TextEncoder().encode(problems.toCsv(headers)), 'text/csv');
			await db
				.update(importJob)
				.set({ status: 'ready', counts, problemsKey, error: null })
				.where(eq(importJob.id, job.id));
			// Checked again: the earlier problem file is replaced (it may hold serials).
			if (job.problemsKey) await deleteObject(job.problemsKey).catch(() => undefined);
			return;
		}
		const known = error instanceof ImportError || error instanceof SpreadsheetTooLarge;
		const message = known ? error.message : 'Something went wrong while reading the file.';
		if (!known) console.error('[import] failed', job.id, error);
		await db
			.update(importJob)
			.set({
				status: mode === 'commit' ? 'failed' : 'uploaded',
				error: mode === 'commit' ? `Import stopped, nothing saved. ${message}` : message
			})
			.where(eq(importJob.id, job.id));
	}
}

/**
 * Marks imports interrupted by a restart as failed; nothing was saved because each import is one
 * transaction. A running import writes its progress every 1,000 rows, so only imports untouched
 * for a while are touched: another process may be running the rest.
 */
export async function recoverInterruptedImports(staleMinutes = 15) {
	await ctx()
		.db.update(importJob)
		.set({
			status: 'failed',
			error: 'Import stopped, nothing saved. The server restarted while it was running. Try again.'
		})
		.where(
			and(
				inArray(importJob.status, ['validating', 'committing']),
				lt(importJob.updatedAt, new Date(Date.now() - staleMinutes * 60_000))
			)
		);
}

export const IMPORT_FILE_RETENTION_DAYS = 90;

/**
 * Uploaded files (and the rows sent through the API) are deleted 90 days after upload, with the
 * problem-rows file and the sample rows, since all of them may hold serials as typed. The
 * import's counts and audit entries stay. An import still waiting to be committed by then is
 * cancelled, because there's nothing left to commit.
 */
export async function purgeOldImportFiles(now = new Date()) {
	const { db } = ctx();
	const cutoff = new Date(now.getTime() - IMPORT_FILE_RETENTION_DAYS * 86_400_000);
	const due = await db
		.select({
			id: importJob.id,
			fileKey: importJob.fileKey,
			problemsKey: importJob.problemsKey,
			status: importJob.status
		})
		.from(importJob)
		.where(
			and(
				isNull(importJob.fileDeletedAt),
				lt(importJob.createdAt, cutoff),
				// Never under a running import.
				ne(importJob.status, 'validating'),
				ne(importJob.status, 'committing')
			)
		)
		.limit(500);
	for (const job of due) {
		await deleteObject(job.fileKey).catch(() => undefined);
		if (job.problemsKey) await deleteObject(job.problemsKey).catch(() => undefined);
		const waiting = job.status === 'uploaded' || job.status === 'ready';
		await db
			.update(importJob)
			.set({
				fileDeletedAt: now,
				problemsKey: null,
				sampleRows: null,
				...(waiting
					? {
							status: 'cancelled' as const,
							error: `Not committed within ${IMPORT_FILE_RETENTION_DAYS} days, so the file was deleted. Upload it again to continue.`
						}
					: {})
			})
			.where(eq(importJob.id, job.id));
	}
	return due.length;
}

// ---------------------------------------------------------------- the manufacturer data API

/** Queue options for imports: a big import can run long, so the queue mustn't give up early. */
export const IMPORT_JOB = { expireInSeconds: 3 * 3600 };

export const MAX_API_ROWS = 50_000;

/** Every cell quoted: the reader also accepts ";" and tab as separators, so "A;B" must stay one cell. */
function csvCell(value: unknown): string {
	const text = value === null || value === undefined ? '' : String(value);
	return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Rows sent to the API become an import, exactly like an uploaded file: the same checks, the same
 * problem rows and the same audit trail. Sending the same rows twice returns the first import.
 */
export async function createApiImport(
	actor: Actor,
	manufacturerId: string,
	kind: ImportKind,
	rows: unknown,
	options: { commit: boolean }
) {
	if (!Array.isArray(rows) || rows.length === 0) throw new ImportError('Send at least one row.');
	if (rows.length > MAX_API_ROWS)
		throw new ImportError(`Send at most ${MAX_API_ROWS.toLocaleString('en-GB')} rows at a time.`);
	const fields = IMPORT_FIELDS[kind].map((f) => f.key);
	const used = fields.filter((f) =>
		rows.some((r) => r && typeof r === 'object' && (r as Record<string, unknown>)[f] != null)
	);
	if (used.length === 0) throw new ImportError(`Rows need these fields: ${fields.join(', ')}.`);
	const mapping = Object.fromEntries(used.map((f) => [f, f]));
	// Checked before anything is stored, so a bad request never leaves an import behind.
	const missing = missingRequired(kind, mapping);
	if (missing.length)
		throw new ImportError(
			`Rows are missing these fields: ${missing.map((f) => `${f.key} (${f.label})`).join(', ')}.`
		);
	const lines = [used.join(',')];
	for (const r of rows) {
		if (!r || typeof r !== 'object') throw new ImportError('Every row must be an object.');
		lines.push(used.map((f) => csvCell((r as Record<string, unknown>)[f])).join(','));
	}
	const day = today();
	const { job, existing } = await createImportJob(
		actor,
		manufacturerId,
		kind,
		{
			name: `api-${kind}-${day}.csv`,
			type: 'text/csv',
			bytes: new TextEncoder().encode(lines.join('\r\n'))
		},
		{ source: 'api' }
	);
	if (existing) {
		// The same rows again. Rows that were only checked before ("commit": false) are imported
		// now if asked; anything else (running or already imported) is returned as it is.
		const waiting = job.status === 'ready' || job.status === 'uploaded';
		if (!waiting || (job.status === 'ready' && !options.commit)) return { job, existing };
		await saveMapping(job, mapping);
		await enqueue('import.api', { jobId: job.id, commit: options.commit, actor }, IMPORT_JOB);
		return { job: (await loadJob(job.id))!, existing };
	}
	await saveMapping(job, mapping);
	await enqueue('import.api', { jobId: job.id, commit: options.commit, actor }, IMPORT_JOB);
	return { job: (await loadJob(job.id))!, existing: false };
}

/** The worker's job for API imports: check, then (when asked) import the ready rows. */
export async function runApiImport(jobId: string, commit: boolean, actor?: Actor) {
	await runImport(jobId, 'dry_run');
	if (!commit) return;
	const job = await loadJob(jobId);
	if (!job || job.status !== 'ready' || (job.counts?.ready ?? 0) === 0) return;
	await markCommitting(job);
	await runImport(jobId, 'commit', actor);
}

/** The first problem rows of an import, with their reasons, from the stored problems file. */
/** A held-back row: its row number, the problem, and the row's own cells by column name. */
export type ProblemRow = {
	row: number;
	index?: number;
	problem: string;
	[column: string]: string | number | undefined;
};

export async function readProblemRows(job: Job, limit = 100): Promise<ProblemRow[]> {
	if (!job.problemsKey) return [];
	try {
		const { parse } = await import('csv-parse/sync');
		const rows = parse((await getObject(job.problemsKey)).toString('utf8'), {
			bom: true,
			relax_column_count: true,
			to: limit + 1
		}) as string[][];
		const headers = ['row', 'problem', ...(job.headers ?? [])];
		return rows
			.slice(1)
			.map((r) => ({
				...Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])),
				problem: r[1] ?? '',
				row: Number(r[0]),
				// Rows sent through the API: where the row is in the "rows" array sent (from 0). Row 1 of
				// the stored file is its header, so the first row sent is row 2.
				...(job.source === 'api' ? { index: Number(r[0]) - 2 } : {})
			}))
			.sort((a, b) => a.row - b.row);
	} catch {
		return [];
	}
}
