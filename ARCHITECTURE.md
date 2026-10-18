# Visit Sabunike — architecture

A static direct-booking site for Apartments Napros (Put kandelica 60, Sabunike).
Vite + vanilla ES modules, no framework. `three` for 3D, `leaflet` for maps.

```
npm run dev      # http://localhost:5180/
npm run data     # research/*.json → src/data/*.json (normalised, distances added)
npm run build    # data + vite build → dist/
npm test         # node --test tests/
node scripts/smoke.mjs http://localhost:5180/ [--only audience=families] [--section villa] [--width 390] [--out dir]
```

## Versions and toggles

`src/state.js` holds the global UI state (audience, theme, language, experiments).
State is read from the URL first, then localStorage, then the defaults, and every change is
written back to the URL. Any version is a shareable link, e.g.
`/?audience=cyclists&theme=minimal&mapEngine=terrain3d`. `?for=families` is an alias
for `audience`. The **Versions** button (`src/lab.js`) switches all of this live.

## Section contract

Each section is one module in `src/sections/<id>.js`, registered in `src/sections/index.js`.
Each audience in `src/content/audiences.js` lists the sections it shows, in order.

```js
export default {
  id: 'beaches',                        // also the DOM id and the nav anchor
  nav: { en: 'Beaches', de: 'Strände' }, // nav label, or null to hide from the nav
  className: 'alt',                     // optional extra class on <section> ('alt' sand bg, 'water' blue bg)
  rerenderOn: ['month'],                // state keys that rebuild this section (unmount → render → mount)
  eager: false,                         // true = mount immediately; default mounts ~600px before it scrolls into view
  render(ctx) { return '<div class="container">…</div>' },  // HTML string. Must be cheap and pure.
  mount(el, ctx) { …; return () => cleanup() },            // optional, may be async; wire events, create maps / WebGL
  update(el, ctx, changedKeys) { … },                       // optional; for state changes not in rerenderOn
};
```

`ctx` = `{ state, audience, lang, site, brand, t, setState, linkFor, bus }`

- `t(x)` translates `{en, de, sl, hr, it}` objects, or keys of `src/content/ui.js`. It falls back to English.
- Changes to `audience`, `lang` or `brand` rebuild the whole page. A `theme` change only swaps CSS tokens.
- `bus.emit('inquiry:prefill', { apartment, purpose, month, guests, message })` scrolls to and
  prefills the inquiry form. `bus.emit('map:focus', { id, lat, lon, zoom })` asks the explore map to fly somewhere.
- Sections import their own CSS (`import './beaches.css'`). Use only theme tokens (`var(--brand)` and so on)
  from `src/styles/themes.css`. Never hard-code colours, except for map pins and data-viz series.
- Shared helpers are in `src/lib/util.js`: `esc`, `tr`, `icon`, `fromVilla`, `travelMinutes`, `formatKm`,
  `formatMinutes`, `bestMode`, `monthName`, `photo`, `whenNear`, `toast`, `bus`. The lightbox is `src/lib/lightbox.js`.
- Every Leaflet map goes through `src/maps/base.js` `createMap()`, which follows the `basemap` toggle and adds the house marker.
- Heavy work (WebGL, maps, network) happens in `mount`, never in `render`. It must be cleaned up in the
  returned function, and it must fail visibly with a message, never with a blank box.

## Content honesty rules

- Facts come from `src/data/*.json`, which is built from verified research in `research/`.
  Each item has `sources` and a `confidence` field. Low-confidence facts are worded cautiously or left out.
- Never invent prices, phone numbers, reviews or business names. Unknown owner facts show as
  "on request", or as a visible `TODO(owner)` badge in development (`site.js`).
- Distances from the house are straight-line plus a detour factor, and are always shown as "about".

## Design rules

- Light, high-contrast themes only (`adriatic`, `editorial`, `postcard`, `minimal`). Body text is 17px with line-height 1.6.
- Mobile first: works at 360px width with no horizontal scroll and tap targets of at least 44px.
- Respect `prefers-reduced-motion`: no auto-rotation or fly-throughs when it is set.
