import './styles/base.css';
import './styles/themes.css';
import './styles/sections.css';

import { getState, setState, subscribe, linkFor } from './state.js';
import { AUDIENCES, audienceById } from './content/audiences.js';
import { SITE } from './content/site.js';
import { SECTIONS } from './sections/index.js';
import { tr, whenNear, bus, scrollToSection } from './lib/util.js';
import { mountLab } from './lab.js';
import { mountStickyCta } from './sticky-cta.js';
import { UI } from './content/ui.js';

// Mounted section instances: id -> { el, cleanup, mounted, cancelNear }
const live = new Map();

// Counts how many {en,de,…} strings t() could translate and how many fell back
// to English, so a mostly-English section can be marked lang="en".
const i18n = { translated: 0, fallback: 0 };
function countLang(value, lang) {
  if (lang === 'en' || !value || typeof value !== 'object') return;
  if (value[lang] == null) i18n.fallback += 1;
  else i18n.translated += 1;
}

// Fonts of the non-default themes (index.html loads the default theme's).
const THEME_FONTS = {
  editorial: 'family=Playfair+Display:wght@500;700&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600',
  postcard: 'family=Baloo+2:wght@500;700',
};
function themeFonts(theme) {
  const q = THEME_FONTS[theme];
  if (!q || document.querySelector(`link[data-theme-fonts="${theme}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${q}&display=swap`;
  link.dataset.themeFonts = theme;
  document.head.append(link);
}

function makeCtx() {
  const state = getState();
  const audience = audienceById(state.audience);
  const lang = state.lang;
  return {
    state,
    audience,
    lang,
    site: SITE,
    brand: SITE.names[state.brand] || SITE.names.apartments,
    // t(): translate a {en,de,...} object, or a key from the UI string table.
    t: (value) => {
      const v = typeof value === 'string' && UI[value] ? UI[value] : value;
      countLang(v, lang);
      return tr(v, lang);
    },
    setState,
    linkFor,
    bus,
  };
}

function sectionList(ctx) {
  return ctx.audience.sections.map((id) => SECTIONS[id]).filter(Boolean);
}

function renderNav(ctx) {
  const nav = document.getElementById('site-nav');
  const items = sectionList(ctx).filter((s) => s.nav);
  nav.innerHTML = items
    .map((s) => `<a href="#${s.id}" data-nav="${s.id}">${ctx.t(typeof s.nav === 'function' ? s.nav(ctx) : s.nav)}</a>`)
    .join('');
  const brand = document.querySelector('.brand strong');
  if (brand) brand.textContent = ctx.brand;
  document.querySelector('.brand')?.setAttribute('aria-label', `${ctx.brand}, ${ctx.t('backToTop')}`);
  // Static index.html strings follow the language too.
  nav.setAttribute('aria-label', ctx.t('sectionsNav'));
  const skip = document.querySelector('[data-skip]');
  if (skip) skip.textContent = ctx.t('skipToContent');
  const cta = document.querySelector('[data-cta="header"]');
  if (cta) cta.textContent = ctx.t('askDates');
  document.querySelector('#btn-menu span').textContent = ctx.t('menu');
  menuBtn.setAttribute('aria-label', ctx.t('menu')); // the text is hidden on small phones
  nav.insertAdjacentHTML('beforeend', `<details class="nav-more" hidden><summary>${ctx.t('moreNav')}</summary><div class="nav-more-list"></div></details>`);
  fitNav();
  document.title = `${ctx.brand} · ${ctx.t(ctx.audience.titleSuffix || 'Sabunike, Croatia')}`;
  // Unlisted versions (audiences.js) are opt-in pages: keep them out of search results.
  document.querySelector('meta[name="robots"]')?.remove();
  if (ctx.audience.unlisted) document.head.insertAdjacentHTML('beforeend', '<meta name="robots" content="noindex" />');
}

function unmount(id) {
  const inst = live.get(id);
  if (!inst) return;
  inst.cancelNear?.();
  try {
    inst.cleanup?.();
  } catch (err) {
    console.error(`[sections] cleanup of ${id} failed`, err);
  }
  live.delete(id);
}

function mountSection(section, el, ctx) {
  const inst = { el, cleanup: null, mounted: false };
  live.set(section.id, inst);
  if (!section.mount) return;
  const run = async () => {
    try {
      inst.mounted = true;
      // Lazy sections mount long after render with the render-time ctx; any
      // change made since then is replayed through update() below.
      const rendered = ctx.state;
      const cleanup = await section.mount(el, ctx);
      // The section may have been re-rendered while an async mount was running.
      if (live.get(section.id) !== inst) {
        cleanup?.();
        return;
      }
      inst.cleanup = cleanup;
      const now = getState();
      const changed = Object.keys(now).filter((k) => now[k] !== rendered[k] && !(section.rerenderOn || []).includes(k));
      if (changed.length && section.update) section.update(el, makeCtx(), changed);
    } catch (err) {
      console.error(`[sections] mount of ${section.id} failed`, err);
      el.querySelector('[data-mount-error]')?.removeAttribute('hidden');
    }
  };
  if (section.eager) run();
  else inst.cancelNear = whenNear(el, run);
}

function sectionHtml(section, ctx, index) {
  const cls = ['section', `section-${section.id}`, ...(section.className ? [section.className] : [])].join(' ');
  i18n.translated = 0;
  i18n.fallback = 0;
  let body;
  try {
    body = section.render(ctx);
  } catch (err) {
    // One broken section must not blank the whole page.
    console.error(`[sections] render of ${section.id} failed`, err);
    body = `<div class="container"><p class="muted">${ctx.t({ en: 'This part of the page could not be shown.', de: 'Dieser Teil der Seite konnte nicht angezeigt werden.' })}</p></div>`;
  }
  // Mostly untranslated copy is announced as English, not in the page language.
  const lang = ctx.lang !== 'en' && i18n.fallback > i18n.translated ? ' lang="en"' : '';
  return `<section id="${section.id}" class="${cls}" data-section="${section.id}" data-index="${String(index + 1).padStart(2, '0')}"${lang}>${body}</section>`;
}

function renderAll() {
  for (const id of [...live.keys()]) unmount(id);
  const ctx = makeCtx();
  document.documentElement.dataset.theme = ctx.state.theme;
  themeFonts(ctx.state.theme);
  document.documentElement.dataset.audience = ctx.audience.id;
  document.documentElement.dataset.sectionNumbers = String(ctx.state.sectionNumbers);
  document.documentElement.lang = ctx.lang;
  renderNav(ctx);
  const root = document.getElementById('sections');
  const list = sectionList(ctx);
  root.innerHTML = list.map((s, i) => sectionHtml(s, ctx, i)).join('');
  for (const section of list) mountSection(section, root.querySelector(`#${section.id}`), ctx);
  watchActiveNav();
}

function rerenderSection(section, ctx) {
  const el = document.getElementById(section.id);
  if (!el) return;
  unmount(section.id);
  const index = sectionList(ctx).indexOf(section);
  const tmp = document.createElement('div');
  tmp.innerHTML = sectionHtml(section, ctx, index);
  const fresh = tmp.firstElementChild;
  el.replaceWith(fresh);
  // The active-nav observer still watches the detached element.
  navObserver?.unobserve(el);
  if (document.querySelector(`[data-nav="${section.id}"]`)) navObserver?.observe(fresh);
  mountSection(section, fresh, ctx);
}

const FULL_RERENDER = new Set(['audience', 'lang', 'brand']);

function onChange(state, changed) {
  if (changed.some((k) => FULL_RERENDER.has(k))) {
    const y = window.scrollY;
    renderAll();
    if (!changed.includes('audience')) window.scrollTo(0, y);
    else window.scrollTo(0, 0);
    return;
  }
  const ctx = makeCtx();
  document.documentElement.dataset.theme = state.theme;
  themeFonts(state.theme);
  document.documentElement.dataset.sectionNumbers = String(state.sectionNumbers);
  for (const section of sectionList(ctx)) {
    const keys = changed.filter((k) => (section.rerenderOn || []).includes(k));
    if (keys.length) rerenderSection(section, ctx);
    else if (section.update) {
      const inst = live.get(section.id);
      if (inst?.mounted) section.update(inst.el, ctx, changed);
    }
  }
  bus.emit('state', { state, changed });
}

let navObserver;
function watchActiveNav() {
  navObserver?.disconnect();
  const links = new Map([...document.querySelectorAll('[data-nav]')].map((a) => [a.dataset.nav, a]));
  navObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        for (const a of links.values()) a.removeAttribute('aria-current');
        links.get(e.target.id)?.setAttribute('aria-current', 'true');
      }
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  for (const id of links.keys()) {
    const el = document.getElementById(id);
    if (el) navObserver.observe(el);
  }
}

// Header nav. Wide screens: links that do not fit move into a "More" menu at
// the end. Below 1080px the nav is hidden and the Menu button opens all links
// as a drop-down sheet.
const header = document.getElementById('site-header');
const menuBtn = document.getElementById('btn-menu');
const narrow = window.matchMedia('(max-width: 1080px)');

function fitNav() {
  const nav = document.getElementById('site-nav');
  const more = nav.querySelector('.nav-more');
  if (!more) return;
  const list = more.querySelector('.nav-more-list');
  for (const a of [...list.children]) more.before(a);
  more.hidden = true;
  more.open = false;
  if (narrow.matches) return;
  const right = () => nav.getBoundingClientRect().right + 0.5;
  const fits = () => [...nav.children].every((c) => c.hidden || c.getBoundingClientRect().right <= right());
  if (fits()) return;
  more.hidden = false;
  let links = nav.querySelectorAll(':scope > a');
  while (!fits() && links.length) {
    list.prepend(links[links.length - 1]);
    links = nav.querySelectorAll(':scope > a');
  }
}

function setMenu(open) {
  header.classList.toggle('nav-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
}

function wireNav() {
  const nav = document.getElementById('site-nav');
  new ResizeObserver(() => fitNav()).observe(nav);
  document.fonts?.ready.then(fitNav);
  narrow.addEventListener('change', () => {
    setMenu(false);
    fitNav();
  });
  menuBtn.addEventListener('click', () => setMenu(!header.classList.contains('nav-open')));
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const more = nav.querySelector('.nav-more[open]');
    if (more) {
      more.open = false;
      more.querySelector('summary').focus();
    } else if (header.classList.contains('nav-open')) {
      setMenu(false);
      menuBtn.focus();
    }
  });
  document.addEventListener('click', (e) => {
    const more = nav.querySelector('.nav-more[open]');
    if (more && !more.contains(e.target)) more.open = false;
    if (header.classList.contains('nav-open') && !header.contains(e.target)) setMenu(false);
  });
}

// In-page links (nav, header and sticky CTAs, section buttons): jump with a
// corrected scroll, because lazy sections change height while they mount.
function onAnchorClick(e) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.matches('[data-skip]')) return;
  const target = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
  if (!target) return;
  e.preventDefault();
  setMenu(false);
  const more = a.closest('.nav-more');
  if (more) more.open = false;
  history.pushState(null, '', `${location.pathname}${location.search}#${target.id}`);
  scrollToSection(target);
  // Like a native fragment jump, the next Tab starts inside the target.
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

function boot() {
  try {
    renderAll();
  } catch (err) {
    console.error('[sections] render failed', err);
  }
  subscribe(onChange);
  mountLab(document.getElementById('lab-root'), { audiences: AUDIENCES });
  mountStickyCta();
  wireNav();
  document.addEventListener('click', onAnchorClick);
  // Deep links like #villa should still work after the first render.
  // The id is the part before '&' (#cycling&route=… carries a route for that section).
  if (location.hash) scrollToSection(document.getElementById(decodeURIComponent(location.hash.slice(1).split('&')[0])));
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  // Not synchronously: reading scrollY right after the first render forces a full layout.
  requestAnimationFrame(onScroll);
}

boot();
