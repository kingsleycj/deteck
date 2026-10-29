/**
 * Checks every translation against English (see src/messages/check.ts).
 *
 *   node scripts/check-translations.ts          all languages
 *   node scripts/check-translations.ts ha       one language
 */
import { checkTranslation } from '../src/messages/check.ts';
import { LOCALES, messages, type Locale } from '../src/messages/i18n.ts';

const only = process.argv[2];
const locales = (only ? [only] : LOCALES.filter((l) => l !== 'en')) as Locale[];
let failed = false;
for (const locale of locales) {
	const { problems, warnings } = checkTranslation(messages(locale));
	console.log(
		`${locale}: ${problems.length ? `${problems.length} problem(s)` : 'ok'}${warnings.length ? `, ${warnings.length} sentence(s) still in English` : ''}`
	);
	for (const p of problems) console.log(`  ✗ ${p}`);
	for (const w of warnings) console.log(`  · ${w}`);
	if (problems.length) failed = true;
}
process.exit(failed ? 1 : 0);
