import { describe, expect, it } from 'vitest';
import { auditFilterFromUrl, lagosMidnight } from './audit-filter.ts';

describe('lagosMidnight', () => {
	it('gives the start of the Lagos day (UTC+1), whatever the server zone', () => {
		expect(lagosMidnight(new Date('2026-10-26T23:30:00Z')).toISOString()).toBe(
			'2026-10-26T23:00:00.000Z'
		);
		expect(lagosMidnight(new Date('2026-10-26T22:59:00Z')).toISOString()).toBe(
			'2026-10-25T23:00:00.000Z'
		);
		expect(lagosMidnight(new Date('2026-10-26T23:00:00Z')).toISOString()).toBe(
			'2026-10-26T23:00:00.000Z'
		);
		// Lagos has no daylight saving, so the offset is the same in summer.
		expect(lagosMidnight(new Date('2026-06-15T12:00:00Z')).toISOString()).toBe(
			'2026-06-14T23:00:00.000Z'
		);
	});
});

describe('auditFilterFromUrl', () => {
	const read = (query: string) =>
		auditFilterFromUrl(new URL(`https://deteck.example/audit?${query}`));

	it('reads known filters and ignores unknown ones', () => {
		const r = read('range=all&area=Console&q=%20recall%20&page=3&action=batch_');
		expect(r).toMatchObject({ range: 'all', page: 3 });
		expect(r.filter).toEqual({
			q: 'recall',
			area: 'Console',
			action: 'batch_',
			actor: undefined,
			from: undefined
		});
		const junk = read('range=year&area=Nowhere&page=-2');
		expect(junk).toMatchObject({ range: '7', page: 1 });
		expect(junk.filter.area).toBeUndefined();
		expect(junk.filter.from).toBeInstanceOf(Date);
	});
});
