/**
 * Turns results and journeys into sentences, in any language: the logic lives here once, the
 * words come from the dictionary passed in (dict/*.ts). Results, journeys and packaging checks
 * all follow D-09: the server returns codes, and every sentence is chosen here.
 */
import type { FormatProblem, PublicResult } from '../verify/types.ts';
import type { Journey, JourneyStep } from '../verify/journey-types.ts';
import type { Messages } from './dict/en.ts';
import { lagosToday } from '../dates.ts';
import { fmt, plural } from './format.ts';

// Pack dates are printed in English month abbreviations, so results show them the same way.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "12 Mar 2026", or the dictionary's "not recorded" wording. */
export function formatDate(
	iso: string | null | undefined,
	notRecorded = 'Date not recorded'
): string {
	if (!iso) return notRecorded;
	// A moment in time (not a plain date) is shown as the date it was in Nigeria.
	const day = iso.length > 10 && !Number.isNaN(Date.parse(iso)) ? lagosToday(new Date(iso)) : iso;
	const [y, m, d] = day.slice(0, 10).split('-').map(Number);
	return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** "Apr 2028" */
export function formatMonth(iso: string | null | undefined, notRecorded = 'Not recorded'): string {
	if (!iso) return notRecorded;
	const [y, m] = iso.slice(0, 10).split('-').map(Number);
	return `${MONTHS[m - 1]} ${y}`;
}

export function rateLimited(seconds: number, t: Messages): string {
	return plural(Math.max(1, Math.ceil(seconds / 60)), t.network.rateLimited);
}

export function formatProblemText(problem: FormatProblem, t: Messages): string {
	return t.format[problem];
}

export function productName(r: PublicResult, t: Messages): string {
	const p = r.product;
	return p ? `${p.brandName} ${p.strength}` : t.result.thisMedicine;
}

export type Tone = 'valid' | 'warn' | 'info' | 'danger';

export interface ResultCopy {
	tone: Tone;
	badges: string[];
	mood: 'happy' | 'concerned' | 'thinking';
	title?: string;
	bubble: string;
	reasons?: string[];
	nextStep?: string;
}

function coverageLine(c: { products: number; manufacturers: number }, t: Messages): string {
	return fmt(t.result.coverage, {
		products: plural(c.products, t.result.products),
		manufacturers: plural(c.manufacturers, t.result.manufacturers)
	});
}

function unrecognisedReasons(r: PublicResult, t: Messages): string[] {
	const u = t.result.unrecognised;
	return [
		u.mistyped,
		r.coverage ? `${u.notShared} ${coverageLine(r.coverage, t)}` : u.notShared,
		u.notRecorded
	];
}

export function resultCopy(r: PublicResult, t: Messages): ResultCopy {
	const res = t.result;
	const names = { product: productName(r, t), maker: r.manufacturer?.name ?? res.theManufacturer };
	switch (r.code) {
		case 'VALID': {
			if (r.flags.includes('LOT_MISMATCH') || r.flags.includes('EXPIRY_MISMATCH')) {
				// Expired as well: say both, never hide the expiry behind the mismatch.
				const expired = r.flags.includes('EXPIRED');
				return {
					tone: 'warn',
					badges: [
						res.valid.badge,
						res.mismatch.badge,
						...(expired ? [res.expiredPack.badge] : [])
					],
					mood: 'concerned',
					title: res.mismatch.title,
					bubble: fmt(
						r.flags.includes('LOT_MISMATCH') ? res.mismatch.bubbleLot : res.mismatch.bubbleExpiry,
						names
					),
					reasons: expired ? [res.expiredPack.title] : undefined,
					nextStep: res.mismatch.nextStep
				};
			}
			if (r.flags.includes('EXPIRED')) {
				return {
					tone: 'warn',
					badges: [res.valid.badge, res.expiredPack.badge],
					mood: 'concerned',
					title: res.expiredPack.title,
					bubble: fmt(res.expiredPack.bubble, names),
					nextStep: res.expiredPack.nextStep
				};
			}
			return {
				tone: 'valid',
				badges: [res.valid.badge],
				mood: 'happy',
				title: res.valid.title,
				bubble: fmt(res.valid.bubble, names)
			};
		}
		case 'RECALLED': {
			const b = r.batch!;
			const rc = res.recalled;
			const withdrawn = b.status === 'withdrawn';
			return {
				tone: 'danger',
				badges: [withdrawn ? rc.badgeWithdrawn : rc.badgeRecalled],
				mood: 'concerned',
				title: withdrawn ? rc.titleWithdrawn : rc.titleRecalled,
				bubble: fmt(withdrawn ? rc.bubbleWithdrawn : rc.bubbleRecalled, {
					product: names.product,
					lot: b.lot,
					by: b.statusSource ? fmt(rc.by, { source: b.statusSource }) : '',
					on: b.statusEffectiveAt ? fmt(rc.on, { date: formatDate(b.statusEffectiveAt) }) : ''
				}),
				reasons: b.statusReason ? [fmt(rc.reason, { reason: b.statusReason })] : undefined,
				nextStep: rc.nextStep
			};
		}
		case 'CANT_CONFIRM':
			return {
				tone: 'warn',
				badges: [res.cantConfirm.badge],
				mood: 'thinking',
				title: res.cantConfirm.title,
				bubble:
					r.reason === 'product_deactivated'
						? res.cantConfirm.bubbleProduct
						: res.cantConfirm.bubbleManufacturer,
				nextStep: res.askPharmacist
			};
		case 'NOT_COVERED':
			return {
				tone: 'info',
				badges: [res.notCovered.badge],
				mood: 'thinking',
				title: res.notCovered.title,
				bubble: r.reason === 'drug_in_review' ? res.notCovered.reviewBubble : res.notCovered.bubble,
				reasons:
					r.coverage && r.reason !== 'drug_in_review' ? [coverageLine(r.coverage, t)] : undefined,
				nextStep: res.notCovered.nextStep
			};
		case 'NEEDS_BATCH':
			return {
				tone: 'info',
				badges: [res.needsBatch.badge],
				mood: 'thinking',
				title: r.reason === 'needs_scan' ? res.needsBatch.scanTitle : res.needsBatch.title,
				bubble: r.reason === 'needs_scan' ? res.needsBatch.scanBubble : res.needsBatch.bubble
			};
		case 'UNRECOGNISED':
		default: {
			const u = res.unrecognised;
			const reason = r.reason ?? 'not_found';
			const bubble =
				reason === 'not_found_for_covered_product' ||
				reason === 'batch_not_matched' ||
				reason === 'no_serial_in_code'
					? u[reason]
					: u.not_found;
			return {
				tone: 'warn',
				badges: [u.badge],
				mood: 'concerned',
				title: u.title,
				bubble,
				reasons: r.serialHelp
					? [
							fmt(u.serialWhere, { drug: r.serialHelp.drug, hint: r.serialHelp.hint }),
							reason === 'no_serial_in_code' ? u.typeInstead : u.typeToConfirm
						]
					: reason === 'not_found'
						? unrecognisedReasons(r, t)
						: undefined,
				nextStep: reason === 'not_found_for_covered_product' ? u.nextStepKeep : res.askPharmacist
			};
		}
	}
}

// ---------------------------------------------------------------- journey

function partyNames(j: Journey): string[] {
	return j.steps
		.filter((s): s is Extract<JourneyStep, { kind: 'party' }> => s.kind === 'party')
		.map((s) => s.name);
}

/** "A, B and C" */
export function joinNames(names: string[], t: Messages): string {
	if (names.length <= 1) return names[0] ?? '';
	return `${names.slice(0, -1).join(', ')} ${t.common.and} ${names.at(-1)}`;
}

export function journeySummary(j: Journey, manufacturerName: string, t: Messages): string {
	const s = t.journey.summary;
	const names = partyNames(j);
	switch (j.state) {
		// Wherever the records end (a pharmacy, or a distributor), say what's recorded.
		case 'TO_RETAIL':
		case 'ENDS_BEFORE_RETAIL': {
			const middle = names.slice(0, -1);
			return fmt(s.toRetail, {
				maker: manufacturerName,
				via: middle.length ? fmt(s.via, { names: joinNames(middle, t) }) : '',
				last: names.at(-1) ?? ''
			});
		}
		case 'BATCH_LEVEL':
			return plural(names.length, s.batchLevel, { maker: manufacturerName });
		default:
			return s.none;
	}
}

export function journeyLinkLine(j: Journey | null, t: Messages): string {
	const l = t.journey.link;
	if (!j || j.state === 'NONE' || !j.lastHolder) return l.none;
	const where = j.lastHolder.place ? `, ${j.lastHolder.place}` : '';
	if (j.state === 'BATCH_LEVEL') return plural(partyNames(j).length, l.suppliedTo);
	return fmt(l.lastWith, { name: j.lastHolder.name, where });
}

export function stepLabel(
	step: JourneyStep,
	isLast: boolean,
	state: Journey['state'],
	t: Messages
): string {
	const s = t.journey.step;
	if (step.kind === 'manufacturer')
		return fmt(s.manufacturer, {
			month: formatMonth(step.manufactureDate, t.common.notRecorded).toUpperCase()
		});
	const role = t.journey.roles[step.role].toUpperCase();
	if (isLast && (state === 'TO_RETAIL' || state === 'ENDS_BEFORE_RETAIL')) {
		return step.date
			? fmt(s.lastHolderSince, { date: formatDate(step.date).toUpperCase() })
			: s.lastHolder;
	}
	return step.date ? `${role} · ${formatDate(step.date).toUpperCase()}` : role;
}

// ---------------------------------------------------------------- packaging scan (F-02)

export function packagingCopy(
	outcome: string,
	t: Messages
): ResultCopy & { packagingLine: string } {
	const o = t.packaging.outcomes;
	switch (outcome) {
		case 'NO_VISIBLE_INCONSISTENCIES':
			return {
				tone: 'valid',
				badges: [o.match.badge],
				mood: 'happy',
				title: o.match.title,
				bubble: o.match.bubble,
				packagingLine: o.match.line
			};
		case 'INCONSISTENCIES_FOUND':
			return {
				tone: 'warn',
				badges: [o.mismatch.badge],
				mood: 'concerned',
				title: o.mismatch.title,
				bubble: o.mismatch.bubble,
				nextStep: o.mismatch.nextStep,
				packagingLine: o.mismatch.line
			};
		default:
			return {
				tone: 'info',
				badges: [o.unsure.badge],
				mood: 'thinking',
				title: o.unsure.title,
				bubble: o.unsure.bubble,
				nextStep: o.unsure.nextStep,
				packagingLine: o.unsure.line
			};
	}
}
