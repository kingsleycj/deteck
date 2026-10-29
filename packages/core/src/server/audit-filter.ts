import type { AuditFilter } from './insights.ts';

export const AUDIT_AREAS = [
	'Public app',
	'Manufacturer board',
	'Business accounts',
	'Team and sign-in',
	'API',
	'Console',
	'System'
];

/** Start of today in Lagos. Nigeria is UTC+1 all year (no daylight saving), whatever the server's zone. */
export function lagosMidnight(now = new Date()): Date {
	const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Lagos' }).format(now);
	return new Date(`${day}T00:00:00+01:00`);
}

/** Reads the audit filters from the query string (shared by the page and the CSV export). */
export function auditFilterFromUrl(url: URL): { filter: AuditFilter; range: string; page: number } {
	const p = url.searchParams;
	const range = ['today', '7', '30', 'all'].includes(p.get('range') ?? '') ? p.get('range')! : '7';
	const now = new Date();
	const from =
		range === 'today'
			? lagosMidnight(now)
			: range === 'all'
				? undefined
				: new Date(now.getTime() - Number(range) * 86400000);
	return {
		filter: {
			q: p.get('q')?.trim() || undefined,
			area: AUDIT_AREAS.includes(p.get('area') ?? '') ? p.get('area')! : undefined,
			action: p.get('action')?.trim() || undefined,
			actor: p.get('actor') || undefined,
			from
		},
		range,
		page: Math.max(1, Number(p.get('page')) || 1)
	};
}
