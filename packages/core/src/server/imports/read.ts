import { Readable } from 'node:stream';
import { parse } from 'csv-parse';
import ExcelJS from 'exceljs';

/**
 * A cell value that Excel stored as a number too long to keep exactly. Excel keeps 15 significant
 * digits, so a 16-digit number may already have lost its last digit.
 */
export const UNSAFE_NUMBER = '\u0000unsafe-number';

export type FileKind = 'csv' | 'xlsx';

export function fileKind(name: string, type: string): FileKind | null {
	const n = name.toLowerCase();
	if (n.endsWith('.csv') || type === 'text/csv') return 'csv';
	if (
		n.endsWith('.xlsx') ||
		type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
	)
		return 'xlsx';
	return null;
}

/** A date shown only as month and year in Excel ("Apr-28", "04/2028") has no day to trust. */
const hasDay = (numFmt: string | undefined) =>
	!numFmt || /d/i.test(numFmt.replace(/"[^"]*"|\[[^\]]*\]/g, ''));

function cellToString(value: ExcelJS.CellValue, numFmt?: string): string {
	if (value === null || value === undefined) return '';
	// Excel stores "04/2028" as 1 April 2028. Keep only the month, so an expiry becomes the last
	// day of the month as printed, not the first (which would call packs expired a month early).
	if (value instanceof Date)
		return hasDay(numFmt) ? value.toISOString().slice(0, 10) : value.toISOString().slice(0, 7);
	if (typeof value === 'number') {
		if (Number.isInteger(value) && (!Number.isSafeInteger(value) || String(value).length > 15))
			return UNSAFE_NUMBER;
		return String(value);
	}
	if (typeof value === 'string' || typeof value === 'boolean') return String(value);
	if (typeof value === 'object') {
		if ('richText' in value && Array.isArray(value.richText))
			return value.richText.map((r) => r.text).join('');
		if ('result' in value) return cellToString(value.result as ExcelJS.CellValue);
		if ('text' in value) return String(value.text);
		if ('error' in value) return '';
	}
	return String(value);
}

/**
 * The file in 64 KB pieces. Handed over as one piece, the parser would turn every row into objects
 * before the first is used; in pieces, rows flow through and memory stays flat.
 */
function* pieces(body: Uint8Array, size = 64 * 1024): Generator<Buffer> {
	for (let i = 0; i < body.length; i += size)
		yield Buffer.from(body.buffer, body.byteOffset + i, Math.min(size, body.length - i));
}

async function* csvRows(body: Uint8Array): AsyncGenerator<string[]> {
	const parser = Readable.from(pieces(body)).pipe(
		parse({
			bom: true,
			delimiter: [',', ';', '\t'],
			relax_column_count: true,
			skip_empty_lines: true,
			trim: true
		})
	);
	for await (const record of parser) yield (record as string[]).map((v) => v ?? '');
}

async function* xlsxRows(body: Uint8Array): AsyncGenerator<string[]> {
	checkXlsxSize(body);
	const reader = new ExcelJS.stream.xlsx.WorkbookReader(Readable.from(pieces(body)), {
		sharedStrings: 'cache',
		styles: 'cache',
		hyperlinks: 'ignore',
		worksheets: 'emit'
	});
	// One sheet at a time (MF4a): the first worksheet is used.
	for await (const worksheet of reader) {
		for await (const row of worksheet as AsyncIterable<ExcelJS.Row>) {
			const values: string[] = [];
			row.eachCell({ includeEmpty: true }, (cell, column) => {
				values[column - 1] = cellToString(cell.value, cell.numFmt);
			});
			for (let i = 0; i < values.length; i++) values[i] ??= '';
			if (values.some((v) => v.trim() !== '')) yield values.map((v) => v.trim());
		}
		return;
	}
}

export class SpreadsheetTooLarge extends Error {}

/**
 * An .xlsx file is a zip. A small file can unpack into gigabytes (one cell repeated a million
 * times), so its listed sizes are checked before anything is unpacked.
 */
export function checkXlsxSize(body: Uint8Array) {
	const view = Buffer.from(body.buffer, body.byteOffset, body.length);
	const tooLarge = () =>
		new SpreadsheetTooLarge(
			'This spreadsheet is too large once unpacked. Split it into smaller files, or save it as CSV.'
		);
	// End-of-central-directory record: within the last 64 KB + 22 bytes.
	let end = -1;
	for (let i = view.length - 22; i >= Math.max(0, view.length - 65_557); i--)
		if (view.readUInt32LE(i) === 0x06054b50) {
			end = i;
			break;
		}
	if (end < 0) return; // Not a readable zip: the spreadsheet reader reports it.
	const entries = view.readUInt16LE(end + 10);
	let offset = view.readUInt32LE(end + 16);
	if (entries === 0xffff || offset === 0xffffffff || entries > 5_000) throw tooLarge();
	let total = 0;
	for (let n = 0; n < entries; n++) {
		if (offset + 46 > view.length || view.readUInt32LE(offset) !== 0x02014b50) return;
		const unpacked = view.readUInt32LE(offset + 24);
		const nameLength = view.readUInt16LE(offset + 28);
		const extra = view.readUInt16LE(offset + 30);
		const comment = view.readUInt16LE(offset + 32);
		const name = view.toString('utf8', offset + 46, offset + 46 + nameLength);
		if (unpacked === 0xffffffff) throw tooLarge();
		if (/sharedStrings\.xml$/i.test(name) && unpacked > 64 * 1024 * 1024) throw tooLarge();
		total += unpacked;
		offset += 46 + nameLength + extra + comment;
	}
	if (total > 400 * 1024 * 1024) throw tooLarge();
}

/** Streams rows (header first) from a CSV or XLSX file. */
export function readRows(body: Uint8Array, kind: FileKind): AsyncGenerator<string[]> {
	return kind === 'csv' ? csvRows(body) : xlsxRows(body);
}

/** Header row plus the first few data rows, for the column-matching screen. */
export async function preview(body: Uint8Array, kind: FileKind, sampleSize = 3) {
	let headers: string[] | null = null;
	const sample: string[][] = [];
	let rows = 0;
	for await (const row of readRows(body, kind)) {
		if (!headers) {
			headers = row.map((h, i) => h || `Column ${i + 1}`);
			continue;
		}
		rows++;
		if (sample.length < sampleSize) sample.push(row);
	}
	return { headers: headers ?? [], sample, rows };
}
