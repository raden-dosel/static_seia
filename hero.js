// Lightweight hero component: injects hero markup into #hero
(function(){
	const html = `
		<section class="hero" id="home">
			<div class="hero__bg" aria-hidden="true"></div>
			<div class="hero__overlay" aria-hidden="true"></div>
			<div class="hero__inner">
				<p class="hero__kicker">We keep you safe</p>
				<h1 class="hero__title">SEIA Security Installation Services</h1>
				<p class="hero__subtitle">Expert electric fence installations and automatic gate systems for ultimate protection and convenience.</p>
				<div class="hero__actions">
					<a class="hero__btn" href="#features">Get started</a>
					<a class="hero__btn hero__btn--ghost" href="about.html">Learn more</a>
				</div>
			</div>
		</section>`;

	function mount(target){ if (target) target.innerHTML = html; }

	document.addEventListener('DOMContentLoaded', function(){
		const slot = document.getElementById('hero');
		if (slot) mount(slot);
	});

	window.Hero = { mount };
})();

