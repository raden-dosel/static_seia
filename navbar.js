// Lightweight standalone navbar injection and behavior
(function () {
  const html = `
    <nav class="nav" aria-label="Primary">
      <div class="nav__inner">
        <a href="#hero" class="nav__brand">
          <img class="nav__brand-logo" src="images/logo.jpg" width="28" height="28" alt="" decoding="async" />
          <span>SEIA</span>
        </a>

        <!-- NOTE: This element becomes "position: fixed" on mobile via CSS -->
        <div id="nav-menu" class="nav__menu" role="menubar">
          <ul class="nav__list">
            <li role="none"><a role="menuitem" class="nav__link" href="#hero" data-match="#hero">Home</a></li>
            <li role="none"><a role="menuitem" class="nav__link" href="#about" data-match="#about">About</a></li>
            <li role="none"><a role="menuitem" class="nav__link" href="#portfolio" data-match="#portfolio">Portfolio</a></li>
            <li role="none"><a role="menuitem" class="nav__link" href="#contact" data-match="#contact">Contact</a></li>
            <!-- Desktop: theme toggle appears after Features -->
            <li role="none"><button role="menuitem" class="theme-btn theme-btn--menu" type="button" aria-label="Toggle theme" title="Toggle theme" aria-pressed="false"><span class="ico" aria-hidden="true">🌙</span></button></li>
          </ul>
        </div>

        <!-- Right-side controls: burger + theme (mobile) -->
        <div class="nav__controls">
          <button class="nav__toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-menu">
            <span class="nav__toggle-icon" aria-hidden="true"></span>
          </button>

          <button class="theme-btn theme-btn--header" type="button" aria-label="Toggle theme" title="Toggle theme" aria-pressed="false">
            <span class="ico" aria-hidden="true">🌙</span>
          </button>
        </div>
      </div>
    </nav>
  `;

  function mount(target) {
    if (!target) return;
    target.innerHTML = html;

    const toggle = target.querySelector('.nav__toggle');
    const menu = target.querySelector('#nav-menu');

    function openMenu() {
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.classList.add('no-scroll');   // lock scroll
      document.documentElement.classList.add('no-scroll');
    }

    function closeMenu() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        isOpen() ? closeMenu() : openMenu();
      });

      // Close on ESC
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) {
          closeMenu();
          toggle.focus();
        }
      });

      // Smooth-scroll to section on menu link click and close on mobile
      menu.addEventListener('click', (e) => {
        const a = e.target.closest('a.nav__link[href^="#"]');
        if (!a) return;
        const targetId = a.getAttribute('href');
        const sec = document.querySelector(targetId);
        if (sec) {
          e.preventDefault();
          // update hash for active highlighting after scroll
          history.pushState(null, '', targetId);
          const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 56;
          const y = sec.getBoundingClientRect().top + window.pageYOffset - headerH;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
        if (isOpen()) closeMenu();
      });
    }

    // Mark active link (basic path/hash match) and update on hash change
    function updateActiveLinks() {
      const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
      const hash = (location.hash || '').toLowerCase();
      const curHash = hash || '#hero';
      target.querySelectorAll('.nav__link').forEach(a => {
        const match = (a.getAttribute('data-match') || '').toLowerCase();
        if (!match) return a.classList.remove('active');
        const isActive = (match.startsWith('#') ? curHash === match : path === match);
        a.classList.toggle('active', isActive);
      });
    }

    updateActiveLinks();
    window.addEventListener('hashchange', updateActiveLinks);
    // Also update on scroll near top so Home highlights when no hash
    window.addEventListener('scroll', () => {
      if (!location.hash) updateActiveLinks();
    });

    // ===== Theme toggle (two buttons: header + menu) =====
    const btnHeader = target.querySelector('.theme-btn--header');
    const btnMenu = target.querySelector('.theme-btn--menu');
    const root = document.documentElement;
    const storageKey = 'theme';

    function getPreferredTheme() {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'light' || saved === 'dark') return saved;
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }

    function reflect(btn, theme) {
      if (!btn) return;
      const dark = theme === 'dark';
      btn.setAttribute('aria-pressed', dark ? 'true' : 'false');
      const ico = btn.querySelector('.ico');
      if (ico) ico.textContent = dark ? '🌙' : '☀️';
    }

    function setTheme(theme, persist = true) {
      const t = theme === 'dark' ? 'dark' : 'light';
      root.setAttribute('data-theme', t);
      reflect(btnHeader, t);
      reflect(btnMenu, t);
      if (persist) localStorage.setItem(storageKey, t);
    }

    // Initialize from preference without persisting
    setTheme(getPreferredTheme(), false);

    function toggleTheme() {
      const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(current === 'dark' ? 'light' : 'dark');
    }

    btnHeader && btnHeader.addEventListener('click', toggleTheme);
    btnMenu && btnMenu.addEventListener('click', toggleTheme);

    // Follow system changes only if user hasn't explicitly chosen yet
    const mql = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if (mql && !localStorage.getItem(storageKey)) {
      const onChange = (e) => setTheme(e.matches ? 'dark' : 'light', false);
      if (mql.addEventListener) mql.addEventListener('change', onChange);
      else if (mql.addListener) mql.addListener(onChange);
    }
  }

  // Auto-mount on #navbar if present
  document.addEventListener('DOMContentLoaded', () => {
    const slot = document.getElementById('navbar');
    if (slot) mount(slot);
  });

  // Expose for manual use if needed
  window.LightNav = { mount };
})();
