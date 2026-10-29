/** Regression tests (no database) for the problems found in the October 2026 audit. */
import { describe, expect, it } from 'vitest';
import { lagosToday } from '../dates.ts';
import { sameKind } from '../imports/values.ts';
import { formatDate } from '../messages/copy.ts';
import { ipKey } from './rate-limit.ts';
import { parseCheckInput } from './verify/lookup.ts';
import { isPrivateAddress } from './webhooks.ts';

describe('rate limits by network', () => {
	it('counts IPv6 per /64 network and IPv4 per address', () => {
		expect(ipKey('2001:db8:aa:bb:1:2:3:4')).toBe('2001:db8:aa:bb::/64');
		expect(ipKey('2001:db8:aa:bb::9')).toBe('2001:db8:aa:bb::/64');
		expect(ipKey('2001:0db8:00aa:00bb:ffff::1%eth0')).toBe('2001:db8:aa:bb::/64');
		expect(ipKey('::ffff:102.89.1.7')).toBe('102.89.1.7');
		expect(ipKey('102.89.1.7')).toBe('102.89.1.7');
	});
});

describe('webhook addresses', () => {
	it('refuses private networks, including IPv4 hidden inside IPv6', () => {
		for (const a of [
			'10.0.0.1',
			'127.0.0.1',
			'169.254.169.254',
			'192.168.1.10',
			'::1',
			'::ffff:127.0.0.1',
			'::ffff:a00:1',
			'::7f00:1',
			'64:ff9b::7f00:1',
			'64:ff9b:1::a00:1',
			'fd00::1',
			'fe80::1'
		])
			expect(isPrivateAddress(a), a).toBe(true);
		for (const a of ['102.89.1.7', '8.8.8.8', '2606:4700::1111'])
			expect(isPrivateAddress(a), a).toBe(false);
	});
});

describe('dates in Nigeria', () => {
	it('uses the date in Lagos, which is an hour ahead of UTC', () => {
		expect(lagosToday(new Date('2026-10-26T23:30:00Z'))).toBe('2026-10-27');
		expect(lagosToday(new Date('2026-10-26T22:59:00Z'))).toBe('2026-10-26');
		expect(formatDate('2026-10-26T23:30:00.000Z')).toBe('27 Oct 2026');
		expect(formatDate('2026-10-26')).toBe('26 Oct 2026');
	});
});

describe('typed serials with a label in front', () => {
	it('keeps the whole text, and tries it without the label too', () => {
		expect(parseCheckInput('SN 7K4M9QX2TB8D')).toMatchObject({
			ok: true,
			key: 'SN7K4M9QX2TB8D',
			altKey: '7K4M9QX2TB8D'
		});
		// Too long with the label, so the label is dropped straight away.
		expect(parseCheckInput('Serial Number: 7K4M9QX2TB8D')).toMatchObject({
			ok: true,
			key: '7K4M9QX2TB8D'
		});
		expect(parseCheckInput('7K4M9QX2TB8D')).not.toHaveProperty('altKey');
	});
});

describe('matching businesses', () => {
	it('never takes a pharmacy for a distributor of the same name', () => {
		expect(sameKind('pharmacy')).toEqual(['pharmacy', 'hospital']);
		expect(sameKind('wholesaler')).toEqual(['distributor', 'wholesaler']);
	});
});
