// Progressive enhancement for the serial check form (PRD US-04.1).
// Without JavaScript the form still works; this only adds the "checking",
// "slow network" (after 10 s) and "no connection" states, keeping the serial.
(function () {
	var form = document.querySelector('[data-check-form]');
	var overlay = document.querySelector('[data-checking]');
	if (!form || !overlay) return;
	var slow = overlay.querySelector('[data-slow]');
	var offline = overlay.querySelector('[data-offline]');
	var timer;

	function show(el, on) {
		if (el) el.hidden = !on;
	}
	function reset() {
		clearTimeout(timer);
		show(overlay, false);
		overlay.classList.remove('on');
		show(slow, false);
		show(offline, false);
	}
	function start() {
		show(overlay, true);
		overlay.classList.add('on');
		show(slow, false);
		show(offline, false);
		clearTimeout(timer);
		timer = setTimeout(function () {
			show(slow, true);
		}, 10000);
	}

	form.addEventListener('submit', function (event) {
		if (navigator.onLine === false) {
			event.preventDefault();
			show(overlay, true);
			overlay.classList.add('on');
			show(offline, true);
			return;
		}
		start();
	});

	overlay.addEventListener('click', function (event) {
		var target = event.target;
		if (target && target.hasAttribute && target.hasAttribute('data-retry')) {
			if (window.stop) window.stop();
			reset();
			if (navigator.onLine === false) {
				show(overlay, true);
				overlay.classList.add('on');
				show(offline, true);
				return;
			}
			start();
			form.submit();
		}
	});

	// Returning with the back button must not leave the overlay showing.
	window.addEventListener('pageshow', reset);
})();
