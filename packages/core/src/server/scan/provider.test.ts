import { describe, expect, it } from 'vitest';
import { CONFIDENCE_FLOOR, mapOutput } from './provider.ts';

describe('mapping model output to the closed outcome set', () => {
	const ok = {
		photos_usable: true,
		overall: 'no_visible_differences' as const,
		differences: [],
		confidence: 0.9
	};

	it('passes through a confident "no visible differences"', () => {
		expect(mapOutput(ok, 'm').outcome).toBe('NO_VISIBLE_INCONSISTENCIES');
	});

	it('reports listed differences', () => {
		const r = mapOutput(
			{
				...ok,
				overall: 'differences_found',
				differences: [{ category: 'logo', side: 'front', note: 'Lighter blue' }]
			},
			'm'
		);
		expect(r.outcome).toBe('INCONSISTENCIES_FOUND');
		expect(r.categories).toHaveLength(1);
	});

	it.each([
		['unusable photos', { ...ok, photos_usable: false }, 'unclear_photos'],
		['the model cannot tell', { ...ok, overall: 'cannot_tell' as const }, 'unclear_photos'],
		['low confidence', { ...ok, confidence: CONFIDENCE_FLOOR - 0.01 }, 'low_confidence'],
		[
			'differences found but none listed',
			{ ...ok, overall: 'differences_found' as const },
			'inconsistent_output'
		],
		[
			'no differences but some listed',
			{ ...ok, differences: [{ category: 'font' as const, side: 'back' as const, note: 'x' }] },
			'inconsistent_output'
		]
	])('says "can\'t tell" when %s', (_label, output, reason) => {
		const r = mapOutput(output, 'm');
		expect(r.outcome).toBe('CANT_TELL');
		expect(r.reason).toBe(reason);
	});

	it('says "can\'t tell" when there is no parsed output', () => {
		expect(mapOutput(null, 'm').outcome).toBe('CANT_TELL');
	});

	it('applies a different confidence floor when the evaluation script asks', () => {
		const answer = { ...ok, confidence: 0.65 };
		expect(mapOutput(answer, 'm', 0.6).outcome).toBe('NO_VISIBLE_INCONSISTENCIES');
		expect(mapOutput(answer, 'm', 0.7).outcome).toBe('CANT_TELL');
	});
});
