/** Parsers for spreadsheet values, which arrive in many shapes. */
import type { PartyRoleName } from '../verify/journey-types.ts';

const MONTHS: Record<string, number> = {
	jan: 1,
	feb: 2,
	mar: 3,
	apr: 4,
	may: 5,
	jun: 6,
	jul: 7,
	aug: 8,
	sep: 9,
	sept: 9,
	oct: 10,
	nov: 11,
	dec: 12
};

/**
 * A two-digit year is this century, and only when that's within the next 20 years: "01/01/95"
 * isn't read as 2095 (it may mean 1995), so the person is asked for four digits instead.
 */
function fullYear(y: number): number | null {
	if (y >= 100) return y;
	const full = 2000 + y;
	return full <= new Date().getUTCFullYear() + 20 ? full : null;
}

function iso(year: number, m: number, d: number): string | null {
	const y = fullYear(year);
	if (y === null) return null;
	if (m < 1 || m > 12 || y < 1990 || y > 2100) return null;
	const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
	if (d < 1 || d > last) return null;
	return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function lastDay(year: number, m: number): string | null {
	const y = fullYear(year);
	if (y === null || m < 1 || m > 12) return null;
	return iso(y, m, new Date(Date.UTC(y, m, 0)).getUTCDate());
}

/**
 * Parses a date. Accepts YYYY-MM-DD, DD/MM/YYYY (Nigerian order), DD-Mon-YYYY,
 * MM/YYYY and Mon YYYY (taken as the last day of the month, as expiry dates
 * usually are) and Excel serial numbers.
 */
export function parseDate(raw: string): string | null {
	const s = raw.trim();
	if (!s) return null;
	let m: RegExpMatchArray | null;
	if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/))) return iso(+m[1], +m[2], +m[3]);
	if ((m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/))) return iso(+m[3], +m[2], +m[1]);
	if ((m = s.match(/^(\d{1,2})[\s/-]([A-Za-z]{3,9})[\s/-](\d{2,4})$/))) {
		const month = MONTHS[m[2].slice(0, 4).toLowerCase()] ?? MONTHS[m[2].slice(0, 3).toLowerCase()];
		return month ? iso(+m[3], month, +m[1]) : null;
	}
	if ((m = s.match(/^(\d{1,2})[/.-](\d{4})$/))) return lastDay(+m[2], +m[1]);
	if ((m = s.match(/^(\d{4})[/.-](\d{1,2})$/))) return lastDay(+m[1], +m[2]);
	if ((m = s.match(/^([A-Za-z]{3,9})[\s/-](\d{2,4})$/))) {
		const month = MONTHS[m[1].slice(0, 4).toLowerCase()] ?? MONTHS[m[1].slice(0, 3).toLowerCase()];
		return month ? lastDay(+m[2], month) : null;
	}
	// Six digits ("280430") are refused: in a spreadsheet they could be YYMMDD (as on packs) or
	// DDMMYY, and a wrong expiry date gives a wrong answer.
	if (/^\d{5}(\.\d+)?$/.test(s)) {
		// Excel serial date (days since 1899-12-30).
		const n = Math.floor(Number(s));
		if (n > 30000 && n < 80000) {
			const d = new Date(Date.UTC(1899, 11, 30) + n * 86400000);
			return d.toISOString().slice(0, 10);
		}
	}
	return null;
}

const ROLE_WORDS: [RegExp, PartyRoleName][] = [
	[/hospital|clinic|health ?cent(re|er)|medical cent(re|er)|phc|facility/i, 'hospital'],
	[/pharm|chemist|drug ?store|retail|patent medicine|ppmv/i, 'pharmacy'],
	[/wholesal|sub-?dealer|depot/i, 'wholesaler'],
	[/distribut|dealer|stockist|importer|key account/i, 'distributor'],
	[/manufactur/i, 'manufacturer']
];

export function parseRole(raw: string): PartyRoleName | null {
	const s = raw.trim();
	if (!s) return null;
	for (const [pattern, role] of ROLE_WORDS) if (pattern.test(s)) return role;
	return /^other$/i.test(s) ? 'other' : null;
}

/** Normalised business name for matching: lower case, no punctuation or company suffixes. */
export function normaliseBusinessName(name: string): string {
	return name
		.toLowerCase()
		.replace(/&/g, ' and ')
		.replace(/[^a-z0-9 ]+/g, ' ')
		.replace(/\b(limited|ltd|plc|nig|nigeria|enterprises?|ventures?|co|company|inc)\b/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function parseQuantity(raw: string): number | null | 'invalid' {
	const s = raw.replace(/[,\s]/g, '');
	if (!s) return null;
	return /^\d{1,9}$/.test(s) ? Number(s) : 'invalid';
}

/** Roles that can be the same business under different labels (a wholesaler is a distributor). */
export function sameKind(role: string): ('pharmacy' | 'hospital' | 'distributor' | 'wholesaler')[] {
	return role === 'pharmacy' || role === 'hospital'
		? ['pharmacy', 'hospital']
		: ['distributor', 'wholesaler'];
}
