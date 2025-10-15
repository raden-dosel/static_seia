// Portfolio component: loads partial and adds filtering + details behavior
(function(){
  // Build absolute URL relative to current document origin
  function resolveUrl(path){
    try { return new URL(path, document.baseURI).href; }
    catch { return path; }
  }

  async function loadInto(id, url){
    const el = document.getElementById(id);
    if (!el) return;
    const res = await fetch(resolveUrl(url), { cache: 'no-cache' });
    el.innerHTML = await res.text();
    // wire is now async because we fetch data before initial render
    await wire(el);
  }

  // NEW: helper to create one card element from a data item
  function createCard(item){
    const article = document.createElement('article');
    article.className = 'pf-card';
    article.tabIndex = 0;

    // data-* used by filters and details pane
    article.dataset.project = item.project;
    article.dataset.date = item.date;
    article.dataset.loc = item.loc;
    article.dataset.title = item.title;
    article.dataset.tags = Array.isArray(item.tags) ? item.tags.join(' • ') : String(item.tags || '');
    article.dataset.desc = item.desc || '';

    // Visible content (feel free to tailor)
    const img = document.createElement('img');
    img.className = 'pf-card__img';
    img.src = item.thumbUrl || 'images/cover.jpg';
    img.alt = (item.imageAlt) || `${item.title} preview`;

    const meta = document.createElement('div');
    meta.className = 'pf-card__meta';
    const metaSpan = document.createElement('span');
    metaSpan.textContent = item.category || (item.project === 'fence' ? 'Web' : 'Mobile');
    meta.appendChild(metaSpan);

    const h3 = document.createElement('h3');
    h3.className = 'pf-card__title';
    h3.textContent = item.title;

    article.appendChild(img);
    article.appendChild(meta);
    article.appendChild(h3);

    return article;
  }

  // NEW: render a list of cards into the grid
  function renderCardsIntoGrid(items, grid){
    const frag = document.createDocumentFragment();
    items.forEach(item => frag.appendChild(createCard(item)));
    grid.innerHTML = ''; // clear any existing content
    grid.appendChild(frag);
  }

  async function wire(root){
    const grid = root.querySelector('.portfolio__grid');
    const pager = root.querySelector('.portfolio__pager');
  // Details pane removed

    // Map cards to their data for modal usage
    const cardData = new WeakMap();

    // Modal creation
    let modal, modalDialog, modalTitle, modalImage, modalTags, modalDesc, btnPrev, btnNext, btnClose;
    let modalIndex = 0;
    let modalImages = [];

    function ensureModal(){
      if (modal) return;
      modal = document.createElement('div');
      modal.className = 'pf-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="pf-modal__dialog">
          <div class="pf-modal__header">
            <h3 class="pf-modal__title"></h3>
            <button class="pf-modal__close" aria-label="Close">×</button>
          </div>
          <div class="pf-modal__body">
            <div class="pf-carousel">
              <img alt="" />
              <div class="pf-carousel__nav">
                <button class="pf-carousel__btn pf-carousel__prev" aria-label="Previous image">‹</button>
                <button class="pf-carousel__btn pf-carousel__next" aria-label="Next image">›</button>
              </div>
            </div>
          </div>
          <div class="pf-modal__footer">
            <p class="pf-modal__tags"></p>
            <p class="pf-modal__desc"></p>
          </div>
        </div>`;
      document.body.appendChild(modal);

      modalDialog = modal.querySelector('.pf-modal__dialog');
      modalTitle = modal.querySelector('.pf-modal__title');
      modalImage = modal.querySelector('.pf-carousel img');
      modalTags = modal.querySelector('.pf-modal__tags');
      modalDesc = modal.querySelector('.pf-modal__desc');
      btnPrev = modal.querySelector('.pf-carousel__prev');
      btnNext = modal.querySelector('.pf-carousel__next');
      btnClose = modal.querySelector('.pf-modal__close');

      const onBackdrop = (e) => { if (e.target === modal) closeModal(); };
      modal.addEventListener('click', onBackdrop);
      btnClose.addEventListener('click', () => closeModal());
      btnPrev.addEventListener('click', () => showImage(modalIndex - 1));
      btnNext.addEventListener('click', () => showImage(modalIndex + 1));

      window.addEventListener('keydown', (e) => {
        if (!modal || !modal.classList.contains('is-open')) return;
        if (e.key === 'Escape') closeModal();
        else if (e.key === 'ArrowLeft') showImage(modalIndex - 1);
        else if (e.key === 'ArrowRight') showImage(modalIndex + 1);
      });
    }

    function normalizeImages(item){
      const arr = Array.isArray(item.images) ? item.images : [];
      if (arr.length > 0) {
        return arr.map(v => typeof v === 'string' ? { src: v, alt: item.title } : v);
      }
      // Fallback to thumb
      if (item.thumbUrl) return [{ src: item.thumbUrl, alt: item.imageAlt || item.title }];
      return [{ src: 'images/cover.jpg', alt: item.title }];
    }

    function showImage(i){
      if (!modalImages.length) return;
      modalIndex = (i + modalImages.length) % modalImages.length;
      const { src, alt } = modalImages[modalIndex];
      modalImage.src = src;
      modalImage.alt = alt || '';
    }

    function openModal(item){
      ensureModal();
      modalImages = normalizeImages(item);
      modalIndex = 0;
      modalTitle.textContent = item.title || 'Project';
      modalTags.textContent = Array.isArray(item.tags) ? item.tags.join(' • ') : (item.tags || '');
      modalDesc.textContent = item.desc || '';
      showImage(0);
      modal.classList.add('is-open');
      document.body.classList.add('pf-modal-open');
      // Focus management
      btnClose.focus();
    }

    function closeModal(){
      if (!modal) return;
      modal.classList.remove('is-open');
      document.body.classList.remove('pf-modal-open');
    }

    // Filtering via selects
    const selProject = root.querySelector('#pfProject');
    const selDate = root.querySelector('#pfDate');
    const selLoc = root.querySelector('#pfLocation');
    const btnSort = root.querySelector('#pfSort');

    // Pagination state
    const PAGE_SIZE_MOBILE = 4;
    const PAGE_SIZE_DESKTOP = 6;
    let page = 1;
    // Sort state: 'desc' (newest first) or 'asc' (oldest first)
    let sortDir = 'desc';

    function pageSize(){ return matchMedia('(min-width: 768px)').matches ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE; }

    // Parse date from data-date; supports YYYY, YYYY-MM, YYYY-MM-DD
    function dateToKey(s){
      if (!s) return 0;
      // Normalize to YYYYMMDD numeric for stable sort
      const parts = String(s).split('-');
      const y = parts[0] || '0000';
      const m = (parts[1] || '01').padStart(2,'0');
      const d = (parts[2] || '01').padStart(2,'0');
      return Number(`${y}${m}${d}`);
    }

    function applySort(){
      const cards = Array.from(grid.querySelectorAll('.pf-card'));
      cards.sort((a,b) => {
        const ak = dateToKey(a.dataset.date);
        const bk = dateToKey(b.dataset.date);
        return sortDir === 'desc' ? (bk - ak) : (ak - bk);
      });
      // Re-append in sorted order
      const frag = document.createDocumentFragment();
      cards.forEach(c => frag.appendChild(c));
      grid.appendChild(frag);
    }

    function filteredCards(){
      const all = Array.from(grid.querySelectorAll('.pf-card'));
      const proj = selProject ? selProject.value : 'all';
      const yr = selDate ? selDate.value : 'all';
      const loc = selLoc ? selLoc.value : 'all';
      return all.filter(c => {
        const okProj = proj === 'all' || (c.dataset.project === proj);
        const okYear = yr === 'all' || ((c.dataset.date || '').startsWith(yr));
        const okLoc = loc === 'all' || (c.dataset.loc === loc);
        return okProj && okYear && okLoc;
      });
    }

    function renderPage(){
      const cards = filteredCards();
      const size = pageSize();
      const total = cards.length;
      const pages = Math.max(1, Math.ceil(total / size));
      if (page > pages) page = pages;

      // Hide all, then show current slice
      grid.querySelectorAll('.pf-card').forEach(c => c.style.display = 'none');
      const start = (page - 1) * size;
      const slice = cards.slice(start, start + size);
      slice.forEach(c => c.style.display = '');

      // Empty state
      let empty = root.querySelector('.pf-empty');
      if (!empty) {
        empty = document.createElement('p');
        empty.className = 'pf-empty';
        empty.textContent = 'No projects match your filters.';
        empty.style.opacity = '0.8';
        grid.parentElement.insertBefore(empty, grid.nextSibling);
      }
      empty.style.display = slice.length === 0 ? '' : 'none';

      // Build pager
      if (pager) {
        pager.innerHTML = '';
        const addBtn = (label, targetPage, isCurrent=false) => {
          const b = document.createElement('button');
          b.className = 'pager-btn';
          b.textContent = label;
          if (isCurrent) b.setAttribute('aria-current', 'page');
          b.disabled = isCurrent;
          b.addEventListener('click', () => { page = targetPage; renderPage(); });
          pager.appendChild(b);
        };

        // Prev
        const prev = document.createElement('button');
        prev.className = 'pager-btn';
        prev.textContent = 'Prev';
        prev.disabled = page <= 1;
        prev.addEventListener('click', () => { if (page > 1) { page--; renderPage(); } });
        pager.appendChild(prev);

        for (let i=1;i<=pages;i++) addBtn(String(i), i, i===page);

        // Next
        const next = document.createElement('button');
        next.className = 'pager-btn';
        next.textContent = 'Next';
        next.disabled = page >= pages;
        next.addEventListener('click', () => { if (page < pages) { page++; renderPage(); } });
        pager.appendChild(next);
      }
    }

    // Filtering (selects) -> reset to page 1
    function onFilterChange(){ page = 1; renderPage(); }
    if (selProject) selProject.addEventListener('change', onFilterChange);
    if (selDate) selDate.addEventListener('change', onFilterChange);
    if (selLoc) selLoc.addEventListener('change', onFilterChange);

    // Sorting toggle
    if (btnSort) {
      const updateBtn = () => {
        btnSort.textContent = sortDir === 'desc' ? 'Sort: Newest' : 'Sort: Oldest';
        btnSort.setAttribute('aria-pressed', sortDir === 'desc' ? 'true' : 'false');
      };
      updateBtn();
      btnSort.addEventListener('click', () => {
        sortDir = sortDir === 'desc' ? 'asc' : 'desc';
        updateBtn();
        applySort();
        page = 1; // reset pagination after sort change
        renderPage();
      });
    }

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.pf-card');
      if (card) {
        const item = cardData.get(card);
        if (item) openModal(item);
      }
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.pf-card');
        if (card) { e.preventDefault(); const item = cardData.get(card); if (item) openModal(item); }
      }
    });

    // Rerender on resize to adapt page size
    window.addEventListener('resize', () => renderPage());

    // NEW: fetch data and paint cards before initial render
    try {
  const dataRes = await fetch(resolveUrl('portfolio-data.json'), { cache: 'no-cache' });
      if (!dataRes.ok) throw new Error(`Failed to fetch dataset: ${dataRes.status}`);
      const items = await dataRes.json();
      renderCardsIntoGrid(items, grid);
      // Map each card element to its source data for modal
      const cards = Array.from(grid.querySelectorAll('.pf-card'));
      cards.forEach((card, idx) => { cardData.set(card, items[idx]); });
      // Default sort: newest first
      applySort();
    } catch (err) {
      console.error(err);
      // Optional: simple failure fallback
      grid.innerHTML = '<p style="opacity:.8">Failed to load projects.</p>';
    }

    // Initial render (after cards exist)
    renderPage();
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadInto('portfolio', 'portfolio.html');
  });

  window.Portfolio = { loadInto };
})();
