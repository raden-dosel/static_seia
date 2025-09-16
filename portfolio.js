// Portfolio component: loads partial and adds filtering + details behavior
(function(){
  async function loadInto(id, url){
    const el = document.getElementById(id);
    if (!el) return;
    const res = await fetch(url, { cache: 'no-cache' });
    el.innerHTML = await res.text();
    wire(el);
  }

  function wire(root){
    const grid = root.querySelector('.portfolio__grid');
    const pager = root.querySelector('.portfolio__pager');
    const details = root.querySelector('.portfolio__details');
    const title = details.querySelector('.details__title');
    const tags = details.querySelector('.details__tags');
    const desc = details.querySelector('.details__desc');

    // Filtering via selects
    const selProject = root.querySelector('#pfProject');
    const selDate = root.querySelector('#pfDate');
    const selLoc = root.querySelector('#pfLocation');

    // Pagination state
    const PAGE_SIZE_MOBILE = 4;
    const PAGE_SIZE_DESKTOP = 6;
  let page = 1;

    function pageSize(){ return matchMedia('(min-width: 768px)').matches ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE; }

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

    // Details pane update
    function select(card){
      title.textContent = card.dataset.title || 'Project';
      tags.textContent = card.dataset.tags || '';
      desc.textContent = card.dataset.desc || '';
    }

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.pf-card');
      if (card) select(card);
    });
    grid.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.pf-card');
        if (card) { e.preventDefault(); select(card); }
      }
    });
    // Rerender on resize to adapt page size
    window.addEventListener('resize', () => renderPage());

    // Initial render
    renderPage();
  }

  document.addEventListener('DOMContentLoaded', function(){
    loadInto('portfolio', 'portfolio.html');
  });

  window.Portfolio = { loadInto };
})();
