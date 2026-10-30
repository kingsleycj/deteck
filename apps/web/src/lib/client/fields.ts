/**
 * After a form comes back with problems: each field marked `.field-error` is told it's invalid
 * and which message describes it (for screen readers), and the first one gets the focus.
 */
export function markInvalidFields(root: ParentNode = document) {
	let first: HTMLElement | null = null;
	for (const field of root.querySelectorAll('.field-error')) {
		const control = field.querySelector<HTMLElement>(
			'input:not([type="hidden"]), select, textarea'
		);
		const message = field.querySelector('.error-text[id]');
		if (!control) continue;
		control.setAttribute('aria-invalid', 'true');
		if (message) {
			const ids = new Set(
				(control.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean)
			);
			ids.add(message.id);
			control.setAttribute('aria-describedby', [...ids].join(' '));
		}
		first ??= control;
	}
	first?.focus();
}
