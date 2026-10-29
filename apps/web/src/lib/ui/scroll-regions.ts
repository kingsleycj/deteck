/**
 * Tables and code examples that scroll sideways must be reachable by keyboard (WCAG 2.1.1): each
 * one that overflows gets tabindex="0", a region role and a name. Ones that fit are left alone.
 */
export function markScrollRegions(root: ParentNode = document) {
	for (const el of root.querySelectorAll<HTMLElement>('.table-wrap, pre')) {
		const overflows = el.scrollWidth > el.clientWidth + 1;
		if (overflows && !el.hasAttribute('tabindex')) {
			el.tabIndex = 0;
			el.dataset.scrollRegion = '';
			el.setAttribute('role', 'region');
			if (!el.hasAttribute('aria-label'))
				el.setAttribute(
					'aria-label',
					el.matches('pre') ? 'Code example, scrolls sideways' : 'Table, scrolls sideways'
				);
		} else if (!overflows && 'scrollRegion' in el.dataset) {
			el.removeAttribute('tabindex');
			el.removeAttribute('role');
			el.removeAttribute('aria-label');
			delete el.dataset.scrollRegion;
		}
	}
}
