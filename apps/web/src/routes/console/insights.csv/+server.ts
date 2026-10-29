import type { RequestHandler } from './$types';
import { requireStaff } from '#lib/server/guards.ts';
import { insights, rangeFromDays, toCsv } from '@deteck/core/server/insights.ts';

/** US-06.4: export the numbers behind the overview charts. No personal identifiers. */
export const GET: RequestHandler = async (event) => {
	requireStaff(event);
	const days = Math.min(365, Math.max(1, Number(event.url.searchParams.get('days')) || 30));
	const i = await insights(rangeFromDays(days));
	const rows: unknown[][] = [
		['Section', 'Key', 'Serial checks', 'Scans', 'Journeys opened', 'Packaging checks', 'Count'],
		...i.daily.map((d) => [
			'Checks per day',
			d.day,
			d.serial,
			d.scan,
			d.journey,
			d.packaging,
			d.serial + d.scan
		]),
		...i.results.map((r) => ['Results', r.result, '', '', '', '', r.n]),
		...i.packaging.map((r) => ['Packaging results', r.result, '', '', '', '', r.n]),
		...i.topProducts.map((p) => [
			'Most-checked drugs',
			`${p.name} (${p.manufacturer})`,
			'',
			'',
			'',
			'',
			p.n
		]),
		...i.byState.map((s) => ['Checks by state', s.state, '', '', '', '', s.suppressed ? '<5' : s.n])
	];
	return new Response('﻿' + toCsv(rows), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="deteck-insights-last-${days}-days.csv"`,
			'cache-control': 'private, no-store'
		}
	});
};
