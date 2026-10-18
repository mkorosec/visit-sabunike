// "Versions" Lab: lets the owner switch audience versions and try every design
// or feature experiment live. All choices sit in the URL, so each version can
// be shared as a link. Guests never see the button: it shows in development,
// or after the owner has opened the page once with ?lab (remembered in this
// browser).

import './styles/lab.css';
import { getState, setState, subscribe, resetState, linkFor, DEFAULTS } from './state.js';
import { esc, tr, icon, toast } from './lib/util.js';

const CHOICES = [
  {
    group: 'Look & feel',
    items: [
      { key: 'theme', label: 'Theme', options: { adriatic: 'Adriatic', editorial: 'Editorial', postcard: 'Postcard', minimal: 'Minimal' } },
      { key: 'brand', label: 'Name', options: { apartments: 'Apartments Napros', villa: 'Villa Napros' } },
      { key: 'hero', label: 'Hero', options: { photo: 'Photo', villa3d: '3D house', map: 'Map flyover' } },
      { key: 'sectionNumbers', label: 'Numbered sections', toggle: true },
    ],
  },
  {
    group: 'Language',
    items: [{ key: 'lang', label: 'Language', options: { en: 'English', de: 'Deutsch', sl: 'Slovenščina', hr: 'Hrvatski', it: 'Italiano' } }],
  },
  {
    group: 'Maps',
    items: [
      { key: 'mapEngine', label: 'Area map', options: { leaflet: '2D map', terrain3d: '3D terrain' } },
      { key: 'basemap', label: 'Base map', options: { light: 'Light', satellite: 'Satellite', topo: 'Topographic' } },
      { key: 'flightsView', label: 'Flights', options: { map: 'Route map', board: 'Departures board' } },
    ],
  },
  {
    group: 'Features',
    items: [
      { key: 'weather', label: 'Live weather & sea temperature', toggle: true },
      { key: 'priceCompare', label: 'Direct vs. platform price explainer', toggle: true },
      { key: 'stickyCta', label: 'Sticky inquiry bar', toggle: true },
    ],
  },
];

function render(root, audiences) {
  const s = getState();
  const audienceCards = audiences
    .map(
      (a) => `
      <button type="button" class="lab-aud" data-audience="${esc(a.id)}" aria-pressed="${s.audience === a.id}">
        <strong>${esc(tr(a.label, 'en'))}</strong>
        <small>${esc(tr(a.season, 'en'))}</small>
      </button>`,
    )
    .join('');

  const groups = CHOICES.map(
    (g) => `
    <fieldset class="lab-group">
      <legend>${esc(g.group)}</legend>
      ${g.items
        .map((item) => {
          if (item.toggle) {
            return `<label class="lab-toggle"><input type="checkbox" data-key="${item.key}" ${s[item.key] ? 'checked' : ''}/> <span>${esc(item.label)}</span></label>`;
          }
          return `<div class="lab-choice"><span class="lab-label">${esc(item.label)}</span><div class="lab-seg" role="group" aria-label="${esc(item.label)}">
            ${Object.entries(item.options)
              .map(([v, l]) => `<button type="button" data-key="${item.key}" data-value="${v}" aria-pressed="${String(s[item.key]) === v}">${esc(l)}</button>`)
              .join('')}
          </div></div>`;
        })
        .join('')}
    </fieldset>`,
  ).join('');

  root.innerHTML = `
    <div class="lab" id="lab" lang="en" role="dialog" aria-modal="false" aria-labelledby="lab-title" hidden>
      <div class="lab-head">
        <div>
          <h2 id="lab-title">Versions &amp; experiments</h2>
          <p class="muted small">Every choice is saved in the page link. Share it to show someone exactly this version.</p>
        </div>
        <button type="button" class="btn btn-ghost btn-small" data-lab-close aria-label="Close">${icon('close')}</button>
      </div>
      <div class="lab-body">
        <fieldset class="lab-group">
          <legend>Audience version</legend>
          <div class="lab-auds">${audienceCards}</div>
        </fieldset>
        ${groups}
      </div>
      <div class="lab-foot">
        <button type="button" class="btn btn-primary btn-small" data-lab-copy>${icon('download', { size: 16 })} Copy link to this version</button>
        <button type="button" class="btn btn-small" data-lab-reset>Reset</button>
      </div>
    </div>`;
}

const LAB_KEY = 'visit-sabunike:lab';

function labEnabled() {
  if (import.meta.env.DEV) return true;
  try {
    if (new URLSearchParams(location.search).has('lab')) localStorage.setItem(LAB_KEY, '1');
    return localStorage.getItem(LAB_KEY) === '1';
  } catch {
    return new URLSearchParams(location.search).has('lab');
  }
}

// The panel is built once; state changes only update the pressed/checked
// marks, so keyboard focus and the panel's scroll position survive a choice.
function sync(root) {
  const s = getState();
  for (const b of root.querySelectorAll('[data-key][data-value]')) b.setAttribute('aria-pressed', String(String(s[b.dataset.key]) === b.dataset.value));
  for (const b of root.querySelectorAll('[data-audience]')) b.setAttribute('aria-pressed', String(s.audience === b.dataset.audience));
  for (const c of root.querySelectorAll('input[type=checkbox][data-key]')) c.checked = !!s[c.dataset.key];
}

export function mountLab(root, { audiences }) {
  const btn = document.getElementById('btn-lab');
  btn.setAttribute('aria-expanded', 'false');
  if (!labEnabled()) return { open() {} };
  btn.hidden = false;
  render(root, audiences);
  const panel = () => root.querySelector('#lab');
  const open = (v) => {
    const hadFocus = panel().contains(document.activeElement);
    panel().hidden = !v;
    btn.setAttribute('aria-expanded', String(v));
    if (v) (panel().querySelector('.lab-body button[aria-pressed="true"]') || panel().querySelector('button'))?.focus();
    else if (hadFocus) btn.focus();
  };
  btn.addEventListener('click', () => open(panel().hidden));

  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.matches('[data-lab-close]')) return open(false);
    if (t.matches('[data-lab-reset]')) return resetState();
    if (t.matches('[data-lab-copy]')) {
      const url = linkFor({});
      navigator.clipboard?.writeText(url).then(
        () => toast('Link copied'),
        () => toast(url, 6000),
      );
      return;
    }
    if (t.dataset.audience) return setState({ audience: t.dataset.audience });
    if (t.dataset.key) setState({ [t.dataset.key]: t.dataset.value });
  });
  root.addEventListener('change', (e) => {
    const input = e.target;
    if (input.matches('input[type=checkbox][data-key]')) setState({ [input.dataset.key]: input.checked });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel().hidden) open(false);
  });
  subscribe(() => sync(root));
  // First-time visitors with ?lab in the URL get the panel opened.
  if (new URLSearchParams(location.search).has('lab')) open(true);
  return { open };
}

export { DEFAULTS };
