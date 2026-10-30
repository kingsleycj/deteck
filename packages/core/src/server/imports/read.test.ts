import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { parseDate } from '../../imports/values.ts';
import {
	checkXlsxSize,
	csvDelimiter,
	preview,
	readNumberedRows,
	readRows,
	SpreadsheetTooLarge,
	UNSAFE_NUMBER
} from './read.ts';

async function workbook() {
	const wb = new ExcelJS.Workbook();
	const ws = wb.addWorksheet('Serials');
	ws.addRow(['Product Code', 'Lot No', 'Exp', 'Serial']);
	ws.addRow([9506000134352, 'NB-2611', new Date(Date.UTC(2028, 3, 30)), '7K4M9QX2TB8D']);
	ws.addRow([
		9506000134352,
		{ richText: [{ text: 'NB-' }, { text: '2612' }] },
		'04/2028',
		// eslint-disable-next-line no-loss-of-precision -- a long serial typed into Excel as a number
		12345678901234567890
	]);
	ws.addRow([]);
	return new Uint8Array(await wb.xlsx.writeBuffer());
}

describe('reading spreadsheets', () => {
	it('reads Excel rows, dates, rich text and flags numbers Excel lost digits on', async () => {
		const rows: string[][] = [];
		for await (const r of readRows(await workbook(), 'xlsx')) rows.push(r);
		expect(rows).toHaveLength(3);
		expect(rows[1]).toEqual(['9506000134352', 'NB-2611', '2028-04-30', '7K4M9QX2TB8D']);
		expect(rows[2][1]).toBe('NB-2612');
		expect(rows[2][3]).toBe(UNSAFE_NUMBER);
	});

	it("keeps a semicolon inside a cell of a comma file, and knows each row's line", async () => {
		const csv = new TextEncoder().encode(
			'GTIN,Brand,Generic\n9506000134352,Malarex,Artemether; Lumefantrine\n\n,,\n9506000134353,Paxolin,Paracetamol\n'
		);
		expect(csvDelimiter(csv)).toBe(',');
		const rows = [];
		for await (const r of readNumberedRows(csv, 'csv')) rows.push(r);
		// The blank line and the row of commas aren't rows; line numbers stay those of the file.
		expect(rows).toEqual([
			{ cells: ['GTIN', 'Brand', 'Generic'], line: 1 },
			{ cells: ['9506000134352', 'Malarex', 'Artemether; Lumefantrine'], line: 2 },
			{ cells: ['9506000134353', 'Paxolin', 'Paracetamol'], line: 5 }
		]);
		expect(csvDelimiter(new TextEncoder().encode('a\tb\tc\n1,2\t3\t4'))).toBe('\t');
	});

	it('gives repeated and blank column names their own name', async () => {
		const csv = new TextEncoder().encode('Brand name,,Brand name\nA,B,C\n');
		expect((await preview(csv, 'csv')).headers).toEqual([
			'Brand name',
			'Column 2',
			'Brand name (2)'
		]);
	});

	it('previews CSV with a byte-order mark and semicolons', async () => {
		const csv = new TextEncoder().encode(
			'﻿GTIN;Batch number;Expiry date\n09506000134352;NB-2611;2028-04-30\n'
		);
		const info = await preview(csv, 'csv');
		expect(info.headers).toEqual(['GTIN', 'Batch number', 'Expiry date']);
		expect(info.rows).toBe(1);
	});

	it('reads a month-only Excel date as that month, so expiry is the end of the month', async () => {
		const wb = new ExcelJS.Workbook();
		const ws = wb.addWorksheet('Serials');
		ws.addRow(['Exp']);
		const cell = ws.addRow([new Date(Date.UTC(2028, 3, 1))]).getCell(1);
		cell.numFmt = 'mmm-yy';
		const rows: string[][] = [];
		for await (const r of readRows(new Uint8Array(await wb.xlsx.writeBuffer()), 'xlsx'))
			rows.push(r);
		expect(rows[1][0]).toBe('2028-04');
		expect(parseDate(rows[1][0])).toBe('2028-04-30');
	});

	it('refuses a spreadsheet that would unpack into something huge, before unpacking it', () => {
		// A zip's table of contents claiming a 100 MB shared-strings part.
		const name = Buffer.from('xl/sharedStrings.xml');
		const entry = Buffer.alloc(46);
		entry.writeUInt32LE(0x02014b50, 0);
		entry.writeUInt32LE(100 * 1024 * 1024, 24);
		entry.writeUInt16LE(name.length, 28);
		const end = Buffer.alloc(22);
		end.writeUInt32LE(0x06054b50, 0);
		end.writeUInt16LE(1, 10);
		end.writeUInt32LE(0, 16);
		const zip = new Uint8Array(Buffer.concat([entry, name, end]));
		expect(() => checkXlsxSize(zip)).toThrow(SpreadsheetTooLarge);
	});
});
