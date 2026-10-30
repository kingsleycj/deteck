import type { PageServerLoad } from './$types';
import { lastActionAt } from '@deteck/core/server/audit.ts';
import { listBusinesses } from '@deteck/core/server/business.ts';
import { listManufacturers } from '@deteck/core/server/console/manufacturers.ts';
import { requireStaff } from '#lib/server/guards.ts';

/** One thing waiting for (or decided by) DETECK, from either kind of applicant. */
export interface QueueItem {
	id: string;
	href: string;
	name: string;
	/** "Manufacturer", "Pharmacy", "Hospital", "Distributor", "Wholesaler". */
	kind: string;
	group: 'manufacturer' | 'business';
	stage: 'new' | 'golive' | 'waiting' | 'rejected';
	place: string;
	/**
	 * When it reached DETECK (the application, or the go-live submission), or, while DETECK waits for
	 * the applicant, when DETECK asked for more information.
	 */
	since: string;
	detail: string;
}

const ROLE: Record<string, string> = {
	pharmacy: 'Pharmacy',
	hospital: 'Hospital',
	distributor: 'Distributor',
	wholesaler: 'Wholesaler',
	other: 'Business'
};

export const load: PageServerLoad = async (event) => {
	requireStaff(event);
	const [pending, infoRequested, inReview, rejected, bPending, bInfo, bRejected] =
		await Promise.all([
			listManufacturers({ status: 'pending' }),
			listManufacturers({ status: 'info_requested' }),
			listManufacturers({ status: 'in_review' }),
			listManufacturers({ status: 'rejected' }),
			listBusinesses('pending'),
			listBusinesses('info_requested'),
			listBusinesses('rejected')
		]);
	const [asked, bAsked] = await Promise.all([
		lastActionAt(
			'application_request_info',
			infoRequested.map((m) => m.id)
		),
		lastActionAt(
			'business_request_info',
			bInfo.map((b) => b.id)
		)
	]);
	const place = (town: string | null, state: string) => [town, state].filter(Boolean).join(', ');
	const request = (reason: string | null) =>
		reason ? `You asked: "${reason}"` : 'More information';
	const items: QueueItem[] = [
		...[
			...pending.map((m) => ({ m, stage: 'new' as const })),
			...infoRequested.map((m) => ({ m, stage: 'waiting' as const })),
			...rejected.map((m) => ({ m, stage: 'rejected' as const }))
		].map(({ m, stage }) => ({
			id: m.id,
			href: `/console/applications/${m.id}`,
			name: m.companyName,
			kind: 'Manufacturer',
			group: 'manufacturer' as const,
			stage,
			place: place(m.town, m.state),
			since: (stage === 'waiting' ? (asked.get(m.id) ?? m.createdAt) : m.createdAt).toISOString(),
			detail: stage === 'waiting' ? request(m.statusReason) : 'Company application'
		})),
		...inReview.map((m) => ({
			id: m.id,
			href: `/console/manufacturers/${m.id}/review`,
			name: m.companyName,
			kind: 'Manufacturer',
			group: 'manufacturer' as const,
			stage: 'golive' as const,
			place: place(m.town, m.state),
			since: (m.submittedForReviewAt ?? m.createdAt).toISOString(),
			detail: `${m.products.toLocaleString('en-NG')} ${m.products === 1 ? 'drug' : 'drugs'} · ${m.serials.toLocaleString('en-NG')} ${m.serials === 1 ? 'serial' : 'serials'}`
		})),
		...[
			...bPending.map((b) => ({ b, stage: 'new' as const })),
			...bInfo.map((b) => ({ b, stage: 'waiting' as const })),
			...bRejected.map((b) => ({ b, stage: 'rejected' as const }))
		].map(({ b, stage }) => ({
			id: b.id,
			href: `/console/business-accounts/${b.id}`,
			name: b.name,
			kind: ROLE[b.role] ?? 'Business',
			group: 'business' as const,
			stage,
			place: place(b.town, b.state),
			since: (stage === 'waiting' ? (bAsked.get(b.id) ?? b.createdAt) : b.createdAt).toISOString(),
			detail:
				stage === 'waiting'
					? request(b.statusReason)
					: b.pcnLicence
						? `PCN ${b.pcnLicence}`
						: 'Business application'
		}))
	];
	// Oldest first: whoever has waited longest is reviewed first.
	items.sort((a, b) => a.since.localeCompare(b.since));
	return { items };
};
