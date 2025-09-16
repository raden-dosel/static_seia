// Floating Back-to-top button
(function(){
	function ensureFab(){
		if (document.querySelector('.fab-top')) return;
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.className = 'fab-top';
		btn.setAttribute('aria-label', 'Back to top');
		btn.textContent = '↑';
		document.body.appendChild(btn);
		const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
		function onScroll(){
			const show = window.scrollY > headerH * 2;
			btn.classList.toggle('show', show);
		}
		window.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
		btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', ensureFab);
	} else {
		ensureFab();
	}
})();

