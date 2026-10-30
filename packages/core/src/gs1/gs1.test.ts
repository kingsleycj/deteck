import { describe, expect, it } from 'vitest';
import { gtinCheckDigit, isValidGtin, toGtin14 } from './gtin.ts';
import { gs1DateToIso, looksLikeGs1, parseGs1 } from './element-string.ts';
import {
	checkTypedSerial,
	looksLikeBatchNumber,
	looksLikeNafdacNumber,
	normaliseSerialKey
} from './serial.ts';

describe('GTIN', () => {
	it('computes the GS1 check digit', () => {
		expect(gtinCheckDigit('0950600013435')).toBe(2);
		expect(gtinCheckDigit('400638133393')).toBe(1);
	});

	it('validates GTIN-8, -12, -13 and -14', () => {
		expect(isValidGtin('09506000134352')).toBe(true);
		expect(isValidGtin('4006381333931')).toBe(true);
		expect(isValidGtin('036000291452')).toBe(true);
		expect(isValidGtin('96385074')).toBe(true);
		expect(isValidGtin('09506000134353')).toBe(false);
		expect(isValidGtin('0950600013435')).toBe(false);
		expect(isValidGtin('ABC')).toBe(false);
	});

	it('pads to 14 digits', () => {
		expect(toGtin14('4006381333931')).toBe('04006381333931');
		expect(toGtin14('4006381333932')).toBeNull();
	});
});

describe('GS1 dates', () => {
	it('converts YYMMDD', () => {
		expect(gs1DateToIso('280430')).toBe('2028-04-30');
	});
	it('treats day 00 as the last day of the month', () => {
		expect(gs1DateToIso('280200')).toBe('2028-02-29');
		expect(gs1DateToIso('270200')).toBe('2027-02-28');
	});
	it('rejects impossible dates', () => {
		expect(gs1DateToIso('281301')).toBeNull();
		expect(gs1DateToIso('280231')).toBeNull();
	});
});

describe('GS1 element strings', () => {
	const expected = {
		gtin: '09506000134352',
		expiry: '2028-04-30',
		lot: 'NB-2611',
		serial: '7K4M9QX2TB8D'
	};

	it('parses the bracketed human-readable form', () => {
		const r = parseGs1('(01)09506000134352(17)280430(10)NB-2611(21)7K4M9QX2TB8D');
		expect(r.ok && r.data).toMatchObject(expected);
	});

	it('ignores spaces in the bracketed form', () => {
		const r = parseGs1('(01) 09506000134352 (17) 280430 (10) NB-2611 (21) 7K4M9QX2TB8D');
		expect(r.ok && r.data).toMatchObject(expected);
	});

	it('parses raw form with group separators and a symbology identifier', () => {
		const r = parseGs1(']d201095060001343521728043010NB-2611\u001d217K4M9QX2TB8D');
		expect(r.ok && r.data).toMatchObject(expected);
	});

	it('parses escaped <GS> separators emitted by some readers', () => {
		const r = parseGs1('<GS>0109506000134352217K4M9QX2TB8D<GS>10NB-2611<GS>17280430');
		expect(r.ok && r.data).toMatchObject(expected);
	});

	it('rejects a bad GTIN check digit', () => {
		const r = parseGs1('(01)09506000134353(21)ABC123');
		expect(r).toEqual({ ok: false, reason: 'bad_gtin' });
	});

	it('rejects strings that are not element strings', () => {
		expect(parseGs1('hello world').ok).toBe(false);
		expect(parseGs1('').ok).toBe(false);
	});

	it('reads the internal-use AI 90 and four-digit AIs such as 7003 and 8008', () => {
		const r = parseGs1(
			// 7003 isn't in GS1's fixed-length table, so a separator follows its value too.
			']d2010950600013435217280430\u001d90INT-7\u001d70032804301230\u001d10NB-2611\u001d217K4M9QX2TB8D'
		);
		expect(r.ok && r.data).toMatchObject(expected);
		expect(r.ok && r.data.ais['90']).toBe('INT-7');
		expect(r.ok && r.data.ais['7003']).toBe('2804301230');
	});

	it('keeps brackets that are part of a value', () => {
		const r = parseGs1('(01)09506000134352(17)280430(10)NB(26)11(21)7K4M9QX2TB8D');
		expect(r.ok && r.data.lot).toBe('NB(26)11');
		expect(r.ok && r.data.serial).toBe('7K4M9QX2TB8D');
	});

	it('reads GS1 Digital Link web addresses, with AI numbers or short names', () => {
		const a = parseGs1(
			'https://id.example.com/01/09506000134352/10/NB-2611/21/7K4M9QX2TB8D?17=280430'
		);
		expect(a.ok && a.data).toMatchObject(expected);
		const b = parseGs1(
			'https://example.com/gtin/09506000134352/lot/NB-2611/ser/7K4M9QX2TB8D?exp=280430'
		);
		expect(b.ok && b.data).toMatchObject(expected);
		expect(looksLikeGs1('https://example.com/01/09506000134352/21/ABC123')).toBe(true);
		expect(looksLikeGs1('https://example.com/about')).toBe(false);
	});

	it('detects GS1-looking input', () => {
		expect(looksLikeGs1('(01)09506000134352(21)X')).toBe(true);
		expect(looksLikeGs1('010950600013435221ABC')).toBe(true);
		expect(looksLikeGs1('7K4M-9QX2-TB8D')).toBe(false);
	});
});

describe('typed serials', () => {
	it('ignores spaces, dashes and case', () => {
		expect(normaliseSerialKey(' 7k4m-9qx2 tb8d ')).toBe('7K4M9QX2TB8D');
		expect(normaliseSerialKey('7K4M–9QX2')).toBe('7K4M9QX2');
	});

	it('accepts 4 to 20 characters', () => {
		expect(checkTypedSerial('7K4M-9QX2')).toEqual({ ok: true, key: '7K4M9QX2' });
		expect(checkTypedSerial('ab1')).toEqual({ ok: false, problem: 'too_short' });
		expect(checkTypedSerial('A'.repeat(21))).toEqual({ ok: false, problem: 'too_long' });
		expect(checkTypedSerial('  ')).toEqual({ ok: false, problem: 'empty' });
		expect(checkTypedSerial('ABC#1234')).toEqual({ ok: false, problem: 'bad_characters' });
	});

	it('recognises NAFDAC registration numbers typed by mistake', () => {
		expect(looksLikeNafdacNumber('A4-1234')).toBe(true);
		expect(looksLikeNafdacNumber('04-1234L')).toBe(true);
		expect(looksLikeNafdacNumber('7K4M9QX2')).toBe(false);
		// With the label copied from the pack.
		expect(looksLikeNafdacNumber('NAFDAC A4-0000')).toBe(true);
		expect(looksLikeNafdacNumber('NAFDAC Reg. No. A4-1234')).toBe(true);
		expect(looksLikeNafdacNumber('Reg No: 04-1234L')).toBe(true);
	});

	it('recognises a batch number copied with its label, but not a serial that starts like one', () => {
		expect(looksLikeBatchNumber('LOT NB-2611')).toBe(true);
		expect(looksLikeBatchNumber('Batch: NB-2611')).toBe(true);
		expect(looksLikeBatchNumber('B/N NB2611')).toBe(true);
		expect(looksLikeBatchNumber('BN7K4M9QX2')).toBe(false);
		expect(looksLikeBatchNumber('LOTA9XK21')).toBe(false);
	});
});
