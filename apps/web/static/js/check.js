// Progressive enhancement for the serial check forms (PRD US-04.1).
// Without JavaScript the forms still work; this only adds the "checking", "slow network"
// (after 10 s) and "no connection" states, keeping the serial, and tries again by itself
// when the connection comes back.
(function () {
	var forms = document.querySelectorAll('[data-check-form]');
	var overlay = document.querySelector('[data-checking]');
	if (!forms.length || !overlay) return;
	var slow = overlay.querySelector('[data-slow]');
	var serials = overlay.querySelectorAll('[data-serial]');
	var active = forms[0];
	var timer;

	function show(el, on) {
		if (el) el.hidden = !on;
	}
	function fillSerial() {
		var input = active.querySelector('[name="serial"]');
		var value = input ? input.value.trim() : '';
		for (var i = 0; i < serials.length; i++) serials[i].textContent = value;
	}
	// While the overlay shows, the page behind it can't be reached (focus, Tab, screen readers).
	function behind(on) {
		var kids = document.body.children;
		for (var i = 0; i < kids.length; i++)
			if (kids[i] !== overlay && !kids[i].contains(overlay)) kids[i].inert = on;
	}
	function focusShown() {
		var heading = overlay.querySelector(
			overlay.classList.contains('offline') ? '.co-when-off h2' : '.co-when-busy h2'
		);
		if (heading) {
			heading.setAttribute('tabindex', '-1');
			heading.focus();
		}
	}
	function open(offline) {
		fillSerial();
		show(overlay, true);
		overlay.classList.add('on');
		overlay.classList.toggle('offline', offline);
		behind(true);
		focusShown();
		show(slow, false);
		clearTimeout(timer);
		if (!offline)
			timer = setTimeout(function () {
				show(slow, true);
			}, 10000);
	}
	function reset() {
		clearTimeout(timer);
		show(overlay, false);
		overlay.classList.remove('on', 'offline');
		show(slow, false);
		behind(false);
	}
	function edit() {
		reset();
		var input = active.querySelector('[name="serial"]');
		if (input) input.focus();
	}
	function send() {
		if (navigator.onLine === false) return open(true);
		open(false);
		active.submit();
	}

	for (var i = 0; i < forms.length; i++) {
		forms[i].addEventListener('submit', function (event) {
			active = event.currentTarget;
			if (navigator.onLine === false) {
				event.preventDefault();
				open(true);
				return;
			}
			open(false);
		});
	}

	overlay.addEventListener('click', function (event) {
		var target = event.target.closest ? event.target.closest('button') : null;
		if (!target) return;
		if (target.hasAttribute('data-retry')) {
			if (window.stop) window.stop();
			send();
		} else if (target.hasAttribute('data-edit')) {
			edit();
		}
	});

	// Escape on "no connection" goes back to the serial (a check in progress can't be stopped).
	document.addEventListener('keydown', function (event) {
		if (event.key === 'Escape' && overlay.classList.contains('offline')) edit();
	});

	// Back online while the "no connection" screen shows: try again, as it promises.
	window.addEventListener('online', function () {
		if (overlay.classList.contains('offline')) send();
	});

	// Returning with the back button must not leave the overlay showing.
	window.addEventListener('pageshow', reset);
})();
