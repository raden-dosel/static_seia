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

document.addEventListener("DOMContentLoaded", async () => {
  const mount = document.getElementById("contact");
  if (!mount) return;

  try {
    const res = await fetch("contact.html", { cache: "no-cache" });
    if (!res.ok) throw new Error(`Failed to load contact.html: ${res.status}`);
    const html = await res.text();

    // Extract just the inner of <section id="contact"> to avoid nested IDs
    const tmp = document.createElement("div");
    tmp.innerHTML = html.trim();
    const section = tmp.querySelector("section#contact");
    mount.innerHTML = section ? section.innerHTML : html;
  } catch (err) {
    console.error(err);
    mount.innerHTML = "<p>Failed to load contact section.</p>";
  }
});

