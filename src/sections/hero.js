// Hero: three variants (state.hero) — photo slideshow, split with the live 3D
// house, or text over a 3D terrain flyover — plus the "When are you coming?"
// month picker that other sections react to (state.month).

import './hero.css';
import { PHOTOS } from '../content/site.js';
import { esc, icon, photo, monthName, prefersReducedMotion } from '../lib/util.js';
import { airportRoadLabel, secondaryCta } from './core-shared.js';

// The 3D modules are built in parallel and may not exist yet; a glob import
// resolves to {} instead of breaking the build when a file is missing.
const LAZY = import.meta.glob(['../villa3d/viewer.js', '../maps/terrain3d.js']);

const SLIDES = {
  general: ['20210810_184724.jpg', 'napros/20210918_110141.jpg', 'app1-terrace.jpg', 'napros/20210918_155653.jpg'],
  families: ['napros/20210918_155653.jpg', 'napros/20210918_155421.jpg', 'grillarea.jpg', 'app1-terrace.jpg'],
  cyclists: ['napros/20210918_110141.jpg', 'napros/20210720_171714.jpg', 'driveway.jpg', 'napros/20210918_152134.jpg'],
  retreats: ['20210720_171634.jpg', 'grillarea.jpg', 'app2-terrace.jpg', 'napros/20210918_110141.jpg'],
};
const SLIDE_MS = 6500;

const L = {
  trustFamily: { en: 'Talk to the owners, not a call centre', de: 'Sie sprechen direkt mit den Eigentümern', sl: 'Govorite neposredno z lastniki', hr: 'Razgovarate izravno s vlasnicima', it: 'Parlate direttamente con i proprietari' },
  trustUnits: { en: '4 apartments · or the whole house', de: '4 Apartments · oder das ganze Haus', sl: '4 apartmaji · ali cela hiša', hr: '4 apartmana · ili cijela kuća', it: '4 appartamenti · o tutta la casa' },
  trustAirport: { en: 'by car from Zadar Airport', de: 'mit dem Auto vom Flughafen Zadar', sl: 'z avtom od letališča Zadar', hr: 'autom od zračne luke Zadar', it: 'in auto dall’aeroporto di Zadar' },
  bestFor: { en: 'best months for this trip', de: 'beste Monate für diese Reise', sl: 'najboljši meseci za to potovanje', hr: 'najbolji mjeseci za ovo putovanje', it: 'i mesi migliori per questo viaggio' },
  // Followed by the month name in the nominative, so the phrasing must not inflect it.
  picked: { en: 'We’ll tailor the page to', de: 'Wir passen die Seite an Ihren Reisemonat an:', sl: 'Stran prilagodimo za', hr: 'Stranicu prilagođavamo mjesecu:', it: 'Adattiamo la pagina al mese di' },
  pickedBest: { en: 'is one of the best months for this trip.', de: 'ist einer der besten Monate dafür.', sl: 'je eden najboljših mesecev za to potovanje.', hr: '– jedan od najboljih mjeseci za ovo putovanje.', it: 'è uno dei mesi migliori per questo viaggio.' },
  pause: { en: 'Pause slideshow', de: 'Diashow anhalten', sl: 'Ustavi diaprojekcijo', hr: 'Zaustavi prezentaciju', it: 'Metti in pausa' },
  live3d: { en: 'Live 3D model of the house · drag to look around', de: 'Live-3D-Modell des Hauses · ziehen zum Drehen', sl: '3D model hiše · povlecite za ogled', hr: '3D model kuće · povucite za pregled', it: 'Modello 3D della casa · trascinate per ruotare' },
  loading3d: { en: 'Loading the 3D house…', de: '3D-Haus wird geladen…', sl: 'Nalaganje 3D-modela hiše…', hr: 'Učitavanje 3D modela kuće…', it: 'Caricamento del modello 3D…' },
  no3d: { en: '3D preview unavailable on this device — showing a photo instead.', de: '3D-Vorschau hier nicht verfügbar — stattdessen ein Foto.', sl: '3D predogled ni na voljo — prikazujemo fotografijo.', hr: '3D pregled nije dostupan — prikazujemo fotografiju.', it: 'Anteprima 3D non disponibile — ecco una foto.' },
  pauseMotion: { en: 'Pause animation', de: 'Animation anhalten', sl: 'Ustavi animacijo', hr: 'Zaustavi animaciju', it: "Metti in pausa l'animazione" },
  openApartments: { en: 'See the four apartments', de: 'Die vier Apartments', sl: 'Oglejte si štiri apartmaje', hr: 'Pogledajte četiri apartmana', it: 'Scoprite i quattro appartamenti' },
};

function slideFiles(audience) {
  const list = [audience.hero.photo, ...(audience.hero.slides || SLIDES[audience.id] || SLIDES.general)].filter(Boolean);
  return [...new Set(list)].slice(0, 4);
}

function caption(file, ctx) {
  const p = PHOTOS.find((x) => x.file === file);
  return p ? ctx.t(p) : '';
}

function slideImg(file, ctx, i, attrs) {
  return `<img class="hero-slide${i === 0 ? ' is-active' : ''}" src="${photo(file)}" alt="" data-caption="${esc(caption(file, ctx))}" ${attrs} decoding="async" />`;
}

// Only the first slide is in the page; the others wait in a <template> (not
// downloaded) until the slideshow is about to show them, so they do not
// compete with the first photo, the LCP image. The map hero only needs a
// poster behind the terrain and adds the rest only if the terrain fails.
function slidesHtml(ctx, { poster = false } = {}) {
  const first = slideImg(slideFiles(ctx.audience)[0], ctx, 0, poster ? 'loading="lazy"' : 'fetchpriority="high"');
  return poster ? first : first + pendingSlidesHtml(ctx);
}

function pendingSlidesHtml(ctx) {
  return `<template data-slides>${slideFiles(ctx.audience).slice(1).map((file, k) => slideImg(file, ctx, k + 1, '')).join('')}</template>`;
}

function ctasHtml(ctx, light) {
  const second = secondaryCta(ctx);
  const primary = ctx.audience.hero?.primaryLabel || 'askDates';
  return `<div class="hero-ctas">
    <a class="btn btn-primary btn-lg" href="#inquiry" data-cta="hero">${icon('calendar')} ${esc(ctx.t(primary))}</a>
    ${second ? `<a class="btn ${light ? 'btn-glass' : ''} btn-lg" href="${esc(second.href)}">${esc(second.label)} ${icon('arrow', { size: 18 })}</a>` : ''}
  </div>`;
}

function trustHtml(ctx) {
  const items = [
    ['euro', ctx.t('noPlatformFees')],
    ['bed', ctx.t(L.trustUnits)],
    ['chat', ctx.t(L.trustFamily)],
    ['plane', `≈ ${airportRoadLabel()} ${ctx.t(L.trustAirport)}`],
  ];
  return `<ul class="hero-trust" role="list">${items
    .map(([ic, text, title]) => `<li${title ? ` title="${esc(title)}"` : ''}>${icon(ic, { size: 18 })}<span>${esc(text)}</span></li>`)
    .join('')}</ul>`;
}

function hint(ctx) {
  const m = ctx.state.month;
  if (!m) return `<span class="dot" aria-hidden="true"></span> ${esc(ctx.t(L.bestFor))}`;
  const name = monthName(m, ctx.lang, true);
  // The month opens the sentence here; sl/hr/it month names are lower case.
  if (ctx.audience.months?.includes(m)) return `<strong>${esc(name[0].toUpperCase() + name.slice(1))}</strong> ${esc(ctx.t(L.pickedBest))}`;
  return `${esc(ctx.t(L.picked))} <strong>${esc(name)}</strong>.`;
}

function monthsHtml(ctx) {
  const best = new Set(ctx.audience.months || []);
  const chips = [0, ...Array.from({ length: 12 }, (_, i) => i + 1)]
    .map((m) => {
      const label = m ? monthName(m, ctx.lang) : ctx.t({ en: 'Any', de: 'Egal', sl: 'Kadarkoli', hr: 'Bilo kada', it: 'Qualsiasi' });
      const full = m ? monthName(m, ctx.lang, true) : ctx.t('anyMonth');
      return `<button type="button" class="month-chip${best.has(m) ? ' is-best' : ''}" data-month="${m}" aria-pressed="${ctx.state.month === m}" aria-label="${esc(full)}${best.has(m) ? ` (${esc(ctx.t(L.bestFor))})` : ''}">${esc(label)}</button>`;
    })
    .join('');
  return `<div class="hero-when" role="group" aria-labelledby="hero-when-label">
    <div class="hero-when-head">
      <span class="hero-when-title" id="hero-when-label">${icon('calendar', { size: 18 })} ${esc(ctx.t('whenComing'))}</span>
      <span class="hero-when-hint" data-when-hint aria-live="polite">${hint(ctx)}</span>
    </div>
    <div class="hero-months">${chips}</div>
  </div>`;
}

function copyHtml(ctx, light) {
  const h = ctx.audience.hero;
  // Untranslated hero copy is announced as English.
  const en = ctx.lang !== 'en' && typeof h.title === 'object' && h.title[ctx.lang] == null;
  return `<div class="hero-copy"${en ? ' lang="en"' : ''}>
    <p class="hero-kicker">${esc(ctx.t(h.kicker))}</p>
    <h1>${esc(ctx.t(h.title))}</h1>
    <p class="hero-sub">${esc(ctx.t(h.subtitle))}</p>
    ${ctasHtml(ctx, light)}
  </div>`;
}

function overlayHtml(ctx, variant) {
  return `<div class="hero hero-overlay hero--${variant}">
    <div class="hero-stage" aria-hidden="true">
      ${slidesHtml(ctx, { poster: variant === 'map' })}
      ${variant === 'map' ? '<div class="hero-terrain" data-terrain></div>' : ''}
    </div>
    <div class="hero-scrim" aria-hidden="true"></div>
    ${captionHtml(ctx)}
    <div class="container hero-inner">
      ${copyHtml(ctx, true)}
      <div class="hero-foot">${monthsHtml(ctx)}${trustHtml(ctx)}</div>
    </div>
  </div>`;
}

function pauseHtml(ctx, label = L.pause) {
  return `<button type="button" class="hero-pause" data-pause aria-pressed="false" aria-label="${esc(ctx.t(label))}" hidden>
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path class="i-pause" d="M8 5v14M16 5v14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path class="i-play" d="M8 5l11 7-11 7z" fill="currentColor"/></svg>
      </button>`;
}

function captionHtml(ctx) {
  return `<div class="hero-caption" data-caption-wrap>
      <span data-caption-text aria-live="off">${esc(caption(slideFiles(ctx.audience)[0], ctx))}</span>
      ${pauseHtml(ctx)}
    </div>`;
}

function splitHtml(ctx) {
  return `<div class="hero hero-split hero--villa3d">
    <div class="container hero-split-grid">
      <div class="hero-split-copy">
        ${copyHtml(ctx, false)}
        ${trustHtml(ctx)}
        ${monthsHtml(ctx)}
      </div>
      <figure class="hero-3d">
        <div class="hero-3d-stage" data-villa3d>
          <div class="hero-3d-loading">${icon('cube', { size: 28 })}<span>${esc(ctx.t(L.loading3d))}</span></div>
        </div>
        <div class="hero-3d-pause">${pauseHtml(ctx, L.pauseMotion)}</div>
        <figcaption>${icon('cube', { size: 16 })} ${esc(ctx.t(L.live3d))} · <a href="#villa">${esc(ctx.t(L.openApartments))}</a></figcaption>
      </figure>
    </div>
  </div>`;
}

// Loads a lazily built 3D module and normalises whatever it returns into a cleanup function.
async function mountLazy(path, exportName, el, options) {
  const load = LAZY[path];
  if (!load) throw new Error(`${path} is not available yet`);
  const mod = await load();
  const factory = mod[exportName] || mod.default?.[exportName];
  if (typeof factory !== 'function') throw new Error(`${path} has no ${exportName}()`);
  const inst = await factory(el, options);
  const cleanup = () => {
    if (typeof inst === 'function') inst();
    else (inst?.dispose || inst?.destroy)?.call(inst);
  };
  return { cleanup, inst };
}

// WCAG 2.2.2: endless motion needs a pause control. Offered when the 3D module
// exposes pause(bool); reduced motion already stops the animation there.
function wirePause(el, inst) {
  const btn = el.querySelector('[data-pause]');
  if (!btn || typeof inst?.pause !== 'function' || prefersReducedMotion()) return;
  btn.hidden = false;
  btn.addEventListener('click', () => {
    const paused = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(paused));
    inst.pause(paused);
  });
}

function startSlideshow(el) {
  const stage = el.querySelector('.hero-stage');
  const tpl = el.querySelector('template[data-slides]');
  const pending = tpl ? [...tpl.content.querySelectorAll('img')] : [];
  const cap = el.querySelector('[data-caption-text]');
  const pauseBtn = el.querySelector('[data-pause]');
  const watch = (img) => img.addEventListener('error', () => img.remove(), { once: true });
  el.querySelectorAll('.hero-slide').forEach(watch);
  if (el.querySelectorAll('.hero-slide').length + pending.length < 2 || prefersReducedMotion()) return () => {};

  let index = 0;
  let timer = null;
  let paused = false;
  let visible = true;
  let started = false;
  let stopped = false;
  const show = (i) => {
    const live = [...el.querySelectorAll('.hero-slide')];
    if (!live.length) return;
    index = i % live.length;
    live.forEach((img, k) => img.classList.toggle('is-active', k === index));
    if (cap) cap.textContent = live[index].dataset.caption || '';
  };
  // Fetch the next photo only when it is due, and show it once decoded.
  const advance = async () => {
    if (index + 1 >= el.querySelectorAll('.hero-slide').length && pending.length) {
      const img = document.importNode(pending.shift(), true);
      watch(img);
      stage.append(img);
      try {
        await img.decode();
      } catch {
        img.remove();
      }
    }
    if (!stopped) show(index + 1);
  };
  const sync = () => {
    clearInterval(timer);
    timer = null;
    if (started && !paused && visible && !document.hidden) timer = setInterval(advance, SLIDE_MS);
  };
  pauseBtn.hidden = false;
  pauseBtn.addEventListener('click', () => {
    paused = !paused;
    // The label stays "Pause slideshow"; aria-pressed carries the state.
    pauseBtn.setAttribute('aria-pressed', String(paused));
    el.querySelector('.hero')?.classList.toggle('is-paused', paused);
    sync();
  });
  // Start after the page has loaded, so later slides never delay the first.
  const begin = () => {
    started = true;
    sync();
  };
  if (document.readyState === 'complete') begin();
  else window.addEventListener('load', begin, { once: true });
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    sync();
  });
  io.observe(el);
  document.addEventListener('visibilitychange', sync);
  sync();
  return () => {
    stopped = true;
    clearInterval(timer);
    window.removeEventListener('load', begin);
    io.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}

function fallbackPhoto(stage, ctx) {
  stage.innerHTML = `<img src="${photo(ctx.audience.hero.photo)}" alt="${esc(caption(ctx.audience.hero.photo, ctx))}" />
    <p class="hero-3d-note">${icon('info', { size: 16 })} ${esc(ctx.t(L.no3d))}</p>`;
}

export default {
  id: 'hero',
  nav: null,
  eager: true,
  rerenderOn: ['hero'],

  render(ctx) {
    const variant = ctx.state.hero;
    return variant === 'villa3d' ? splitHtml(ctx) : overlayHtml(ctx, variant === 'map' ? 'map' : 'photo');
  },

  async mount(el, ctx) {
    const cleanups = [];
    const months = el.querySelector('.hero-months');
    months.addEventListener('click', (e) => {
      const chip = e.target.closest('[data-month]');
      if (chip) ctx.setState({ month: Number(chip.dataset.month) });
    });
    // On narrow screens the chip row scrolls: start it at the chosen month or
    // the audience's first best month instead of January.
    const start = months.querySelector('[aria-pressed="true"]:not([data-month="0"])') || months.querySelector('.is-best');
    if (months.scrollWidth > months.clientWidth) {
      months.classList.add('is-scrollable');
      if (start) months.scrollLeft = start.offsetLeft - months.offsetLeft - 16;
    }

    const variant = ctx.state.hero;
    if (variant === 'villa3d') {
      const stage = el.querySelector('[data-villa3d]');
      try {
        const { cleanup, inst } = await mountLazy('../villa3d/viewer.js', 'createVillaViewer', stage, { mode: 'hero' });
        cleanups.push(cleanup);
        stage.querySelector('.hero-3d-loading')?.remove();
        wirePause(el, inst);
      } catch (err) {
        console.warn('[hero] 3D house unavailable, showing a photo', err);
        fallbackPhoto(stage, ctx);
      }
    } else if (variant === 'map') {
      const terrain = el.querySelector('[data-terrain]');
      try {
        const { cleanup, inst } = await mountLazy('../maps/terrain3d.js', 'createTerrain', terrain, { flyover: true, pois: [] });
        cleanups.push(cleanup);
        el.querySelector('.hero').classList.add('has-terrain');
        // No photo caption over the terrain, but keep the pause control.
        el.querySelector('[data-caption-text]').hidden = true;
        wirePause(el, inst);
      } catch (err) {
        console.warn('[hero] terrain flyover unavailable, showing photos', err);
        terrain.remove();
        el.querySelector('.hero-stage').insertAdjacentHTML('beforeend', pendingSlidesHtml(ctx));
        cleanups.push(startSlideshow(el));
      }
    } else {
      cleanups.push(startSlideshow(el));
    }
    return () => cleanups.forEach((fn) => fn());
  },

  update(el, ctx, changed) {
    if (!changed.includes('month')) return;
    for (const chip of el.querySelectorAll('[data-month]')) {
      chip.setAttribute('aria-pressed', String(Number(chip.dataset.month) === ctx.state.month));
    }
    const h = el.querySelector('[data-when-hint]');
    if (h) h.innerHTML = hint(ctx);
  },
};
