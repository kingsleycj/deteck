/**
 * GTIN helpers (GS1 General Specifications, section 7.9).
 * GTIN-8, -12, -13 and -14 are all stored as 14 digits, left-padded with zeros.
 */

const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

/** Mod-10 check digit for the digits that precede it. */
export function gtinCheckDigit(body: string): number {
	let sum = 0;
	// Weights alternate 3,1,3,1... starting from the rightmost digit of the body.
	for (let i = 0; i < body.length; i++) {
		const digit = body.charCodeAt(body.length - 1 - i) - 48;
		sum += digit * (i % 2 === 0 ? 3 : 1);
	}
	return (10 - (sum % 10)) % 10;
}

export function isValidGtin(value: string): boolean {
	if (!/^\d+$/.test(value) || !GTIN_LENGTHS.has(value.length)) return false;
	const body = value.slice(0, -1);
	return gtinCheckDigit(body) === Number(value[value.length - 1]);
}

/** Returns the 14-digit form of a valid GTIN, or null. Spaces are ignored. */
export function toGtin14(value: string): string | null {
	const digits = value.replace(/\s+/g, '');
	if (!isValidGtin(digits)) return null;
	return digits.padStart(14, '0');
}
