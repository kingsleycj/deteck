/**
 * Rules for serial numbers typed by a person (PRD US-01.1): letters and digits
 * are accepted, spaces and dashes are ignored, and case does not matter.
 *
 * GS1 serials (AI 21) are up to 20 characters from GS1 character set 82, which
 * includes lower case and punctuation. The lookup therefore uses this
 * normalised key, and imports flag any two serials that collide under it.
 */

/** Spaces, tabs and every kind of dash a phone keyboard may insert. */
const IGNORED = /[\s\u00a0\u2010-\u2015\u2212-]/g;

/** GS1 character set 82, after upper-casing (so no lower-case letters). */
const ALLOWED = /^[A-Z0-9!"%&'()*+,./:;<=>?_]+$/;

export const SERIAL_MIN_LENGTH = 4;
export const SERIAL_MAX_LENGTH = 20;

export function normaliseSerialKey(input: string): string {
	return input.replace(IGNORED, '').toUpperCase();
}

export type SerialFormatProblem = 'empty' | 'too_short' | 'too_long' | 'bad_characters';

export function checkTypedSerial(
	input: string
): { ok: true; key: string } | { ok: false; problem: SerialFormatProblem } {
	const key = normaliseSerialKey(input);
	if (key.length === 0) return { ok: false, problem: 'empty' };
	if (key.length < SERIAL_MIN_LENGTH) return { ok: false, problem: 'too_short' };
	if (key.length > SERIAL_MAX_LENGTH) return { ok: false, problem: 'too_long' };
	if (!ALLOWED.test(key)) return { ok: false, problem: 'bad_characters' };
	return { ok: true, key };
}

/**
 * NAFDAC registration numbers look like "A4-1234" or "04-1234L". People often
 * type them by mistake, so the checker gives a specific hint.
 */
export function looksLikeNafdacNumber(input: string): boolean {
	return /^\s*[A-Z]?\d{1,2}\s*-\s*\d{3,5}\s*L?\s*$/i.test(input);
}
