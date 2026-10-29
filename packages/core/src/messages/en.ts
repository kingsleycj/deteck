/**
 * English wording, for code that always speaks English (business accounts, the DETECK console,
 * emails to businesses and the API's default). Public pages use the visitor's language through
 * i18n.ts and copy.ts; the sentences themselves live in dict/en.ts (D-09).
 */
import type { FormatProblem, PublicResult } from '../verify/types.ts';
import type { Journey, JourneyStep, PartyRoleName } from '../verify/journey-types.ts';
import * as copy from './copy.ts';
import { en } from './dict/en.ts';

export type { ResultCopy, Tone } from './copy.ts';
export { formatDate, formatMonth } from './copy.ts';

export const EN = en;

export const ROLE_LABEL: Record<PartyRoleName, string> = en.journey.roles;

export const home = en.check;

export const formatProblem: Record<FormatProblem, string> = {
	empty: en.format.empty,
	too_short: en.format.too_short,
	too_long: en.format.too_long,
	bad_characters: en.format.bad_characters,
	nafdac_number: en.format.nafdac_number,
	bad_code: en.format.bad_code
};

export const formatMascot = en.format.mascot;
export const slowNetwork = en.network.slow;
export const noConnection = {
	slowServer: en.network.slowServer,
	title: en.network.offlineTitle,
	body: en.network.offlineBody
};

export const rateLimited = (seconds: number) => copy.rateLimited(seconds, en);
export const batchNotMatched = en.result.batchNotMatched;
export const productName = (r: PublicResult) => copy.productName(r, en);
export const resultCopy = (r: PublicResult) => copy.resultCopy(r, en);
export const resultFootnote = en.result.footnote;
export const journeyText = en.journey;

export const journeySummary = (j: Journey, manufacturerName: string) =>
	copy.journeySummary(j, manufacturerName, en);
export const journeyLinkLine = (j: Journey | null) => copy.journeyLinkLine(j, en);
export const stepLabel = (step: JourneyStep, isLast: boolean, state: Journey['state']) =>
	copy.stepLabel(step, isLast, state, en);

export const CATEGORY_TEXT: Record<string, string> = en.packaging.categories;
export const SIDE_TEXT: Record<string, string> = en.packaging.sides;
export const packagingText = en.packaging;
export const packagingCopy = (outcome: string) => copy.packagingCopy(outcome, en);
