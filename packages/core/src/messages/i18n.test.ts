import { describe, expect, it } from 'vitest';
import { checkTranslation } from './check.ts';
import { resultCopy } from './copy.ts';
import { fmt, LOCALES, messages, parseLanguages, pickLocale, plural, richParts } from './i18n.ts';
import type { PublicResult } from '../verify/types.ts';

describe('languages', () => {
	it.each(LOCALES.filter((l) => l !== 'en'))('%s has every English key and placeholder', (l) => {
		expect(checkTranslation(messages(l)).problems).toEqual([]);
	});

	it('picks the saved choice, then the browser languages, then English', () => {
		const all = parseLanguages('en,pcm,ha,yo,ig');
		expect(pickLocale('yo', 'ha', all)).toBe('yo');
		expect(pickLocale(undefined, 'fr-FR,ha;q=0.8,en;q=0.5', all)).toBe('ha');
		expect(pickLocale(undefined, 'ig;q=0.2,yo;q=0.9', all)).toBe('yo');
		expect(pickLocale(undefined, 'fr', all)).toBe('en');
		// Only switched-on languages are used.
		expect(pickLocale('ha', 'ha', parseLanguages('en,yo'))).toBe('en');
		expect(parseLanguages('ha, zz,yo')).toEqual(['en', 'ha', 'yo']);
	});

	it('fills placeholders, plurals and bold parts', () => {
		expect(fmt('Batch {lot} of {drug}', { lot: 'NB-1', drug: 'Curavyn' })).toBe(
			'Batch NB-1 of Curavyn'
		);
		expect(fmt('Keep {missing}', {})).toBe('Keep {missing}');
		expect(plural(1, { one: '{n} product', other: '{n} products' })).toBe('1 product');
		expect(plural(3, { one: '{n} product', other: '{n} products' })).toBe('3 products');
		expect(richParts('Look after **SN** or **Serial**.')).toEqual([
			{ text: 'Look after ', bold: false },
			{ text: 'SN', bold: true },
			{ text: ' or ', bold: false },
			{ text: 'Serial', bold: true },
			{ text: '.', bold: false }
		]);
	});

	it('builds results in each language without leaving placeholders behind', () => {
		const result = {
			v: 1,
			code: 'RECALLED',
			flags: [],
			input: 'typed',
			serialDisplay: '…TB8D',
			manufacturer: { name: 'Northbridge Pharma Ltd', state: 'Ogun', town: 'Ota' },
			product: { brandName: 'Curavyn', strength: '500 mg' },
			batch: {
				lot: 'NB-2611',
				status: 'recalled',
				statusSource: 'NAFDAC',
				statusEffectiveAt: '2026-10-01',
				statusReason: 'Labelling error'
			},
			journeyAvailable: false,
			packagingAvailable: false
		} as unknown as PublicResult;
		for (const l of LOCALES) {
			const copy = resultCopy(result, messages(l));
			const text = [copy.title, copy.bubble, ...(copy.reasons ?? []), copy.nextStep].join(' ');
			expect(text, l).toContain('NB-2611');
			expect(text, l).toContain('NAFDAC');
			expect(text, l).not.toMatch(/\{\w+\}/);
		}
	});
});
