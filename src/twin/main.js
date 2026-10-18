import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import * as M from '../villa3d/model.js';
import {
  createMaterials, buildBuilding, buildZoneObjects, makeUnitLabel, boxOutline, buildDimensions, buildNorth,
  buildPhotoMarkers, buildTrees,
} from '../villa3d/build.js';

/* ------------------------------------------------------------------ */
/* Assets                                                              */
/* ------------------------------------------------------------------ */

// Photos are served from public/photos. The site only ships the 1600 px web
// copies, so "original" links point at those too.
function photoUrl(file, kind = 'web') {
  const base = import.meta.env.BASE_URL;
  return kind === 'thumb' ? `${base}photos/thumbs/${file}` : `${base}photos/web/${file}`;
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const DEG = Math.PI / 180;
const DEFAULT_FOV = 40;
const MAX_PIXEL_RATIO = 1.5;
const MAX_POLAR = Math.PI * 0.495; // keep the orbit camera above the ground

const state = {
  params: { ...M.DEFAULT_PARAMS },
  floor: 'all',
  roof: true,
  cut: false,
  cutAxis: 'z',
  cutZ: -1.2,
  cutX: 3.2,
  evidence: false,
  labels: true,
  dims: false,
  markers: true,
  trees: false,
  selected: null, // { type: 'unit' | 'section', id }
  overlay: null,
};

const facade = M.feasibleFacadeAzimuths();
const stats = { frames: 0, lastFrameAt: 0, pixelRatio: 1 };
let gl = null; // 3D context (null when WebGL failed)

/* ------------------------------------------------------------------ */
/* 3D setup                                                            */
/* ------------------------------------------------------------------ */

function init3D() {
  if (new URLSearchParams(location.search).has('nogl')) {
    throw new Error('3D deliberately disabled with the ?nogl URL switch (used to test this fallback).');
  }
  const canvas = $('scene');
  const viewport = $('viewport');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false; // geometry is static: refresh shadows only on change
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.localClippingEnabled = true;
  // a shader that fails to compile would otherwise only show up in the console
  renderer.debug.onShaderError = (ctx, program, vs, fs) => {
    console.error('Shader compile/link error', ctx.getProgramInfoLog(program), ctx.getShaderInfoLog(vs), ctx.getShaderInfoLog(fs));
    showBanner('A graphics shader failed to compile on this device; parts of the 3D view may be missing. Photos and unit data remain available.');
  };

  const labelRenderer = new CSS2DRenderer({ element: $('labels') });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce7f0');

  const camera = new THREE.PerspectiveCamera(DEFAULT_FOV, 1, 0.1, 500);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;
  controls.minDistance = 2.5;
  controls.maxDistance = 120;
  controls.maxPolarAngle = MAX_POLAR;
  controls.screenSpacePanning = true;

  const materials = createMaterials();
  const cutPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), state.cutZ);

  // lighting: sun placed as in photo 20210720_171634, using the inferred orientation
  const hemi = new THREE.HemisphereLight('#eef4fb', '#8f8a70', 1.15);
  scene.add(hemi);
  const sunObs = facade.observations[0];
  const sunDir = new THREE.Vector3(...M.sunDirectionModel(sunObs.sun, facade.mid)).normalize();
  const sun = new THREE.DirectionalLight('#fff3df', 2.7);
  const centre = new THREE.Vector3(6, 2, -2);
  sun.position.copy(centre).addScaledVector(sunDir, 45);
  sun.target.position.copy(centre);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 5, far: 100 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), materials.mats.lawn);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.set(6, -0.002, 4);
  lawn.receiveShadow = true;
  scene.add(lawn);

  const north = buildNorth(facade);
  scene.add(north);
  const markers = buildPhotoMarkers(M.PHOTOS);
  scene.add(markers.group);
  const trees = buildTrees(materials);
  trees.visible = false;
  scene.add(trees);
  const overlayGroup = new THREE.Group();
  scene.add(overlayGroup);

  gl = {
    renderer, labelRenderer, scene, camera, controls, materials, cutPlane, sun, markers, trees, north, overlayGroup,
    world: null, zoneMats: new Map(), siteMats: new Map(), lost: false, raf: 0, tween: null,
  };
  gl.world = buildWorld();
  scene.add(gl.world.root);

  // events
  controls.addEventListener('change', requestRender);
  controls.addEventListener('start', () => { gl.tween = null; });
  new ResizeObserver(resize).observe(viewport);
  window.addEventListener('resize', resize);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    gl.lost = true;
    showBanner('The graphics context was lost. Waiting for the browser to restore it…');
  });
  canvas.addEventListener('webglcontextrestored', () => {
    gl.lost = false;
    hideBanner();
    renderer.shadowMap.needsUpdate = true;
    requestRender();
  });
  setupPicking(canvas);
  canvas.addEventListener('keydown', onCanvasKey);

  resize();
  setView('home', { instant: true });
  applyAll();
}

/** Building + zones + labels + section outlines + dimensions (rebuilt when the depth changes). */
function buildWorld() {
  const root = new THREE.Group();
  root.name = 'world';
  const { groups, meshes } = buildBuilding(state.params, gl.materials);
  // site objects keep their own unclipped materials (fence/driveway should not vanish in a cutaway)
  for (const mesh of meshes) {
    if (mesh.userData.floor === 'site') {
      mesh.material = siteMaterial(mesh.material);
      mesh.userData.baseMaterial = mesh.material;
    }
  }
  for (const g of Object.values(groups)) root.add(g);

  const zoneGroups = { ground: new THREE.Group(), upper: new THREE.Group() };
  const { zones, objects } = buildZoneObjects(state.params, zoneMaterialsFor);
  for (const o of objects) zoneGroups[o.zone.floor].add(o.mesh);
  root.add(zoneGroups.ground, zoneGroups.upper);

  const labelGroup = new THREE.Group();
  const labels = new Map();
  for (const unit of M.UNITS) {
    const own = objects.filter((o) => o.unit.id === unit.id && o.zone.kind === 'interior');
    const main = own.sort((a, b) => Math.abs(M.polygonArea(b.zone.poly)) - Math.abs(M.polygonArea(a.zone.poly)))[0];
    if (!main) continue;
    const [cx, cz] = M.polygonCentroid(main.zone.poly);
    const label = makeUnitLabel(unit, (id) => select({ type: 'unit', id }));
    label.position.set(cx, main.zone.level + Math.min(1.6, main.zone.height * 0.6), cz);
    label.userData.floor = main.zone.floor;
    labelGroup.add(label);
    labels.set(unit.id, label);
  }
  root.add(labelGroup);

  const sectionOutlines = new Map();
  for (const s of M.buildSections(state.params)) {
    const o = boxOutline(s.box, '#e0312b');
    o.visible = false;
    root.add(o);
    sectionOutlines.set(s.id, o);
  }
  const dims = buildDimensions(state.params);
  root.add(dims);
  return { root, groups, meshes, zones, zoneObjects: objects, zoneGroups, labelGroup, labels, sectionOutlines, dims };
}

function disposeWorld(world) {
  const shared = new Set([...gl.materials.clippable, ...gl.siteMats.values()]);
  for (const zm of gl.zoneMats.values()) Object.values(zm).forEach((m) => shared.add(m));
  world.root.traverse((o) => {
    if (o.isCSS2DObject) o.element.remove(); // removing the root does not detach label elements
    if (o.isInstancedMesh) o.dispose();
    if (o.geometry && !o.isInstancedMesh) o.geometry.dispose();
    if (o.material && !shared.has(o.material)) o.material.dispose?.();
  });
  world.root.removeFromParent();
}

function rebuildWorld() {
  if (!gl) return;
  disposeWorld(gl.world);
  gl.world = buildWorld();
  gl.scene.add(gl.world.root);
  applyAll();
}

function siteMaterial(mat) {
  if (!gl.siteMats.has(mat)) {
    const m = new THREE.MeshStandardMaterial({
      color: mat.color, map: mat.map, roughness: mat.roughness, metalness: mat.metalness,
      transparent: mat.transparent, opacity: mat.opacity, side: mat.transparent ? THREE.DoubleSide : THREE.FrontSide,
    });
    gl.siteMats.set(mat, m);
  }
  return gl.siteMats.get(mat);
}

function zoneMaterialsFor(unit, kind) {
  let z = gl.zoneMats.get(unit.id);
  if (!z) {
    const base = { color: unit.color, transparent: true, depthWrite: false, roughness: 1, clipShadows: true };
    z = {
      interior: new THREE.MeshStandardMaterial({ ...base, opacity: 0.22 }),
      outdoor: new THREE.MeshStandardMaterial({ ...base, opacity: 0.12 }),
      edge: new THREE.LineBasicMaterial({ color: unit.color, transparent: true, opacity: 0.8 }),
    };
    for (const m of Object.values(z)) gl.materials.clippable.add(m);
    gl.zoneMats.set(unit.id, z);
  }
  return { fill: kind === 'outdoor' ? z.outdoor : z.interior, edge: z.edge };
}

/* ------------------------------------------------------------------ */
/* Render on demand                                                    */
/* ------------------------------------------------------------------ */

function requestRender() {
  if (!gl || gl.lost || gl.raf || document.hidden) return;
  gl.raf = requestAnimationFrame(frame);
}

function frame(now) {
  gl.raf = 0;
  let more = false;
  if (gl.tween) more = stepTween(now);
  if (gl.controls.update()) more = true; // still damping
  updateCompass();
  gl.renderer.render(gl.scene, gl.camera);
  gl.labelRenderer.render(gl.scene, gl.camera);
  stats.frames += 1;
  stats.lastFrameAt = now;
  if (more) requestRender();
  else scheduleIdleStats();
}

let idleTimer = 0;
function scheduleIdleStats() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    const el = $('render-stats');
    if (el) el.textContent = `${stats.frames} frames rendered so far; idle now. Pixel ratio ${stats.pixelRatio.toFixed(2)} (capped at ${MAX_PIXEL_RATIO}).`;
  }, 250);
}

document.addEventListener('visibilitychange', () => {
  if (!gl) return;
  if (document.hidden) {
    if (gl.raf) cancelAnimationFrame(gl.raf);
    gl.raf = 0;
  } else requestRender();
});

function invalidateShadows() {
  if (gl) gl.renderer.shadowMap.needsUpdate = true;
}

function resize() {
  if (!gl) return;
  const vp = $('viewport');
  const w = Math.max(1, vp.clientWidth);
  const h = Math.max(1, vp.clientHeight);
  stats.pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
  gl.renderer.setPixelRatio(stats.pixelRatio);
  gl.renderer.setSize(w, h, false);
  gl.labelRenderer.setSize(w, h);
  gl.camera.aspect = w / h;
  gl.camera.updateProjectionMatrix();
  requestRender();
}

/* ------------------------------------------------------------------ */
/* Camera views & tweening                                             */
/* ------------------------------------------------------------------ */

function flyTo(pos, target, { fov = DEFAULT_FOV, ms = 750, instant = false } = {}) {
  if (!gl) return;
  if (instant || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    gl.camera.position.copy(pos);
    gl.controls.target.copy(target);
    gl.camera.fov = fov;
    gl.camera.updateProjectionMatrix();
    gl.controls.update();
    requestRender();
    return;
  }
  gl.tween = {
    p0: gl.camera.position.clone(), t0: gl.controls.target.clone(), f0: gl.camera.fov,
    p1: pos.clone(), t1: target.clone(), f1: fov, start: performance.now(), ms,
  };
  requestRender();
}

function stepTween(now) {
  const tw = gl.tween;
  const k = Math.min(1, (now - tw.start) / tw.ms);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  gl.camera.position.lerpVectors(tw.p0, tw.p1, e);
  gl.controls.target.lerpVectors(tw.t0, tw.t1, e);
  gl.camera.fov = tw.f0 + (tw.f1 - tw.f0) * e;
  gl.camera.updateProjectionMatrix();
  if (k >= 1) gl.tween = null;
  return gl.tween !== null;
}

function fitDistance(w, h, fov = DEFAULT_FOV) {
  const v = (fov * DEG) / 2;
  return Math.max(h / 2 / Math.tan(v), w / 2 / (Math.tan(v) * gl.camera.aspect)) * 1.1;
}

function setView(view, opts = {}) {
  if (!gl) return;
  closeOverlay({ fly: false });
  const D = state.params.depth;
  const { W } = M.LEVELS;
  if (view === 'home') {
    const t = new THREE.Vector3(6.2, 3.2, -D / 2 + 1.0);
    // portrait screens: frame the building itself rather than the whole site
    const span = gl.camera.aspect < 1 ? 17 : 26;
    const off = new THREE.Vector3().setFromSphericalCoords(Math.max(24, fitDistance(span, 14)), 63 * DEG, -36 * DEG);
    flyTo(t.clone().add(off), t, opts);
  } else if (view === 'front') {
    const t = new THREE.Vector3(W / 2 - 0.6, 4.8, 0);
    flyTo(new THREE.Vector3(t.x, t.y, fitDistance(18.5, 10.8)), t, opts);
  } else if (view === 'top') {
    // footprint plus the stair, driveway pergola and the north arrow
    const x0 = -9.5;
    const x1 = 16.0;
    const z0 = -D - 1.0;
    const z1 = 11.5;
    const t = new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2);
    // fit the footprint at roof height, not at ground level
    const d = fitDistance(x1 - x0, z1 - z0) + M.LEVELS.RIDGE;
    flyTo(new THREE.Vector3(t.x, d, t.z + 0.01), t, opts);
  }
  announce(view === 'home' ? '3D overview' : view === 'front' ? 'Front view' : 'Overhead view');
}

function orbitBy(dTheta, dPhi) {
  const off = gl.camera.position.clone().sub(gl.controls.target);
  const s = new THREE.Spherical().setFromVector3(off);
  s.theta += dTheta;
  s.phi = THREE.MathUtils.clamp(s.phi + dPhi, 0.02, gl.controls.maxPolarAngle);
  off.setFromSpherical(s);
  gl.camera.position.copy(gl.controls.target).add(off);
  gl.controls.update();
  requestRender();
}

function zoomBy(f) {
  const off = gl.camera.position.clone().sub(gl.controls.target);
  const len = THREE.MathUtils.clamp(off.length() * f, gl.controls.minDistance, gl.controls.maxDistance);
  gl.camera.position.copy(gl.controls.target).add(off.setLength(len));
  gl.controls.update();
  requestRender();
}

function panBy(dx, dy) {
  const off = gl.camera.position.clone().sub(gl.controls.target);
  const dist = off.length();
  const right = new THREE.Vector3().setFromMatrixColumn(gl.camera.matrixWorld, 0);
  const up = new THREE.Vector3().setFromMatrixColumn(gl.camera.matrixWorld, 1);
  const delta = right.multiplyScalar(dx * dist * 0.05).add(up.multiplyScalar(dy * dist * 0.05));
  gl.camera.position.add(delta);
  gl.controls.target.add(delta);
  gl.controls.update();
  requestRender();
}

function updateCompass() {
  const north = M.azimuthToModelDir(0, facade.mid);
  const n = new THREE.Vector3(north[0], 0, north[1]);
  const fwd = new THREE.Vector3();
  gl.camera.getWorldDirection(fwd);
  const camUp = new THREE.Vector3().setFromMatrixColumn(gl.camera.matrixWorld, 1);
  const screenUp = new THREE.Vector3(fwd.x + camUp.x, 0, fwd.z + camUp.z).normalize();
  const screenRight = new THREE.Vector3().setFromMatrixColumn(gl.camera.matrixWorld, 0).setY(0).normalize();
  const ang = Math.atan2(n.dot(screenRight), n.dot(screenUp)) / DEG;
  $('compass-needle').setAttribute('transform', `rotate(${ang.toFixed(1)})`);
}

/* ------------------------------------------------------------------ */
/* Visibility, cutaway, evidence colouring                             */
/* ------------------------------------------------------------------ */

function applyAll() {
  applyVisibility();
  applyClipping(true);
  applyEvidence();
  applySelectionHighlight();
}

function applyVisibility() {
  syncToolbar();
  if (!gl) return;
  const w = gl.world;
  const f = state.floor;
  w.groups.ground.visible = f === 'all' || f === 'ground';
  w.groups.upper.visible = f === 'all' || f === 'upper';
  w.groups.roof.visible = f === 'all' && state.roof;
  w.zoneGroups.ground.visible = w.groups.ground.visible;
  w.zoneGroups.upper.visible = w.groups.upper.visible;
  w.labelGroup.visible = state.labels;
  gl.north.userData.label.visible = state.labels && !state.overlay;
  for (const label of w.labels.values()) label.visible = w.zoneGroups[label.userData.floor].visible;
  w.dims.visible = state.dims;
  gl.markers.group.visible = state.markers;
  gl.trees.visible = state.trees;
  invalidateShadows();
  requestRender();
}

function applyClipping(force = false) {
  if (!gl) return;
  const D = state.params.depth;
  if (state.cutAxis === 'z') {
    state.cutZ = THREE.MathUtils.clamp(state.cutZ, -D + 0.3, 1.5);
    gl.cutPlane.normal.set(0, 0, -1);
    gl.cutPlane.constant = state.cutZ; // keep z <= cutZ
  } else {
    state.cutX = THREE.MathUtils.clamp(state.cutX, -2.6, 14.6);
    gl.cutPlane.normal.set(1, 0, 0);
    gl.cutPlane.constant = -state.cutX; // keep x >= cutX
  }
  const planes = state.cut ? [gl.cutPlane] : null;
  for (const m of gl.materials.clippable) {
    const had = Boolean(m.clippingPlanes && m.clippingPlanes.length);
    if (force || had !== state.cut) {
      m.clippingPlanes = planes;
      m.needsUpdate = true;
    }
  }
  syncCutControls();
  invalidateShadows();
  requestRender();
}

function applyEvidence() {
  $('legend').hidden = !state.evidence;
  if (!gl) return;
  for (const mesh of gl.world.meshes) {
    const site = mesh.userData.floor === 'site';
    mesh.material = state.evidence ? evidenceMaterial(mesh.userData.prov, site) : mesh.userData.baseMaterial;
  }
  requestRender();
}

function evidenceMaterial(prov, site) {
  const m = gl.materials.evidence[prov] || gl.materials.evidence.assumed;
  return site ? siteMaterial(m) : m;
}

/* ------------------------------------------------------------------ */
/* Selection                                                           */
/* ------------------------------------------------------------------ */

function select(sel, { frame = false } = {}) {
  state.selected = sel;
  if (sel && sel.type === 'unit' && frame) {
    const unit = M.UNITS.find((u) => u.id === sel.id);
    if (state.floor !== 'all' && state.floor !== unit.floor) state.floor = unit.floor;
    applyVisibility();
  }
  renderUnitLists();
  renderDetail();
  applySelectionHighlight();
  if (frame) frameSelection();
  if (sel) announce(`${selectionName(sel)} selected`);
}

function selectionName(sel) {
  if (!sel) return '';
  if (sel.type === 'unit') return M.UNITS.find((u) => u.id === sel.id).name;
  return M.buildSections(state.params).find((s) => s.id === sel.id).name;
}

function clearSelection() {
  if (!state.selected) return;
  state.selected = null;
  renderUnitLists();
  renderDetail();
  applySelectionHighlight();
  announce('Selection cleared');
}

function applySelectionHighlight() {
  if (!gl) return;
  const sel = state.selected;
  for (const [unitId, z] of gl.zoneMats) {
    const isSel = sel && sel.type === 'unit' && sel.id === unitId;
    const dim = sel && !isSel;
    z.interior.opacity = isSel ? 0.45 : dim ? 0.07 : 0.22;
    z.outdoor.opacity = isSel ? 0.32 : dim ? 0.05 : 0.12;
    z.edge.opacity = isSel ? 1 : dim ? 0.25 : 0.8;
    z.interior.emissive.set(isSel ? z.interior.color : 0x000000).multiplyScalar(isSel ? 0.35 : 0);
  }
  // outlines drawn through walls so the selected unit is visible even with roof and walls in place
  for (const child of [...gl.overlayGroup.children]) {
    child.geometry.dispose();
    gl.materials.clippable.delete(child.material);
    child.material.dispose();
    child.removeFromParent();
  }
  if (sel && sel.type === 'unit') {
    const unit = M.UNITS.find((u) => u.id === sel.id);
    for (const o of gl.world.zoneObjects.filter((x) => x.unit.id === sel.id)) {
      if (!gl.world.zoneGroups[o.zone.floor].visible) continue;
      const mat = new THREE.LineBasicMaterial({ color: unit.color, depthTest: false, transparent: true, opacity: 0.95, clippingPlanes: state.cut ? [gl.cutPlane] : null });
      gl.materials.clippable.add(mat);
      const line = new THREE.LineSegments(o.edges.geometry.clone(), mat);
      line.renderOrder = 30;
      gl.overlayGroup.add(line);
    }
  }
  for (const [id, outline] of gl.world.sectionOutlines) outline.visible = Boolean(sel && sel.type === 'section' && sel.id === id);
  for (const [id, label] of gl.world.labels) label.element.classList.toggle('is-selected', Boolean(sel && sel.type === 'unit' && sel.id === id));
  requestRender();
}

function frameSelection() {
  if (!gl || !state.selected) return;
  const box = new THREE.Box3();
  if (state.selected.type === 'unit') {
    for (const o of gl.world.zoneObjects.filter((x) => x.unit.id === state.selected.id)) {
      o.mesh.geometry.computeBoundingBox();
      box.union(o.mesh.geometry.boundingBox);
    }
  } else {
    const s = M.buildSections(state.params).find((x) => x.id === state.selected.id);
    box.set(new THREE.Vector3(...s.box[0]), new THREE.Vector3(...s.box[1]));
  }
  if (box.isEmpty()) return;
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const dir = gl.camera.position.clone().sub(gl.controls.target).normalize();
  const dist = THREE.MathUtils.clamp(fitDistance(Math.max(size.x, size.z) + 4, size.y + 6), 8, 60);
  flyTo(centre.clone().addScaledVector(dir, dist), centre, { fov: gl.camera.fov });
}

/* ------------------------------------------------------------------ */
/* Picking                                                             */
/* ------------------------------------------------------------------ */

function isShown(obj) {
  for (let o = obj; o; o = o.parent) if (!o.visible) return false;
  return true;
}

function setupPicking(canvas) {
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId };
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || down.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
    const quick = performance.now() - down.t < 650;
    down = null;
    if (moved > 6 || !quick) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, gl.camera);
    pick(raycaster);
  });
}

function pick(raycaster) {
  const w = gl.world;
  if (state.markers) {
    const mh = raycaster.intersectObjects(gl.markers.sprites, false);
    if (mh.length) {
      openPhoto(mh[0].object.userData.photo);
      return;
    }
  }
  const candidates = w.meshes.filter((m) => m.userData.floor !== 'site' && isShown(m));
  for (const o of w.zoneObjects) if (isShown(o.mesh)) candidates.push(o.mesh);
  const hits = raycaster
    .intersectObjects(candidates, false)
    .filter((h) => !state.cut || gl.cutPlane.distanceToPoint(h.point) >= -1e-3);
  if (!hits.length) {
    clearSelection();
    return;
  }
  const hit = hits[0];
  if (hit.object.userData.isZone) {
    select({ type: 'unit', id: hit.object.userData.unit });
    return;
  }
  const visibleZones = w.zones.filter((z) => w.zoneGroups[z.floor].visible);
  for (const s of [0.05, 0.2, 0.45, 0.8, 1.2]) {
    const p = hit.point.clone().addScaledVector(raycaster.ray.direction, s);
    const zone = M.zoneAt(visibleZones, p.x, p.y, p.z);
    if (zone) {
      select({ type: 'unit', id: zone.unit });
      return;
    }
  }
  const p = hit.point;
  const sections = M.buildSections(state.params);
  const order = ['stair-terrace', 'annex', 'main-block'];
  for (const id of order) {
    const s = sections.find((x) => x.id === id);
    const [[x0, y0, z0], [x1, y1, z1]] = s.box;
    const m = 0.6;
    if (p.x >= x0 - m && p.x <= x1 + m && p.y >= y0 - m && p.y <= y1 + 1.2 && p.z >= z0 - m && p.z <= z1 + m) {
      select({ type: 'section', id });
      return;
    }
  }
  clearSelection();
}

/* ------------------------------------------------------------------ */
/* Toolbar                                                             */
/* ------------------------------------------------------------------ */

function syncToolbar() {
  document.querySelectorAll('[data-floor]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.floor === state.floor)));
  const set = (id, v) => $(id).setAttribute('aria-pressed', String(v));
  set('t-roof', state.roof);
  set('t-cut', state.cut);
  set('t-evidence', state.evidence);
  set('t-labels', state.labels);
  set('t-dims', state.dims);
  set('t-markers', state.markers);
  set('t-trees', state.trees);
  $('t-roof').disabled = !gl || state.floor !== 'all';
  $('t-roof').title = state.floor !== 'all' ? 'The roof is hidden while a single floor is isolated' : 'Show or remove the roof and attic (R)';
}

function syncCutControls() {
  $('cut-controls').hidden = !state.cut;
  const input = $('cut-pos');
  const D = state.params.depth;
  if (state.cutAxis === 'z') {
    input.min = String(-D + 0.3);
    input.max = '1.5';
    input.value = String(state.cutZ);
    $('t-cut-axis').textContent = 'Front→back';
    input.setAttribute('aria-valuetext', `section ${Math.abs(Math.min(0, state.cutZ)).toFixed(1)} m behind the front façade`);
  } else {
    input.min = '-2.6';
    input.max = '14.6';
    input.value = String(state.cutX);
    $('t-cut-axis').textContent = 'Left→right';
    input.setAttribute('aria-valuetext', `section ${state.cutX.toFixed(1)} m from the left corner`);
  }
  syncToolbar();
}

function setFloor(f) {
  state.floor = f;
  applyVisibility();
  applySelectionHighlight();
  announce(f === 'all' ? 'All floors shown' : f === 'ground' ? 'Ground floor isolated' : 'Upper floor isolated');
}

function toggle(key, label) {
  state[key] = !state[key];
  if (key === 'cut') applyClipping();
  else if (key === 'evidence') applyEvidence();
  else applyVisibility();
  syncToolbar();
  announce(`${label} ${state[key] ? 'on' : 'off'}`);
}

function moveCut(delta) {
  if (!state.cut) return;
  if (state.cutAxis === 'z') state.cutZ += delta;
  else state.cutX += delta;
  applyClipping();
}

function setupToolbar() {
  document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  document.querySelectorAll('[data-floor]').forEach((b) => b.addEventListener('click', () => setFloor(b.dataset.floor)));
  $('t-roof').addEventListener('click', () => toggle('roof', 'Roof'));
  $('t-cut').addEventListener('click', () => toggle('cut', 'Cutaway'));
  $('t-cut-axis').addEventListener('click', () => {
    state.cutAxis = state.cutAxis === 'z' ? 'x' : 'z';
    applyClipping();
  });
  $('cut-pos').addEventListener('input', (e) => {
    const v = Number(e.target.value);
    if (state.cutAxis === 'z') state.cutZ = v;
    else state.cutX = v;
    applyClipping();
  });
  $('t-evidence').addEventListener('click', () => toggle('evidence', 'Evidence colours'));
  $('t-labels').addEventListener('click', () => toggle('labels', 'Labels'));
  $('t-dims').addEventListener('click', () => toggle('dims', 'Dimensions'));
  $('t-markers').addEventListener('click', () => toggle('markers', 'Photo spots'));
  $('t-trees').addEventListener('click', () => toggle('trees', 'Trees'));
  $('btn-panel').addEventListener('click', () => setPanel(!isPanelOpen()));
  $('btn-help').addEventListener('click', () => $('help-dialog').showModal());
  $('help-close').addEventListener('click', () => $('help-dialog').close());
  $('overlay-close').addEventListener('click', closeOverlay);
  $('overlay-opacity').addEventListener('input', (e) => { $('photo-overlay').style.opacity = e.target.value; });
  $('gl-error-photos').addEventListener('click', () => {
    setPanel(true);
    selectTab('tab-photos');
  });
}

function isPanelOpen() {
  return !$('app').classList.contains('panel-closed');
}

function setPanel(open) {
  $('app').classList.toggle('panel-closed', !open);
  $('btn-panel').setAttribute('aria-expanded', String(open));
  // layout change resizes the viewport; ResizeObserver triggers a render
}

/* ------------------------------------------------------------------ */
/* Keyboard                                                            */
/* ------------------------------------------------------------------ */

function onCanvasKey(e) {
  if (!gl || e.ctrlKey || e.metaKey || e.altKey) return;
  const step = 6 * DEG;
  let handled = true;
  if (e.shiftKey && e.key.startsWith('Arrow')) {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    panBy(d[0], d[1]);
  } else if (e.key === 'ArrowLeft') orbitBy(-step, 0);
  else if (e.key === 'ArrowRight') orbitBy(step, 0);
  else if (e.key === 'ArrowUp') orbitBy(0, -step);
  else if (e.key === 'ArrowDown') orbitBy(0, step);
  else if (e.key === '+' || e.key === '=') zoomBy(0.88);
  else if (e.key === '-' || e.key === '_') zoomBy(1.14);
  else handled = false;
  if (handled) e.preventDefault();
}

function onGlobalKey(e) {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  const tag = (t.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || t.isContentEditable) return;
  if (document.querySelector('dialog[open]')) return;
  const k = e.key;
  const actions = {
    h: () => setView('home'), f: () => setView('front'), t: () => setView('top'),
    0: () => setFloor('all'), 1: () => setFloor('ground'), 2: () => setFloor('upper'),
    r: () => state.floor === 'all' && toggle('roof', 'Roof'), c: () => toggle('cut', 'Cutaway'),
    x: () => { state.cutAxis = state.cutAxis === 'z' ? 'x' : 'z'; applyClipping(); },
    '[': () => moveCut(state.cutAxis === 'z' ? 0.5 : -0.5), ']': () => moveCut(state.cutAxis === 'z' ? -0.5 : 0.5),
    e: () => toggle('evidence', 'Evidence colours'), l: () => toggle('labels', 'Labels'), d: () => toggle('dims', 'Dimensions'),
    p: () => toggle('markers', 'Photo spots'), g: () => toggle('trees', 'Trees'),
    n: () => cycleUnit(1), N: () => cycleUnit(-1),
    '?': () => $('help-dialog').showModal(),
    Escape: () => (state.overlay ? closeOverlay() : clearSelection()),
  };
  // single letters are case-insensitive except Shift+N (previous unit)
  const key = k.length === 1 && k !== 'N' ? k.toLowerCase() : k;
  const fn = actions[key];
  if (fn) {
    fn();
    e.preventDefault();
  }
}

function cycleUnit(dir) {
  const ids = M.UNITS.map((u) => u.id);
  const cur = state.selected && state.selected.type === 'unit' ? ids.indexOf(state.selected.id) : -1;
  const next = ids[(cur + dir + ids.length) % ids.length];
  select({ type: 'unit', id: next }, { frame: true });
}

/* ------------------------------------------------------------------ */
/* Panel: units, sections, detail                                      */
/* ------------------------------------------------------------------ */

function chip(prov, text) {
  return `<span class="chip ${prov}">${text || M.PROV[prov]?.label || prov}</span>`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function unitMeta(u) {
  const s = u.stated;
  if (u.id === 'apt4') return 'similar to Apt 3 · area unspecified';
  if (u.id === 'caretaker') return 'below Apt 4 · area unspecified';
  return `${s.bedrooms} bedroom${s.bedrooms > 1 ? 's' : ''} · ${s.outdoor} · ${s.area} m² (stated)`;
}

function renderUnitLists() {
  const sel = state.selected;
  $('unit-list').innerHTML = M.UNITS.map((u) => `
    <li><button type="button" class="unit-btn" data-unit="${u.id}" style="--c:${u.color}" aria-pressed="${Boolean(sel && sel.type === 'unit' && sel.id === u.id)}">
      <span class="swatch" aria-hidden="true"></span><span class="u-name">${esc(u.name)}</span>
      <span class="u-meta">${esc(unitMeta(u))} · ${u.floor === 'ground' ? 'ground floor' : 'upper floor'} (inferred)</span>
    </button></li>`).join('');
  $('section-list').innerHTML = M.buildSections(state.params).map((s) => `
    <li><button type="button" class="unit-btn" data-section="${s.id}" style="--c:#e0312b" aria-pressed="${Boolean(sel && sel.type === 'section' && sel.id === s.id)}">
      <span class="swatch" aria-hidden="true"></span><span class="u-name">${esc(s.name)}</span><span class="u-meta">${esc(s.text.split('.')[0])}.</span>
    </button></li>`).join('');
}

function areaSentence(u) {
  const rep = M.unitAreaReport(M.buildZones(state.params)).find((r) => r.unit === u.id);
  if (!rep) return '';
  const zoneTxt = `${rep.interior.toFixed(1)} m² enclosed${rep.outdoor ? ` + ${rep.outdoor.toFixed(1)} m² terrace/balcony` : ''}`;
  if (rep.ratio == null) return `<p class="area">Model zone: ${zoneTxt}. No area was supplied, so nothing can be checked.</p>`;
  const cls = rep.verdict === 'plausible' ? 'verdict-plausible' : 'verdict-bad';
  const ref = rep.referenceIsStated ? `stated ${rep.reference} m²` : `Apt 3's ${rep.reference} m² ("similar to apartment 3")`;
  return `<p class="area">Model zone: ${zoneTxt} = <strong>${rep.ratio.toFixed(2)}×</strong> ${ref} → <span class="${cls}">${rep.verdict}</span>.
    The zone outline is indicative. ${rep.referenceIsStated ? 'The stated figure is the authoritative area.' : ''}</p>`;
}

function renderSelectionChip() {
  const chipEl = $('sel-chip');
  const sel = state.selected;
  chipEl.hidden = !sel || !gl;
  if (!sel) return;
  const color = sel.type === 'unit' ? M.UNITS.find((u) => u.id === sel.id).color : '#e0312b';
  chipEl.style.setProperty('--c', color);
  $('sel-name').textContent = selectionName(sel);
}

function renderDetail() {
  const el = $('detail');
  const sel = state.selected;
  renderSelectionChip();
  if (!sel) {
    el.innerHTML = '';
    return;
  }
  if (sel.type === 'section') {
    const s = M.buildSections(state.params).find((x) => x.id === sel.id);
    el.innerHTML = `<div class="card"><h3>${esc(s.name)} ${chip(s.prov)}</h3><p>${esc(s.text)}</p>
      <div class="actions"><button type="button" class="btn small" data-act="frame">Frame in 3D</button><button type="button" class="btn small" data-act="clear">Clear selection</button></div></div>`;
    return;
  }
  const u = M.UNITS.find((x) => x.id === sel.id);
  const rooms = u.rooms.map((r) => {
    const thumbs = r.photos.map((f) => `<button type="button" class="thumb-btn" data-photo="${f}" aria-label="Open photo: ${esc(M.photoByFile(f)?.title || f)}"><img src="${photoUrl(f, 'thumb')}" alt="" loading="lazy" /></button>`).join('');
    return `<div class="room ${r.photos.length ? '' : 'nophoto'}">${thumbs ? `<div>${thumbs}</div>` : ''}<div><strong>${esc(r.name)}</strong><br />${esc(r.text)}</div></div>`;
  }).join('');
  el.innerHTML = `<div class="card" style="--c:${u.color}">
    <h3><span class="swatch" style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${u.color}"></span>${esc(u.name)}
      ${chip(u.placement.confidence, `placement ${u.placement.confidence}`)}</h3>
    <h4>Stated by owner ${chip('stated')}</h4><p>${esc(u.stated.text)}</p>
    <h4>Placement in the model ${chip('inferred')}</h4><ul>${u.placement.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <h4>Area check</h4>${areaSentence(u)}
    <h4>Rooms &amp; photos</h4>${rooms || '<p>No photographs or room descriptions supplied.</p>'}
    <p class="hint small">Room positions inside the unit are unknown, so no interior partitions are drawn.</p>
    <div class="actions">
      <button type="button" class="btn small" data-act="isolate">Show ${u.floor === 'ground' ? 'ground' : 'upper'} floor only</button>
      <button type="button" class="btn small" data-act="frame">Frame in 3D</button>
      <button type="button" class="btn small" data-act="clear">Clear selection</button>
    </div></div>`;
}

function setupPanel() {
  renderUnitLists();
  // on phones the sheet covers the model: collapse it so the framed selection is visible
  const revealModel = () => {
    if (gl && matchMedia('(max-width: 760px)').matches) setPanel(false);
  };
  $('unit-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-unit]');
    if (!b) return;
    const already = state.selected && state.selected.type === 'unit' && state.selected.id === b.dataset.unit;
    if (already) clearSelection();
    else {
      revealModel();
      select({ type: 'unit', id: b.dataset.unit }, { frame: true });
    }
  });
  $('section-list').addEventListener('click', (e) => {
    const b = e.target.closest('[data-section]');
    if (!b) return;
    revealModel();
    select({ type: 'section', id: b.dataset.section }, { frame: true });
  });
  $('sel-details').addEventListener('click', () => {
    setPanel(true);
    selectTab('tab-units');
    $('detail').scrollIntoView({ block: 'start' });
    $('detail').querySelector('h3')?.setAttribute('tabindex', '-1');
    $('detail').querySelector('h3')?.focus();
  });
  $('sel-clear').addEventListener('click', clearSelection);
  $('detail').addEventListener('click', (e) => {
    const p = e.target.closest('[data-photo]');
    if (p) return openPhoto(p.dataset.photo);
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'clear') clearSelection();
    if (a.dataset.act === 'frame') frameSelection();
    if (a.dataset.act === 'isolate') {
      const u = M.UNITS.find((x) => x.id === state.selected.id);
      setFloor(u.floor);
      frameSelection();
    }
  });

  // tabs with arrow-key navigation
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => selectTab(tab.id));
    tab.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
      selectTab(next.id);
      next.focus();
      e.preventDefault();
    });
  });

  renderPhotoGrid();
  renderEvidence();
}

function selectTab(id) {
  document.querySelectorAll('[role="tab"]').forEach((t) => {
    const on = t.id === id;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute('aria-controls')).hidden = !on;
  });
}

/* ------------------------------------------------------------------ */
/* Photos                                                              */
/* ------------------------------------------------------------------ */

function renderPhotoGrid() {
  $('photo-grid').innerHTML = M.PHOTOS.map((p) => `
    <li><button type="button" class="photo-card" data-photo="${p.file}">
      <img src="${photoUrl(p.file, 'thumb')}" alt="" loading="lazy" />
      <span>${esc(p.title)}<small>${esc(p.file)}${p.view ? ' · viewpoint estimated' : ''}</small></span>
    </button></li>`).join('');
  $('photo-grid').addEventListener('click', (e) => {
    const b = e.target.closest('[data-photo]');
    if (b) openPhoto(b.dataset.photo);
  });
  $('dup-note').textContent = 'The packet also contains a file named ".jpg". It is byte-identical (same SHA-256) to 20210720_171634.jpg, so it is listed once. 17 files, 16 distinct photographs.';
}

let currentPhoto = 0;

function openPhoto(file) {
  const idx = M.PHOTOS.findIndex((p) => p.file === file || (p.duplicates || []).includes(file));
  if (idx < 0) return;
  currentPhoto = idx;
  fillPhotoDialog();
  const dlg = $('photo-dialog');
  if (!dlg.open) dlg.showModal();
  $('photo-close').focus();
}

function fillPhotoDialog() {
  const p = M.PHOTOS[currentPhoto];
  $('photo-title').textContent = p.title;
  const img = $('photo-img');
  img.src = photoUrl(p.file, 'web');
  img.alt = `${p.title}. ${p.evidence[0]}`;
  const bits = [`File: ${p.file}`];
  if (p.exif) bits.push(`EXIF: ${p.exif.time.replace('T', ' ')} · ${p.exif.camera} · ${p.exif.mm35} mm equiv. · GPS ${p.exif.lat.toFixed(5)}, ${p.exif.lon.toFixed(5)}`);
  else bits.push('Listing photo without EXIF metadata');
  if (p.duplicates?.length) bits.push(`also supplied as "${p.duplicates.join('", "')}" (identical bytes)`);
  if (p.view) bits.push(`3D viewpoint ${p.view.prov}`);
  const units = p.units.map((id) => M.UNITS.find((u) => u.id === id)?.short).filter(Boolean);
  if (units.length) bits.push(`Related: ${units.join(', ')}`);
  $('photo-meta').textContent = bits.join(' · ');
  $('photo-evidence').innerHTML = p.evidence.map((t) => `<li>${esc(t)}</li>`).join('');
  const orig = $('photo-original');
  orig.href = photoUrl(p.file, 'original');
  orig.textContent = 'Open full-size photo';
  const match = $('photo-match');
  match.hidden = !p.view || !gl;
}

function setupPhotoDialog() {
  const dlg = $('photo-dialog');
  $('photo-close').addEventListener('click', () => dlg.close());
  $('photo-prev').addEventListener('click', () => { currentPhoto = (currentPhoto - 1 + M.PHOTOS.length) % M.PHOTOS.length; fillPhotoDialog(); });
  $('photo-next').addEventListener('click', () => { currentPhoto = (currentPhoto + 1) % M.PHOTOS.length; fillPhotoDialog(); });
  dlg.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    }
    if (e.key === 'ArrowLeft') $('photo-prev').click();
    if (e.key === 'ArrowRight') $('photo-next').click();
  });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  $('photo-match').addEventListener('click', () => {
    const p = M.PHOTOS[currentPhoto];
    dlg.close();
    matchPhoto(p);
  });
}

function matchPhoto(p) {
  if (!gl || !p.view) return;
  state.overlay = p.file;
  applyVisibility();
  const img = $('photo-overlay');
  img.src = photoUrl(p.file, 'web');
  img.style.opacity = $('overlay-opacity').value;
  img.hidden = false;
  $('overlay-bar').hidden = false;
  $('overlay-name').textContent = `${p.file}: viewpoint ${p.view.prov}`;
  if (state.floor !== 'all') setFloor('all');
  // photo cameras often look slightly upward: allow it while the overlay is shown
  gl.controls.maxPolarAngle = Math.PI * 0.98;
  flyTo(new THREE.Vector3(...p.view.pos), new THREE.Vector3(...p.view.target), { fov: p.view.vfov, ms: 900 });
  announce(`Camera moved to the estimated viewpoint of ${p.file}. Photo overlaid at ${Math.round($('overlay-opacity').value * 100)} percent opacity.`);
}

function closeOverlay({ fly = true } = {}) {
  if (!state.overlay) return;
  state.overlay = null;
  $('photo-overlay').hidden = true;
  $('overlay-bar').hidden = true;
  if (!gl) return;
  applyVisibility();
  gl.controls.maxPolarAngle = MAX_POLAR;
  // move to the nearest camera position that respects the normal "stay above ground" limit
  const off = gl.camera.position.clone().sub(gl.controls.target);
  const s = new THREE.Spherical().setFromVector3(off);
  s.phi = Math.min(s.phi, MAX_POLAR);
  const pos = gl.controls.target.clone().add(off.setFromSpherical(s));
  if (fly) flyTo(pos, gl.controls.target.clone(), { fov: DEFAULT_FOV, ms: 400 });
  else {
    gl.camera.fov = DEFAULT_FOV;
    gl.camera.updateProjectionMatrix();
  }
}

/* ------------------------------------------------------------------ */
/* Evidence tab                                                        */
/* ------------------------------------------------------------------ */

function renderEvidence() {
  const iv = facade.intervals[0];
  const obsRows = facade.observations.map((o) => `<tr><td>${esc(o.photo)}<br><small>${o.time.replace('T', ' ')}</small></td>
    <td class="num">${o.sun.azimuthDeg.toFixed(1)}° / ${o.sun.altitudeDeg.toFixed(1)}°</td><td>${o.surface} ${o.lit ? 'sunlit' : 'shaded'}${o.sunSide ? ', sun on right' : ''} (${o.strength})</td></tr>`).join('');
  const dimRows = Object.values(M.DIMS).map((d) => `<tr><td>${esc(d.label)}${d.note ? `<br><small>${esc(d.note)}</small>` : ''}</td><td class="num">${d.value}${d.label.includes('(°)') ? '°' : ' m'}</td><td>${chip(d.prov)}</td></tr>`).join('');
  const feasible = M.feasibleDepths();
  $('evidence-content').innerHTML = `
    <div class="ev-section"><h3>How to read the model</h3>
      <p>${chip('stated')} ${esc(M.PROV.stated.text)}</p>
      <p>${chip('observed')} ${esc(M.PROV.observed.text)}</p>
      <p>${chip('estimated')} ${esc(M.PROV.estimated.text)}</p>
      <p>${chip('inferred')} ${esc(M.PROV.inferred.text)}</p>
      <p>${chip('assumed')} ${esc(M.PROV.assumed.text)}</p>
      <p class="hint">Turn on <strong>Evidence</strong> in the toolbar to colour the 3D geometry by these classes. Walls never photographed (rear and right side) are shown blank. Their openings are unknown, not absent.</p></div>
    <div class="ev-section"><h3>Orientation ${chip('inferred')}</h3>
      <p>No north arrow or site plan was supplied. The sun position at the EXIF time of three owner photos constrains the direction the front façade faces to <strong>${Math.round(iv.from)}°–${Math.round(iv.to)}°</strong> (best estimate ≈${Math.round(facade.mid)}°, roughly north-west). The 3D sun uses photo 20210720_171634's time.</p>
      <table class="data"><thead><tr><th>Photo</th><th>Sun az / alt</th><th>Observation</th></tr></thead><tbody>${obsRows}</tbody></table>
      <p class="hint small">${esc(M.SITE.gpsNote)}</p></div>
    <div class="ev-section"><h3>Address</h3><p>${esc(M.SITE.address)}</p><p class="hint small">${esc(M.SITE.addressNote)}</p></div>
    <div class="ev-section"><h3>What-if: building depth ${chip('estimated')}</h3>
      <p>The rear of the building was never photographed. Move the slider to see how the unknown depth changes the zones and the area check.</p>
      <div class="depth-row"><label for="depth">Depth</label><input type="range" id="depth" min="${M.DEPTH_RANGE.min}" max="${M.DEPTH_RANGE.max}" step="${M.DEPTH_RANGE.step}" value="${state.params.depth}" /><output id="depth-out">${state.params.depth.toFixed(1)} m</output></div>
      <div id="area-table"></div>
      <p class="hint small">Depths ${feasible[0]}–${feasible[feasible.length - 1]} m keep every stated area within ${M.AREA_BAND.min}–${M.AREA_BAND.max}× of its zone (terrace/balcony included). Areas are never turned into room dimensions.</p></div>
    <div class="ev-section"><h3>Dimensions used</h3><table class="data"><tbody>${dimRows}</tbody></table></div>
    <div class="ev-section"><h3>Most useful missing evidence</h3><ul>
      <li>Any floor plan, or simply which door belongs to which apartment on each floor.</li>
      <li>Photos of the rear and right-hand sides, and of the roof covering.</li>
      <li>One tape measurement (façade width or a door) to replace the balustrade-height scale.</li>
      <li>Where Apartment 4 and the caretaker room actually are; Apt 3 and Apt 4 interior photos.</li>
      <li>A compass bearing of the front façade or a site plan.</li></ul></div>
    <div class="ev-section"><h3>Rendering</h3><p id="render-stats">${gl ? 'Renders only on interaction; stops when idle or when the tab is hidden.' : '3D not running.'}</p></div>`;
  renderAreaTable();
  $('depth').addEventListener('input', (e) => {
    state.params.depth = Number(e.target.value);
    $('depth-out').textContent = `${state.params.depth.toFixed(1)} m`;
    renderAreaTable();
    clearTimeout(depthTimer);
    depthTimer = setTimeout(() => {
      rebuildWorld();
      renderDetail();
      announce(`Depth set to ${state.params.depth.toFixed(1)} metres`);
    }, 120);
  });
}
let depthTimer = 0;

function renderAreaTable() {
  const rep = M.unitAreaReport(M.buildZones(state.params));
  $('area-table').innerHTML = `<table class="data"><thead><tr><th>Unit</th><th>Stated</th><th>Zone (+ outdoor)</th><th>Ratio</th></tr></thead><tbody>${rep.map((r) => {
    const u = M.UNITS.find((x) => x.id === r.unit);
    const cls = r.verdict === 'plausible' ? 'verdict-plausible' : r.ratio == null ? '' : 'verdict-bad';
    return `<tr><td>${esc(u.short)}</td><td class="num">${r.stated != null ? `${r.stated} m²` : '—'}</td><td class="num">${r.interior.toFixed(1)} (+${r.outdoor.toFixed(1)})</td><td class="num ${cls}">${r.ratio != null ? `${r.ratio.toFixed(2)}${r.referenceIsStated ? '' : '*'}` : '—'}</td></tr>`;
  }).join('')}</tbody></table><p class="hint small">* Apt 4 compared with Apt 3's 46 m², because it is "similar to apartment 3".</p>`;
}

/* ------------------------------------------------------------------ */
/* Misc UI                                                             */
/* ------------------------------------------------------------------ */

let announceTimer = 0;
function announce(msg) {
  clearTimeout(announceTimer);
  announceTimer = setTimeout(() => { $('status').textContent = msg; }, 50);
}

function showBanner(msg) {
  const b = $('banner');
  b.textContent = msg;
  b.hidden = false;
}
function hideBanner() {
  $('banner').hidden = true;
}

function showGlError(err) {
  gl = null;
  console.error(err);
  $('scene').hidden = true;
  $('compass').hidden = true;
  $('gl-error').hidden = false;
  const msg = String(err && err.message ? err.message : err);
  $('gl-error-msg').textContent = /webgl|context/i.test(msg)
    ? 'This browser or device could not create a WebGL 2 context, which the 3D view needs.'
    : `The 3D view failed to start: ${msg}`;
  $('gl-error-detail').textContent = `${msg}\n\nUser agent: ${navigator.userAgent}`;
  document.querySelectorAll('#toolbar .btn').forEach((b) => { b.disabled = true; });
  setPanel(true);
}

/* ------------------------------------------------------------------ */
/* Boot                                                                */
/* ------------------------------------------------------------------ */

function boot() {
  if (matchMedia('(max-width: 760px)').matches) setPanel(false);
  // the mobile bottom sheet sits just above the toolbar, whatever its height
  new ResizeObserver(() => {
    document.documentElement.style.setProperty('--toolbar-h', `${$('toolbar').offsetHeight}px`);
  }).observe($('toolbar'));
  setupToolbar();
  setupPhotoDialog();
  window.addEventListener('keydown', onGlobalKey);
  try {
    init3D();
  } catch (err) {
    showGlError(err);
  }
  setupPanel();
  syncToolbar();
  // test hook (read-only status for automated checks)
  window.__napros = {
    state, stats, facade,
    isRendering: () => Boolean(gl && gl.raf),
    hasGL: () => Boolean(gl),
    scene: () => gl && gl.scene,
    // world point -> CSS pixel position inside the page (for automated click tests)
    project: (x, y, z) => {
      if (!gl) return null;
      const v = new THREE.Vector3(x, y, z).project(gl.camera);
      const r = $('scene').getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    },
  };
}

window.addEventListener('error', (e) => {
  if (!gl) return;
  showBanner(`Unexpected error: ${e.message}`);
});

boot();
