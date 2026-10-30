/**
 * Closed set of public result states (decisions.md D-09). The server returns
 * these codes; all wording lives in the message catalogue.
 */

export type SerialResultCode =
	'VALID' | 'UNRECOGNISED' | 'NOT_COVERED' | 'CANT_CONFIRM' | 'RECALLED' | 'NEEDS_BATCH';

export type ResultFlag = 'EXPIRED' | 'LOT_MISMATCH' | 'EXPIRY_MISMATCH';

/** Why a result is Unrecognised or can't be confirmed, so the copy can be specific. */
export type ResultReason =
	| 'not_found'
	| 'not_found_for_covered_product'
	| 'no_serial_in_code'
	| 'manufacturer_suspended'
	| 'product_deactivated'
	| 'batch_not_matched'
	/** The serial and batch match more than one drug: scan the code to tell them apart. */
	| 'needs_scan'
	/** A live manufacturer's new drug that DETECK is still reviewing. */
	| 'drug_in_review';

export interface PublicProduct {
	id: string;
	brandName: string;
	genericName: string;
	strength: string;
	dosageForm: string;
	packSize: string;
	nafdacRegNo: string;
	serialHint: string | null;
}

export interface PublicBatch {
	id: string;
	lot: string;
	manufactureDate: string | null;
	expiryDate: string;
	status: 'active' | 'recalled' | 'withdrawn';
	statusReason: string | null;
	statusSource: string | null;
	statusEffectiveAt: string | null;
}

export interface VerificationResult {
	v: 1;
	code: SerialResultCode;
	flags: ResultFlag[];
	reason?: ResultReason;
	input: 'typed' | 'scanned';
	/** The end of the serial for display, e.g. "…TB8D". The full serial is never stored. */
	serialDisplay: string;
	manufacturer?: { id: string; name: string; state: string; town: string | null };
	product?: PublicProduct;
	batch?: PublicBatch;
	packId?: number;
	/** Keyed hash of the serial (hex), never the serial itself. Server-side only. */
	serialKey?: string;
	/**
	 * When a scanned code names a drug on DETECK but its serial can't be checked: the
	 * manufacturer's note on where the serial is printed, so the person can type it instead.
	 */
	serialHelp?: { drug: string; hint: string };
	/** Pack ids to choose between when a typed serial matches several products. */
	candidates?: number[];
	journeyAvailable: boolean;
	packagingAvailable: boolean;
	coverage?: { manufacturers: number; products: number };
	checkedAt: string;
}

/** A result as pages send it to the browser: the stored result without internal ids. */
export type PublicResult = Omit<
	VerificationResult,
	'packId' | 'candidates' | 'manufacturer' | 'product' | 'batch' | 'serialKey'
> & {
	manufacturer?: Omit<NonNullable<VerificationResult['manufacturer']>, 'id'>;
	product?: Omit<PublicProduct, 'id'>;
	batch?: Omit<PublicBatch, 'id'>;
};

export type FormatProblem =
	| 'empty'
	| 'too_short'
	| 'too_long'
	| 'bad_characters'
	| 'nafdac_number'
	| 'batch_number'
	| 'bad_code';
