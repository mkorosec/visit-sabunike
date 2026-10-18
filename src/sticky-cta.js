// Sticky inquiry bar (state.stickyCta), phones only (< 760px). Appears once the
// hero has scrolled away, hides while the inquiry form or the footer is on
// screen. Wider screens have the always-visible header button instead.

import './sticky-cta.css';
import { getState, subscribe } from './state.js';
import { SITE } from './content/site.js';
import { UI } from './content/ui.js';
import { esc, icon, monthName, tr } from './lib/util.js';

// Slovenian and Croatian need the month inflected ("maja", "u svibnju"), so
// they take the month number; the others use the plain month name.
const SL_GEN = ['januarja', 'februarja', 'marca', 'aprila', 'maja', 'junija', 'julija', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra'];
const HR_LOC = ['siječnju', 'veljači', 'ožujku', 'travnju', 'svibnju', 'lipnju', 'srpnju', 'kolovozu', 'rujnu', 'listopadu', 'studenome', 'prosincu'];
const TRAVEL_IN = {
  en: (m) => `Travelling in ${m}?`,
  de: (m) => `Reisen Sie im ${m}?`,
  sl: (m, n) => `Pridete ${SL_GEN[n - 1]}?`,
  hr: (m, n) => `Dolazite u ${HR_LOC[n - 1]}?`,
  it: (m) => `In viaggio ${m.startsWith('a') ? 'ad' : 'a'} ${m}?`, // ad aprile, ad agosto
};

function content(state) {
  const lang = state.lang;
  const brand = SITE.names[state.brand] || SITE.names.apartments;
  const line = state.month ? (TRAVEL_IN[lang] || TRAVEL_IN.en)(monthName(state.month, lang, true), state.month) : tr(UI.noPlatformFees, lang);
  const wa = SITE.contact.whatsapp;
  return `<div class="sticky-cta-inner">
    <div class="sticky-cta-text"><strong>${esc(brand)}</strong><span>${esc(line)}</span></div>
    <div class="sticky-cta-actions">
      ${wa ? `<a class="btn sticky-cta-wa" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('chat', { size: 18 })}<span>WhatsApp</span></a>` : ''}
      <a class="btn btn-primary" href="#inquiry">${icon('calendar', { size: 18 })} ${esc(tr(UI.askDates, lang))}</a>
    </div>
  </div>`;
}

export function mountStickyCta() {
  const bar = document.createElement('div');
  bar.className = 'sticky-cta';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', tr(UI.askDates, getState().lang));
  document.body.append(bar);

  const phone = window.matchMedia('(max-width: 759px)');
  const seen = { hero: true, inquiry: false, footer: false };
  const sync = () => {
    const show = phone.matches && getState().stickyCta && !seen.hero && !seen.inquiry && !seen.footer;
    bar.classList.toggle('is-visible', show);
    bar.inert = !show;
    bar.setAttribute('aria-hidden', String(!show));
    document.documentElement.classList.toggle('has-sticky-cta', show);
  };

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) seen[e.target.id] = e.isIntersecting;
    sync();
  });
  // Sections are replaced on audience/lang changes, so re-observe each time.
  const observe = () => {
    io.disconnect();
    seen.hero = false;
    seen.inquiry = false;
    seen.footer = false;
    for (const id of ['hero', 'inquiry', 'footer']) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    sync();
  };
  const sections = document.getElementById('sections');
  new MutationObserver(observe).observe(sections, { childList: true });

  phone.addEventListener('change', sync);

  const draw = () => {
    bar.innerHTML = content(getState());
    bar.setAttribute('aria-label', tr(UI.askDates, getState().lang));
  };
  subscribe((state, changed) => {
    if (changed.some((k) => ['lang', 'brand', 'month'].includes(k))) draw();
    sync();
  });
  draw();
  observe();
}
