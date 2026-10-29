import { formatDate, formatMonth } from '@deteck/core/messages/en.ts';

export { formatDate, formatMonth };

/** Labels and chip styles for pharmacy, hospital and distributor accounts. */
export const BUSINESS_STATUS: Record<string, { label: string; chip: string }> = {
	pending: { label: 'Waiting for review', chip: 'chip-progress' },
	info_requested: { label: 'Information requested', chip: 'chip-warn' },
	rejected: { label: 'Rejected', chip: 'chip-bad' },
	approved: { label: 'Approved', chip: 'chip-live' },
	suspended: { label: 'Suspended', chip: 'chip-bad' }
};

/** Labels and chip styles for manufacturer statuses, shared by the workspace and console. */
export const MANUFACTURER_STATUS: Record<string, { label: string; chip: string }> = {
	pending: { label: 'Waiting for review', chip: 'chip-progress' },
	info_requested: { label: 'Information requested', chip: 'chip-warn' },
	rejected: { label: 'Rejected', chip: 'chip-bad' },
	approved: { label: 'Approved · adding data', chip: 'chip-progress' },
	in_review: { label: 'Go-live review', chip: 'chip-progress' },
	changes_requested: { label: 'Changes requested', chip: 'chip-warn' },
	live: { label: 'Live', chip: 'chip-live' },
	suspended: { label: 'Suspended', chip: 'chip-bad' }
};

export const PACKAGING_STATUS: Record<string, { label: string; chip: string }> = {
	ready: { label: 'Ready', chip: 'chip-ok' },
	processing: { label: 'Processing', chip: 'chip-progress' },
	rejected: { label: 'Needs better photos', chip: 'chip-bad' },
	missing: { label: 'Missing · add', chip: 'chip-warn' },
	draft: { label: 'Draft · not submitted', chip: 'chip-warn' }
};

export const IMPORT_KIND: Record<string, string> = {
	products: 'Drugs (product list)',
	batches_serials: 'Batches and serials',
	distribution: 'Supply chain records'
};

export const IMPORT_STATUS: Record<string, { label: string; chip: string }> = {
	uploaded: { label: 'Uploaded', chip: '' },
	validating: { label: 'Checking', chip: 'chip-progress' },
	ready: { label: 'Ready to import', chip: 'chip-progress' },
	committing: { label: 'Importing', chip: 'chip-progress' },
	committed: { label: 'Imported', chip: 'chip-ok' },
	failed: { label: 'Failed, nothing saved', chip: 'chip-bad' },
	cancelled: { label: 'Cancelled', chip: '' }
};

export const PARTY_ROLE: Record<string, string> = {
	manufacturer: 'Manufacturer',
	distributor: 'Distributor',
	wholesaler: 'Wholesaler',
	pharmacy: 'Pharmacy',
	hospital: 'Hospital',
	other: 'Other'
};

export const DOCUMENT_KIND: Record<string, string> = {
	nafdac_certificate: 'NAFDAC certificate',
	data_sharing_agreement: 'Signed data-sharing agreement',
	pcn_premises_licence: 'PCN premises licence',
	cac_certificate: 'CAC certificate',
	other: 'Other document'
};

export const PRODUCT_STATUS: Record<string, string> = {
	active: 'Active',
	flagged: 'Flagged for review',
	deactivated: 'Deactivated',
	pending_review: 'Waiting for DETECK review',
	rejected: 'Rejected'
};

/** Answers of the packaging check, as the console shows them. */
export const PACKAGING_OUTCOME: Record<string, string> = {
	NO_VISIBLE_INCONSISTENCIES: 'No visible differences',
	INCONSISTENCIES_FOUND: 'Differences found',
	CANT_TELL: "Can't tell"
};

export function formatNumber(n: number | null | undefined): string {
	return (n ?? 0).toLocaleString('en-NG');
}

/** "1 serial", "2 serials". */
export function countOf(n: number | null | undefined, one: string, many: string): string {
	return `${formatNumber(n)} ${(n ?? 0) === 1 ? one : many}`;
}

/** A note quoted at the end of a sentence: "Send the licence." (never "licence.".) */
export function quoted(text: string | null | undefined): string {
	const t = (text ?? '').trim();
	return `"${t}"${/[.!?]$/.test(t) ? '' : '.'}`;
}

export function formatDateTime(d: Date | string | null | undefined): string {
	if (!d) return '';
	const date = typeof d === 'string' ? new Date(d) : d;
	return date.toLocaleString('en-GB', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
		timeZone: 'Africa/Lagos'
	});
}

/** Which batches a packaging version applies to. Version 1 starts at 2000-01-01, meaning every batch. */
export function appliesTo(effectiveFrom: string): string {
	return effectiveFrom <= '2000-01-01'
		? 'all batches'
		: `packs made from ${formatDate(effectiveFrom)}`;
}
