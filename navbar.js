// Simple navbar with menu toggle and theme toggle
(function () {
  const html = `
    <nav class="nav" aria-label="Primary navigation">
      <div class="nav__inner">
        <a href="#hero" class="nav__brand">
          <img class="nav__brand-logo" src="images/logo.jpg" width="28" height="28" alt="" />
          <span>SEIA</span>
        </a>

        <ul class="nav__menu" id="nav-menu">
          <li><a class="nav__link" href="#hero">Home</a></li>
          <li><a class="nav__link" href="#about">About</a></li>
          <li><a class="nav__link" href="#portfolio">Portfolio</a></li>
          <li><a class="nav__link" href="#contact">Contact</a></li>
        </ul>

        <div class="nav__controls">
          <button class="nav__toggle" aria-label="Toggle menu" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
          <button class="nav__theme-btn" aria-label="Toggle theme">🌙</button>
        </div>
      </div>
    </nav>
  `;

  function mount(target) {
    if (!target) return;
    target.innerHTML = html;

    const toggle = target.querySelector('.nav__toggle');
    const menu = target.querySelector('#nav-menu');
    const themeBtn = target.querySelector('.nav__theme-btn');
    const root = document.documentElement;

    // Menu toggle
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', !isOpen);
      menu.classList.toggle('open');
    });

    // Close menu on link click
    menu.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.remove('open');
      });
    });

    // Theme toggle
    const storageKey = 'theme';
    function getTheme() {
      const saved = localStorage.getItem(storageKey);
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
      const t = theme === 'dark' ? 'dark' : 'light';
      root.setAttribute('data-theme', t);
      themeBtn.textContent = t === 'dark' ? '☀️' : '🌙';
      localStorage.setItem(storageKey, t);
    }

    setTheme(getTheme());
    themeBtn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const slot = document.getElementById('navbar');
    if (slot) mount(slot);
  });

  window.LightNav = { mount };
})();
