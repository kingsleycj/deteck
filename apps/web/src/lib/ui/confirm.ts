/**
 * Asks before a destructive action is sent, naming what will happen ("Remove Ada from the team?").
 * On a button: `<button use:confirmFirst={'…'}>`. On a form, with `when` to ask only for some
 * choices: `<form use:confirmSubmit={{ message: '…', when: (form) => … }}>`. Without JavaScript the
 * action goes ahead as before; every one of these is also recorded in the audit trail.
 */
export function confirmFirst(button: HTMLButtonElement, message: string) {
	const onClick = (event: MouseEvent) => {
		if (!window.confirm(message)) event.preventDefault();
	};
	button.addEventListener('click', onClick);
	return {
		update(next: string) {
			message = next;
		},
		destroy() {
			button.removeEventListener('click', onClick);
		}
	};
}

export function confirmSubmit(
	form: HTMLFormElement,
	options: { message: string; when?: (form: HTMLFormElement) => boolean }
) {
	const onSubmit = (event: SubmitEvent) => {
		if ((options.when?.(form) ?? true) && !window.confirm(options.message)) {
			event.preventDefault();
			event.stopImmediatePropagation();
		}
	};
	// Capture, so the question comes before SvelteKit's enhance sends the form.
	form.addEventListener('submit', onSubmit, true);
	return {
		update(next: typeof options) {
			options = next;
		},
		destroy() {
			form.removeEventListener('submit', onSubmit, true);
		}
	};
}
