import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Automated WCAG 2.1 AA checks (P8). A manual TalkBack and VoiceOver pass is still needed. */
export async function audit(page: Page, label: string) {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
		.analyze();
	const serious = results.violations.filter(
		(v) => v.impact === 'serious' || v.impact === 'critical'
	);
	expect(
		serious.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`),
		label
	).toEqual([]);
}
