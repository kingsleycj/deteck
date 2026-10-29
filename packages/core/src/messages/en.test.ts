import { describe, expect, it } from 'vitest';
import {
	CATEGORY_TEXT,
	journeySummary,
	journeyText,
	packagingCopy,
	packagingText,
	resultCopy
} from './en.ts';
import type { ResultFlag, SerialResultCode, VerificationResult } from '../verify/types.ts';

const base: VerificationResult = {
	v: 1,
	code: 'VALID',
	flags: [],
	input: 'typed',
	serialDisplay: '7K4M…TB8D',
	manufacturer: { id: 'm', name: 'Northbridge Pharma Ltd', state: 'Ogun', town: 'Ota' },
	product: {
		id: 'p',
		brandName: 'Curavyn',
		genericName: 'Paracetamol',
		strength: '500 mg',
		dosageForm: 'Tablets',
		packSize: '20',
		nafdacRegNo: 'A4-0000',
		serialHint: null
	},
	batch: {
		id: 'b',
		lot: 'NB-2611',
		manufactureDate: '2026-03-01',
		expiryDate: '2028-04-30',
		status: 'recalled',
		statusReason: 'Failed assay',
		statusSource: 'NAFDAC',
		statusEffectiveAt: '2026-05-01'
	},
	coverage: { manufacturers: 2, products: 9 },
	journeyAvailable: false,
	packagingAvailable: false,
	checkedAt: '2026-10-25T00:00:00Z'
};

const codes: SerialResultCode[] = [
	'VALID',
	'UNRECOGNISED',
	'NOT_COVERED',
	'CANT_CONFIRM',
	'RECALLED',
	'NEEDS_BATCH'
];
const flagSets: ResultFlag[][] = [[], ['EXPIRED'], ['LOT_MISMATCH'], ['EXPIRY_MISMATCH']];

/**
 * PRD tone rules: never "safe", "genuine", "real", "100%" or a guarantee, and no bare
 * "don't use it" (analysis C-09: stopping some medicines suddenly can cause harm).
 */
function breaksToneRules(text: string): boolean {
	return /\bsafe\b|\bsafely\b|genuine|\breal\b|100\s?%|guarantee|don't use it/i.test(text);
}

describe('result wording', () => {
	it('never claims more than the records support, in any state', () => {
		for (const code of codes) {
			for (const flags of flagSets) {
				const copy = resultCopy({ ...base, code, flags });
				const all = [
					copy.title,
					copy.bubble,
					...(copy.reasons ?? []),
					copy.nextStep,
					...copy.badges
				].join(' ');
				expect(breaksToneRules(all), `${code} ${flags.join(',')}: ${all}`).toBe(false);
			}
		}
	});

	it('keeps packaging wording within the rules', () => {
		for (const outcome of ['NO_VISIBLE_INCONSISTENCIES', 'INCONSISTENCIES_FOUND', 'CANT_TELL']) {
			const c = packagingCopy(outcome);
			const all = [c.title, c.bubble, c.nextStep, c.packagingLine, ...c.badges].join(' ');
			expect(breaksToneRules(all), all).toBe(false);
			expect(all).not.toMatch(/everything matches/i);
		}
		expect(
			breaksToneRules([...Object.values(CATEGORY_TEXT), ...Object.values(packagingText)].join(' '))
		).toBe(false);
	});

	it('says "last recorded with", never "current holder" or "now with"', () => {
		const summary = journeySummary(
			{
				state: 'TO_RETAIL',
				steps: [
					{
						kind: 'party',
						name: 'Lakeside',
						role: 'distributor',
						place: null,
						date: null,
						verified: true
					},
					{
						kind: 'party',
						name: 'Riverside Pharmacy',
						role: 'pharmacy',
						place: null,
						date: null,
						verified: false
					}
				],
				recordedSteps: 2,
				gaps: 0
			},
			'Northbridge'
		);
		expect(summary).toBe(
			'It went from Northbridge to Lakeside, and was last recorded with Riverside Pharmacy.'
		);
		expect(Object.values(journeyText).join(' ')).not.toMatch(/current holder|now with/i);
	});

	it('gives Unrecognised a calm next step instead of "don\'t use it"', () => {
		const copy = resultCopy({ ...base, code: 'UNRECOGNISED', reason: 'not_found' });
		expect(copy.nextStep).toBe('Ask a pharmacist before you use it.');
		expect(copy.reasons?.join(' ')).toContain('9 products from 2 manufacturers');
	});
});
