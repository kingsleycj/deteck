import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { ReportError, reportDetail, updateReport } from '@deteck/core/server/reports.ts';
import { requireStaff } from '#lib/server/guards.ts';

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const detail = await reportDetail(event.params.id);
	if (!detail) error(404, 'Report not found.');
	const { serialKeyHmac, deviceDayHash: _d, ...report } = detail.report;
	return {
		report: {
			...report,
			serialRef: serialKeyHmac ? serialKeyHmac.toString('hex').slice(0, 10) : null
		},
		manufacturerName: detail.manufacturerName,
		productName: detail.productName,
		assignee: detail.assignee,
		otherReportsOfSerial: detail.otherReportsOfSerial
	};
};

export const actions: Actions = {
	default: async (event) => {
		const { actor } = requireStaff(event);
		const d = await event.request.formData();
		try {
			await updateReport(actor, event.params.id, {
				status: String(d.get('status') ?? ''),
				resolution: String(d.get('resolution') ?? ''),
				assignToMe: d.get('assignToMe') === 'on'
			});
		} catch (err) {
			if (err instanceof ReportError) return fail(400, { message: err.message });
			throw err;
		}
		return { done: 'Saved and recorded in the audit trail.' };
	}
};
