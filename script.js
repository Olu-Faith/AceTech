/* ==========================================================================
   AceTech Studios — script.js
   Libraries: GSAP + ScrollTrigger (loaded in index.html)

   PART A — Core behaviour (works with or without GSAP)
     A1. Header shadow on scroll
     A2. Mobile menu
     A3. Scroll-spy (active nav link)
     A4. FAQ accordion
     A5. Footer year
   PART B — Motion (only runs if GSAP loaded and motion is allowed)
     B1. Helpers (split words, inline SVG icons, ScrollTrigger config)
     B2. Hero entrance timeline
     B3. Section headings
     B4. Reveal cards on scroll (batched, staggered)
     B5. SVG icon draw-in
     B6. Scroll-linked effects (progress line, process line, image parallax)
     B7. Count-up numbers
     B8. Small details (plan flag, quote marks, protocol rows)
     B9. Magnetic buttons
   ========================================================================== */
(() => {
  'use strict';

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const root         = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canAnimate   = Boolean(window.gsap && window.ScrollTrigger) && !reduceMotion;

  // GSAP is ready (or not needed): cancel the safety timer set in <head>.
  clearTimeout(window.__jsGuard);
  // No GSAP or reduced motion: drop the .js class so nothing stays hidden.
  if (!canAnimate) root.classList.remove('js');

  const header = $('#header');
  const nav    = $('#nav');
  const burger = $('#burger');

  /* ======================================================================
     PART A — CORE BEHAVIOUR
     ====================================================================== */

  /* A1. HEADER SHADOW */
  const onScroll = () => header.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* A2. MOBILE MENU */
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

    // Links glide in one after another when the menu opens
    if (open && canAnimate) {
      gsap.fromTo('.nav__link, .nav__cta',
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: .45, stagger: .05, delay: .08, ease: 'power3.out', clearProps: 'all' });
    }
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));
  matchMedia('(min-width: 900px)').addEventListener('change', () => setMenu(false));

  /* A3. SCROLL-SPY
     Each <section data-nav="x"> maps to the nav link href="#x".
     A thin band in the middle of the viewport decides the current section. */
  const links = $$('.nav__link');
  const setActive = (id) => links.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`));
  const band = { rootMargin: '-45% 0px -50% 0px' };

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.isIntersecting && setActive(e.target.dataset.nav));
  }, band);
  $$('[data-nav]').forEach((s) => spy.observe(s));
  new IntersectionObserver(([e]) => e.isIntersecting && setActive(''), band).observe($('.hero'));

  /* A4. FAQ ACCORDION (one open at a time; height animation is CSS) */
  const questions = $$('.faq__q');
  questions.forEach((btn) => btn.addEventListener('click', () => {
    const willOpen = btn.getAttribute('aria-expanded') !== 'true';
    questions.forEach((q) => q.setAttribute('aria-expanded', 'false'));
    btn.setAttribute('aria-expanded', willOpen);
  }));

  /* A5. FOOTER YEAR */
  $('#year').textContent = new Date().getFullYear();

  if (!canAnimate) return;   // everything below needs GSAP

  /* ======================================================================
     PART B — MOTION (GSAP + ScrollTrigger)
     ====================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  /* B1. HELPERS ---------------------------------------------------------- */

  // ScrollTrigger config used almost everywhere: plays once when the element
  // reaches `start`. end:'max' means it still fires if the page is loaded
  // already scrolled past the element (e.g. after a refresh mid-page).
  const when = (trigger, start = 'top 85%') => ({ trigger, start, end: 'max', once: true });

  // Wraps every word in <span class="w"><span class="wi">word</span></span>
  // so words can slide up from behind a mask. Keeps nested <em> intact.
  const splitWords = (el) => {
    el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());   // screen readers read the full heading
    const walk = (node) => [...node.childNodes].forEach((child) => {
      if (child.nodeType === 1) return walk(child);
      if (child.nodeType !== 3) return;
      const frag = document.createDocumentFragment();
      child.textContent.split(/(\s+)/).filter(Boolean).forEach((token) => {
        if (/^\s+$/.test(token)) return frag.append(token);
        const outer = Object.assign(document.createElement('span'), { className: 'w' });
        const inner = Object.assign(document.createElement('span'), { className: 'wi', textContent: token });
        outer.setAttribute('aria-hidden', 'true');
        outer.append(inner);
        frag.append(outer);
      });
      child.replaceWith(frag);
    });
    walk(el);
    return $$('.wi', el);
  };

  // SVG icons use <use> from a sprite, whose inner paths can't be styled from
  // outside. Copy the symbol's shapes into the <svg> so each stroke can be
  // "drawn" by animating stroke-dashoffset.
  const inlineIcon = (svg) => {
    const symbol = $($('use', svg).getAttribute('href'));
    svg.setAttribute('viewBox', symbol.getAttribute('viewBox'));
    svg.innerHTML = symbol.innerHTML;
    return $$('path, circle, rect', svg).map((shape) => {
      const len = shape.getTotalLength();
      shape.style.strokeDasharray  = len;
      shape.style.strokeDashoffset = len;
      shape.style.opacity = 0;          // hides the round-cap dot at stroke start
      return shape;
    });
  };
  const drawIcon = (shapes, vars = {}) => gsap.timeline(vars)
    .set(shapes, { opacity: 1 })
    .to(shapes, { strokeDashoffset: 0, duration: .9, ease: 'power2.inOut', stagger: .12 });

  /* B2. HERO ENTRANCE ----------------------------------------------------- */
  const [meta, title, lead, cta, checks, showcase] = $$('.hero__inner > *');
  const titleWords = splitWords(title);
  gsap.set([title, cta, checks], { opacity: 1 });      // containers visible; their contents animate
  gsap.set(titleWords, { yPercent: 115 });

  const checkIcons = $$('svg[data-draw]', checks).map(inlineIcon);

  const hero = gsap.timeline({ defaults: { ease: 'power3.out' } });
  hero
    .from(header,  { yPercent: -100, duration: .7, clearProps: 'transform' }, 0)
    .fromTo(meta,  { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: .6 }, .1)
    .to(titleWords, { yPercent: 0, duration: .9, stagger: .06 }, .2)
    .fromTo(lead,  { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .7 }, .6)
    .from(cta.children, { y: 18, opacity: 0, duration: .6, stagger: .1 }, .75)
    .from($$('li', checks), { y: 12, opacity: 0, duration: .5, stagger: .12 }, .95)
    .fromTo(showcase, { y: 70, opacity: 0, scale: .96, transformOrigin: '50% 0' },
                      { y: 0, opacity: 1, scale: 1, duration: 1.1 }, .9);
  checkIcons.forEach((shapes, i) => hero.add(drawIcon(shapes), 1.1 + i * .12));

  /* B3. SECTION HEADINGS -------------------------------------------------- */
  // Eyebrow fades up, heading words slide up, side note follows.
  $$('.section__head').forEach((head) => {
    head.classList.remove('reveal');                   // the head animates its own children instead
    const note = $('.section__note, .standard', head);
    const tl = gsap.timeline({ scrollTrigger: when(head) })
      .from($('.eyebrow', head), { y: 14, opacity: 0, duration: .5 })
      .from(splitWords($('h2', head)), { yPercent: 115, duration: .85, stagger: .05 }, .05);
    if (note) tl.from(note, { y: 14, opacity: 0, duration: .6 }, .3);
  });
  // Headings that sit inside cards (About, Contact)
  $$('.ethos h2, .cta h2').forEach((h2) => {
    gsap.from(splitWords(h2), { yPercent: 115, duration: .85, stagger: .05, scrollTrigger: when(h2, 'top 88%') });
  });

  /* B4. REVEAL CARDS ON SCROLL --------------------------------------------
     Elements entering together (a row of cards, the FAQ list…) are staggered. */
  ScrollTrigger.batch('.reveal', {
    start: 'top 90%', end: 'max', once: true,
    onEnter: (els) => gsap.fromTo(els,
      { y: 28, opacity: 0 },
      { y: 0, opacity: 1, duration: .85, stagger: .1, overwrite: true,
        onComplete: () => els.forEach((el) => {
          el.classList.remove('reveal');               // hand control back to the CSS hover styles
          gsap.set(el, { clearProps: 'all' });
        }) })
  });

  /* B5. SVG ICON DRAW-IN (outside the hero) -------------------------------- */
  $$('svg[data-draw]').filter((svg) => !checks.contains(svg)).forEach((svg) => {
    drawIcon(inlineIcon(svg), { scrollTrigger: when(svg, 'top 92%') });
  });

  /* B6. SCROLL-LINKED EFFECTS --------------------------------------------- */
  // Reading-progress line under the header (CSS reads --progress)
  gsap.fromTo(header, { '--progress': 0 }, { '--progress': 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  // Process line that fills as the steps scroll past (CSS reads --p; shown on desktop)
  gsap.fromTo('.steps', { '--p': 0 }, { '--p': 1, ease: 'none',
    scrollTrigger: { trigger: '.steps', start: 'top 75%', end: 'bottom 60%', scrub: .4 } });

  // Gentle parallax on showcase and case-study images
  $$('.showcase__main img, .case__img img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -7, scale: 1.16 }, { yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* B7. COUNT-UP NUMBERS (data-count="N") ---------------------------------- */
  $$('[data-count]').forEach((el) => {
    const counter = { value: 0 };
    el.textContent = 0;
    gsap.to(counter, { value: Number(el.dataset.count), duration: 1.6, ease: 'power2.out', snap: { value: 1 },
      onUpdate: () => { el.textContent = counter.value; },
      scrollTrigger: when(el, 'top 92%') });
  });

  /* B8. SMALL DETAILS ------------------------------------------------------ */
  gsap.from('.plan__flag', { y: -10, opacity: 0, duration: .6, ease: 'back.out(2)', clearProps: 'transform', scrollTrigger: when('.pricing', 'top 70%') });
  gsap.from('.quote__mark', { scale: 0, rotate: -40, duration: .7, stagger: .15, ease: 'back.out(2.2)', scrollTrigger: when('.quote', 'top 85%') });
  gsap.from('.protocol__list li', { x: -18, opacity: 0, duration: .6, stagger: .12, scrollTrigger: when('.protocol', 'top 85%') });

  /* B9. MAGNETIC BUTTONS (mouse only) -------------------------------------- */
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    $$('.hero__cta .btn, .cta__actions .btn, .nav__cta').forEach((btn) => {
      btn.classList.add('magnetic');                   // CSS stops transitioning transform so GSAP owns it
      const moveX = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' });
      const moveY = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        moveX((e.clientX - r.left - r.width  / 2) * .25);
        moveY((e.clientY - r.top  - r.height / 2) * .3);
      });
      btn.addEventListener('pointerleave', () => { moveX(0); moveY(0); });
    });
  }

  /* Re-measure trigger positions once fonts and images have settled layout */
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();