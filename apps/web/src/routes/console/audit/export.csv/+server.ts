import type { RequestHandler } from './$types';
import { auditFilterFromUrl } from '@deteck/core/server/audit-filter.ts';
import { audit } from '@deteck/core/server/audit.ts';
import { requireStaff } from '#lib/server/guards.ts';
import { auditCsv } from '@deteck/core/server/insights.ts';
import { today } from '@deteck/core/server/time.ts';

/** Streams the filtered audit trail as CSV (US-06.3). The export itself is audited. */
export const GET: RequestHandler = async (event) => {
	const { actor } = requireStaff(event);
	const { filter } = auditFilterFromUrl(event.url);
	await audit(actor, {
		area: 'Console',
		action: 'audit_export',
		itemType: 'audit_log',
		summary: 'Exported the audit trail to CSV',
		after: { filter: event.url.searchParams.toString() }
	});
	const encoder = new TextEncoder();
	const iterator = auditCsv(filter);
	const stream = new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next();
			if (done) controller.close();
			else controller.enqueue(encoder.encode(value));
		}
	});
	const stamp = today();
	return new Response(stream, {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'content-disposition': `attachment; filename="deteck-audit-${stamp}.csv"`,
			'cache-control': 'private, no-store'
		}
	});
};
