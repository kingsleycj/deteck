/**
 * Chrome and Firefox on Linux change a focused drop-down's value when the mouse wheel turns over
 * it, so scrolling down a long form flicks through its options (states, roles) on its own. Over a
 * closed drop-down, the wheel scrolls the page instead. Lists that show several rows are left alone.
 */
const guarded = new WeakSet<HTMLSelectElement>();

function scrollPage(event: WheelEvent) {
	event.preventDefault();
	const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
	window.scrollBy({ left: event.deltaX * unit, top: event.deltaY * unit });
}

export function guardSelectWheel(root: ParentNode = document) {
	for (const select of root.querySelectorAll('select')) {
		if (guarded.has(select) || select.multiple || select.size > 1) continue;
		guarded.add(select);
		select.addEventListener('wheel', scrollPage, { passive: false });
	}
}
