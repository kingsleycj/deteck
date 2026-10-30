// The landing page's phone menu is a <details> the browser opens without JavaScript. With it,
// choosing a link (or pressing Escape) closes the menu, so it doesn't stay open over the page.
(function () {
	var menus = document.querySelectorAll('details.menu');
	for (var i = 0; i < menus.length; i++) {
		(function (menu) {
			menu.addEventListener('click', function (event) {
				if (event.target.closest && event.target.closest('a')) menu.open = false;
			});
		})(menus[i]);
	}
	document.addEventListener('keydown', function (event) {
		if (event.key !== 'Escape') return;
		for (var i = 0; i < menus.length; i++) menus[i].open = false;
	});
})();
