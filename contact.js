// Contact component: loads partial and wires a simple mailto-based submit
(function(){
	async function loadInto(id, url){
		const el = document.getElementById(id);
		if (!el) return;
		const res = await fetch(url, { cache: 'no-cache' });
		el.innerHTML = await res.text();
		wire(el);
	}

	function wire(root){
		const form = root.querySelector('.contact__form');
		const status = root.querySelector('.form-status');
		if (!form) return;

		form.addEventListener('submit', (e) => {
			e.preventDefault();
			const name = form.name.value.trim();
			const email = form.email.value.trim();
			const msg = form.message.value.trim();
			if (!name || !email || !msg) {
				if (status) status.textContent = 'Please fill out all fields.';
				return;
			}
			const subject = encodeURIComponent(`[Website] Message from ${name}`);
			const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`);
			const to = 'hello@example.com';
			const link = `mailto:${to}?subject=${subject}&body=${body}`;
			if (status) status.textContent = 'Opening your email app…';
			window.location.href = link;
		});
	}

	document.addEventListener('DOMContentLoaded', function(){
		loadInto('contact', 'contact.html');
	});

	window.Contact = { loadInto };
})();

