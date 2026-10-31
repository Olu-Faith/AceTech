/* ==========================================================================
   CONTACT  (contact.js)
   WHERE: save next to script.js and add  <script src="contact.js"></script>
          just BEFORE the <script src="script.js"> line.

   Does three things:
     1) wires every WhatsApp and "book a call" link on the page
     2) validates and sends the intake form to your Google Sheet
     3) shows the thank-you panel with "Book a call now" + WhatsApp
   ========================================================================== */


/* ==========================================================================
   YOUR CONTACT SETTINGS — EDIT ONLY THIS BLOCK
   ========================================================================== */
const CONTACT_CONFIG = {

  // Your WhatsApp Business number. Any normal Nigerian format works:
  //   '08031234567'   '+234 803 123 4567'   '2348031234567'
  // Leave '' to hide the WhatsApp buttons until you are ready.
  whatsappNumber: '+2348115049208',

  // The message WhatsApp pre-fills for the visitor (they only tap send)
  whatsappMessage: "Hi AceTech, I'd like to discuss a project",

  // Your Calendly or Cal.com link, e.g. 'https://calendly.com/yourname/discovery-call'
  // Leave '' to hide the "Book a call" buttons until you are ready.
  bookingUrl: '',

  // The Google Apps Script "Web app" URL that saves leads to your Sheet
  // (ends with /exec). You get it in step 2 of the setup guide.
  // While this is '' the form falls back to opening the visitor's email app.
  formEndpoint: '',

  // Only used by the email fallback above
  fallbackEmail: 'faithdanieloluwafemi@gmail.com'
};
/* ============================ END OF SETTINGS ============================== */


(() => {
  'use strict';

  const cfg = CONTACT_CONFIG;
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---- Helpers ------------------------------------------------------------ */

  // Turns '0803 123 4567', '+234 803...', '2348031234567' into '2348031234567'.
  // Numbers from other countries (e.g. +44...) are kept as they are.
  function normalizeNumber(raw) {
    let d = String(raw || '').replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('234')) return d;
    if (d.startsWith('0')) return '234' + d.slice(1);
    if (d.length === 10) return '234' + d;
    return d;
  }
  const waNumber = normalizeNumber(cfg.whatsappNumber);
  const waLink = (message) => `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

  function bookingLink(name, email) {                   // pre-fills name and email on Calendly / Cal.com
    if (!cfg.bookingUrl) return '';
    try {
      const url = new URL(cfg.bookingUrl);
      if (name)  url.searchParams.set('name', name);
      if (email) url.searchParams.set('email', email);
      return url.toString();
    } catch { return cfg.bookingUrl; }
  }

  /* ---- 1) Wire WhatsApp + booking links across the page ------------------------- */
  // data-wa            : becomes a WhatsApp link (optional data-wa-message="...")
  // data-book-call     : becomes a booking link
  // data-wa-only / data-book-only : hide the element completely until configured;
  //                                 without them it keeps its normal href (e.g. #contact)
  $$('[data-wa]').forEach((a) => {
    if (!waNumber) { if (a.hasAttribute('data-wa-only')) (a.closest('li') || a).setAttribute('hidden', ''); return; }
    a.href = waLink(a.dataset.waMessage || cfg.whatsappMessage);
    a.target = '_blank'; a.rel = 'noopener noreferrer';
  });
  $$('[data-book-call]').forEach((a) => {
    if (!cfg.bookingUrl) { if (a.hasAttribute('data-book-only')) (a.closest('li') || a).setAttribute('hidden', ''); return; }
    a.href = bookingLink(); a.target = '_blank'; a.rel = 'noopener noreferrer';
  });

  // Floating WhatsApp button: tucks away while the contact section is visible
  const floatBtn = $('.wa-float'), contactSection = $('#contact');
  if (floatBtn && contactSection) {
    new IntersectionObserver(([e]) => floatBtn.classList.toggle('is-away', e.isIntersecting), { threshold: 0.15 }).observe(contactSection);
  }

  /* ---- 2) The intake form ------------------------------------------------------------ */
  const form = $('#project-form');
  if (!form) return;

  const thanks = $('#form-thanks'), formError = $('#form-error');
  const submitBtn = $('button[type="submit"]', form), submitLabel = $('[data-label]', submitBtn);
  const pageLoadedAt = Date.now();

  // Source tracking: add ?utm_source=... to links you send people (e.g. in outreach)
  const params = new URLSearchParams(location.search);
  const utm = { utm_source: params.get('utm_source') || '', utm_medium: params.get('utm_medium') || '', utm_campaign: params.get('utm_campaign') || '' };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const field = (name) => form.elements[name];

  function classifyContact(value) {                       // 'email', 'whatsapp' or '' when invalid
    const v = value.trim();
    if (v.includes('@')) return EMAIL_RE.test(v) ? 'email' : '';
    const digits = v.replace(/\D/g, '');
    return /^[+\d\s()-]+$/.test(v) && digits.length >= 10 && digits.length <= 15 ? 'whatsapp' : '';
  }

  function validate() {
    const v = (n) => field(n).value.trim();
    const errors = {};
    if (v('name').length < 2)                 errors.name = 'Please enter your name.';
    if (!classifyContact(v('contact')))       errors.contact = 'Enter a valid email address or WhatsApp number.';
    if (!v('service'))                        errors.service = 'Choose what you need.';
    if (v('project').length < 10)             errors.project = 'Please add a short description of the project.';
    if (!v('budget'))                         errors.budget = 'Choose a range, or "Not sure yet".';
    if (!v('timeline'))                       errors.timeline = 'Choose when you need it.';
    return errors;
  }

  function showErrors(errors) {
    ['name', 'contact', 'service', 'project', 'budget', 'timeline'].forEach((n) => {
      const msg = $(`#err-${n}`), wrap = field(n).closest('.field');
      msg.hidden = !errors[n];
      msg.textContent = errors[n] || '';
      wrap.classList.toggle('has-error', Boolean(errors[n]));
      field(n).setAttribute('aria-invalid', errors[n] ? 'true' : 'false');
    });
    const first = Object.keys(errors)[0];
    if (first) field(first).focus();
  }
  // Clear a field's error as soon as the visitor fixes it
  ['input', 'change'].forEach((evt) => form.addEventListener(evt, (e) => {
    const n = e.target.name, wrap = e.target.closest('.field');
    if (wrap && wrap.classList.contains('has-error') && !validate()[n]) { $(`#err-${n}`).hidden = true; wrap.classList.remove('has-error'); e.target.setAttribute('aria-invalid', 'false'); }
  }));

  function setSending(on) {
    submitBtn.setAttribute('aria-busy', on);
    submitBtn.disabled = on;
    submitLabel.textContent = on ? 'Sending…' : 'Send my request';
  }

  function collect() {
    const v = (n) => field(n).value.trim();
    const type = classifyContact(v('contact'));
    return {
      name: v('name'),
      contact: type === 'whatsapp' ? '+' + normalizeNumber(v('contact')) : v('contact'),
      contactType: type === 'email' ? 'Email' : 'WhatsApp',
      service: v('service'), project: v('project'), budget: v('budget'), timeline: v('timeline'), source: v('source'),
      ...utm,
      page: location.origin + location.pathname,
      elapsedMs: Date.now() - pageLoadedAt,               // very fast submits are treated as bots by the script
      hp: v('company_website')                            // honeypot
    };
  }

  async function send(data) {
    // No endpoint yet: open the visitor's email app with everything pre-filled
    if (!cfg.formEndpoint) {
      console.warn('[contact.js] formEndpoint is empty: using the email fallback. Add your Apps Script URL in CONTACT_CONFIG.');
      const body = `Name: ${data.name}\nContact: ${data.contact}\nService: ${data.service}\nBudget: ${data.budget}\nTimeline: ${data.timeline}\n\n${data.project}`;
      location.href = `mailto:${cfg.fallbackEmail}?subject=${encodeURIComponent('New project: ' + data.service)}&body=${encodeURIComponent(body)}`;
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      // no-cors: Google's script URL cannot be read from another site, but the data is still delivered.
      // A thrown error here means the request never left (offline, blocked, timed out).
      await fetch(cfg.formEndpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data), signal: controller.signal });
    } finally { clearTimeout(timer); }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;
    const errors = validate();
    showErrors(errors);
    if (Object.keys(errors).length) return;

    const data = collect();
    if (data.hp) { showThanks(data); return; }            // bot: pretend it worked, send nothing
    setSending(true);
    try {
      await send(data);
      showThanks(data);
    } catch {
      formError.innerHTML = 'Something went wrong sending that. Please try again' + (waNumber ? `, or <a href="${waLink('Hi AceTech, I tried the form but it failed. ' + data.project.slice(0, 200))}" target="_blank" rel="noopener noreferrer">message us on WhatsApp</a>.` : '.');
      formError.hidden = false;
    } finally { setSending(false); }
  });

  /* ---- 3) Thank-you panel ---------------------------------------------------------------- */
  function showThanks(data) {
    const first = data.name.split(' ')[0];
    $('[data-thanks-title]', thanks).textContent = `Thanks ${first}, we've got your request.`;
    $('[data-thanks-text]', thanks).textContent = data.contactType === 'Email'
      ? `We'll reply to ${data.contact} within 24 hours. Want to move faster? Pick a time to talk now.`
      : "We'll message you on WhatsApp within 24 hours. Want to move faster? Pick a time to talk now.";

    const book = $('[data-thanks-book]', thanks), wa = $('[data-thanks-wa]', thanks);
    book.hidden = !cfg.bookingUrl;
    if (cfg.bookingUrl) book.href = bookingLink(data.name, data.contactType === 'Email' ? data.contact : '');
    wa.hidden = !waNumber;
    if (waNumber) wa.href = waLink(`Hi AceTech, I'm ${data.name}. I just sent a project request through your website (${data.service}).`);

    form.hidden = true;
    thanks.hidden = false;
    thanks.focus();                                       // moves screen-reader and keyboard focus to the message
    thanks.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    document.dispatchEvent(new CustomEvent('acetech:lead', { detail: { service: data.service, contactType: data.contactType } }));
  }

  $('[data-again]', thanks).addEventListener('click', () => {
    form.reset();
    thanks.hidden = true; form.hidden = false;
    field('name').focus();
  });
})();