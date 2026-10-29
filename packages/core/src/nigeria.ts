/** Nigeria's 36 states and the Federal Capital Territory. */
export const NIGERIAN_STATES = [
	'Abia',
	'Adamawa',
	'Akwa Ibom',
	'Anambra',
	'Bauchi',
	'Bayelsa',
	'Benue',
	'Borno',
	'Cross River',
	'Delta',
	'Ebonyi',
	'Edo',
	'Ekiti',
	'Enugu',
	'FCT',
	'Gombe',
	'Imo',
	'Jigawa',
	'Kaduna',
	'Kano',
	'Katsina',
	'Kebbi',
	'Kogi',
	'Kwara',
	'Lagos',
	'Nasarawa',
	'Niger',
	'Ogun',
	'Ondo',
	'Osun',
	'Oyo',
	'Plateau',
	'Rivers',
	'Sokoto',
	'Taraba',
	'Yobe',
	'Zamfara'
] as const;

export type NigerianState = (typeof NIGERIAN_STATES)[number];

const simplify = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/**
 * Maps a free-text region (e.g. Cloudflare's `cf-region` header, "Lagos State",
 * "Federal Capital Territory") to a state name, or null if it isn't one.
 */
export function toNigerianState(region: string | null | undefined): NigerianState | null {
	if (!region) return null;
	const r = simplify(region).replace(/state$/, '');
	if (r.includes('federalcapital') || r === 'fct' || r === 'abuja') return 'FCT';
	return NIGERIAN_STATES.find((s) => simplify(s) === r) ?? null;
}
