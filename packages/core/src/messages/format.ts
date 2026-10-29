/**
 * Small text helpers shared by the server and the browser. Kept apart from i18n.ts, which loads
 * every language, so pages that run in the browser only ship the one language they show.
 */

/** Fills {placeholders}. Unknown placeholders are left as they are, so mistakes are visible. */
export function fmt(template: string, params: Record<string, string | number> = {}): string {
	return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
		key in params ? String(params[key]) : whole
	);
}

/** Picks the singular or plural form and fills in {n}. */
export function plural(
	n: number,
	forms: { one: string; other: string },
	params: Record<string, string | number> = {}
): string {
	return fmt(n === 1 ? forms.one : forms.other, { ...params, n });
}

/** Splits "**bold**" markers into parts, so pages can show bold text without raw HTML. */
export function richParts(text: string): { text: string; bold: boolean }[] {
	return text
		.split(/(\*\*[^*]+\*\*)/)
		.filter(Boolean)
		.map((part) =>
			part.startsWith('**') && part.endsWith('**')
				? { text: part.slice(2, -2), bold: true }
				: { text: part, bold: false }
		);
}
