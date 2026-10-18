// Turns the pure model data (model.js) into three.js objects.
// Static geometry is merged per (material, storey, provenance) to keep draw
// calls low; provenance is kept so the "evidence" view can recolour it.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import * as M from './model.js';

const { GF, AGF, FF, CEIL, SLAB_BOTTOM, W, MW, T } = M.LEVELS;

export const EVIDENCE_COLORS = { observed: '#1b9e77', inferred: '#e6ab02', assumed: '#d95f02' };
const CAP_RGB = 'vec3(0.50, 0.30, 0.26)';

/* ------------------------------------------------------------------ */
/* Materials & procedural textures                                     */
/* ------------------------------------------------------------------ */

export function createMaterials() {
  const clippable = new Set();
  const tex = makeTextures();

  // Closed solids: double-sided, back faces painted as a flat "section cap" so
  // the cutaway reads as solid walls rather than hollow shells.
  const solid = (opts) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.9, metalness: 0, ...opts, side: THREE.DoubleSide, clipShadows: true });
    m.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>\n\tif ( !gl_FrontFacing ) gl_FragColor = vec4( ${CAP_RGB}, 1.0 );`,
      );
    };
    m.customProgramCacheKey = () => 'section-cap';
    clippable.add(m);
    return m;
  };
  const surface = (opts) => {
    const m = new THREE.MeshStandardMaterial({ roughness: 0.95, ...opts, clipShadows: true });
    clippable.add(m);
    return m;
  };

  const mats = {
    wall: solid({ color: '#efe8dc' }),
    wallInner: solid({ color: '#f3efe8' }),
    slab: solid({ color: '#d6d0c6' }),
    roof: solid({ color: '#8b817a', roughness: 0.85 }),
    trim: solid({ color: '#cdd2d4', metalness: 0.2, roughness: 0.55 }),
    white: solid({ color: '#f7f5f0', roughness: 0.7 }),
    glass: solid({ color: '#3f505d', roughness: 0.12, metalness: 0.15 }),
    frosted: solid({ color: '#aab6b8', roughness: 0.35 }),
    louver: solid({ color: '#ffffff', map: tex.louver, roughness: 0.75 }),
    garage: solid({ color: '#ffffff', map: tex.garage, roughness: 0.6 }),
    door: solid({ color: '#ffffff', map: tex.pvcDoor, roughness: 0.6 }),
    timber: solid({ color: '#4b3628', roughness: 0.8 }),
    blueTile: solid({ color: '#2d68b0', roughness: 0.35 }),
    metalDark: solid({ color: '#4f3b30', metalness: 0.35, roughness: 0.6 }),
    metalGrey: solid({ color: '#5d6367', metalness: 0.5, roughness: 0.5 }),
    stoneBlock: solid({ color: '#c3a880', roughness: 0.95 }),
    concrete: solid({ color: '#c9c6bf', roughness: 0.95 }),
    tiles: solid({ color: '#b9bec0', roughness: 0.6 }),
    awningSea: solid({ color: '#ffffff', map: tex.awningSea, roughness: 0.8 }),
    awningLight: solid({ color: '#ffffff', map: tex.awningLight, roughness: 0.8 }),
    sign: solid({ color: '#ffffff', map: tex.sign }),
    plate: solid({ color: '#ffffff', map: tex.plate }),
    ac: solid({ color: '#d5d8d6', roughness: 0.5 }),
    stoneSkin: surface({ color: '#ffffff', map: tex.stone }),
    paving: surface({ color: '#ffffff', map: tex.paving }),
    vine: surface({ color: '#5e7d3b', transparent: true, opacity: 0.42, roughness: 1, side: THREE.DoubleSide, depthWrite: false }),
    lawn: new THREE.MeshStandardMaterial({ color: '#97a96f', roughness: 1 }),
    foliage: new THREE.MeshStandardMaterial({ color: '#5f7f3e', roughness: 1, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: '#6b5640', roughness: 1 }),
  };
  const evidence = {};
  for (const [k, c] of Object.entries(EVIDENCE_COLORS)) evidence[k] = solid({ color: c, roughness: 0.8 });
  return { mats, evidence, clippable, tex };
}

function canvasTexture(w, h, draw, repeat = true) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// The textures are procedural and never change (the paving alone is ~250 ms of per-pixel work),
// so they are built once and shared by every viewer; viewers do not dispose them.
let TEXTURES = null;
function makeTextures() {
  return (TEXTURES ??= buildTextures());
}

function buildTextures() {
  const stone = canvasTexture(512, 256, (g, w, h) => {
    const r = rng(7);
    g.fillStyle = '#7d7062';
    g.fillRect(0, 0, w, h);
    const tones = ['#d3b98d', '#c9a877', '#e0cba3', '#b8986a', '#d8c4a0', '#c4ab86'];
    let y = 0;
    while (y < h) {
      const rowH = 34 + r() * 26;
      let x = -r() * 40;
      while (x < w) {
        const sw = 40 + r() * 70;
        g.fillStyle = tones[Math.floor(r() * tones.length)];
        g.beginPath();
        const j = () => (r() - 0.5) * 8;
        g.moveTo(x + 3 + j(), y + 3 + j());
        g.lineTo(x + sw - 3 + j(), y + 3 + j());
        g.lineTo(x + sw - 3 + j(), y + rowH - 3 + j());
        g.lineTo(x + 3 + j(), y + rowH - 3 + j());
        g.closePath();
        g.fill();
        x += sw;
      }
      y += rowH;
    }
  });
  const paving = canvasTexture(256, 256, (g, w, h) => {
    const r = rng(11);
    const seeds = Array.from({ length: 46 }, () => [r() * w, r() * h, 205 + r() * 30]);
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let d1 = 1e9;
        let d2 = 1e9;
        let best = 0;
        for (let i = 0; i < seeds.length; i++) {
          for (const ox of [-w, 0, w]) {
            for (const oy of [-h, 0, h]) {
              const dx = x - seeds[i][0] - ox;
              const dy = y - seeds[i][1] - oy;
              const d = dx * dx + dy * dy;
              if (d < d1) {
                d2 = d1;
                d1 = d;
                best = i;
              } else if (d < d2) d2 = d;
            }
          }
        }
        const edge = Math.sqrt(d2) - Math.sqrt(d1) < 2.2;
        const v = edge ? 150 : seeds[best][2];
        const o = (y * w + x) * 4;
        img.data[o] = v;
        img.data[o + 1] = v - 6;
        img.data[o + 2] = v - 18;
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
  const louver = canvasTexture(64, 128, (g, w, h) => {
    g.fillStyle = '#efede7';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#b9b7b0';
    for (let y = 10; y < h - 8; y += 7) g.fillRect(6, y, w - 12, 2);
    g.strokeStyle = '#d7d5ce';
    g.lineWidth = 4;
    g.strokeRect(2, 2, w - 4, h - 4);
  }, false);
  const garage = canvasTexture(64, 128, (g, w, h) => {
    g.fillStyle = '#dcddda';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#3c4852';
    g.fillRect(8, 10, w - 16, 16);
    g.strokeStyle = '#b9bbb7';
    g.lineWidth = 3;
    g.strokeRect(2, 2, w - 4, h - 4);
  }, false);
  const pvcDoor = canvasTexture(64, 128, (g, w, h) => {
    g.fillStyle = '#f6f6f3';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#5d7480';
    for (const y of [22, 56, 90]) g.fillRect(36, y, 12, 20);
    g.fillStyle = '#a7a9a6';
    g.fillRect(10, 62, 6, 3);
  }, false);
  const stripes = (cols) => (g, w, h) => {
    const n = 16;
    for (let i = 0; i < n; i++) {
      g.fillStyle = cols[i % cols.length];
      g.fillRect((i * w) / n, 0, w / n + 1, h);
    }
  };
  const awningSea = canvasTexture(128, 32, stripes(['#1f7a72', '#2c5fa0', '#1f8a6e', '#3a7cc0']), false);
  const awningLight = canvasTexture(128, 32, stripes(['#e9efe6', '#7fa88a']), false);
  const sign = canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = '#1f3f9a';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#ffffff';
    g.font = 'bold 9px sans-serif';
    g.textAlign = 'center';
    g.fillText('APARTMAN', w / 2, h / 2 + 12);
    g.fillRect(16, 22, 32, 6);
  }, false);
  const plate = canvasTexture(64, 48, (g, w, h) => {
    g.fillStyle = '#2b2b2b';
    g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f2f2';
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText('60', w / 2, h / 2 + 2);
  }, false);
  return { stone, paving, louver, garage, pvcDoor, awningSea, awningLight, sign, plate };
}

/* ------------------------------------------------------------------ */
/* Geometry accumulation                                               */
/* ------------------------------------------------------------------ */

class Builder {
  constructor(materials) {
    this.materials = materials;
    this.bins = new Map();
    this.balusters = new Map();
  }

  add(geom, mat, floor, prov) {
    let g = geom.index ? geom.toNonIndexed() : geom;
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array((g.attributes.position.count) * 2), 2));
    g.clearGroups();
    const key = `${mat}|${floor}|${prov}`;
    if (!this.bins.has(key)) this.bins.set(key, { mat, floor, prov, list: [] });
    this.bins.get(key).list.push(g);
  }

  box(x0, y0, z0, x1, y1, z1, mat, floor, prov) {
    const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
    g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    this.add(g, mat, floor, prov);
  }

  /** Box of length L between plan points p0 → p1 (any direction). */
  beam(p0, p1, y0, y1, width, mat, floor, prov) {
    const dx = p1[0] - p0[0];
    const dz = p1[1] - p0[1];
    const L = Math.hypot(dx, dz);
    const g = new THREE.BoxGeometry(L, y1 - y0, width);
    g.rotateY(-Math.atan2(dz, dx));
    g.translate((p0[0] + p1[0]) / 2, (y0 + y1) / 2, (p0[1] + p1[1]) / 2);
    this.add(g, mat, floor, prov);
  }

  /** Box between two 3D points (centre line), square section w×h. */
  strut(a, b, w, h, mat, floor, prov) {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = vb.clone().sub(va);
    const L = dir.length();
    const g = new THREE.BoxGeometry(w, h, L);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize());
    g.applyQuaternion(q);
    const mid = va.add(vb).multiplyScalar(0.5);
    g.translate(mid.x, mid.y, mid.z);
    this.add(g, mat, floor, prov);
  }

  baluster(x, y, z, height, floor, prov) {
    const key = `${floor}|${prov}`;
    if (!this.balusters.has(key)) this.balusters.set(key, { floor, prov, mats: [] });
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(1, height / BALUSTER_H, 1));
    this.balusters.get(key).mats.push(m);
  }

  finish(groups) {
    const meshes = [];
    for (const bin of this.bins.values()) {
      const geom = mergeGeometries(bin.list, false);
      geom.computeBoundingSphere();
      const material = this.materials.mats[bin.mat];
      const mesh = new THREE.Mesh(geom, material);
      mesh.userData = { floor: bin.floor, prov: bin.prov, baseMaterial: material, building: true };
      mesh.castShadow = !material.transparent;
      mesh.receiveShadow = true;
      groups[bin.floor].add(mesh);
      meshes.push(mesh);
      for (const g of bin.list) g.dispose();
    }
    for (const b of this.balusters.values()) {
      const inst = new THREE.InstancedMesh(balusterGeometry(), this.materials.mats.white, b.mats.length);
      b.mats.forEach((m, i) => inst.setMatrixAt(i, m));
      inst.instanceMatrix.needsUpdate = true;
      inst.computeBoundingSphere();
      inst.computeBoundingBox();
      inst.castShadow = true;
      inst.receiveShadow = true;
      inst.userData = { floor: b.floor, prov: b.prov, baseMaterial: this.materials.mats.white, building: true };
      groups[b.floor].add(inst);
      meshes.push(inst);
    }
    return meshes;
  }
}

const BALUSTER_H = 0.7;
let _balusterGeom = null;
function balusterGeometry() {
  if (_balusterGeom) return _balusterGeom;
  const p = [
    [0, 0], [0.055, 0], [0.055, 0.05], [0.038, 0.08], [0.066, 0.2], [0.072, 0.29], [0.05, 0.41], [0.03, 0.5],
    [0.036, 0.57], [0.052, 0.62], [0.052, 0.7], [0, 0.7],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  _balusterGeom = new THREE.LatheGeometry(p, 10);
  return _balusterGeom;
}

/* ------------------------------------------------------------------ */
/* Walls                                                               */
/* ------------------------------------------------------------------ */

function wallFrame(wall) {
  const [ax, az] = wall.a;
  const [bx, bz] = wall.b;
  const U = new THREE.Vector3(bx - ax, 0, bz - az).normalize();
  const Y = new THREE.Vector3(0, 1, 0);
  const N = new THREE.Vector3().crossVectors(U, Y); // outward normal
  const m = new THREE.Matrix4().makeBasis(U, Y, N).setPosition(ax, 0, az);
  return { m, axis: M.wallAxis(wall) };
}

function toShapePoints(poly, axis) {
  return poly.map(([w, y]) => new THREE.Vector2(axis.toU(w), y));
}

function addWalls(b, params) {
  for (const wall of M.buildWalls(params)) {
    const frame = wallFrame(wall);
    const mat = wall.exterior ? 'wall' : 'wallInner';
    for (const piece of M.wallPieces(wall)) {
      const shape = new THREE.Shape(toShapePoints(piece.outline, frame.axis));
      for (const op of piece.holes) shape.holes.push(new THREE.Path(toShapePoints(M.openingPolygon(op), frame.axis)));
      const g = new THREE.ExtrudeGeometry(shape, { depth: wall.t, bevelEnabled: false, curveSegments: 4 });
      g.translate(0, 0, -wall.t);
      g.applyMatrix4(frame.m);
      b.add(g, mat, piece.floor, wall.prov);
      for (const op of piece.holes) addOpeningFill(b, frame, wall, op, piece.floor);
    }
  }
}

function localBox(b, frame, u0, u1, y0, y1, w0, w1, mat, floor, prov) {
  const g = new THREE.BoxGeometry(Math.abs(u1 - u0), Math.abs(y1 - y0), Math.abs(w1 - w0));
  g.translate((u0 + u1) / 2, (y0 + y1) / 2, (w0 + w1) / 2);
  g.applyMatrix4(frame.m);
  b.add(g, mat, floor, prov);
}

function addOpeningFill(b, frame, wall, op, floor) {
  if (op.fill === 'open') return;
  let u0 = frame.axis.toU(op.w0);
  let u1 = frame.axis.toU(op.w1);
  if (u0 > u1) [u0, u1] = [u1, u0];
  const { y0, y1 } = op;
  const prov = op.prov;
  const fr = 0.055;
  const frameRing = (w0, w1) => {
    localBox(b, frame, u0, u0 + fr, y0, y1, w0, w1, 'white', floor, prov);
    localBox(b, frame, u1 - fr, u1, y0, y1, w0, w1, 'white', floor, prov);
    localBox(b, frame, u0, u1, y1 - fr, y1, w0, w1, 'white', floor, prov);
    if (op.fill !== 'glass' && op.fill !== 'door') localBox(b, frame, u0, u1, y0, y0 + fr, w0, w1, 'white', floor, prov);
  };
  const mid = (u0 + u1) / 2;
  switch (op.fill) {
    case 'window':
      frameRing(-0.17, -0.09);
      localBox(b, frame, u0, u1, y0, y1, -0.14, -0.125, 'glass', floor, prov);
      if (op.shutters === 'closed') {
        localBox(b, frame, u0 + 0.01, mid - 0.005, y0 + 0.01, y1 - 0.01, -0.07, -0.035, 'louver', floor, prov);
        localBox(b, frame, mid + 0.005, u1 - 0.01, y0 + 0.01, y1 - 0.01, -0.07, -0.035, 'louver', floor, prov);
      }
      break;
    case 'frosted':
      frameRing(-0.16, -0.08);
      localBox(b, frame, u0, u1, y0, y1, -0.13, -0.115, 'frosted', floor, prov);
      break;
    case 'glass': {
      frameRing(-0.17, -0.09);
      localBox(b, frame, mid - 0.03, mid + 0.03, y0, y1, -0.17, -0.09, 'white', floor, prov);
      localBox(b, frame, u0, u1, y0, y1, -0.14, -0.125, 'glass', floor, prov);
      if (op.shutters === 'open') {
        const half = (u1 - u0) / 2;
        localBox(b, frame, u0 - half - 0.02, u0 - 0.02, y0, y1, 0.005, 0.04, 'louver', floor, prov);
        localBox(b, frame, u1 + 0.02, u1 + half + 0.02, y0, y1, 0.005, 0.04, 'louver', floor, prov);
      }
      break;
    }
    case 'door':
      frameRing(-0.16, -0.08);
      localBox(b, frame, u0 + fr, u1 - fr, y0, y1 - fr, -0.14, -0.1, 'door', floor, prov);
      break;
    case 'garage':
      localBox(b, frame, u0, mid - 0.01, y0, y1, -0.12, -0.07, 'garage', floor, prov);
      localBox(b, frame, mid + 0.01, u1, y0, y1, -0.12, -0.07, 'garage', floor, prov);
      break;
    case 'louver':
      localBox(b, frame, u0, mid - 0.005, y0, y1, -0.09, -0.05, 'louver', floor, prov);
      localBox(b, frame, mid + 0.005, u1, y0, y1, -0.09, -0.05, 'louver', floor, prov);
      break;
    default:
      break;
  }
}

/* ------------------------------------------------------------------ */
/* Building parts                                                      */
/* ------------------------------------------------------------------ */

function balustrade(b, p0, p1, y, floor, prov, { height = 1.0, spacing = 0.19, plinth = 0.12, rail = 0.1, depth = 0.2 } = {}) {
  b.beam(p0, p1, y, y + plinth, depth, 'white', floor, prov);
  b.beam(p0, p1, y + height - rail, y + height, depth + 0.04, 'white', floor, prov);
  const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
  const n = Math.max(2, Math.round(L / spacing));
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    b.baluster(p0[0] + (p1[0] - p0[0]) * t, y + plinth, p0[1] + (p1[1] - p0[1]) * t, height - plinth - rail, floor, prov);
  }
}

function addSlabsAndRoof(b, params) {
  const D = params.depth;
  // ground-floor solid fill (raised floor) and annex floor
  b.box(T, 0, -D + T, MW - 0.15, GF, -T, 'slab', 'ground', 'inferred');
  b.box(MW + 0.15, 0, -D + T, W - T, AGF, -T, 'slab', 'ground', 'inferred');
  // upper floor slab over the whole footprint
  b.box(T, SLAB_BOTTOM, -D + T, W - T, FF, -T, 'slab', 'upper', 'inferred');
  // attic floor over the main block
  b.box(T, CEIL, -D + T, MW - 0.15, CEIL + 0.2, -T, 'slab', 'roof', 'assumed');

  // roof: extruded cross-section (left slope, right slope, lower annex slope)
  const vo = M.DIMS.vergeOverhang.value;
  const shape = new THREE.Shape(M.roofSection().map(([x, y]) => new THREE.Vector2(x, y)));
  const roof = new THREE.ExtrudeGeometry(shape, { depth: D + 2 * vo, bevelEnabled: false });
  roof.translate(0, 0, -D - vo);
  b.add(roof, 'roof', 'roof', 'inferred');

  // verge trims (front observed, rear assumed) and eaves fascia
  const eo = M.DIMS.eaveOverhang.value;
  const pts = [-eo, M.LEVELS.RX, MW, W + eo].map((x) => [x, M.roofTopAt(x)]);
  for (const [z, prov] of [[vo + 0.02, 'observed'], [-D - vo - 0.02, 'assumed']]) {
    for (let i = 0; i < pts.length - 1; i++) {
      b.strut([pts[i][0], pts[i][1] - 0.08, z], [pts[i + 1][0], pts[i + 1][1] - 0.08, z], 0.05, 0.2, 'trim', 'roof', prov);
    }
  }
  const yL = M.roofTopAt(-eo);
  const yR = M.roofTopAt(W + eo);
  b.box(-eo - 0.04, yL - 0.28, -D - vo, -eo, yL, vo, 'trim', 'roof', 'observed');
  b.box(W + eo, yR - 0.26, -D - vo, W + eo + 0.04, yR, vo, 'trim', 'roof', 'observed');
  // gutters + downpipe at the right front corner (photo 20210810_184724)
  const gut = (x, y) => {
    const g = new THREE.CylinderGeometry(0.065, 0.065, D + 2 * vo, 10);
    g.rotateX(Math.PI / 2);
    g.translate(x, y, -D / 2);
    b.add(g, 'trim', 'roof', 'observed');
  };
  gut(-eo - 0.1, yL - 0.3);
  gut(W + eo + 0.1, yR - 0.28);
  const dp = new THREE.CylinderGeometry(0.045, 0.045, yR - 0.3, 8);
  dp.translate(W + 0.1, (yR - 0.3) / 2, 0.12);
  b.add(dp, 'trim', 'roof', 'observed');
}

function addFrontDetails(b) {
  // loggia balustrades (two bays) and the "APARTMAN" sign on the pillar
  balustrade(b, [0.38, -0.15], [2.87, -0.15], FF, 'upper', 'observed');
  balustrade(b, [3.28, -0.15], [6.52, -0.15], FF, 'upper', 'observed');
  b.box(2.96, FF + 1.85, 0, 3.19, FF + 2.08, 0.012, 'sign', 'upper', 'observed');
  // loggia awnings (blue/green stripes, photo 20210810_184724)
  for (const [x0, x1] of [[0.35, 2.9], [3.25, 6.55]]) {
    b.strut([x0, CEIL - 0.08, 0.03], [x0, CEIL - 0.42, 0.85], 0.02, 0.02, 'metalGrey', 'upper', 'observed');
    b.strut([x1, CEIL - 0.08, 0.03], [x1, CEIL - 0.42, 0.85], 0.02, 0.02, 'metalGrey', 'upper', 'observed');
    const g = new THREE.BoxGeometry(x1 - x0, 0.02, 0.9);
    g.rotateX(Math.atan2(0.34, 0.82));
    g.translate((x0 + x1) / 2, CEIL - 0.25, 0.44);
    b.add(g, 'awningSea', 'upper', 'observed');
    b.box(x0, CEIL - 0.62, 0.84, x1, CEIL - 0.42, 0.86, 'awningSea', 'upper', 'observed');
  }
  // AC unit on loggia back wall
  const ld = M.DIMS.loggiaDepth.value;
  b.box(5.7, FF + 1.85, -ld + 0.02, 6.45, FF + 2.4, -ld + 0.3, 'ac', 'upper', 'observed');

  // ground floor: balustrade in arch B, entrance steps at arch A
  balustrade(b, [7.05, -0.15], [10.25, -0.15], GF, 'ground', 'observed');
  const r = GF / 4;
  for (let i = 0; i < 4; i++) b.box(3.95, 0, 0, 6.9, (i + 1) * r, 1.2 - i * 0.3, 'tiles', 'ground', 'observed');
  // terrace floor tiles (slightly above the fill)
  b.box(4.15, GF, -M.DIMS.terraceDepth.value, MW - 0.15, GF + 0.01, -T, 'tiles', 'ground', 'observed');

  // annex: balcony slab + dark metal railing, glazed-door awning
  const bz = 1.3;
  b.box(MW, SLAB_BOTTOM, 0, W, FF, bz, 'slab', 'upper', 'observed');
  const railPts = [[MW + 0.05, 0.02], [MW + 0.05, bz - 0.04], [W - 0.04, bz - 0.04], [W - 0.04, 0.02]];
  for (let i = 0; i < railPts.length - 1; i++) {
    const [p0, p1] = [railPts[i], railPts[i + 1]];
    for (const yy of [FF + 0.35, FF + 0.65, FF + 0.98]) b.beam(p0, p1, yy - 0.025, yy + 0.025, 0.04, 'metalDark', 'upper', 'observed');
    const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const n = Math.max(1, Math.round(L / 1.1));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const x = p0[0] + (p1[0] - p0[0]) * t;
      const z = p0[1] + (p1[1] - p0[1]) * t;
      b.box(x - 0.025, FF, z - 0.025, x + 0.025, FF + 1.0, z + 0.025, 'metalDark', 'upper', 'observed');
    }
  }
  {
    const x0 = 11.1;
    const x1 = 13.3;
    const yTop = FF + 2.32;
    const g = new THREE.BoxGeometry(x1 - x0, 0.02, 0.75);
    g.rotateX(Math.atan2(0.3, 0.7));
    g.translate((x0 + x1) / 2, yTop - 0.15, 0.37);
    b.add(g, 'awningLight', 'upper', 'observed');
    b.box(x0, yTop - 0.48, 0.72, x1, yTop - 0.3, 0.74, 'awningLight', 'upper', 'observed');
  }
}

function texturedPlane(w, h, tileW, tileH) {
  const g = new THREE.PlaneGeometry(w, h);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tileW, (uv.getY(i) * h) / tileH);
  return g;
}

function addPlinthAndPaving(b, params) {
  const D = params.depth;
  const front = (x0, x1) => {
    const g = texturedPlane(x1 - x0, GF, 2.0, 1.0);
    g.translate((x0 + x1) / 2, GF / 2, 0.012);
    b.add(g, 'stoneSkin', 'ground', 'observed');
  };
  front(0, 3.95);
  front(6.9, MW);
  const side = texturedPlane(D, 0.75, 2.0, 1.0);
  side.rotateY(-Math.PI / 2);
  side.translate(-0.012, 0.375, -D / 2);
  b.add(side, 'stoneSkin', 'ground', 'observed');

  const pave = (x0, x1, z0, z1) => {
    const g = texturedPlane(x1 - x0, z1 - z0, 3, 3);
    g.rotateX(-Math.PI / 2);
    g.translate((x0 + x1) / 2, 0.012, (z0 + z1) / 2);
    b.add(g, 'paving', 'site', 'observed');
  };
  pave(-3.4, 10.7, 0, 2.6);
  pave(-3.4, 0, -D - 0.6, 0);
}

function addStairAndPergolaTerrace(b, params) {
  const D = params.depth;
  const PW = M.DIMS.pergolaTerraceWidth.value;
  const xo = -PW; // outer edge
  const xi = -1.1; // stair inner edge
  const risers = 19;
  const r = FF / risers;
  const going = 0.27;
  const zFoot = -2.0 + (risers - 1) * going;
  for (let i = 0; i < risers - 1; i++) {
    b.box(xo, 0, -2.0, xi, (i + 1) * r, zFoot - i * going, 'white', 'ground', 'observed');
  }
  // stair balustrades (one baluster per tread) + sloped rails + newels
  for (const x of [xo + 0.1, xi - 0.1]) {
    for (let i = 0; i < risers - 1; i++) {
      b.baluster(x, (i + 1) * r, zFoot - i * going - going / 2, 0.78, 'ground', 'observed');
    }
    b.strut([x, r + 0.86, zFoot - going / 2], [x, FF + 0.9, -2.0], 0.14, 0.1, 'white', 'ground', 'observed');
    b.box(x - 0.15, 0, zFoot, x + 0.15, 1.15, zFoot + 0.3, 'white', 'ground', 'observed');
  }

  // terrace slab, parapets with blue tile capping, posts, under-pillars
  b.box(xo, SLAB_BOTTOM, -D, 0, FF, -2.0, 'slab', 'upper', 'observed');
  const ph = FF + 0.95;
  b.box(xo, FF, -D, xo + 0.2, ph, -2.0, 'white', 'upper', 'observed');
  b.box(xo, FF, -D, 0, ph, -D + 0.2, 'white', 'upper', 'observed');
  b.box(xi, FF, -2.2, 0, ph, -2.0, 'white', 'upper', 'observed');
  b.box(xo - 0.03, ph, -D - 0.03, xo + 0.23, ph + 0.04, -2.0, 'blueTile', 'upper', 'observed');
  b.box(xo, ph, -D - 0.03, 0, ph + 0.04, -D + 0.23, 'blueTile', 'upper', 'observed');
  b.box(xi, ph, -2.23, 0, ph + 0.04, -1.97, 'blueTile', 'upper', 'observed');
  const postZ = [-2.12, (-2.12 + (-D + 0.12)) / 2, -D + 0.12];
  const pergolaLow = FF + 2.35;
  const pergolaHigh = FF + 2.62;
  for (const z of postZ) b.box(xo + 0.0, ph + 0.04, z - 0.11, xo + 0.22, pergolaLow, z + 0.11, 'white', 'upper', 'observed');
  for (const z of [-5.0, -D + 0.15]) b.box(xo, 0, z - 0.15, xo + 0.3, SLAB_BOTTOM, z + 0.15, 'white', 'ground', 'inferred');

  // timber pergola roof (removed with the roof toggle)
  b.box(xo - 0.05, pergolaLow, -D - 0.1, xo + 0.25, pergolaLow + 0.16, -1.9, 'timber', 'roof', 'observed');
  for (let z = -2.0; z >= -D - 0.05; z -= 0.85) {
    b.strut([0, pergolaHigh + 0.06, z], [xo - 0.3, pergolaLow + 0.1, z], 0.09, 0.16, 'timber', 'roof', 'observed');
  }
  const slope = Math.atan2(pergolaHigh - pergolaLow, -xo + 0.3);
  const planks = new THREE.BoxGeometry(-xo + 0.35, 0.03, D - 1.8);
  planks.rotateZ(-slope);
  planks.translate(xo / 2 - 0.15, (pergolaHigh + pergolaLow) / 2 + 0.19, -(D + 2.0) / 2 - 0.05);
  b.add(planks, 'timber', 'roof', 'observed');
  const gutter = new THREE.CylinderGeometry(0.06, 0.06, D - 1.8, 8);
  gutter.rotateX(Math.PI / 2);
  gutter.translate(xo - 0.35, pergolaLow + 0.02, -(D + 2.0) / 2 - 0.05);
  b.add(gutter, 'trim', 'roof', 'observed');
}

function addSite(b, params) {
  const fz = M.DIMS.fenceDistance.value;
  // driveway (concrete) from the annex door through the fence opening to the road verge
  b.box(10.95, 0, 0, 13.75, 0.025, fz + 6, 'concrete', 'site', 'observed');
  // vine pergola over the driveway
  const xs = [10.0, 14.6];
  const zs = [1.5, 4.1, 6.7];
  const top = 3.3;
  for (const x of xs) for (const z of zs) b.box(x - 0.035, 0, z - 0.035, x + 0.035, top, z + 0.035, 'metalGrey', 'site', 'observed');
  for (const x of xs) b.box(x - 0.03, top - 0.06, 1.3, x + 0.03, top, 6.8, 'metalGrey', 'site', 'observed');
  for (const z of zs) b.box(9.95, top - 0.06, z - 0.03, 14.65, top, z + 0.03, 'metalGrey', 'site', 'observed');
  b.box(9.9, top, 1.3, 14.7, top + 0.14, 6.9, 'vine', 'site', 'observed');

  // street fence: stone base, balusters, stone pillars, gate "60", driveway gap
  const pillars = [-9, -5, -1.4, 2.4, 6.0, 10.45, 14.25, 18.2, 22.2];
  const gate = [6.45, 10.4];
  const drive = [10.9, 14.2];
  for (const x of pillars) b.box(x - 0.22, 0, fz - 0.22, x + 0.22, 1.3, fz + 0.22, 'stoneBlock', 'site', 'observed');
  for (let i = 0; i < pillars.length - 1; i++) {
    const x0 = pillars[i] + 0.22;
    const x1 = pillars[i + 1] - 0.22;
    const mid = (x0 + x1) / 2;
    if (mid > gate[0] && mid < gate[1]) continue;
    if (mid > drive[0] - 0.5 && mid < drive[1]) continue;
    b.box(x0, 0, fz - 0.16, x1, 0.38, fz + 0.16, 'stoneBlock', 'site', 'observed');
    balustrade(b, [x0, fz], [x1, fz], 0.38, 'site', 'observed', { height: 0.78, plinth: 0.06, rail: 0.08, depth: 0.18 });
  }
  // gate: frame + vertical bars + number plate
  const gy = 1.15;
  b.box(gate[0], 0.05, fz - 0.03, gate[1], 0.1, fz + 0.03, 'metalDark', 'site', 'observed');
  b.box(gate[0], gy - 0.05, fz - 0.03, gate[1], gy, fz + 0.03, 'metalDark', 'site', 'observed');
  for (let x = gate[0] + 0.06; x < gate[1]; x += 0.12) b.box(x - 0.012, 0.1, fz - 0.012, x + 0.012, gy - 0.05, fz + 0.012, 'metalDark', 'site', 'observed');
  const gm = (gate[0] + gate[1]) / 2;
  b.box(gm - 0.16, gy - 0.02, fz + 0.03, gm + 0.16, gy + 0.2, fz + 0.045, 'plate', 'site', 'observed');
}

/* ------------------------------------------------------------------ */
/* Zones, labels, sections, markers, dimensions, north                 */
/* ------------------------------------------------------------------ */

function insetPolygon(poly, d) {
  const ccw = M.polygonArea(poly) > 0;
  const n = poly.length;
  return poly.map((p, i) => {
    const a = poly[(i + n - 1) % n];
    const c = poly[(i + 1) % n];
    const e1 = normalize2([p[0] - a[0], p[1] - a[1]]);
    const e2 = normalize2([c[0] - p[0], c[1] - p[1]]);
    // inward normal is to the left for CCW polygons (in x,z-as-y plan coordinates)
    const n1 = ccw ? [-e1[1], e1[0]] : [e1[1], -e1[0]];
    const n2 = ccw ? [-e2[1], e2[0]] : [e2[1], -e2[0]];
    return [p[0] + (n1[0] + n2[0]) * d, p[1] + (n1[1] + n2[1]) * d];
  });
}

function normalize2([x, y]) {
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}

export function buildZoneObjects(params, materialsFor) {
  const zones = M.buildZones(params);
  const objects = [];
  for (const zone of zones) {
    const unit = M.UNITS.find((u) => u.id === zone.unit);
    // shape in (x, -z) so that after rotating -90° about X it lands on (x, z)
    const poly = insetPolygon(zone.poly, 0.04);
    const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z)));
    const g = new THREE.ExtrudeGeometry(shape, { depth: zone.height - 0.06, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, zone.level + 0.03, 0);
    const { fill, edge } = materialsFor(unit, zone.kind);
    const mesh = new THREE.Mesh(g, fill);
    mesh.renderOrder = 2;
    mesh.userData = { zone, unit: unit.id, isZone: true, floor: zone.floor };
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), edge);
    edges.renderOrder = 3;
    mesh.add(edges);
    objects.push({ zone, unit, mesh, edges });
  }
  return { zones, objects };
}

export function makeUnitLabel(unit, onClick) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'unit-label';
  el.style.setProperty('--c', unit.color);
  el.tabIndex = -1; // keyboard users select units from the panel list
  el.innerHTML = `<span>${unit.short}</span><small>${unit.placement.confidence === 'weak' ? 'placement weak' : 'placement inferred'}</small>`;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick(unit.id);
  });
  return new CSS2DObject(el);
}

export function boxOutline(box, color) {
  const [[x0, y0, z0], [x1, y1, z1]] = box;
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color, depthTest: false, transparent: true }));
  e.renderOrder = 10;
  g.dispose();
  return e;
}

function textLabel(text, cls = 'dim-label') {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  return new CSS2DObject(el);
}

export function buildDimensions(params) {
  const D = params.depth;
  const group = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: '#33414d' });
  const line = (pts) => {
    const g = new THREE.BufferGeometry().setFromPoints(pts.map((p) => new THREE.Vector3(...p)));
    group.add(new THREE.LineSegments(g, mat));
  };
  const dim = (a, b, tick, text) => {
    line([a, b, a.map((v, i) => v + tick[i]), a.map((v, i) => v - tick[i]), b.map((v, i) => v + tick[i]), b.map((v, i) => v - tick[i])]);
    const l = textLabel(text);
    l.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    group.add(l);
  };
  const z = 3.6;
  dim([0, 0.05, z], [W, 0.05, z], [0, 0, 0.25], `≈${W.toFixed(1)} m front width · estimated`);
  dim([0, 0.05, z + 1.1], [MW, 0.05, z + 1.1], [0, 0, 0.25], `≈${MW.toFixed(1)} m main block · estimated`);
  dim([W + 1.4, 0.05, 0], [W + 1.4, 0.05, -D], [0.25, 0, 0], `≈${D.toFixed(1)} m depth · estimated ±1.5 m`);
  dim([-4.0, 0, 3.4], [-4.0, M.LEVELS.RIDGE, 3.4], [0.25, 0, 0], `ridge ≈${M.LEVELS.RIDGE.toFixed(1)} m · estimated`);
  const ff = textLabel(`upper floor ≈${FF.toFixed(2)} m · estimated`);
  ff.position.set(-4.0, FF, 3.4);
  line([[-4.25, FF, 3.4], [-3.75, FF, 3.4]]);
  group.add(ff);
  return group;
}

export function buildNorth(facade) {
  const group = new THREE.Group();
  const origin = new THREE.Vector3(-7.5, 0.04, 9.5);
  const len = 3.2;
  const mid = facade.mid;
  const [dx, dz] = M.azimuthToModelDir(0, mid);
  // uncertainty wedge: north directions for every feasible façade azimuth
  const iv = facade.intervals[0];
  const pts = [origin.clone()];
  const spanDeg = ((iv.to - iv.from) % 360 + 360) % 360;
  for (let i = 0; i <= 24; i++) {
    const A = iv.from + (spanDeg * i) / 24;
    const [nx, nz] = M.azimuthToModelDir(0, A);
    pts.push(new THREE.Vector3(origin.x + nx * len, origin.y, origin.z + nz * len));
  }
  const idx = [];
  for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
  const wedge = new THREE.BufferGeometry().setFromPoints(pts);
  wedge.setIndex(idx);
  wedge.computeVertexNormals();
  group.add(new THREE.Mesh(wedge, new THREE.MeshBasicMaterial({ color: '#d95f02', transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false })));
  // arrow
  const dir = new THREE.Vector3(dx, 0, dz);
  const side = new THREE.Vector3(dz, 0, -dx);
  const tip = origin.clone().addScaledVector(dir, len);
  const base = origin.clone().addScaledVector(dir, len * 0.68);
  const arrowPts = [
    origin.clone().addScaledVector(side, 0.09), base.clone().addScaledVector(side, 0.09), base.clone().addScaledVector(side, 0.32), tip,
    base.clone().addScaledVector(side, -0.32), base.clone().addScaledVector(side, -0.09), origin.clone().addScaledVector(side, -0.09),
  ];
  const shape = new THREE.Shape(arrowPts.map((p) => new THREE.Vector2(p.x, -p.z)));
  const ag = new THREE.ShapeGeometry(shape);
  ag.rotateX(-Math.PI / 2);
  ag.translate(0, 0.05, 0);
  group.add(new THREE.Mesh(ag, new THREE.MeshBasicMaterial({ color: '#2b3540', side: THREE.DoubleSide })));
  const label = textLabel(`N · inferred from sun/shadows, ±${Math.round(spanDeg / 2)}°`, 'north-label');
  label.position.copy(tip).add(new THREE.Vector3(0, 0.3, 0));
  group.add(label);
  group.userData.label = label;
  return group;
}

function markerTexture() {
  return canvasTexture(64, 64, (g, w, h) => {
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.beginPath();
    g.arc(w / 2, h / 2, 29, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = '#1d4f91';
    g.stroke();
    g.fillStyle = '#1d4f91';
    g.fillRect(17, 24, 30, 20);
    g.fillRect(25, 19, 12, 6);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(32, 34, 6, 0, Math.PI * 2);
    g.fill();
  }, false);
}

export function buildPhotoMarkers(photos) {
  const group = new THREE.Group();
  const tex = markerTexture();
  const sprites = [];
  const lineMat = new THREE.LineBasicMaterial({ color: '#1d4f91', transparent: true, opacity: 0.7 });
  for (const p of photos) {
    if (!p.view) continue;
    const mat = new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true });
    const s = new THREE.Sprite(mat);
    s.position.set(...p.view.pos);
    s.scale.set(0.55, 0.55, 0.55);
    s.renderOrder = 20;
    s.userData = { photo: p.file };
    group.add(s);
    sprites.push(s);
    const a = new THREE.Vector3(...p.view.pos);
    const t = new THREE.Vector3(...p.view.target).sub(a).normalize().multiplyScalar(1.4).add(a);
    group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a, t]), lineMat));
  }
  return { group, sprites };
}

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

export function buildBuilding(params, materials) {
  const groups = { ground: new THREE.Group(), upper: new THREE.Group(), roof: new THREE.Group(), site: new THREE.Group() };
  for (const [k, g] of Object.entries(groups)) g.name = `floor:${k}`;
  const b = new Builder(materials);
  addWalls(b, params);
  addSlabsAndRoof(b, params);
  addFrontDetails(b);
  addPlinthAndPaving(b, params);
  addStairAndPergolaTerrace(b, params);
  addSite(b, params);
  const meshes = b.finish(groups);
  return { groups, meshes };
}

export function buildTrees(materials) {
  const group = new THREE.Group();
  const trees = [[2.6, 6.0, 1.0], [8.6, 7.4, 1.0], [-3.2, 7.0, 1.25], [4.6, 12.5, 0.9]];
  for (const [x, z, s] of trees) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.14 * s, 2.2 * s, 7), materials.mats.trunk);
    trunk.position.set(x, 1.1 * s, z);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.7 * s, 1), materials.mats.foliage);
    crown.position.set(x, 3.0 * s, z);
    crown.scale.set(1, 0.85, 1);
    for (const m of [trunk, crown]) {
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    }
  }
  return group;
}
