/**
 * Compares a translation with English: same keys, the same {placeholders} in each sentence and
 * the same number of **bold** parts. Sentences identical to English are reported as warnings,
 * since names like DETECK, NAFDAC and WhatsApp stay as they are.
 */
import { en } from './dict/en.ts';
import type { Messages } from './dict/en.ts';

type Tree = { [key: string]: string | boolean | Tree };

const placeholders = (s: string) =>
	[...s.matchAll(/\{(\w+)\}/g)]
		.map((m) => m[1])
		.sort()
		.join(',');
const boldCount = (s: string) => (s.match(/\*\*/g) ?? []).length;

export function checkTranslation(target: Messages) {
	const problems: string[] = [];
	const warnings: string[] = [];
	const walk = (source: Tree, other: Tree, path: string[]) => {
		for (const key of Object.keys(source)) {
			const here = [...path, key].join('.');
			const a = source[key];
			const b = other?.[key];
			if (b === undefined) {
				problems.push(`${here}: missing`);
				continue;
			}
			if (typeof a === 'object') {
				if (typeof b !== 'object') problems.push(`${here}: should be a group`);
				else walk(a, b, [...path, key]);
				continue;
			}
			if (typeof a !== typeof b) {
				problems.push(`${here}: should be a ${typeof a}`);
				continue;
			}
			if (typeof a !== 'string' || typeof b !== 'string') continue;
			if (placeholders(a) !== placeholders(b))
				problems.push(
					`${here}: placeholders {${placeholders(a)}} expected, found {${placeholders(b)}}`
				);
			if (boldCount(a) !== boldCount(b))
				problems.push(`${here}: ** bold markers don't match English`);
			if (a.length > 25 && a === b) warnings.push(`${here}: same as English`);
		}
		for (const key of Object.keys(other ?? {}))
			if (!(key in source)) problems.push(`${[...path, key].join('.')}: not in English`);
	};
	walk(en as unknown as Tree, target as unknown as Tree, []);
	return { problems, warnings };
}
