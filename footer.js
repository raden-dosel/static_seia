// Footer component: loads partial and wires quick behaviors
(function(){
	async function loadInto(id, url){
		const el = document.getElementById(id);
		if (!el) return;
		const res = await fetch(url, { cache: 'no-cache' });
		el.innerHTML = await res.text();
		wire(el);
	}

	function wire(root){
		// Dynamic year
		const y = root.querySelector('[data-year]');
		if (y) y.textContent = new Date().getFullYear();

		// Smooth scroll for footer quick links
		root.addEventListener('click', (e) => {
			const a = e.target.closest('a.footer__link[href^="#"]');
			if (!a) return;
			const targetId = a.getAttribute('href');
			const sec = document.querySelector(targetId);
			if (!sec) return;
			e.preventDefault();
			// update URL hash for consistency with navbar highlighting
			history.pushState(null, '', targetId);
			const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
			const y = sec.getBoundingClientRect().top + window.pageYOffset - headerH;
			window.scrollTo({ top: y, behavior: 'smooth' });
		});
	}

	document.addEventListener('DOMContentLoaded', function(){
		loadInto('footer', 'footer.html');
	});

	window.Footer = { loadInto };
})();

