/**
 * What each import kind expects (MF4 "Match their columns to DETECK fields").
 * Shared by the server (validation) and the column-matching screen.
 */
export type ImportKind = 'products' | 'batches_serials' | 'distribution';

export interface FieldDef {
	key: string;
	label: string;
	required: boolean;
	help?: string;
	/** Lower-case header names that auto-match this field. */
	synonyms: string[];
}

/** The problem-rows download holds at most this many rows; the count covers them all. */
export const MAX_PROBLEM_ROWS = 50_000;

export const IMPORT_FIELDS: Record<ImportKind, FieldDef[]> = {
	products: [
		{
			key: 'gtin',
			label: 'GTIN (product barcode number)',
			required: true,
			synonyms: [
				'gtin',
				'gtin14',
				'gtin-14',
				'gtin13',
				'ean',
				'barcode',
				'product code',
				'item code'
			]
		},
		{
			key: 'brandName',
			label: 'Brand name',
			required: true,
			synonyms: ['brand', 'brand name', 'product name', 'trade name', 'name']
		},
		{
			key: 'genericName',
			label: 'Generic name',
			required: true,
			synonyms: ['generic', 'generic name', 'inn', 'active ingredient', 'active ingredients']
		},
		{
			key: 'strength',
			label: 'Strength',
			required: true,
			synonyms: ['strength', 'dose', 'dosage strength']
		},
		{
			key: 'dosageForm',
			label: 'Dosage form',
			required: true,
			synonyms: ['dosage form', 'form', 'formulation']
		},
		{
			key: 'packSize',
			label: 'Pack size',
			required: true,
			synonyms: ['pack size', 'pack', 'pack qty', 'presentation']
		},
		{
			key: 'nafdacRegNo',
			label: 'NAFDAC registration number',
			required: true,
			synonyms: [
				'nafdac',
				'nafdac no',
				'nafdac no.',
				'nafdac reg',
				'nafdac reg no',
				'nafdac number',
				'registration number',
				'reg no'
			]
		},
		{
			key: 'serialHint',
			label: 'Where the serial is printed (optional)',
			required: false,
			synonyms: ['serial location', 'serial hint']
		}
	],
	batches_serials: [
		{
			key: 'gtin',
			label: 'GTIN (or use the NAFDAC number)',
			required: false,
			synonyms: ['gtin', 'gtin14', 'ean', 'barcode', 'product code', 'item code']
		},
		{
			key: 'nafdacRegNo',
			label: 'NAFDAC registration number (if no GTIN)',
			required: false,
			synonyms: ['nafdac', 'nafdac no', 'nafdac reg no', 'nafdac number', 'registration number']
		},
		{
			key: 'lot',
			label: 'Batch number',
			required: true,
			synonyms: [
				'batch',
				'batch no',
				'batch no.',
				'batch number',
				'lot',
				'lot no',
				'lot no.',
				'lot number',
				'bn'
			]
		},
		{
			key: 'manufactureDate',
			label: 'Manufacture date',
			required: false,
			help: 'Needed for the packaging check',
			synonyms: [
				'mfg',
				'mfg date',
				'mfd',
				'manufacture date',
				'manufacturing date',
				'production date',
				'pack date',
				'date of manufacture'
			]
		},
		{
			key: 'expiryDate',
			label: 'Expiry date',
			required: true,
			synonyms: [
				'exp',
				'expiry',
				'expiry date',
				'exp date',
				'expiration',
				'expiration date',
				'best before'
			]
		},
		{
			key: 'serial',
			label: 'Serial number',
			required: false,
			help: 'Leave empty to add a batch without serials',
			synonyms: ['serial', 'serial no', 'serial no.', 'serial number', 'sn', 'unique identifier']
		},
		{
			key: 'quantity',
			label: 'Batch quantity (optional)',
			required: false,
			synonyms: ['qty', 'quantity', 'batch size', 'batch quantity']
		}
	],
	distribution: [
		{
			key: 'gtin',
			label: 'GTIN (or use the NAFDAC number)',
			required: false,
			synonyms: ['gtin', 'gtin14', 'ean', 'barcode', 'product code', 'item code']
		},
		{
			key: 'nafdacRegNo',
			label: 'NAFDAC registration number (if no GTIN)',
			required: false,
			synonyms: ['nafdac', 'nafdac no', 'nafdac reg no', 'nafdac number']
		},
		{
			key: 'lot',
			label: 'Batch number',
			required: true,
			synonyms: ['batch', 'batch no', 'batch number', 'lot', 'lot no', 'lot number']
		},
		{
			key: 'serial',
			label: 'Serial number (optional: leave empty for batch-level records)',
			required: false,
			synonyms: ['serial', 'serial no', 'serial number', 'sn']
		},
		{
			key: 'toName',
			label: 'Receiving business',
			required: true,
			synonyms: [
				'customer',
				'customer name',
				'consignee',
				'ship to',
				'ship to name',
				'receiving business',
				'receiver',
				'to',
				'distributor',
				'buyer'
			]
		},
		{
			key: 'toRole',
			label: 'Their role (distributor, wholesaler, pharmacy, hospital)',
			required: true,
			synonyms: ['role', 'customer type', 'business type', 'channel', 'customer category', 'type']
		},
		{
			key: 'toState',
			label: 'Their state',
			required: true,
			synonyms: ['state', 'customer state', 'ship to state', 'region']
		},
		{
			key: 'toCity',
			label: 'Their city or town',
			required: false,
			synonyms: ['city', 'town', 'lga', 'location', 'ship to city', 'area']
		},
		{
			key: 'eventDate',
			label: 'Date shipped',
			required: true,
			synonyms: [
				'date',
				'ship date',
				'shipped',
				'date shipped',
				'dispatch date',
				'invoice date',
				'delivery date'
			]
		},
		{
			key: 'fromName',
			label: 'Sending business (optional, if not you)',
			required: false,
			synonyms: ['from', 'shipped from', 'sender', 'seller', 'supplier']
		},
		{
			key: 'toCac',
			label: 'Their CAC number (optional)',
			required: false,
			synonyms: ['cac', 'rc', 'rc number', 'cac number', 'cac rc']
		},
		{
			key: 'toPcn',
			label: 'Their PCN premises licence (optional)',
			required: false,
			synonyms: ['pcn', 'pcn licence', 'pcn license', 'premises licence', 'premises license']
		},
		{
			key: 'toGln',
			label: 'Their GLN (optional)',
			required: false,
			synonyms: ['gln', 'global location number']
		}
	]
};

const clean = (s: string) =>
	s
		.trim()
		.toLowerCase()
		.replace(/[_\s]+/g, ' ')
		.replace(/[^a-z0-9 .-]/g, '');

/** Suggests a header for each field, by exact synonym match first and then by containment. */
export function autoMatch(kind: ImportKind, headers: string[]): Record<string, string> {
	const mapping: Record<string, string> = {};
	const used = new Set<string>();
	const cleaned = headers.map(clean);
	for (const field of IMPORT_FIELDS[kind]) {
		let index = cleaned.findIndex((h, i) => !used.has(headers[i]) && field.synonyms.includes(h));
		if (index === -1) {
			index = cleaned.findIndex(
				(h, i) => !used.has(headers[i]) && field.synonyms.some((s) => s.length > 3 && h.includes(s))
			);
		}
		if (index > -1) {
			mapping[field.key] = headers[index];
			used.add(headers[index]);
		}
	}
	return mapping;
}

/** Fields that must be mapped before the import can be checked. */
export function missingRequired(kind: ImportKind, mapping: Record<string, string>): FieldDef[] {
	const missing = IMPORT_FIELDS[kind].filter((f) => f.required && !mapping[f.key]);
	if (kind !== 'products' && !mapping.gtin && !mapping.nafdacRegNo) {
		missing.push({
			key: 'gtin',
			label: 'GTIN or NAFDAC registration number',
			required: true,
			synonyms: []
		});
	}
	return missing;
}

export function templateHeaders(kind: ImportKind): string[] {
	const sets: Record<ImportKind, string[]> = {
		products: [
			'GTIN',
			'Brand name',
			'Generic name',
			'Strength',
			'Dosage form',
			'Pack size',
			'NAFDAC no'
		],
		batches_serials: ['GTIN', 'Batch number', 'Manufacture date', 'Expiry date', 'Serial number'],
		distribution: [
			'GTIN',
			'Batch number',
			'Serial number',
			'Receiving business',
			'Role',
			'State',
			'City',
			'Date shipped',
			'PCN licence'
		]
	};
	return sets[kind];
}
