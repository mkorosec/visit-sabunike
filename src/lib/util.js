// Small shared helpers. No DOM framework: sections render HTML strings and
// enhance them in mount().

import { SITE } from '../content/site.js';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Pick the right language from a {en, de, ...} object; plain strings pass through.
export function tr(value, lang = 'en') {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return value[lang] ?? value.en ?? Object.values(value)[0] ?? '';
}

const R = 6371.0088;
const rad = (d) => (d * Math.PI) / 180;

// Great-circle distance in km between [lat, lon] pairs.
export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function fromVilla(lat, lon) {
  return haversineKm([SITE.location.lat, SITE.location.lon], [lat, lon]);
}

// Rough door-to-door estimates from straight-line distance. Detour factors are
// typical for this flat coastal road grid; always shown as "about".
export function travelMinutes(km, mode) {
  if (mode === 'walk') return (km * 1.3 * 60) / 4.5;
  if (mode === 'bike') return (km * 1.25 * 60) / 16;
  return (km * 1.35 * 60) / 50 + (km > 1 ? 2 : 0);
}

export function formatKm(km) {
  if (km < 1) return `${Math.round((km * 1000) / 10) * 10} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export function formatMinutes(min) {
  if (min < 1) return '1 min';
  if (min < 60) return `${Math.round(min)} min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return m ? `${h} h ${m} min` : `${h} h`;
}

// Picks the most natural way to get somewhere: walk up to ~1.6 km, bike up to ~6 km, else drive.
export function bestMode(km) {
  if (km <= 1.6) return 'walk';
  if (km <= 6) return 'bike';
  return 'car';
}

const MONTHS = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
  sl: ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'avg', 'sep', 'okt', 'nov', 'dec'],
  hr: ['sij', 'velj', 'ožu', 'tra', 'svi', 'lip', 'srp', 'kol', 'ruj', 'lis', 'stu', 'pro'],
  it: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
};
const MONTHS_LONG = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  sl: ['januar', 'februar', 'marec', 'april', 'maj', 'junij', 'julij', 'avgust', 'september', 'oktober', 'november', 'december'],
  hr: ['siječanj', 'veljača', 'ožujak', 'travanj', 'svibanj', 'lipanj', 'srpanj', 'kolovoz', 'rujan', 'listopad', 'studeni', 'prosinac'],
  it: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
};
export function monthName(m, lang = 'en', long = false) {
  const table = (long ? MONTHS_LONG : MONTHS)[lang] || (long ? MONTHS_LONG : MONTHS).en;
  return table[(m - 1 + 12) % 12];
}

// Tiny event bus for cross-section actions (e.g. "prefill the inquiry form").
const handlers = new Map();
export const bus = {
  on(name, fn) {
    if (!handlers.has(name)) handlers.set(name, new Set());
    handlers.get(name).add(fn);
    return () => handlers.get(name).delete(fn);
  },
  emit(name, payload) {
    for (const fn of handlers.get(name) || []) fn(payload);
  },
};

export function toast(message, ms = 3200) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (el.hidden = true), ms);
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Photo URL helper. kind: 'web' (≤1600 px) | 'thumb' (480 px).
export function photo(file, kind = 'web') {
  const base = import.meta.env.BASE_URL;
  return kind === 'thumb' ? `${base}photos/thumbs/${file}` : `${base}photos/web/${file}`;
}

// Inline SVG icons (stroke style, 24px grid). Keep this list small.
const ICONS = {
  walk: '<circle cx="13" cy="4" r="2"/><path d="m9 22 3-8 3 3v5M7 13l2-5 4 1 3 4"/>',
  bike: '<circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2l3 11.5M5.5 17.5 9 9h7l-4 8.5M9 9 7.5 6H6"/>',
  car: '<path d="M5 17h14M3 17v-4l2-5h14l2 5v4h-2M5 17H3"/><circle cx="7.5" cy="17" r="2"/><circle cx="16.5" cy="17" r="2"/>',
  plane: '<path d="M10.5 21 12 15l-7-2v-2l7 1V5.5a1.5 1.5 0 0 1 3 0V12l7-1v2l-7 2 1.5 6L15 22l-1.5-2L12 22z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  wave: '<path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>',
  wind: '<path d="M3 8h11a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
  pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
  bed: '<path d="M3 18V7M3 14h18v4M21 14v-3a3 3 0 0 0-3-3h-7v6"/><circle cx="7" cy="11" r="2"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  euro: '<path d="M17 6.5A6.5 6.5 0 1 0 17 17.5M4 10h9M4 14h9"/>',
  cube: '<path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="m3 7 9 5 9-5M12 12v10"/>',
  grill: '<path d="M4 10h16a8 8 0 0 1-16 0zM8 18l-2 4M16 18l2 4M8 6c0-1 1-1 1-2M12 6c0-1 1-1 1-2M16 6c0-1 1-1 1-2"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r="1"/>',
  parking: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  kite: '<path d="M12 2 20 10 12 22 4 10z"/><path d="M4 10h16M12 2v20"/>',
  dog: '<path d="M10 5 8 2 5 4v4l-2 3 2 2h3l2 4v5h6v-6l3-3V5l-3-2-2 2z"/>',
  leaf: '<path d="M5 21c0-9 6-15 16-16-1 10-7 16-16 16zM5 21l8-8"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 19h20"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  thermometer: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/>',
  mountain: '<path d="m3 20 6-11 4 6 3-4 5 9z"/>',
  fish: '<path d="M2 12c3-4 7-6 11-6 4 0 7 3 9 6-2 3-5 6-9 6-4 0-8-2-11-6zM2 12l-1 4M2 12 1 8"/><circle cx="16" cy="11" r="1"/>',
};
export function icon(name, { size = 20, label } = {}) {
  const body = ICONS[name] || ICONS.info;
  const a11y = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
  return `<svg class="icon icon-${name}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${a11y}>${body}</svg>`;
}

// Observe an element once it is close to the viewport, then run fn once.
export function whenNear(el, fn, rootMargin = '600px') {
  if (!('IntersectionObserver' in window)) {
    fn();
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        fn();
      }
    },
    { rootMargin },
  );
  io.observe(el);
  return () => io.disconnect();
}

// Scroll a section (or any element) to the top of the viewport and keep it
// there while lazy sections above it mount and change height. A smooth scroll
// would pass through, and mount, every section on the way, so the jump is
// instant; afterwards the position is re-checked until it is stable for
// ~0.6 s (or 3 s pass, or the visitor scrolls). Resolves when it settles.
let activeScroll = null;
export function scrollToSection(el) {
  activeScroll?.();
  if (!el) return Promise.resolve();
  return new Promise((resolve) => {
    const want = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const jump = () => el.scrollIntoView({ behavior: 'instant', block: 'start' });
    const userEvents = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
    let timer = null;
    let stable = 0;
    const started = performance.now();
    const stop = () => {
      clearTimeout(timer);
      for (const ev of userEvents) window.removeEventListener(ev, stop, true);
      if (activeScroll === stop) activeScroll = null;
      resolve();
    };
    const check = () => {
      const off = el.getBoundingClientRect().top - want();
      // At the very bottom of the page the target cannot reach the top.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 1;
      if (Math.abs(off) > 4 && !atEnd) {
        stable = 0;
        jump();
      } else stable += 1;
      if (stable >= 3 || performance.now() - started > 3000) stop();
      else timer = setTimeout(check, 200);
    };
    activeScroll = stop;
    for (const ev of userEvents) window.addEventListener(ev, stop, { capture: true, passive: true });
    jump();
    timer = setTimeout(check, 200);
  });
}
