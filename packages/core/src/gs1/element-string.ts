/**
 * Parses GS1 element strings as read from a GS1 DataMatrix or typed from the
 * human-readable text under it, and GS1 Digital Link web addresses (QR codes). Accepts:
 *  - bracketed form: (01)06150000000016(17)280430(10)NB-2611(21)7K4M9QX2
 *  - raw form with group separators (ASCII 29) between variable-length fields
 *  - escaped separators some readers emit: "<GS>", "{GS}", "\x1d", "␝"
 *  - an optional symbology identifier prefix such as "]d2", "]Q3" or "]C1"
 *  - Digital Link: https://example.com/01/09506000134352/10/NB-2611/21/7K4M9QX2?17=280430
 */

import { toGtin14 } from './gtin.ts';

const GS = '\u001d';

/**
 * How many digits an Application Identifier has, from its first two digits (GS1 General
 * Specifications, 3.2). AIs not listed here aren't defined; they make the string unreadable.
 */
function aiLength(firstTwo: string): number | null {
	const n = Number(firstTwo);
	if (!/^\d{2}$/.test(firstTwo)) return null;
	if (n <= 22 || n === 30 || n === 37 || n >= 90) return 2;
	if ([23, 24, 25, 40, 41, 42, 71].includes(n)) return 3;
	if ((n >= 31 && n <= 36) || n === 39 || n === 43 || n === 70 || n === 72 || (n >= 80 && n <= 82))
		return 4;
	return null;
}

/**
 * Data lengths fixed by the first two digits of the AI (GS1 General Specifications, figure
 * 7.8.5-2). Every other AI is variable length and ends at a group separator.
 */
const FIXED_BY_PREFIX: Record<string, number> = {
	'00': 18,
	'01': 14,
	'02': 14,
	'03': 14,
	'04': 16,
	'11': 6,
	'12': 6,
	'13': 6,
	'14': 6,
	'15': 6,
	'16': 6,
	'17': 6,
	'18': 6,
	'19': 6,
	'20': 2,
	'31': 6,
	'32': 6,
	'33': 6,
	'34': 6,
	'35': 6,
	'36': 6,
	'41': 13
};

/** Maximum data lengths of the variable-length AIs DETECK reads; others may be up to 90. */
const MAX_LENGTH: Record<string, number> = { '10': 20, '21': 20, '22': 20 };

/** Digital Link short names some older links use instead of AI numbers. */
const SHORT_NAMES: Record<string, string> = {
	gtin: '01',
	lot: '10',
	ser: '21',
	exp: '17',
	cpv: '22'
};

export interface Gs1Data {
	gtin?: string;
	serial?: string;
	lot?: string;
	/** ISO date (YYYY-MM-DD) from AI 17. */
	expiry?: string;
	/** ISO date from AI 11. */
	productionDate?: string;
	/** Every AI found, as raw strings. */
	ais: Record<string, string>;
}

export type Gs1ParseResult = { ok: true; data: Gs1Data } | { ok: false; reason: string };

function normaliseSeparators(input: string): string {
	return input
		.replace(/^\s*\][A-Za-z]\d/, '')
		.replace(/<GS>|\{GS\}|\\x1[dD]|␝|\\u001[dD]/g, GS)
		.replace(/\r|\n/g, '');
}

function matchAi(rest: string): string | null {
	const len = aiLength(rest.slice(0, 2));
	return len && rest.length >= len && /^\d+$/.test(rest.slice(0, len)) ? rest.slice(0, len) : null;
}

/** Converts a GS1 YYMMDD date. A day of 00 means the last day of the month. */
export function gs1DateToIso(value: string): string | null {
	if (!/^\d{6}$/.test(value)) return null;
	const year = 2000 + Number(value.slice(0, 2));
	const month = Number(value.slice(2, 4));
	let day = Number(value.slice(4, 6));
	if (month < 1 || month > 12) return null;
	const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
	if (day === 0) day = lastDay;
	if (day > lastDay) return null;
	return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * "(01)…(17)…(10)…(21)…". GS1 values may contain brackets themselves, so "(nn)" only starts a new
 * field when nn is a real AI of the right length.
 */
function parseBracketed(input: string): Record<string, string> | null {
	const compact = input.replace(/\s+/g, '');
	const starts = [...compact.matchAll(/\((\d{2,4})\)/g)].filter(
		(m) => aiLength(m[1].slice(0, 2)) === m[1].length
	);
	if (starts.length === 0 || starts[0].index !== 0) return null;
	const ais: Record<string, string> = {};
	for (const [i, m] of starts.entries()) {
		const from = m.index + m[0].length;
		const to = i + 1 < starts.length ? starts[i + 1].index : compact.length;
		ais[m[1]] = compact.slice(from, to).replaceAll(GS, '');
	}
	return ais;
}

/**
 * A GS1 Digital Link, the web address form of the code: https://id.example.com/01/09506000134352/
 * 10/NB-2611/21/7K4M9QX2TB8D?17=280430. The path holds AI/value pairs from the GTIN on; the query
 * may hold more.
 */
function parseDigitalLink(input: string): Record<string, string> | null {
	let url: URL;
	try {
		url = new URL(input.trim());
	} catch {
		return null;
	}
	if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
	const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
	const ai = (key: string) => SHORT_NAMES[key.toLowerCase()] ?? key;
	const first = parts.findIndex((p) => ai(p) === '01');
	if (first === -1) return null;
	const ais: Record<string, string> = {};
	for (let i = first; i + 1 < parts.length; i += 2) {
		const key = ai(parts[i]);
		if (!/^\d{2,4}$/.test(key) || aiLength(key.slice(0, 2)) !== key.length) return null;
		ais[key] = parts[i + 1];
	}
	for (const [key, value] of url.searchParams) {
		const k = ai(key);
		if (/^\d{2,4}$/.test(k) && aiLength(k.slice(0, 2)) === k.length && !(k in ais)) ais[k] = value;
	}
	return ais;
}

function parseRaw(input: string): Record<string, string> | null {
	const ais: Record<string, string> = {};
	let rest = input.replace(/\s+/g, '');
	while (rest.length > 0) {
		if (rest.startsWith(GS)) {
			rest = rest.slice(1);
			continue;
		}
		const ai = matchAi(rest);
		if (!ai) return null;
		rest = rest.slice(ai.length);
		const fixed = FIXED_BY_PREFIX[ai.slice(0, 2)];
		if (fixed) {
			if (rest.length < fixed) return null;
			ais[ai] = rest.slice(0, fixed);
			rest = rest.slice(fixed);
		} else {
			const end = rest.indexOf(GS);
			const value = end === -1 ? rest : rest.slice(0, end);
			if (value.length === 0 || value.length > (MAX_LENGTH[ai] ?? 90)) return null;
			ais[ai] = value;
			rest = end === -1 ? '' : rest.slice(end);
		}
	}
	return Object.keys(ais).length > 0 ? ais : null;
}

/** True when the input looks like a GS1 element string rather than a bare serial. */
export function looksLikeGs1(input: string): boolean {
	const s = normaliseSeparators(input).replace(/\s+/g, '');
	return (
		/^\(\d{2,4}\)/.test(s) ||
		s.includes(GS) ||
		/^01\d{14}(10|11|17|21)/.test(s) ||
		/^https?:\/\/[^/]+\/(.+\/)?(01|gtin)\/\d{8,14}(\/|\?|$)/i.test(s)
	);
}

export function parseGs1(input: string): Gs1ParseResult {
	const cleaned = normaliseSeparators(input).trim();
	if (cleaned.length === 0) return { ok: false, reason: 'empty' };

	const compact = cleaned.replace(/\s+/g, '');
	const ais = /^https?:\/\//i.test(compact)
		? parseDigitalLink(compact)
		: compact.startsWith('(')
			? parseBracketed(cleaned)
			: parseRaw(cleaned);
	if (!ais) return { ok: false, reason: 'unparseable' };

	const data: Gs1Data = { ais };
	if (ais['01'] !== undefined) {
		const gtin = toGtin14(ais['01']);
		if (!gtin) return { ok: false, reason: 'bad_gtin' };
		data.gtin = gtin;
	}
	if (ais['21'] !== undefined) data.serial = ais['21'];
	if (ais['10'] !== undefined) data.lot = ais['10'];
	if (ais['17'] !== undefined) {
		const expiry = gs1DateToIso(ais['17']);
		if (!expiry) return { ok: false, reason: 'bad_expiry' };
		data.expiry = expiry;
	}
	if (ais['11'] !== undefined) {
		const production = gs1DateToIso(ais['11']);
		if (production) data.productionDate = production;
	}
	return { ok: true, data };
}
