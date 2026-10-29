/**
 * Languages for the public pages. Business accounts and the DETECK console stay in English.
 * Translations other than English are drafts until a native speaker checks them (`meta.reviewed`).
 */
import { en, type Messages } from './dict/en.ts';
import { ha } from './dict/ha.ts';
import { ig } from './dict/ig.ts';
import { pcm } from './dict/pcm.ts';
import { yo } from './dict/yo.ts';

export type { Messages };
export { fmt, plural, richParts } from './format.ts';

/** BCP 47 codes: English, Nigerian Pidgin, Hausa, Yoruba, Igbo. */
export const LOCALES = ['en', 'pcm', 'ha', 'yo', 'ig'] as const;
export type Locale = (typeof LOCALES)[number];

const DICTS: Record<Locale, Messages> = { en, pcm, ha, yo, ig };

export const isLocale = (value: unknown): value is Locale =>
	typeof value === 'string' && (LOCALES as readonly string[]).includes(value);

export function messages(locale: Locale): Messages {
	return DICTS[locale] ?? en;
}

/** Each enabled language with its own name, for the language menu. */
export function languageChoices(enabled: readonly Locale[]) {
	return enabled.map((code) => ({ code, name: DICTS[code].meta.name }));
}

/** Reads a comma-separated list such as "en,ha,yo". English is always available. */
export function parseLanguages(raw: string | undefined): Locale[] {
	const listed = (raw ?? 'en')
		.split(',')
		.map((s) => s.trim().toLowerCase())
		.filter(isLocale);
	return ['en', ...listed.filter((l) => l !== 'en')];
}

/**
 * The language to show: the visitor's choice (cookie), then their browser's languages, then
 * English. Only enabled languages are used.
 */
export function pickLocale(
	choice: string | undefined | null,
	acceptLanguage: string | null,
	enabled: readonly Locale[]
): Locale {
	if (isLocale(choice) && enabled.includes(choice)) return choice;
	const wanted = (acceptLanguage ?? '')
		.split(',')
		.map((part) => {
			const [tag, ...params] = part.trim().toLowerCase().split(';');
			const q = params.find((p) => p.trim().startsWith('q='));
			return { lang: tag.split('-')[0], q: q ? Number(q.trim().slice(2)) || 0 : 1 };
		})
		.filter((w) => w.lang)
		.sort((a, b) => b.q - a.q);
	for (const w of wanted) if (isLocale(w.lang) && enabled.includes(w.lang)) return w.lang;
	return 'en';
}
