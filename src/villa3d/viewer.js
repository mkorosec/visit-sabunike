// Embeddable 3D view of the house, built from the photo-based model in
// model.js / build.js. Two modes:
//   'embed' – orbit, hover + click to pick an apartment, floor isolation, roof toggle.
//   'hero'  – no chrome, no picking, slow pendulum orbit (static with reduced motion).
// Frames are rendered on demand only (the hero orbit runs only while on screen).
//
//   const v = await createVillaViewer(el, { mode: 'embed', selected: 'apt1', onSelect: (id) => … });
//   v.select('apt2'); v.setFloor('upper'); v.setRoof(false); v.resetView(); v.dispose();
//
// The viewer fills its container (absolutely positioned), so give the container a size.
// Optional extra option `strings` overrides the English UI text (see STRINGS).

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as M from './model.js';
import { createMaterials, buildBuilding, buildZoneObjects } from './build.js';
import { APARTMENTS } from '../content/site.js';
import { esc, photo, prefersReducedMotion, tr } from '../lib/util.js';
import { getState } from '../state.js';
import './viewer.css';

const DEG = Math.PI / 180;
const MAX_PIXEL_RATIO = 1.5;
const FOV = 36;
const MAX_POLAR = 84 * DEG; // stay above the lawn
const PARAMS = M.DEFAULT_PARAMS;
const FALLBACK_PHOTO = '20210810_184724.jpg';
const HERO_SWING_MS = 46000; // one full pendulum swing of the hero camera, then it rests
const PARK_MS = 30000;

// A disposed viewer parks its renderer for a while instead of destroying it, so a page
// rebuild (language, audience or brand switch) reuses the WebGL context and its compiled
// shader programs instead of creating and compiling them again.
let parked = null; // { renderer, release, timer }
function unpark() {
  const p = parked;
  parked = null;
  if (p) clearTimeout(p.timer);
  return p;
}
function destroy(p) {
  p.release();
  p.renderer.dispose();
  p.renderer.forceContextLoss();
}
function park(renderer, release) {
  const old = unpark();
  if (old) destroy(old);
  parked = { renderer, release, timer: setTimeout(() => destroy(unpark()), PARK_MS) };
}
window.addEventListener('pagehide', () => {
  const p = unpark();
  if (p) destroy(p);
});

// Only the four rentable apartments are shown and pickable (not the caretaker room).
const APT = new Map(APARTMENTS.map((a) => [a.id, a]));

// Viewer chrome in every site language; `strings` passed by the caller override these.
const STRINGS = {
  floors: { en: 'Floors', de: 'Etagen', sl: 'Etaže', hr: 'Etaže', it: 'Piani' },
  all: { en: 'All', de: 'Alle', sl: 'Vse', hr: 'Sve', it: 'Tutti' },
  ground: { en: 'Ground', de: 'EG', sl: 'Pritličje', hr: 'Prizemlje', it: 'Terra' },
  upper: { en: 'Upper', de: 'OG', sl: 'Nadstropje', hr: 'Kat', it: 'Primo' },
  roof: { en: 'Roof', de: 'Dach', sl: 'Streha', hr: 'Krov', it: 'Tetto' },
  reset: { en: 'Reset view', de: 'Ansicht zurücksetzen', sl: 'Ponastavi pogled', hr: 'Vrati početni prikaz', it: 'Ripristina la vista' },
  note: { en: 'Simplified 3D model, based on photos', de: 'Vereinfachtes 3D-Modell nach Fotos', sl: 'Poenostavljen 3D-model, narejen po fotografijah', hr: 'Pojednostavljeni 3D model izrađen prema fotografijama', it: 'Modello 3D semplificato, ricostruito dalle foto' },
  roleDescription: { en: '3D model', de: '3D-Modell', sl: '3D-model', hr: '3D model', it: 'modello 3D' },
  zoomHint: { en: 'Hold Ctrl and scroll to zoom', de: 'Zum Zoomen Strg gedrückt halten und scrollen', sl: 'Za povečavo držite Ctrl in se pomikajte s kolescem', hr: 'Za zumiranje držite Ctrl i pomičite kotačić', it: 'Per lo zoom tenete premuto Ctrl e scorrete' },
  scene: {
    en: '3D model of the house. Drag or use the arrow keys to turn it, plus and minus to zoom. Click an apartment to select it; the apartment list next to the model does the same.',
    de: '3D-Modell des Hauses. Zum Drehen ziehen oder die Pfeiltasten nutzen, Plus und Minus zum Zoomen. Klicken Sie ein Apartment an, um es auszuwählen; die Apartmentliste neben dem Modell funktioniert genauso.',
    sl: '3D-model hiše. Zavrtite ga tako, da ga povlečete ali uporabite puščične tipke, s plusom in minusom ga povečate ali pomanjšate. Kliknite apartma, da ga izberete; enako deluje seznam apartmajev ob modelu.',
    hr: '3D model kuće. Okrenite ga povlačenjem ili tipkama sa strelicama, a plusom i minusom zumirajte. Kliknite apartman da biste ga odabrali; isto možete i na popisu apartmana pokraj modela.',
    it: "Modello 3D della casa. Trascinate o usate i tasti freccia per ruotarlo, più e meno per lo zoom. Fate clic su un appartamento per selezionarlo; l'elenco degli appartamenti accanto al modello funziona allo stesso modo.",
  },
  fallback: {
    en: 'The 3D preview could not start in this browser, so here is a photo of the house instead.',
    de: 'Die 3D-Vorschau konnte in diesem Browser nicht starten, deshalb sehen Sie hier ein Foto des Hauses.',
    sl: '3D-predogled se v tem brskalniku ni mogel zagnati, zato si oglejte fotografijo hiše.',
    hr: '3D prikaz nije se mogao pokrenuti u ovom pregledniku, pa evo fotografije kuće.',
    it: "L'anteprima 3D non si è avviata in questo browser: ecco invece una foto della casa.",
  },
  lost: {
    en: 'The 3D preview paused because the graphics context was lost.',
    de: 'Die 3D-Vorschau wurde angehalten, weil der Grafikkontext verloren ging.',
    sl: '3D-predogled se je ustavil, ker je grafični kontekst izgubljen.',
    hr: '3D prikaz je zaustavljen jer je izgubljen grafički kontekst.',
    it: "L'anteprima 3D si è fermata perché il contesto grafico è andato perso.",
  },
  fallbackAlt: { en: 'The house in the evening sun', de: 'Das Haus in der Abendsonne', sl: 'Hiša v večernem soncu', hr: 'Kuća na večernjem suncu', it: 'La casa al sole della sera' },
};
const APT_SHORT = { en: 'Apt', de: 'Apt.', sl: 'Ap.', hr: 'Ap.', it: 'App.' };
const SELECTED = { en: 'Apartment {n} selected', de: 'Apartment {n} ausgewählt', sl: 'Izbran je apartma {n}', hr: 'Odabran je apartman {n}', it: 'Appartamento {n} selezionato' };

// Resolved in the current page language when a viewer is created.
function localStrings() {
  const lang = getState().lang;
  const S = Object.fromEntries(Object.entries(STRINGS).map(([k, v]) => [k, tr(v, lang)]));
  S.unit = (a) => `${tr(APT_SHORT, lang)} ${a.number}`;
  S.selected = (a) => tr(SELECTED, lang).replace('{n}', a.number);
  return S;
}

export async function createVillaViewer(container, { mode = 'embed', selected = null, onSelect = () => {}, floor = 'all', strings = {} } = {}) {
  const S = { ...localStrings(), ...strings };
  const hero = mode === 'hero';
  if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
  const root = document.createElement('div');
  root.className = `vv vv-${hero ? 'hero' : 'embed'}`;
  container.append(root);

  let view;
  try {
    if (new URLSearchParams(location.search).has('nogl')) throw new Error('3D disabled with ?nogl');
    view = createScene(root, { hero, S, selected, floor, onSelect });
  } catch (err) {
    // Handled: the fallback photo is the visible outcome, so this is not an error.
    console.warn('[villa3d] WebGL viewer unavailable:', err?.message || err);
    view?.dispose?.();
    showFallback(root, S);
    return { ok: false, select() {}, setFloor() {}, setRoof() {}, resetView() {}, dispose: () => root.remove() };
  }
  // Compile the shader programs first: with KHR_parallel_shader_compile the driver links them
  // off the main thread, so the first frame does not block the page.
  await view.compile();
  await new Promise((r) => requestAnimationFrame(r));
  view.renderNow();
  root.classList.add('is-ready');
  return view.api;
}

function showFallback(root, S) {
  root.classList.add('vv-failed', 'is-ready');
  root.innerHTML = `
    <figure class="vv-fallback">
      <img src="${photo(FALLBACK_PHOTO, 'web')}" alt="${esc(S.fallbackAlt)}" loading="lazy" />
      <figcaption>${esc(S.fallback)}</figcaption>
    </figure>`;
}

function createScene(root, { hero, S, selected, floor, onSelect }) {
  // autoRoof: the roof was lifted by a selection (not by the user), so it may come back.
  const state = { selected: APT.has(selected) ? selected : null, hover: null, floor, roof: true, autoRoof: false, disposed: false };

  let reused = unpark();
  if (reused?.renderer.getContext().isContextLost()) {
    destroy(reused);
    reused = null;
  }
  // Render on demand only, so the default GPU is enough (no discrete GPU wake-up on laptops).
  const renderer = reused?.renderer || new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'default' });
  const canvas = renderer.domElement;
  canvas.className = 'vv-canvas';
  root.append(canvas);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // static geometry: refresh shadows only when visibility changes
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);
  const materials = createMaterials();
  addLights(scene);
  const ground = makeGround();
  scene.add(ground);

  const { groups, meshes } = buildBuilding(PARAMS, materials);
  for (const g of Object.values(groups)) scene.add(g);

  const zoneMats = new Map();
  const zoneGroups = { ground: new THREE.Group(), upper: new THREE.Group() };
  const outlines = new Map(); // unit id -> { group, mat }
  const { zones, objects } = buildZoneObjects(PARAMS, (unit, kind) => zoneMaterialsFor(zoneMats, unit, kind));
  const aptObjects = objects.filter((o) => APT.has(o.unit.id));
  for (const o of objects) {
    o.mesh.visible = !hero && APT.has(o.unit.id);
    zoneGroups[o.zone.floor].add(o.mesh);
  }
  scene.add(zoneGroups.ground, zoneGroups.upper);
  // Outlines are drawn through walls so a selected upper-floor unit stays visible under the roof.
  for (const id of APT.keys()) {
    const mat = new THREE.LineBasicMaterial({ color: APT.get(id).color, depthTest: false, transparent: true, opacity: 1 });
    const group = new THREE.Group();
    group.visible = false;
    for (const o of aptObjects.filter((x) => x.unit.id === id)) {
      const line = new THREE.LineSegments(o.edges.geometry, mat);
      line.renderOrder = 30;
      line.userData.floor = o.zone.floor;
      group.add(line);
    }
    scene.add(group);
    outlines.set(id, { group, mat });
  }

  let labelRenderer = null;
  const labels = new Map();
  if (!hero) {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.domElement.className = 'vv-labels';
    root.append(labelRenderer.domElement);
    for (const [id, apt] of APT) {
      const label = makeLabel(apt, S, () => pickUnit(id));
      // Anchor on the unit's terrace/balcony: it is on the visible side and is what guests recognise.
      const own = aptObjects.filter((o) => o.unit.id === id);
      const main = own.find((o) => o.zone.kind === 'outdoor') || own[0];
      const [cx, cz] = M.polygonCentroid(main.zone.poly);
      label.position.set(cx, main.zone.level + Math.min(1.3, main.zone.height * 0.6), cz);
      label.userData.floor = main.zone.floor;
      scene.add(label);
      labels.set(id, label);
    }
  }

  const ui = hero ? null : buildChrome(root, S);
  let controls = null;
  if (!hero) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.12;
    controls.minDistance = 6;
    controls.maxDistance = 70;
    controls.maxPolarAngle = MAX_POLAR;
    controls.screenSpacePanning = true;
    // Horizontal drags turn the model, vertical swipes still scroll the page on phones.
    canvas.style.touchAction = 'pan-y';
    canvas.tabIndex = 0;
    // Interactive (arrow and +/- keys), so not role=img, which screen readers treat as static.
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-roledescription', S.roleDescription);
    canvas.setAttribute('aria-label', S.scene);
  } else {
    canvas.setAttribute('aria-hidden', 'true');
  }

  /* ---------- render on demand ---------- */
  let raf = 0;
  let tween = null;
  let lost = false;
  let onScreen = true;
  const heroMotion = hero && !prefersReducedMotion();
  const heroStart = performance.now();
  let lastHero = 0;

  function requestRender() {
    if (state.disposed || raf || document.hidden || lost) return;
    raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    let more = false;
    if (tween) more = stepTween(now);
    if (controls && controls.update()) more = true;
    if (heroMotion && onScreen) {
      const t = Math.min(now - heroStart, HERO_SWING_MS);
      // The camera moves slowly, so about 30 fps looks the same as the display rate.
      if (t < HERO_SWING_MS && now - lastHero < 33) return requestRender();
      lastHero = now;
      placeHeroCamera(t);
      more = t < HERO_SWING_MS;
    }
    renderNow();
    if (more) requestRender();
  }
  // The very first shadow pass comes out empty (programs still compiling), so repeat it once.
  let shadowWarmup = 2;
  function renderNow() {
    if (shadowWarmup > 0) {
      shadowWarmup -= 1;
      renderer.shadowMap.needsUpdate = true;
    }
    renderer.render(scene, camera);
    labelRenderer?.render(scene, camera);
    // The previous viewer's materials go only now, after this scene took over their programs.
    if (reused) {
      reused.release();
      reused = null;
    }
  }

  /* ---------- camera ---------- */
  const home = () => {
    const D = PARAMS.depth;
    const target = new THREE.Vector3(5.6, hero ? 3.4 : 2.9, -D / 2 + 1.2);
    const span = (camera.aspect < 1 ? 19 : 25) + (hero ? 4 : 0);
    const dist = Math.max(hero ? 32 : 26, fitDistance(span, hero ? 16 : 14));
    const pos = target.clone().add(new THREE.Vector3().setFromSphericalCoords(dist, (hero ? 70 : 64) * DEG, -34 * DEG));
    return { pos, target };
  };
  function fitDistance(w, h) {
    const v = (FOV * DEG) / 2;
    return Math.max(h / 2 / Math.tan(v), w / 2 / (Math.tan(v) * camera.aspect)) * 1.08;
  }
  function placeHeroCamera(ms) {
    const { pos, target } = home();
    const dist = pos.distanceTo(target);
    // A slow pendulum over the front and stair side; the rear walls were never photographed.
    const theta = (-30 + 28 * Math.sin((ms / 46000) * Math.PI * 2)) * DEG;
    const phi = (69 + 2 * Math.sin((ms / 31000) * Math.PI * 2)) * DEG;
    camera.position.copy(target).add(new THREE.Vector3().setFromSphericalCoords(dist, phi, theta));
    camera.lookAt(target);
  }
  function flyTo(pos, target, { instant = false, ms = 800 } = {}) {
    if (!controls) return;
    if (instant || prefersReducedMotion()) {
      tween = null;
      camera.position.copy(pos);
      controls.target.copy(target);
      controls.update();
      requestRender();
      return;
    }
    tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), ms };
    requestRender();
  }
  function stepTween(now) {
    const k = Math.min(1, (now - tween.start) / tween.ms);
    const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k >= 1) tween = null;
    return tween !== null;
  }
  function resetView(opts) {
    const { pos, target } = home();
    if (controls) flyTo(pos, target, opts);
    else {
      camera.position.copy(pos);
      camera.lookAt(target);
      requestRender();
    }
  }
  function frameUnit(id, opts) {
    if (!controls) return;
    const box = new THREE.Box3();
    for (const o of aptObjects.filter((x) => x.unit.id === id)) {
      o.mesh.geometry.computeBoundingBox();
      box.union(o.mesh.geometry.boundingBox);
    }
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    // Aim part-way back to the house centre so the neighbouring labels stay in frame.
    const centre = box.getCenter(new THREE.Vector3()).lerp(new THREE.Vector3(5.6, 2.9, -PARAMS.depth / 2 + 1.2), 0.45);
    // Keep the current viewing direction, but never look from behind the house.
    const off = camera.position.clone().sub(controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    s.theta = THREE.MathUtils.clamp(s.theta, -80 * DEG, 40 * DEG);
    s.phi = THREE.MathUtils.clamp(s.phi, 45 * DEG, 70 * DEG);
    // Move closer only a little, so the rest of the house stays in view for orientation.
    s.radius = THREE.MathUtils.clamp(fitDistance(Math.max(size.x, size.z) + 14, size.y + 12), 26, 44);
    flyTo(centre.clone().add(new THREE.Vector3().setFromSpherical(s)), centre, opts);
  }

  /* ---------- visibility & highlight ---------- */
  function applyVisibility() {
    const f = state.floor;
    groups.ground.visible = f === 'all' || f === 'ground';
    groups.upper.visible = f === 'all' || f === 'upper';
    groups.roof.visible = f === 'all' && state.roof;
    zoneGroups.ground.visible = groups.ground.visible;
    zoneGroups.upper.visible = groups.upper.visible;
    for (const label of labels.values()) label.visible = zoneGroups[label.userData.floor].visible;
    if (ui) {
      for (const b of ui.floorBtns) b.setAttribute('aria-pressed', String(b.dataset.floor === f));
      ui.roof.setAttribute('aria-pressed', String(state.roof && f === 'all'));
      ui.roof.disabled = f !== 'all';
    }
    renderer.shadowMap.needsUpdate = true;
    applyHighlight();
  }
  function applyHighlight() {
    const sel = state.selected;
    for (const [id, z] of zoneMats) {
      if (!APT.has(id)) continue;
      const isSel = sel === id;
      const isHover = state.hover === id && !isSel;
      const dim = sel && !isSel && !isHover;
      z.interior.opacity = isSel ? 0.5 : isHover ? 0.38 : dim ? 0.06 : 0.2;
      z.outdoor.opacity = isSel ? 0.36 : isHover ? 0.26 : dim ? 0.04 : 0.12;
      z.edge.opacity = isSel || isHover ? 1 : dim ? 0.2 : 0.7;
      z.interior.emissive.set(isSel || isHover ? z.interior.color : 0x000000).multiplyScalar(isSel ? 0.4 : 0.2);
      const o = outlines.get(id);
      o.group.visible = !hero && (isSel || isHover);
      o.mat.opacity = isSel ? 1 : 0.6;
      for (const line of o.group.children) line.visible = zoneGroups[line.userData.floor].visible;
    }
    for (const [id, label] of labels) {
      label.element.classList.toggle('is-selected', sel === id);
      label.element.classList.toggle('is-hover', state.hover === id);
      label.element.setAttribute('aria-pressed', String(sel === id));
    }
    requestRender();
  }
  function setSelected(id) {
    state.selected = APT.has(id) ? id : null;
    const apt = APT.get(state.selected);
    if (apt && state.floor !== 'all' && state.floor !== apt.floor) {
      state.floor = apt.floor;
      applyVisibility();
    } else applyHighlight();
    if (apt && ui) ui.status.textContent = S.selected(apt);
  }
  function liftRoofFor(id) {
    const upper = APT.get(id)?.floor === 'upper';
    if (upper && state.roof) {
      state.roof = false;
      state.autoRoof = true;
    } else if (!upper && state.autoRoof) {
      state.roof = true;
      state.autoRoof = false;
    } else return;
    applyVisibility();
  }
  function pickUnit(id) {
    setSelected(id);
    liftRoofFor(state.selected);
    onSelect(state.selected);
  }

  /* ---------- picking ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const isShown = (obj) => {
    for (let o = obj; o; o = o.parent) if (!o.visible) return false;
    return true;
  };
  function unitAt(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const candidates = meshes.filter((m) => m.userData.floor !== 'site' && isShown(m));
    for (const o of aptObjects) if (isShown(o.mesh)) candidates.push(o.mesh);
    const hit = raycaster.intersectObjects(candidates, false)[0];
    if (!hit) return null;
    if (hit.object.userData.isZone) return hit.object.userData.unit;
    // A wall was hit: probe a little further along the ray into the zone behind it.
    const visibleZones = zones.filter((z) => APT.has(z.unit) && zoneGroups[z.floor].visible);
    for (const s of [0.05, 0.2, 0.45, 0.8, 1.2]) {
      const p = hit.point.clone().addScaledVector(raycaster.ray.direction, s);
      const zone = M.zoneAt(visibleZones, p.x, p.y, p.z);
      if (zone) return zone.unit;
    }
    return null;
  }

  const listeners = [];
  const on = (target, type, fn, opts) => {
    target.addEventListener(type, fn, opts);
    listeners.push(() => target.removeEventListener(type, fn, opts));
  };

  if (!hero) {
    let down = null;
    on(canvas, 'pointerdown', (e) => {
      down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
    });
    on(canvas, 'pointerup', (e) => {
      if (!down || down.id !== e.pointerId) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 650;
      down = null;
      if (moved > 6 || !quick) return;
      pickUnit(unitAt(e.clientX, e.clientY));
    });
    let hoverQueued = null;
    on(canvas, 'pointermove', (e) => {
      if (e.pointerType !== 'mouse' || e.buttons) return;
      const first = !hoverQueued;
      hoverQueued = { x: e.clientX, y: e.clientY };
      if (!first) return;
      requestAnimationFrame(() => {
        if (state.disposed || !hoverQueued) return;
        const id = unitAt(hoverQueued.x, hoverQueued.y);
        hoverQueued = null;
        canvas.style.cursor = id ? 'pointer' : '';
        if (id !== state.hover) {
          state.hover = id;
          applyHighlight();
        }
      });
    });
    on(canvas, 'pointerleave', () => {
      hoverQueued = null;
      canvas.style.cursor = '';
      if (state.hover) {
        state.hover = null;
        applyHighlight();
      }
    });
    on(canvas, 'keydown', (e) => onKey(e));
    // Let the page scroll over the model; zoom needs Ctrl (or a pinch).
    // The hint shows once: the model stays pinned while the page scrolls past it.
    let hintTimer = 0;
    let hinted = false;
    on(root, 'wheel', (e) => {
      if (e.ctrlKey || e.metaKey) return;
      e.stopPropagation();
      if (hinted) return;
      hinted = true;
      ui.hint.hidden = false;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => (ui.hint.hidden = true), 1400);
    }, { capture: true });
    listeners.push(() => clearTimeout(hintTimer));
    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', () => (tween = null));

    for (const b of ui.floorBtns) on(b, 'click', () => api.setFloor(b.dataset.floor));
    on(ui.roof, 'click', () => api.setRoof(!state.roof));
    on(ui.reset, 'click', () => resetView());
  }

  function onKey(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const step = 7 * DEG;
    const orbit = (dt, dp) => {
      const off = camera.position.clone().sub(controls.target);
      const s = new THREE.Spherical().setFromVector3(off);
      s.theta += dt;
      s.phi = THREE.MathUtils.clamp(s.phi + dp, 0.05, controls.maxPolarAngle);
      camera.position.copy(controls.target).add(off.setFromSpherical(s));
    };
    const zoom = (f) => {
      const off = camera.position.clone().sub(controls.target);
      off.setLength(THREE.MathUtils.clamp(off.length() * f, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(off);
    };
    const keys = {
      ArrowLeft: () => orbit(-step, 0),
      ArrowRight: () => orbit(step, 0),
      ArrowUp: () => orbit(0, -step),
      ArrowDown: () => orbit(0, step),
      '+': () => zoom(0.88),
      '=': () => zoom(0.88),
      '-': () => zoom(1.14),
    };
    const fn = keys[e.key];
    if (!fn) return;
    e.preventDefault();
    tween = null;
    fn();
    controls.update();
    requestRender();
  }

  /* ---------- lifecycle ---------- */
  on(canvas, 'webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    root.dataset.lost = S.lost;
  });
  on(canvas, 'webglcontextrestored', () => {
    lost = false;
    delete root.dataset.lost;
    renderer.shadowMap.needsUpdate = true;
    requestRender();
  });
  on(document, 'visibilitychange', () => {
    if (document.hidden && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else requestRender();
  });

  let sized = false;
  const resize = () => {
    const w = Math.max(1, root.clientWidth);
    const h = Math.max(1, root.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    renderer.setSize(w, h, false);
    labelRenderer?.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // Re-fit the default view until the user has moved the camera.
    if (!sized || hero) resetView({ instant: true });
    sized = true;
    requestRender();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(root);
  let io = null;
  if (heroMotion) {
    io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      if (onScreen) requestRender();
    });
    io.observe(root);
  }
  resize();
  applyVisibility();

  function dispose() {
    if (state.disposed) return;
    state.disposed = true;
    if (raf) cancelAnimationFrame(raf);
    ro.disconnect();
    io?.disconnect();
    for (const off of listeners) off();
    controls?.dispose();
    // The procedural textures are shared by all viewers (build.js), so they stay.
    const sharedTex = new Set(Object.values(materials.tex || {}));
    const release = () => {
      const mats = new Set();
      scene.traverse((o) => {
        if (o.isInstancedMesh) o.dispose();
        o.geometry?.dispose();
        o.shadow?.dispose();
        for (const m of [].concat(o.material || [])) mats.add(m);
      });
      for (const m of mats) {
        if (!sharedTex.has(m.map)) m.map?.dispose();
        m.alphaMap?.dispose();
        m.dispose();
      }
      for (const m of [...materials.clippable, ...Object.values(materials.mats)]) m.dispose();
    };
    reused?.release(); // disposed before its first frame: the renderer is ours, the old scene is not
    if (lost) destroy({ renderer, release });
    else {
      for (const a of ['role', 'aria-roledescription', 'aria-label', 'aria-hidden', 'tabindex']) canvas.removeAttribute(a);
      canvas.style.cursor = canvas.style.touchAction = '';
      canvas.remove();
      park(renderer, release);
    }
    root.remove();
  }

  const api = {
    ok: true,
    select(id) {
      setSelected(id);
      liftRoofFor(state.selected);
      if (state.selected) frameUnit(state.selected);
    },
    setFloor(f) {
      if (!['all', 'ground', 'upper'].includes(f)) return;
      state.floor = f;
      applyVisibility();
    },
    setRoof(on) {
      state.roof = Boolean(on);
      state.autoRoof = false;
      applyVisibility();
    },
    resetView: () => resetView(),
    dispose,
  };
  // Without the parallel-compile extension the first render compiles anyway (and three warns).
  const compile = () => (renderer.extensions.has('KHR_parallel_shader_compile') ? renderer.compileAsync(scene, camera) : Promise.resolve());
  return { api, renderNow, dispose, compile };
}

/* ---------- scene pieces ---------- */

function addLights(scene) {
  scene.add(new THREE.HemisphereLight('#f2f7fc', '#a39a78', 1.25));
  // Late-afternoon sun as in the owner's photo 20210720_171634 (front lit), using the inferred orientation.
  const facade = M.feasibleFacadeAzimuths();
  const dir = new THREE.Vector3(...M.sunDirectionModel(facade.observations[0].sun, facade.mid)).normalize();
  const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
  const centre = new THREE.Vector3(6, 2, -2);
  sun.position.copy(centre).addScaledVector(dir, 45);
  sun.target.position.copy(centre);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 100 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
}

// Lawn disc that fades out at the edge, so the model sits on the page background.
function makeGround() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.55, '#fff');
  grad.addColorStop(1, '#000');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const alphaMap = new THREE.CanvasTexture(c);
  const mat = new THREE.MeshStandardMaterial({ color: '#a7b67c', roughness: 1, transparent: true, alphaMap, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(36, 64), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(5, -0.01, 2);
  mesh.receiveShadow = true;
  mesh.renderOrder = -1;
  return mesh;
}

function zoneMaterialsFor(cache, unit, kind) {
  let z = cache.get(unit.id);
  if (!z) {
    const color = APT.get(unit.id)?.color || unit.color;
    const base = { color, transparent: true, depthWrite: false, roughness: 1 };
    z = {
      interior: new THREE.MeshStandardMaterial({ ...base, opacity: 0.2 }),
      outdoor: new THREE.MeshStandardMaterial({ ...base, opacity: 0.12 }),
      edge: new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.7 }),
    };
    cache.set(unit.id, z);
  }
  return { fill: kind === 'outdoor' ? z.outdoor : z.interior, edge: z.edge };
}

function makeLabel(apt, S, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'vv-label';
  el.style.setProperty('--c', apt.color);
  el.tabIndex = -1; // keyboard users pick from the apartment cards
  el.setAttribute('aria-pressed', 'false');
  el.innerHTML = `<span class="vv-label-num" aria-hidden="true">${apt.number}</span><span>${esc(S.unit(apt))}</span>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });
  return new CSS2DObject(el);
}

function buildChrome(root, S) {
  const bar = document.createElement('div');
  bar.className = 'vv-ui';
  bar.innerHTML = `
    <div class="vv-seg" role="group" aria-label="${esc(S.floors)}">
      ${['all', 'ground', 'upper'].map((f) => `<button type="button" class="vv-btn" data-floor="${f}" aria-pressed="false">${esc(S[f])}</button>`).join('')}
    </div>
    <button type="button" class="vv-btn vv-roof" aria-pressed="true">${esc(S.roof)}</button>
    <button type="button" class="vv-btn vv-reset" title="${esc(S.reset)}" aria-label="${esc(S.reset)}">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
    </button>`;
  const note = document.createElement('p');
  note.className = 'vv-note';
  note.textContent = S.note;
  const hint = document.createElement('p');
  hint.className = 'vv-hint';
  hint.hidden = true;
  hint.textContent = S.zoomHint;
  const status = document.createElement('p');
  status.className = 'visually-hidden';
  status.setAttribute('role', 'status');
  root.append(bar, note, hint, status);
  return {
    floorBtns: [...bar.querySelectorAll('[data-floor]')],
    roof: bar.querySelector('.vv-roof'),
    reset: bar.querySelector('.vv-reset'),
    hint,
    status,
  };
}
