/**
 * DETECK staff working on a company's behalf: every form carries the company its page was opened
 * for, so a tab left open on another company can't save into this one (audit decision 6). The
 * server refuses on-behalf saves without it (guards.ts).
 */
export function tagCompany(event: SubmitEvent, companyId: string) {
	const form = event.target as HTMLFormElement;
	if ((form.method || 'get').toLowerCase() !== 'post') return;
	const button = event.submitter as HTMLButtonElement | null;
	const target = button?.hasAttribute('formaction') ? button : form;
	const url = new URL(
		target === form ? form.action : (button as HTMLButtonElement).formAction,
		location.href
	);
	url.searchParams.set('_company', companyId);
	if (target === form) form.action = url.toString();
	else (button as HTMLButtonElement).formAction = url.toString();
}
