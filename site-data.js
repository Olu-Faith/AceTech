/* ==========================================================================
   SITE DATA + PROJECT RENDERING  (site-data.js)
   WHERE: save next to script.js and load it BEFORE script.js:
            <script src="site-data.js"></script>
            <script src="script.js"></script>

   This one file feeds BOTH places your projects appear:
     1) the rotating preview in the hero
     2) the case-study cards in the "Selected Work" section
   ========================================================================== */


/* ==========================================================================
   YOUR PROJECTS — EDIT ONLY THIS BLOCK
   --------------------------------------------------------------------------
   !!  THE THREE PROJECTS BELOW ARE DUMMY DATA. Replace them with real ones.

   To ADD a project:    copy one { ... } block, paste it after the last one
                        (keep the comma between blocks), then edit the values.
   To REMOVE a project: delete its whole { ... } block.
   Order here = order on the page.

   Fields
     title         Project name.
     tags          Up to 3 short labels, e.g. ['Product Design', 'Mobile App'].
     summary       One or two sentences about the project.
     outcome       The result, e.g. 'Cut checkout time by 40%.'
     footnote      Small grey line at the bottom left of the card
                   (e.g. the stack or what you delivered).
     image         Screenshot path. Recommended: 1600 x 1000 px (16:10),
                   WebP or JPG, under ~200 KB. Used in the hero AND the card.
                   If the file is missing, a neutral placeholder shows instead.
     imageAlt      Short description of the image for screen readers.
     featured      true = also shown in the hero preview (best: 3 projects).
     caseStudyUrl  Optional. Link to a full case study page.
     liveUrl       Optional. Link to the live site or app store page.
                   Card link priority: caseStudyUrl -> liveUrl -> contact form.
   ========================================================================== */
const SITE_PROJECTS = [
  {
    title: 'Living Hope Care Foundation',
    tags: ['Product Design', 'Web development'],
    summary: 'A web platform for a non-profit organization that provides care and support to vulnerable children and families.',
    outcome: 'Provided a digital presence for LIHOC',
    footnote: 'Website design + development',
    image: 'images/LIHOC.png',
    imageAlt: 'Living Hope Care Foundation website screens',
    featured: true,
    caseStudyUrl: '',
    liveUrl: ''
  },
  {
    title: 'TaxFlow Mobile App',
    tags: ['Product Design', 'Mobile App'],
    summary: 'Simple app to help users file their taxes and track their tax history with ease.',
    outcome: 'Making tax easier for the layman',
    footnote: 'Design System + Mobile App',
    image: 'images/taxflow.png',
    imageAlt: 'TaxFlow Mobile App screens in a phone frame',
    featured: true,
    caseStudyUrl: '',
    liveUrl: ''
  },
  {
    title: 'Talnts Studio',
    tags: ['Product Design', 'Web development'],
    summary: 'A full platform for creators to showcase, sell and manage their digital products and services.',
    outcome: 'Empowering professionals across West Africa.',
    footnote: 'Next.js + Tailwind',
    image: 'images/talnts.png',
    imageAlt: 'Talnts Studio website screen',
    featured: true,
    caseStudyUrl: '',
    liveUrl: ''
  }
];

/* Hero preview behaviour */
const HERO_PREVIEW = {
  maxSlides: 3,        // how many featured projects to cycle through
  intervalMs: 5000     // time on each project (ignored if visitor prefers reduced motion)
};
/* ======================= END OF EDITABLE DATA ============================== */


/* ==========================================================================
   RENDERING — you should not need to edit anything below this line
   ========================================================================== */
(() => {
  'use strict';

  /* Small helper: create an element safely (text is never parsed as HTML) */
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const makeImage = (project, eager) => {
    const img = el('img');
    img.src = project.image;
    img.alt = project.imageAlt || `${project.title} preview`;
    img.loading = eager ? 'eager' : 'lazy';
    img.addEventListener('error', () => img.remove());   // missing file: the placeholder label shows through
    return img;
  };
  const pad = (n) => String(n).padStart(2, '0');

  /* ---- 1) WORK SECTION: one case card per project ----------------------------- */
  const grid = document.querySelector('[data-work-grid]');
  if (grid) {
    const pipeline = grid.querySelector('[data-work-pipeline]');
    SITE_PROJECTS.forEach((p, i) => {
      const card = el('article', 'card case reveal');

      const media = el('div', 'media case__img');
      media.dataset.label = p.title;
      media.append(makeImage(p, false), el('span', 'badge badge--dark mono', `Case // ${pad(i + 1)}`));

      const tags = el('p', 'tags');
      (p.tags || []).slice(0, 3).forEach((t) => tags.append(el('span', 'tag', t)));

      const outcome = el('p', 'outcome');
      outcome.append(el('b', 'mono', 'Outcome:'), ` ${p.outcome}`);

      const foot = el('footer', 'card__foot mono');
      foot.append(el('span', 'muted', p.footnote || ''));
      const link = el('a', 'link');
      if (p.caseStudyUrl)  { link.href = p.caseStudyUrl; link.textContent = 'View case study →'; }
      else if (p.liveUrl)  { link.href = p.liveUrl; link.textContent = 'Visit live site ↗'; link.target = '_blank'; link.rel = 'noopener noreferrer'; }
      else                 { link.href = '#contact'; link.textContent = 'Start a similar project →'; }
      foot.append(link);

      const body = el('div', 'case__body');
      body.append(tags, el('h3', '', p.title), el('p', 'muted', p.summary), outcome, foot);

      card.append(media, body);
      grid.insertBefore(card, pipeline);                  // before the pipeline card (or at the end if there is none)
    });
  }

  /* ---- 2) HERO PREVIEW: rotating look at the featured projects ---------------- */
  const peek = document.querySelector('[data-peek]');
  let slidesSource = SITE_PROJECTS.filter((p) => p.featured).slice(0, HERO_PREVIEW.maxSlides);
  if (!slidesSource.length) slidesSource = SITE_PROJECTS.slice(0, HERO_PREVIEW.maxSlides);
  if (!peek || !slidesSource.length) return;

  const q = (s) => peek.querySelector(s);
  const viewport = q('[data-peek-viewport]'), nav = q('[data-peek-nav]'), pauseBtn = q('[data-peek-pause]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const auto = !reduced && slidesSource.length > 1;
  const total = slidesSource.length;
  let current = 0, timer = 0, userPaused = false;

  peek.style.setProperty('--peek-ms', `${HERO_PREVIEW.intervalMs}ms`);
  if (!auto) peek.classList.add('no-auto');

  const slides = slidesSource.map((p, i) => {
    const slide = el('figure', 'peek__slide');
    slide.append(el('span', 'peek__ph', p.title), makeImage(p, i === 0));
    viewport.append(slide);
    return slide;
  });
  const dots = slidesSource.map((p, i) => {
    const dot = el('button', 'peek__dot');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show ${p.title}`);
    dot.addEventListener('click', () => show(i));   // hover/focus already holds rotation; it resumes when the visitor leaves
    nav.append(dot);
    return dot;
  });
  if (total < 2) nav.hidden = true;

  function show(index) {
    current = (index + total) % total;
    const p = slidesSource[current];
    slides.forEach((s, i) => { s.classList.toggle('is-active', i === current); s.setAttribute('aria-hidden', i === current ? 'false' : 'true'); });
    dots.forEach((d, i) => { d.classList.toggle('is-active', i === current); d.toggleAttribute('aria-current', i === current); });
    q('[data-peek-title]').textContent = p.title;
    q('[data-peek-count]').textContent = `${pad(current + 1)} / ${pad(total)}`;
    q('[data-peek-name]').textContent = p.title;
    q('[data-peek-tags]').textContent = (p.tags || []).slice(0, 2).join(' · ');
  }

  /* Auto-rotation. Pauses on hover, keyboard focus, hidden tab, or the Pause button. */
  function schedule() {
    clearTimeout(timer);
    peek.classList.remove('is-paused');
    dots[current].classList.remove('is-active'); void dots[current].offsetWidth; dots[current].classList.add('is-active');   // restart progress bar
    timer = setTimeout(() => { show(current + 1); schedule(); }, HERO_PREVIEW.intervalMs);
  }
  function hold() { clearTimeout(timer); peek.classList.add('is-paused'); }
  const resumeIfAllowed = () => { if (auto && !userPaused && !document.hidden) schedule(); };

  show(0);
  if (auto) {
    schedule();
    peek.addEventListener('pointerenter', hold);
    peek.addEventListener('pointerleave', resumeIfAllowed);
    peek.addEventListener('focusin', hold);
    peek.addEventListener('focusout', (e) => { if (!peek.contains(e.relatedTarget)) resumeIfAllowed(); });
    document.addEventListener('visibilitychange', () => (document.hidden ? hold() : resumeIfAllowed()));
    pauseBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      pauseBtn.setAttribute('aria-pressed', userPaused);
      pauseBtn.textContent = userPaused ? 'Play' : 'Pause';
      userPaused ? hold() : schedule();
    });
  }
})();