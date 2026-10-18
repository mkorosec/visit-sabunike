// Global UI state: audience version, theme, language and experiment toggles.
// Source of truth order: URL query > localStorage > defaults. Every change is
// written back to the URL (so a version can be shared as a link) and to
// localStorage (so it survives a reload).

import { AUDIENCES } from './content/audiences.js';

const STORAGE_KEY = 'visit-sabunike:state:v1';

export const DEFAULTS = Object.freeze({
  audience: 'general', // see src/content/audiences.js
  theme: 'adriatic', // adriatic | editorial | postcard | minimal
  lang: 'en',
  brand: 'apartments', // apartments | villa  (naming experiment)
  month: 0, // 0 = not chosen yet, 1..12 = travel month
  hero: 'photo', // photo | villa3d | map
  mapEngine: 'leaflet', // leaflet | terrain3d
  basemap: 'light', // light | satellite | topo
  flightsView: 'map', // map | board
  weather: true, // live weather + sea temperature widget
  priceCompare: true, // "direct vs OTA" savings explainer
  stickyCta: true, // sticky bottom inquiry bar
  sectionNumbers: false, // editorial numbering of sections
});

// Allowed values for enum keys. Used to validate URL/localStorage input and by
// the Lab panel to build its controls.
export const ENUMS = {
  audience: AUDIENCES.map((a) => a.id),
  theme: ['adriatic', 'editorial', 'postcard', 'minimal'],
  lang: ['en', 'de', 'sl', 'hr', 'it'],
  brand: ['apartments', 'villa'],
  hero: ['photo', 'villa3d', 'map'],
  mapEngine: ['leaflet', 'terrain3d'],
  basemap: ['light', 'satellite', 'topo'],
  flightsView: ['map', 'board'],
};

const listeners = new Set();
let state = load();
// Write the effective state back on boot, so the address bar always shows
// the version on screen (and a ?for= alias is saved).
persist();

function coerce(key, raw) {
  const def = DEFAULTS[key];
  if (raw == null) return undefined;
  if (key === 'audience') raw = String(raw).toLowerCase(); // hand-typed campaign links: ?for=Families
  if (typeof def === 'boolean') return raw === true || raw === 'true' || raw === '1' || raw === 'on';
  if (typeof def === 'number') {
    // month is the only numeric key: an integer 0..12.
    const n = Number(raw);
    return Number.isInteger(n) && n >= 0 && n <= 12 ? n : undefined;
  }
  if (ENUMS[key] && !ENUMS[key].includes(raw)) return undefined;
  return String(raw);
}

function load() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    stored = {};
  }
  const url = new URLSearchParams(location.search);
  const out = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS)) {
    const fromUrl = coerce(key, url.get(key));
    const fromStore = coerce(key, stored[key]);
    if (fromUrl !== undefined) out[key] = fromUrl;
    else if (fromStore !== undefined) out[key] = fromStore;
  }
  // Audience-specific landing links (?for=cyclists) are a friendlier alias.
  const alias = coerce('audience', url.get('for'));
  if (alias) out.audience = alias;
  return out;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode: state still lives in the URL */
  }
  const url = new URL(location.href);
  url.searchParams.delete('for');
  for (const [key, value] of Object.entries(state)) {
    if (value === DEFAULTS[key]) url.searchParams.delete(key);
    else url.searchParams.set(key, String(value));
  }
  history.replaceState(null, '', url);
}

export function getState() {
  return state;
}

export function setState(patch) {
  const changed = [];
  const next = { ...state };
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in DEFAULTS)) continue;
    const v = coerce(key, value);
    if (v === undefined || next[key] === v) continue;
    next[key] = v;
    changed.push(key);
  }
  if (!changed.length) return;
  state = next;
  persist();
  for (const fn of listeners) fn(state, changed);
}

// Back/forward: entries pushed by in-page links keep their own query string.
window.addEventListener('popstate', () => {
  const url = new URLSearchParams(location.search);
  const next = {};
  for (const key of Object.keys(DEFAULTS)) next[key] = coerce(key, url.get(key)) ?? DEFAULTS[key];
  setState(next);
});

export function resetState() {
  setState({ ...DEFAULTS });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Link that opens the page in a given configuration, e.g. for sharing a version.
export function linkFor(patch) {
  const url = new URL(location.href);
  url.search = '';
  for (const [key, value] of Object.entries({ ...state, ...patch })) {
    if (value !== DEFAULTS[key]) url.searchParams.set(key, String(value));
  }
  url.hash = '';
  return url.toString();
}
