(() => {
  'use strict';
  document.documentElement.classList.add('js');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Mobile menu ---------- */
  const header = $('.site-header');
  const menuBtn = $('.menu-button');
  const mobileNav = $('#mobile-nav');
  const setMenu = (open) => {
    menuBtn.setAttribute('aria-expanded', String(open));
    mobileNav.hidden = !open;
  };
  menuBtn.addEventListener('click', () => setMenu(mobileNav.hidden));
  mobileNav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (!mobileNav.hidden && !e.target.closest('.site-header')) setMenu(false);
  });

  /* ---------- Header state + active nav ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navLinks = $$('.nav a');
  const sections = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
  const setActive = (id) => navLinks.forEach((a) => a.classList.toggle('is-active', a.dataset.nav === id));
  setActive('works');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => io.observe(s));
  }

  /* ---------- Carousel ---------- */
  const track = $('#project-track');
  const allCards = $$('.project', track);
  const current = $('#current-slide');
  const total = $('#total-slides');
  const progress = $('.progress i');
  const prev = $('#prev');
  const next = $('#next');

  const visible = () => allCards.filter((c) => !c.hidden);
  const step = () => {
    const c = visible()[0];
    return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16) : 0;
  };
  const update = () => {
    const cards = visible();
    const n = cards.length;
    const max = track.scrollWidth - track.clientWidth;
    const idx = max <= 2 ? 0 : Math.round(track.scrollLeft / (step() || 1));
    const shown = Math.min(n, idx + 1);
    current.textContent = String(shown).padStart(2, '0');
    total.textContent = String(n).padStart(2, '0');
    const ratio = max <= 2 ? 1 : Math.min(1, Math.max(0, track.scrollLeft / max));
    progress.style.width = `${Math.max(8, ratio * 100)}%`;
    prev.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= max - 2;
  };
  const move = (dir) => track.scrollBy({ left: dir * step(), behavior: 'smooth' });
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  track.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); move(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1); }
  });

  // vertical wheel → horizontal scroll only when using a trackpad-like shift
  track.addEventListener('wheel', (e) => {
    if (e.shiftKey && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      track.scrollLeft += e.deltaY;
    }
  }, { passive: false });

  // drag to scroll (mouse)
  let drag = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; track.classList.add('is-dragging'); }
    if (drag.moved) track.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    const wasMoved = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (wasMoved) {
      // snap to nearest card
      const s = step();
      track.scrollTo({ left: Math.round(track.scrollLeft / s) * s, behavior: 'smooth' });
      track.dataset.justDragged = '1';
      setTimeout(() => delete track.dataset.justDragged, 50);
    }
  });

  /* ---------- Filters ---------- */
  $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    $$('.filter').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    allCards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(' ');
      card.hidden = !(f === 'all' || tags.includes(f) || tags.includes('all'));
    });
    track.scrollTo({ left: 0, behavior: 'auto' });
    update();
  }));

  /* ---------- Card links: ignore click right after a drag ---------- */
  $$('.project__open', track).forEach((a) => a.addEventListener('click', (e) => {
    if (track.dataset.justDragged) e.preventDefault();
  }));

  /* ---------- Back to top ---------- */
  $$('a[href="#top"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search);
  }));

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const ro = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); ro.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el) => ro.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Russian typography: no hanging prepositions ---------- */
  const walker = document.createTreeWalker($('main'), NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((n) => {
    if (!/[А-Яа-яЁё]/.test(n.nodeValue)) return;
    n.nodeValue = n.nodeValue.replace(/(^|[\s(«—])([А-Яа-яЁё]{1,2})\s+(?=\S)/g, '$1$2 ');
  });

  update();
})();
