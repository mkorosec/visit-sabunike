// Stylised 3D terrain map of the Nin / Zadar / Velebit region (three.js).
// Used as the alternative engine of the "Explore the area" map and as the
// cinematic flyover hero. Heights and the painted map texture come from
// public/terrain/ (built by scripts/fetch-terrain.mjs), so no imagery is bundled
// and the browser does no per-pixel work.
//
//   const t = await createTerrain(el, { pois, flyover, onSelect, selected });
//   t.focus('nin-cathedral' | [lat, lon], { zoom }); t.setPois(list); t.setSelected(id); t.dispose();

import * as THREE from 'three';
import { MapControls } from 'three/addons/controls/MapControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import './terrain3d.css';
import { CATEGORY_COLORS } from './colors.js';
import { SITE } from '../content/site.js';
import { esc, fromVilla, formatKm, prefersReducedMotion, tr } from '../lib/util.js';
import { getState } from '../state.js';
import {
  EXAG,
  SEA_DEEP,
  SEA_ROUGHNESS,
  clamp,
  createProjection,
  decodeHeights,
  easeInOutCubic,
  gridMesh,
  gridSampler,
  lerp,
  resampleToScene,
  smoothstep,
} from './terrain-math.js';

const KM = 1 / 1000; // metres -> scene km
const SEA_Y = -0.004; // outer sea plane, just below the terrain's sea level
const MAX_PIXEL_RATIO = 1.5;
const SKY = '#e9eff1'; // fog colour = sky dome horizon
const SKY_TOP = '#b9d3e3';
const HOUSE_COLOR = '#b5451f';
const FLYOVER_SECONDS = 96;
const PLACE_EDGE_PX = 60; // place names this close to the edge are hidden, not clipped
const LABEL_FLASH_MS = 4000;

// Map chrome in every site language, resolved in the current page language.
const T = {
  zoomIn: { en: 'Zoom in', de: 'Vergrößern', sl: 'Povečaj', hr: 'Povećaj', it: 'Ingrandisci' },
  zoomOut: { en: 'Zoom out', de: 'Verkleinern', sl: 'Pomanjšaj', hr: 'Smanji', it: 'Riduci' },
  left: { en: 'Rotate left', de: 'Nach links drehen', sl: 'Zavrti levo', hr: 'Zakreni ulijevo', it: 'Ruota a sinistra' },
  right: { en: 'Rotate right', de: 'Nach rechts drehen', sl: 'Zavrti desno', hr: 'Zakreni udesno', it: 'Ruota a destra' },
  north: { en: 'North up, top view', de: 'Norden oben, Draufsicht', sl: 'Sever zgoraj, pogled od zgoraj', hr: 'Sjever gore, pogled odozgo', it: "Nord in alto, vista dall'alto" },
  home: { en: 'Back to the house', de: 'Zurück zum Haus', sl: 'Nazaj k hiši', hr: 'Natrag do kuće', it: 'Torna alla casa' },
  hintTouch: { en: 'Tap the map to move it', de: 'Tippen Sie auf die Karte, um sie zu bewegen', sl: 'Tapnite zemljevid, da ga premaknete', hr: 'Dodirnite kartu da biste je pomicali', it: 'Toccate la mappa per spostarla' },
  hintMouse: {
    en: 'Drag to pan · Right-drag to tilt · Click, then scroll to zoom',
    de: 'Ziehen zum Verschieben · Mit rechter Maustaste ziehen zum Neigen · Klicken, dann scrollen zum Zoomen',
    sl: 'Povlecite za premik · Povlecite z desno tipko za nagib · Kliknite, nato se pomikajte s kolescem za povečavo',
    hr: 'Povucite za pomicanje · Povucite desnom tipkom za nagib · Kliknite pa pomičite kotačić za zumiranje',
    it: 'Trascinate per spostare · Trascinate col tasto destro per inclinare · Fate clic, poi scorrete per lo zoom',
  },
  done: { en: 'Done', de: 'Fertig', sl: 'Končano', hr: 'Gotovo', it: 'Fatto' },
  doneLabel: { en: 'Done moving the map', de: 'Verschieben der Karte beenden', sl: 'Končaj premikanje zemljevida', hr: 'Završi pomicanje karte', it: 'Fine spostamento della mappa' },
  loading: { en: 'Loading 3D terrain…', de: '3D-Gelände wird geladen…', sl: 'Nalagamo 3D-teren …', hr: 'Učitavamo 3D teren…', it: 'Caricamento del rilievo 3D…' },
  unavailable: { en: '3D terrain unavailable', de: '3D-Gelände nicht verfügbar', sl: '3D-teren ni na voljo', hr: '3D teren nije dostupan', it: 'Rilievo 3D non disponibile' },
  noData: {
    en: 'The elevation data could not be loaded. Please use the 2D map instead.',
    de: 'Die Höhendaten konnten nicht geladen werden. Bitte nutzen Sie stattdessen die 2D-Karte.',
    sl: 'Podatkov o nadmorski višini ni bilo mogoče naložiti. Uporabite 2D-zemljevid.',
    hr: 'Podaci o visini nisu se mogli učitati. Umjesto toga koristite 2D kartu.',
    it: 'Non è stato possibile caricare i dati altimetrici. Usate invece la mappa 2D.',
  },
  noWebgl: {
    en: 'Your browser or device does not support WebGL. Please use the 2D map instead.',
    de: 'Ihr Browser oder Gerät unterstützt kein WebGL. Bitte nutzen Sie stattdessen die 2D-Karte.',
    sl: 'Vaš brskalnik ali naprava ne podpira WebGL. Uporabite 2D-zemljevid.',
    hr: 'Vaš preglednik ili uređaj ne podržava WebGL. Umjesto toga koristite 2D kartu.',
    it: 'Il vostro browser o dispositivo non supporta WebGL. Usate invece la mappa 2D.',
  },
  region: {
    en: '3D terrain map of the area. Arrow keys pan, plus and minus zoom.',
    de: '3D-Geländekarte der Umgebung. Pfeiltasten verschieben, Plus und Minus zoomen.',
    sl: '3D-zemljevid terena v okolici. S puščičnimi tipkami ga premikate, s plusom in minusom povečate ali pomanjšate.',
    hr: '3D karta terena okolice. Strelicama pomičete kartu, a plusom i minusom zumirate.',
    it: 'Mappa 3D del territorio. Le frecce spostano la vista, più e meno regolano lo zoom.',
  },
  stay: { en: 'Your stay', de: 'Ihre Unterkunft', sl: 'Vaša nastanitev', hr: 'Vaš smještaj', it: 'Il vostro alloggio' },
  away: { en: 'About {km} from the house (straight line)', de: 'Ca. {km} vom Haus (Luftlinie)', sl: 'Pribl. {km} od hiše (zračna razdalja)', hr: 'Oko {km} od kuće (zračna linija)', it: "Circa {km} dalla casa (in linea d'aria)" },
  close: { en: 'Close', de: 'Schließen', sl: 'Zapri', hr: 'Zatvori', it: 'Chiudi' },
};
// POI category chips (explore.js layer ids); unknown ids fall back to categoryLabel().
const CATEGORY = {
  beach: { en: 'Beach', de: 'Strand', sl: 'Plaža', hr: 'Plaža', it: 'Spiaggia' },
  history: { en: 'History', de: 'Geschichte', sl: 'Zgodovina', hr: 'Povijest', it: 'Storia' },
  nature: { en: 'Nature', de: 'Natur', sl: 'Narava', hr: 'Priroda', it: 'Natura' },
  town: { en: 'Town', de: 'Ort', sl: 'Kraj', hr: 'Mjesto', it: 'Località' },
  'food-drink': { en: 'Food & drink', de: 'Essen & Trinken', sl: 'Hrana in pijača', hr: 'Hrana i piće', it: 'Cibo e bevande' },
  family: { en: 'Family', de: 'Familie', sl: 'Družine', hr: 'Obitelji', it: 'Famiglie' },
  practical: { en: 'Shops & services', de: 'Läden & Service', sl: 'Trgovine in storitve', hr: 'Trgovine i usluge', it: 'Negozi e servizi' },
  activity: { en: 'Activity', de: 'Aktivität', sl: 'Aktivnost', hr: 'Aktivnost', it: 'Attività' },
  photo: { en: 'Photo', de: 'Foto', sl: 'Fotografija', hr: 'Fotografija', it: 'Foto' },
};
const tt = (key) => tr(T[key], getState().lang);

// Always-labelled places (town centres, approximate). A POI with the same name replaces the label.
const PLACES = [
  { name: 'Nin', lat: 44.2417, lon: 15.1847 },
  { name: 'Zadar', lat: 44.1157, lon: 15.2246 },
  { name: 'Vir', lat: 44.2985, lon: 15.0786 },
  { name: 'Privlaka', lat: 44.2655, lon: 15.1285 },
  { name: 'Pag', lat: 44.4446, lon: 15.0573 },
  { name: 'Starigrad-Paklenica', lat: 44.2989, lon: 15.4428 },
  { name: 'Velebit', lat: 44.43, lon: 15.43, kind: 'range' },
];
// "Vir (island)" names the same place as "Vir".
const placeKey = (name) => String(name).toLowerCase().replace(/\s*\(.*\)$/, '');
const PLACE_NAMES = new Set(PLACES.map((p) => placeKey(p.name)));

/* ------------------------------------------------------------------ */
/* Data (decoded once, shared by every live instance)                   */
/* ------------------------------------------------------------------ */

let dataPromise = null;
let builtCache = new Map();
let liveInstances = 0;

async function fetchBitmap(url, options) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
  // Decoded off the main thread.
  return createImageBitmap(await r.blob(), options);
}

function loadData() {
  if (!dataPromise) {
    dataPromise = (async () => {
      const base = `${import.meta.env.BASE_URL}terrain/`;
      const meta = await fetch(`${base}meta.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`meta.json: HTTP ${r.status}`))));
      const [heightBitmap, color, rough] = await Promise.all([
        // No colour conversion or premultiplication, or the encoded heights shift.
        fetchBitmap(`${base}heightmap.png`, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }),
        // WebGL ignores flipY for ImageBitmaps, so flip while decoding (row 0 = north = v 1).
        fetchBitmap(`${base}${meta.texture.color}`, { imageOrientation: 'flipY' }),
        fetchBitmap(`${base}${meta.texture.roughness}`, { imageOrientation: 'flipY', colorSpaceConversion: 'none' }),
      ]);
      const canvas = document.createElement('canvas');
      canvas.width = meta.width;
      canvas.height = meta.height;
      const g = canvas.getContext('2d', { willReadFrequently: true });
      g.drawImage(heightBitmap, 0, 0);
      heightBitmap.close?.();
      const { data } = g.getImageData(0, 0, meta.width, meta.height);
      return { meta, heights: decodeHeights(data, meta.width, meta.height, 4), proj: createProjection(meta), color, rough };
    })();
    dataPromise.catch(() => (dataPromise = null));
  }
  return dataPromise;
}

// Drop the shared data once nothing uses it (bitmaps and grids are tens of MB).
function release() {
  liveInstances = Math.max(0, liveInstances - 1);
  if (liveInstances) return;
  dataPromise = null;
  builtCache = new Map();
}

// Mesh height grid for one mesh resolution. Cached: the hero and the explore
// map (or a remount after a theme change) reuse the same work.
function build(data, segments) {
  if (builtCache.has(segments)) return builtCache.get(segments);
  const { meta, heights, proj } = data;
  const [minX, minZ, maxX, maxZ] = proj.extent;
  const cols = segments + 1;
  const rows = Math.round(segments * ((maxZ - minZ) / (maxX - minX))) + 1;
  const metres = resampleToScene(heights, meta, proj, cols, rows);
  const grid = new Float32Array(metres.length);
  for (let i = 0; i < grid.length; i++) grid[i] = Math.max(metres[i], 0) * EXAG * KM;
  const out = { cols, rows, grid, heightAt: gridSampler(grid, cols, rows, proj.extent) };
  builtCache.set(segments, out);
  return out;
}

/* ------------------------------------------------------------------ */
/* Scene                                                                */
/* ------------------------------------------------------------------ */

function bitmapTexture(bitmap, renderer) {
  const t = new THREE.Texture(bitmap);
  t.flipY = false; // flipped while decoding
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.needsUpdate = true;
  return t;
}

function terrainMesh(built, data, renderer) {
  const [minX, minZ, maxX, maxZ] = data.proj.extent;
  const { cols, rows, grid } = built;
  const buf = gridMesh(grid, cols, rows, data.proj.extent);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(buf.position, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(buf.normal, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(buf.uv, 2));
  geo.setIndex(new THREE.BufferAttribute(buf.index, 1));

  const map = bitmapTexture(data.color, renderer);
  map.colorSpace = THREE.SRGBColorSpace;
  const roughnessMap = bitmapTexture(data.rough, renderer); // green channel = roughness
  const mat = new THREE.MeshStandardMaterial({ map, roughnessMap, roughness: 1, metalness: 0 });
  const mesh = new THREE.Mesh(geo, mat);

  // Skirts: a stone edge where the map cuts through land, like a tabletop model.
  const skirt = [];
  const push = (x, z, y) => skirt.push(x, y, z, x, SEA_Y * 2, z);
  const edgeRun = (list) => {
    const start = skirt.length / 3;
    for (const [i, j] of list) push(lerp(minX, maxX, i / (cols - 1)), lerp(minZ, maxZ, j / (rows - 1)), grid[j * cols + i]);
    return start;
  };
  const runs = [
    [...Array(cols).keys()].map((i) => [i, rows - 1]),
    [...Array(rows).keys()].map((j) => [cols - 1, rows - 1 - j]),
    [...Array(cols).keys()].map((i) => [cols - 1 - i, 0]),
    [...Array(rows).keys()].map((j) => [0, j]),
  ];
  const index = [];
  for (const run of runs) {
    const s = edgeRun(run);
    for (let n = 0; n < run.length - 1; n++) {
      const a = s + n * 2;
      index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(skirt, 3));
  sg.setIndex(index);
  sg.computeVertexNormals();
  const skirtMesh = new THREE.Mesh(sg, new THREE.MeshLambertMaterial({ color: '#cbbfa6', side: THREE.DoubleSide }));
  return { mesh, skirtMesh };
}

// Sea beyond the data: a large plane with a hole where the terrain is (no overlap, no z-fighting).
function outerSea(extent) {
  const [minX, minZ, maxX, maxZ] = extent;
  const R = 600;
  const shape = new THREE.Shape([new THREE.Vector2(-R, -R), new THREE.Vector2(R, -R), new THREE.Vector2(R, R), new THREE.Vector2(-R, R)]);
  shape.holes.push(new THREE.Path([new THREE.Vector2(minX, -maxZ), new THREE.Vector2(minX, -minZ), new THREE.Vector2(maxX, -minZ), new THREE.Vector2(maxX, -maxZ)]));
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, SEA_Y, 0);
  const color = new THREE.Color().setRGB(SEA_DEEP[0] / 255, SEA_DEEP[1] / 255, SEA_DEEP[2] / 255, THREE.SRGBColorSpace);
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: SEA_ROUGHNESS / 255, metalness: 0 }));
}

// Sky dome that follows the camera. Its horizon colour equals the fog colour, so
// the fogged sea melts into the sky without a seam.
function skyDome() {
  const geo = new THREE.SphereGeometry(800, 48, 24);
  const pos = geo.attributes.position;
  const horizon = new THREE.Color(SKY);
  const zenith = new THREE.Color(SKY_TOP);
  const c = new THREE.Color();
  const colors = [];
  for (let k = 0; k < pos.count; k++) {
    const up = clamp(pos.getY(k) / 800, 0, 1);
    c.copy(horizon).lerp(zenith, smoothstep(0, 0.45, up) ** 0.8);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = -1;
  return mesh;
}

/* ------------------------------------------------------------------ */
/* Markers (HTML via CSS2DRenderer: crisp text, real buttons, tab order) */
/* ------------------------------------------------------------------ */

const categoryLabel = (c) => (c ? (CATEGORY[c] ? tr(CATEGORY[c], getState().lang) : (c.charAt(0).toUpperCase() + c.slice(1)).replace(/-/g, ' & ')) : '');

function markerButton(className, label, html, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = className;
  el.setAttribute('aria-label', label);
  el.innerHTML = html;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(el);
  });
  // Keep pointer drags on a marker from reaching the map controls.
  el.addEventListener('pointerdown', (e) => e.stopPropagation());
  return el;
}

function pinElement(poi, color, important, onClick) {
  const el = markerButton(`t3-pin${important ? ' is-important' : ''}`, poi.name, `<span class="t3-pin-label">${esc(poi.name)}</span><span class="t3-pin-dot"></span><span class="t3-pin-stem"></span>`, onClick);
  el.style.setProperty('--pin', color);
  return el;
}

function houseElement(name, onClick) {
  const icon = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M3 11 12 3l9 8v10H3z" fill="#fff"/><path d="M9 21v-6h6v6" fill="${HOUSE_COLOR}"/></svg>`;
  return markerButton('t3-house', name, `<span class="t3-house-label">${esc(name)}</span><span class="t3-house-icon">${icon}</span><span class="t3-house-stem"></span><span class="t3-house-pulse" aria-hidden="true"></span>`, onClick);
}

function placeElement(place) {
  const el = document.createElement('span');
  el.className = `t3-place${place.kind === 'range' ? ' is-range' : ''}`;
  el.textContent = place.name;
  el.setAttribute('aria-hidden', 'true');
  return el;
}

/* ------------------------------------------------------------------ */
/* UI chrome                                                            */
/* ------------------------------------------------------------------ */

const BTN_ICONS = {
  in: '<path d="M12 5v14M5 12h14"/>',
  out: '<path d="M5 12h14"/>',
  left: '<path d="M4 12a8 8 0 1 0 2.3-5.7M4 4v5h5"/>',
  right: '<path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5"/>',
  home: '<path d="M3 11 12 3l9 8v10h-6v-6H9v6H3z"/>',
  north: '<path d="m12 3 5 15-5-3-5 3z"/>',
};
const svg = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;

function buildChrome(root, coarse) {
  const tools = document.createElement('div');
  tools.className = 't3-tools';
  tools.innerHTML = [
    ['in', tt('zoomIn')],
    ['out', tt('zoomOut')],
    ['left', tt('left')],
    ['right', tt('right')],
    ['north', tt('north')],
    ['home', tt('home')],
  ]
    .map(([id, label]) => `<button type="button" data-t3="${id}" aria-label="${esc(label)}" title="${esc(label)}">${svg(BTN_ICONS[id])}</button>`)
    .join('');
  const hint = document.createElement('p');
  hint.className = 't3-hint';
  hint.textContent = tt(coarse ? 'hintTouch' : 'hintMouse');
  const card = document.createElement('div');
  card.className = 't3-card';
  card.hidden = true;
  card.setAttribute('role', 'status');
  root.append(tools, hint, card);
  let done = null;
  if (coarse) {
    done = document.createElement('button');
    done.type = 'button';
    done.className = 't3-done';
    done.hidden = true;
    done.textContent = tt('done');
    done.setAttribute('aria-label', tt('doneLabel'));
    root.append(done);
  }
  return { tools, hint, card, done };
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export async function createTerrain(container, { pois = [], center = [SITE.location.lat, SITE.location.lon], flyover = false, onSelect = () => {}, selected = null } = {}) {
  const root = document.createElement('div');
  root.className = `t3${flyover ? ' is-flyover' : ''}`;
  root.innerHTML = `<div class="t3-loading" role="status"><span></span>${esc(tt('loading'))}</div>`;
  container.append(root);
  liveInstances++;

  const fail = (message, err) => {
    release();
    root.innerHTML = `<div class="t3-fallback" role="alert"><strong>${esc(tt('unavailable'))}</strong><span>${esc(message)}</span></div>`;
    throw err instanceof Error ? err : new Error(message);
  };

  let data;
  try {
    data = await loadData();
  } catch (err) {
    fail(tt('noData'), err);
  }
  if (!root.isConnected) {
    release();
    return { focus() {}, setPois() {}, setSelected() {}, dispose() {} };
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    fail(tt('noWebgl'), err);
  }

  const reduced = prefersReducedMotion();
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const lowQuality = coarse || Math.max(window.innerWidth, window.innerHeight) < 900;
  const built = build(data, lowQuality ? 320 : 512);
  const { proj } = data;
  const extent = proj.extent;
  const heightAt = built.heightAt;
  const toWorld = (lat, lon, lift = 0) => {
    const p = proj.toScene(lat, lon);
    return new THREE.Vector3(p.x, heightAt(p.x, p.z) + lift, p.z);
  };

  root.innerHTML = '';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = 't3-canvas';
  root.append(canvas);

  const labels = new CSS2DRenderer();
  labels.domElement.className = 't3-labels';
  // Focusing a pin near the edge would scroll the label layer and detach every
  // label from the terrain. CSS uses overflow: clip; this covers browsers without it.
  labels.domElement.addEventListener('scroll', (e) => {
    e.target.scrollLeft = 0;
    e.target.scrollTop = 0;
  });
  root.append(labels.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(SKY, 40, 200);
  const camera = new THREE.PerspectiveCamera(flyover ? 38 : 42, 1, 0.05, 900);

  const { mesh, skirtMesh } = terrainMesh(built, data, renderer);
  const sea = outerSea(extent);
  const sky = skyDome();
  scene.add(mesh, skirtMesh, sea, sky);
  scene.add(new THREE.HemisphereLight('#ffffff', '#d8cfb8', 1.9));
  // Late-afternoon sun from the WSW: lights the seaward face of Velebit and puts a sheen on the sea.
  const sun = new THREE.DirectionalLight('#fff4e2', 1.35);
  sun.position.set(-60, 45, 20);
  scene.add(sun);

  /* Markers */
  const houseLatLon = [SITE.location.lat, SITE.location.lon];
  const brand = SITE.names.apartments;
  let currentPois = [];
  let selectedId = null;
  let opener = null; // marker that opened the card, gets focus back when it closes
  const pinObjects = new Map(); // id -> CSS2DObject
  const placeObjects = [];
  const markerGroup = new THREE.Group();
  scene.add(markerGroup);

  const openFrom = (id) => (el) => {
    opener = el;
    select(id, true);
  };
  const houseObj = new CSS2DObject(houseElement(brand, openFrom('house')));
  houseObj.center.set(0.5, 1);
  houseObj.position.copy(toWorld(...houseLatLon));
  markerGroup.add(houseObj);

  // The flyover hero shows only the house: town names would collide with the hero text.
  function rebuildPlaces() {
    for (const o of placeObjects) {
      markerGroup.remove(o);
      o.element.remove();
    }
    placeObjects.length = 0;
    if (flyover) return;
    const taken = new Set(currentPois.map((p) => placeKey(p.name)));
    for (const place of PLACES) {
      if (taken.has(placeKey(place.name))) continue;
      const o = new CSS2DObject(placeElement(place));
      o.position.copy(toWorld(place.lat, place.lon, place.kind === 'range' ? 0.25 : 0.05));
      o.userData.place = true;
      markerGroup.add(o);
      placeObjects.push(o);
    }
  }

  const poiColor = (poi) => poi.color || CATEGORY_COLORS[poi.category] || '#0b6fa4';

  function setPois(list = []) {
    for (const o of pinObjects.values()) {
      markerGroup.remove(o);
      o.element.remove();
    }
    pinObjects.clear();
    currentPois = list.filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon));
    for (const poi of currentPois) {
      // A POI named like a town takes over that town's always-on label.
      const important = !!poi.important || PLACE_NAMES.has(placeKey(poi.name));
      const o = new CSS2DObject(pinElement(poi, poiColor(poi), important, openFrom(poi.id)));
      o.center.set(0.5, 1);
      o.position.copy(toWorld(poi.lat, poi.lon));
      o.userData.poi = poi;
      markerGroup.add(o);
      pinObjects.set(poi.id, o);
    }
    rebuildPlaces();
    if (selectedId && selectedId !== 'house' && !pinObjects.has(selectedId)) setSelected(null);
    else setSelected(selectedId);
    request();
  }

  /* Chrome, card */
  const chrome = flyover ? null : buildChrome(root, coarse);
  if (flyover) {
    // Decorative: nothing inside may be focused or announced.
    root.inert = true;
    root.setAttribute('aria-hidden', 'true');
  } else {
    root.tabIndex = 0;
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', tt('region'));
    const attr = document.createElement('p');
    attr.className = 't3-attr';
    attr.textContent = data.meta.attribution || '';
    attr.title = (data.meta.sources || []).join('\n');
    root.append(attr);
  }

  function renderCard(id) {
    if (!chrome) return;
    const card = chrome.card;
    if (!id) {
      card.hidden = true;
      card.innerHTML = '';
      return;
    }
    let html;
    if (id === 'house') {
      const a = SITE.address;
      html = `<span class="t3-chip" style="--pin:${HOUSE_COLOR}">${esc(tt('stay'))}</span><h4>${esc(brand)}</h4><p>${esc(`${a.street}, ${a.place}`)}</p>`;
    } else {
      const poi = pinObjects.get(id)?.userData.poi;
      if (!poi) return renderCard(null);
      const km = fromVilla(poi.lat, poi.lon);
      html = `${poi.category ? `<span class="t3-chip" style="--pin:${poiColor(poi)}">${esc(categoryLabel(poi.category))}</span>` : ''}<h4>${esc(poi.name)}</h4><p>${esc(tt('away').replace('{km}', formatKm(km)))}</p>`;
    }
    card.innerHTML = `${html}<button type="button" class="t3-card-close" aria-label="${esc(tt('close'))}">${svg('<path d="M6 6l12 12M18 6 6 18"/>')}</button>`;
    card.hidden = false;
    card.querySelector('.t3-card-close').addEventListener('click', closeCard);
  }

  function setSelected(id) {
    selectedId = id || null;
    for (const [pid, o] of pinObjects) o.element.classList.toggle('is-selected', pid === selectedId);
    houseObj.element.classList.toggle('is-selected', selectedId === 'house');
    renderCard(selectedId);
    request();
  }

  function select(id, fromUser) {
    setSelected(id);
    if (fromUser && id) onSelect(id);
  }

  // Keyboard close: focus goes back to the marker that opened the card (the close
  // button is removed with the card), or to the map when that marker is gone.
  function closeCard() {
    const back = opener;
    opener = null;
    select(null, true);
    const usable = back?.isConnected && back.tabIndex >= 0 && back.style.display !== 'none';
    (usable ? back : root).focus({ preventScroll: true });
  }

  /* Camera, controls, constraints */
  const [minX, minZ, maxX, maxZ] = extent;
  const margin = 3;
  const bounds = { minX: minX + margin, maxX: maxX - margin, minZ: minZ + margin, maxZ: maxZ - margin };
  let controls = null;
  let setTouchActive = null;

  // Position the camera relative to a target by azimuth (0 = looking north), polar angle and distance.
  const orbit = (target, azimuthDeg, polarDeg, dist) => {
    const az = THREE.MathUtils.degToRad(azimuthDeg);
    const po = THREE.MathUtils.degToRad(polarDeg);
    return new THREE.Vector3(target.x - Math.sin(az) * Math.sin(po) * dist, target.y + Math.cos(po) * dist, target.z + Math.cos(az) * Math.sin(po) * dist);
  };
  const home = () => {
    const target = toWorld(center[0], center[1]);
    // From the south-west over the Zadar channel, looking towards Velebit.
    return { target, position: orbit(target, 22, 60, 19) };
  };

  function constrain() {
    if (controls) {
      const t = controls.target;
      const cx = clamp(t.x, bounds.minX, bounds.maxX) - t.x;
      const cz = clamp(t.z, bounds.minZ, bounds.maxZ) - t.z;
      if (cx || cz) {
        t.x += cx;
        t.z += cz;
        camera.position.x += cx;
        camera.position.z += cz;
      }
    }
    const ground = Math.max(heightAt(camera.position.x, camera.position.z), 0);
    if (camera.position.y < ground + 0.35) camera.position.y = ground + 0.35;
  }

  if (!flyover) {
    controls = new MapControls(camera, canvas);
    controls.enableDamping = !reduced;
    controls.dampingFactor = 0.09;
    controls.minDistance = 1.2;
    // Further out the whole data square floats in the open sea, which reads as a slab.
    controls.maxDistance = 45;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(76);
    controls.zoomToCursor = true;
    controls.zoomSpeed = 1.1;
    controls.keyPanSpeed = 22;
    controls.listenToKeyEvents(root);
    // Like the Leaflet maps: the wheel only zooms after the map was clicked or focused,
    // so scrolling the page never gets trapped.
    controls.enableZoom = false;
    const armZoom = () => {
      controls.enableZoom = true;
      chrome.hint.classList.add('is-quiet');
    };
    root.addEventListener('pointerdown', armZoom, { once: true });
    root.addEventListener('focusin', armZoom, { once: true });
    if (coarse) {
      // Same idea for touch: until the map is tapped, every gesture belongs to the
      // page. Sharing gestures (one finger page, two fingers map) via touch-action
      // let the browser take two-finger moves and cancel the pointers the controls need.
      let active = false;
      setTouchActive = (on) => {
        active = on;
        canvas.style.touchAction = on ? 'none' : 'pan-y';
        controls.touches = on ? { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE } : { ONE: -1, TWO: -1 };
        chrome.done.hidden = !on;
        root.classList.toggle('is-touch-active', on);
      };
      setTouchActive(false);
      let hintTimer = 0;
      canvas.addEventListener('touchstart', () => {
        if (active) return;
        chrome.hint.classList.add('is-loud');
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => chrome.hint.classList.remove('is-loud'), 1400);
      }, { passive: true });
      let tap = null;
      canvas.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'touch' && e.isPrimary) tap = [e.clientX, e.clientY, e.timeStamp];
      });
      canvas.addEventListener('pointerup', (e) => {
        if (!active && tap && e.isPrimary && Math.hypot(e.clientX - tap[0], e.clientY - tap[1]) < 10 && e.timeStamp - tap[2] < 500) {
          setTouchActive(true);
          chrome.hint.classList.remove('is-loud');
        }
        tap = null;
      });
      canvas.addEventListener('pointercancel', () => (tap = null));
      chrome.done.addEventListener('click', () => setTouchActive(false));
    }
    controls.addEventListener('change', request);
    // A plain click on the map closes the card; the end of a drag does not.
    let down = null;
    canvas.addEventListener('pointerdown', (e) => (down = [e.clientX, e.clientY]));
    canvas.addEventListener('click', (e) => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 6) select(null, true);
    });
  }

  const h = home();
  camera.position.copy(h.position);
  camera.lookAt(h.target);
  if (controls) controls.target.copy(h.target);

  /* Tweens (focus, zoom buttons, home) */
  let tween = null;
  function animateTo(target, position, ms = 1700) {
    if (!controls) return;
    if (reduced || ms === 0) {
      controls.target.copy(target);
      camera.position.copy(position);
      tween = null;
      request();
      return;
    }
    tween = { t0: performance.now(), ms, fromT: controls.target.clone(), fromP: camera.position.clone(), toT: target, toP: position };
    request();
  }
  function stepTween(now) {
    const k = easeInOutCubic(clamp((now - tween.t0) / tween.ms, 0, 1));
    controls.target.lerpVectors(tween.fromT, tween.toT, k);
    camera.position.lerpVectors(tween.fromP, tween.toP, k);
    // Lift the path a little mid-way so long hops arc over the land instead of skimming it.
    camera.position.y += Math.sin(k * Math.PI) * tween.fromP.distanceTo(tween.toP) * 0.12;
    if (k >= 1) tween = null;
    return !!tween;
  }

  function resolve(idOrLatLon) {
    if (Array.isArray(idOrLatLon)) return idOrLatLon;
    if (idOrLatLon && typeof idOrLatLon === 'object' && Number.isFinite(idOrLatLon.lat)) return [idOrLatLon.lat, idOrLatLon.lon];
    if (idOrLatLon === 'house') return houseLatLon;
    const poi = pinObjects.get(idOrLatLon)?.userData.poi || PLACES.find((p) => p.name === idOrLatLon);
    return poi ? [poi.lat, poi.lon] : null;
  }

  // Show a marker's label for a moment, so the user sees what the camera flew to.
  let flashEl = null;
  let flashTimer = 0;
  function flashLabel(id) {
    flashEl?.classList.remove('is-flash');
    clearTimeout(flashTimer);
    flashEl = id === 'house' ? houseObj.element : pinObjects.get(id)?.element || null;
    if (!flashEl) return;
    flashEl.classList.add('is-flash');
    flashTimer = setTimeout(() => flashEl?.classList.remove('is-flash'), LABEL_FLASH_MS);
  }

  // `zoom` is a Leaflet-style zoom level (map:focus events carry one).
  function focus(idOrLatLon, { distance, zoom } = {}) {
    const ll = resolve(idOrLatLon);
    if (!ll || !controls) return;
    const target = toWorld(ll[0], ll[1]);
    // Raised targets (Velebit) get a wider, steeper view: close and oblique, a
    // mountain fills the frame as a wall of rock with no coast for context.
    const d = clamp(distance ?? (zoom ? 19 * 2 ** (12 - zoom) : 7 + target.y * 7), controls.minDistance, controls.maxDistance);
    const polar = 52 - clamp(target.y * 5, 0, 8);
    const az = THREE.MathUtils.radToDeg(controls.getAzimuthalAngle());
    // Keep the current heading so the user does not lose orientation.
    animateTo(target, orbit(target, -az, polar, d));
    if (typeof idOrLatLon === 'string') flashLabel(idOrLatLon);
  }

  function rotateBy(deg) {
    const t = controls.target;
    const off = camera.position.clone().sub(t).applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
    animateTo(t.clone(), t.clone().add(off), 600);
  }
  function zoomBy(f) {
    const t = controls.target;
    const off = camera.position.clone().sub(t);
    const d = clamp(off.length() * f, controls.minDistance, controls.maxDistance);
    animateTo(t.clone(), t.clone().add(off.setLength(d)), 450);
  }

  if (chrome) {
    chrome.tools.addEventListener('click', (e) => {
      const b = e.target.closest('[data-t3]');
      if (!b) return;
      const a = b.dataset.t3;
      if (a === 'in') zoomBy(0.6);
      else if (a === 'out') zoomBy(1.65);
      else if (a === 'left') rotateBy(-30);
      else if (a === 'right') rotateBy(30);
      else if (a === 'home') {
        const v = home();
        animateTo(v.target, v.position);
      } else if (a === 'north') {
        const t = controls.target.clone();
        animateTo(t, orbit(t, 0, 8, Math.max(camera.position.distanceTo(t), 30)), 900);
      }
    });
    chrome.tools.addEventListener('pointerdown', (e) => e.stopPropagation());
    root.addEventListener('keydown', (e) => {
      // Escape works from anywhere inside the map (a pin, the card), not only the map itself.
      if (e.key === 'Escape' && selectedId) {
        e.preventDefault();
        closeCard();
        return;
      }
      if (e.target !== root) return;
      if (e.key === '+' || e.key === '=') zoomBy(0.7);
      else if (e.key === '-' || e.key === '_') zoomBy(1.45);
    });
  }

  /* Flyover: closed spline through a few hand-picked viewpoints */
  let fly = null;
  if (flyover) {
    const kp = (lat, lon, alt) => {
      const p = proj.toScene(lat, lon);
      return new THREE.Vector3(p.x, alt, p.z);
    };
    // [camera lat, lon, altitude km] -> [look-at lat, lon]
    const path = [
      [[44.46, 15.56, 7.5], [44.26, 15.17]], // high over Velebit, looking to the sea
      [[44.36, 15.42, 4.6], [44.25, 15.16]], // above Paklenica
      [[44.28, 15.29, 2.6], [44.256, 15.158]], // over the Novigrad channel
      [[44.226, 15.205, 1.35], [44.2587, 15.1589]], // near the house, from Nin
      [[44.236, 15.118, 1.5], [44.262, 15.165]], // past the house towards Vir
      [[44.31, 15.06, 2.6], [44.29, 15.19]], // over Vir
      [[44.43, 15.12, 5.2], [44.3, 15.3]], // north, Pag in view
    ];
    const cams = path.map(([c]) => kp(...c));
    const looks = path.map(([, t]) => {
      const p = proj.toScene(...t);
      return new THREE.Vector3(p.x, 0, p.z);
    });
    fly = {
      cam: new THREE.CatmullRomCurve3(cams, true, 'centripetal'),
      look: new THREE.CatmullRomCurve3(looks, true, 'centripetal'),
      t: 0,
    };
    // Reduced motion: one still, composed frame (house in front, Velebit behind).
    if (reduced) {
      const s = proj.toScene(44.3, 15.24);
      camera.position.copy(kp(44.17, 15.06, 6.2));
      camera.lookAt(s.x, 0, s.z);
      fly = null;
    }
  }
  const lookTmp = new THREE.Vector3();
  function stepFly(dt) {
    fly.t = (fly.t + dt / FLYOVER_SECONDS) % 1;
    fly.cam.getPointAt(fly.t, camera.position);
    fly.look.getPointAt(fly.t, lookTmp);
    constrain();
    camera.lookAt(lookTmp);
  }

  /* Render loop: on demand, continuous only while something moves */
  let raf = 0;
  let last = 0;
  let onScreen = true;
  let disposed = false;
  let ready = false; // true once the shaders are compiled (see compileAsync below)
  const view = { w: 1, h: 1, tools: null }; // px, refreshed on resize
  const occlRay = new THREE.Vector3();
  const ndc = new THREE.Vector3();
  const markerObjects = () => [houseObj, ...pinObjects.values(), ...placeObjects];

  // Per frame: hide markers behind ridges, keep off-screen pins out of the tab
  // order, hide place names that would be clipped or sit under the tool buttons,
  // and keep pin labels inside the map (below the dot near the top, inward at the sides).
  function updateMarkers() {
    const cam = camera.position;
    const { w, h, tools } = view;
    ndc.copy(houseObj.position).project(camera);
    const hx = (ndc.x + 1) * 0.5 * w;
    const hy = (1 - ndc.y) * 0.5 * h;
    for (const o of markerObjects()) {
      const el = o.element;
      const p = o.position;
      ndc.copy(p).project(camera);
      const x = (ndc.x + 1) * 0.5 * w;
      const y = (1 - ndc.y) * 0.5 * h;
      const inView = ndc.z < 1 && x > 12 && x < w - 12 && y > 12 && y < h - 12;
      let hidden = false;
      for (let s = 1; s < 24 && inView && !hidden; s++) {
        occlRay.lerpVectors(cam, p, s / 24);
        if (heightAt(occlRay.x, occlRay.z) > occlRay.y + 0.03) hidden = true;
      }
      el.classList.toggle('is-occluded', hidden);
      if (o.userData.place) {
        if (!o.userData.halfW) o.userData.halfW = el.offsetWidth / 2;
        const half = o.userData.halfW || 40;
        const clipped = x - half < 12 || x + half > w - 12 || y < 24 || y > h - 36 || (tools && x + half > tools.left && x - half < tools.right && y + 10 > tools.top && y - 10 < tools.bottom);
        el.classList.toggle('is-clipped', clipped);
        continue;
      }
      // Anchor off the map: hide it even when selected, or only half a label peeks in.
      el.classList.toggle('is-out', !(ndc.z < 1 && x >= 0 && x <= w && y >= 0 && y <= h));
      const tab = inView && (!hidden || o === houseObj) ? 0 : -1;
      if (el.tabIndex !== tab) el.tabIndex = tab;
      if (o === houseObj) continue;
      // An always-on label right next to the house would sit under its marker.
      el.classList.toggle('is-near-house', Math.abs(x - hx) < 70 && Math.abs(y - hy) < 40);
      el.classList.toggle('is-flipped', y < 96);
      el.classList.toggle('is-left', x < 110);
      el.classList.toggle('is-right', x > w - 110);
    }
  }

  function frame(now) {
    raf = 0;
    if (disposed) return;
    const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
    last = now;
    let keep = false;
    if (fly) {
      stepFly(dt);
      keep = true;
    }
    if (tween) keep = stepTween(now) || keep;
    if (controls) {
      keep = controls.update() || keep;
      constrain();
    }
    const dist = controls ? camera.position.distanceTo(controls.target) : camera.position.y * 2.2;
    scene.fog.near = dist * 1.5;
    scene.fog.far = dist * 4 + 30;
    camera.near = clamp(dist * 0.01, 0.02, 1);
    sky.position.copy(camera.position);
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    labels.render(scene, camera);
    updateMarkers();
    root.classList.toggle('is-far', dist > 30);
    if (keep) request();
    else last = 0;
  }
  function request() {
    if (ready && !raf && !disposed && onScreen && !document.hidden) raf = requestAnimationFrame(frame);
  }

  function resize() {
    const w = Math.max(1, root.clientWidth);
    const hgt = Math.max(1, root.clientHeight);
    renderer.setSize(w, hgt, false);
    labels.setSize(w, hgt);
    camera.aspect = w / hgt;
    root.classList.toggle('is-portrait', w / hgt < 1);
    // Flyover on a wide hero: frame the house a little right of centre, clear of left-aligned text.
    if (flyover && w / hgt > 1.3) camera.setViewOffset(w, hgt, -w * 0.1, 0, w, hgt);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    view.w = w;
    view.h = hgt;
    if (chrome) {
      const r = root.getBoundingClientRect();
      const t = chrome.tools.getBoundingClientRect();
      view.tools = { left: t.left - r.left - 8, right: t.right - r.left + 8, top: t.top - r.top - 8, bottom: t.bottom - r.top + 8 };
    }
    for (const o of placeObjects) o.userData.halfW = 0; // fonts and sizes change with the layout
    // setSize clears the canvas. Draw now, inside the ResizeObserver callback (before
    // paint): a vh-sized map resized off-screen or by the phone URL bar would
    // otherwise stay blank until the next frame, which never comes off-screen.
    // Before the shaders are compiled a draw would link them synchronously here.
    if (!ready) return;
    cancelAnimationFrame(raf);
    frame(performance.now());
  }
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  const io = new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    if (onScreen) request();
    else {
      last = 0;
      setTouchActive?.(false); // scrolled away: give touch gestures back to the page
    }
  });
  io.observe(root);
  const onVisibility = () => {
    last = 0;
    request();
  };
  document.addEventListener('visibilitychange', onVisibility);
  const onLost = (e) => {
    e.preventDefault();
    root.insertAdjacentHTML('beforeend', '<div class="t3-fallback" role="alert"><strong>3D view paused</strong><span>The graphics context was lost. Reload the page to continue.</span></div>');
  };
  canvas.addEventListener('webglcontextlost', onLost);

  setPois(pois);
  setSelected(selected);
  // Link the shader programs without blocking the main thread where the browser
  // supports KHR_parallel_shader_compile; elsewhere this compiles synchronously, as the first draw would.
  try {
    await renderer.compileAsync(scene, camera);
  } catch (err) {
    console.warn('[terrain3d] shader precompile failed, compiling on first draw', err);
  }
  ready = true;
  resize();

  return {
    focus,
    setPois,
    setSelected,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      clearTimeout(flashTimer);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      controls?.dispose();
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          o.material.map?.dispose();
          o.material.roughnessMap?.dispose();
          o.material.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      root.remove();
      release();
    },
  };
}
