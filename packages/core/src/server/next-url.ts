/** Only same-site paths inside the business areas may be used as a post-sign-in destination. */
export function safeNext(
	value: FormDataEntryValue | string | null | undefined,
	fallback = '/business/home'
): string {
	const v = typeof value === 'string' ? value : '';
	if (
		/^\/(workspace|console|business)(\/|$|\?)/.test(v) &&
		!v.startsWith('//') &&
		!v.includes('\\')
	)
		return v;
	return fallback;
}
