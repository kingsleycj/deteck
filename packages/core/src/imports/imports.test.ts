import { describe, expect, it } from 'vitest';
import { autoMatch, missingRequired } from './fields.ts';
import { normaliseBusinessName, parseDate, parseQuantity, parseRole } from './values.ts';

describe('dates in spreadsheets', () => {
	it.each([
		['2028-04-30', '2028-04-30'],
		['30/04/2028', '2028-04-30'],
		['30-04-2028', '2028-04-30'],
		['1/3/26', '2026-03-01'],
		['12-Mar-2026', '2026-03-12'],
		['12 March 2026', '2026-03-12'],
		['04/2028', '2028-04-30'],
		['2028-02', '2028-02-29'],
		['Apr 2028', '2028-04-30'],
		['46142', '2026-04-30'],
		['2026-03-12T00:00:00.000Z', '2026-03-12']
	])('parses %s', (input, expected) => {
		expect(parseDate(input)).toBe(expected);
	});

	it.each(['', '31/02/2028', '13/13/2028', 'soon', '99999', '280430'])('rejects %s', (input) => {
		expect(parseDate(input)).toBeNull();
	});
});

describe('business roles and names', () => {
	it.each([
		['Pharmacy', 'pharmacy'],
		['Retail chemist', 'pharmacy'],
		['PPMV', 'pharmacy'],
		['General Hospital', 'hospital'],
		['Primary Health Centre', 'hospital'],
		['Key Distributor', 'distributor'],
		['Wholesaler', 'wholesaler'],
		['Other', 'other']
	])('maps %s', (input, expected) => {
		expect(parseRole(input)).toBe(expected);
	});

	it('normalises names so spelling variants match', () => {
		expect(normaliseBusinessName('Lakeside Medical Supply Ltd.')).toBe(
			normaliseBusinessName('LAKESIDE MEDICAL SUPPLY LIMITED')
		);
		expect(normaliseBusinessName('A & B Pharmacy (Nig) Ltd')).toBe('a and b pharmacy');
	});

	it('parses quantities', () => {
		expect(parseQuantity('420,000')).toBe(420000);
		expect(parseQuantity('')).toBeNull();
		expect(parseQuantity('lots')).toBe('invalid');
	});
});

describe('column matching', () => {
	it("matches a manufacturer's own column names", () => {
		const mapping = autoMatch('batches_serials', [
			'Product Code',
			'Lot No',
			'Serial',
			'Exp',
			'Pack Date'
		]);
		expect(mapping).toEqual({
			gtin: 'Product Code',
			lot: 'Lot No',
			serial: 'Serial',
			expiryDate: 'Exp',
			manufactureDate: 'Pack Date'
		});
		expect(missingRequired('batches_serials', mapping)).toEqual([]);
	});

	it('requires a product identifier for batches and supply chain', () => {
		const missing = missingRequired('distribution', {
			lot: 'Batch',
			toName: 'Customer',
			toRole: 'Type',
			toState: 'State',
			eventDate: 'Date'
		});
		expect(missing.map((f) => f.key)).toEqual(['gtin']);
	});
});
