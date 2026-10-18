import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import {
  boxBlur,
  createProjection,
  decodeHeights,
  decodeTerrarium,
  elevationColor,
  encodeTerrarium,
  gridMesh,
  gridSampler,
  hillshade,
  latToPx,
  lonToPx,
  paintTerrain,
  pxToLat,
  pxToLon,
  resampleToScene,
  SEA_DEEP,
  SEA_ROUGHNESS,
  sampleBilinear,
  tileRange,
} from '../src/maps/terrain-math.js';

const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg ?? ''} expected ${b} ± ${eps}, got ${a}`);
const HOUSE = [44.2587142, 15.1589155];

test('Terrarium decode matches the spec and round-trips', () => {
  assert.equal(decodeTerrarium(128, 0, 0), 0);
  assert.equal(decodeTerrarium(127, 255, 0), -1);
  assert.equal(decodeTerrarium(134, 199, 128), 1735.5);
  for (const m of [-73, -0.5, 0, 0.25, 12.75, 1757]) {
    const [r, g, b] = encodeTerrarium(m);
    close(decodeTerrarium(r, g, b), m, 1 / 256);
  }
});

test('decodeHeights reads RGBA and RGB buffers', () => {
  const rgba = new Uint8ClampedArray([128, 0, 0, 255, 128, 10, 0, 255]);
  assert.deepEqual([...decodeHeights(rgba, 2, 1)], [0, 10]);
  const rgb = new Uint8Array([127, 255, 0, 128, 100, 128]);
  assert.deepEqual([...decodeHeights(rgb, 2, 1, 3)], [-1, 100.5]);
});

test('Web Mercator pixel maths is invertible and matches known tiles', () => {
  for (const z of [11, 12]) {
    close(pxToLon(lonToPx(HOUSE[1], z), z), HOUSE[1], 1e-9);
    close(pxToLat(latToPx(HOUSE[0], z), z), HOUSE[0], 1e-9);
  }
  // Cross-check with the textbook tile formula: tile 11/1110/742 contains the house.
  const phi = (HOUSE[0] * Math.PI) / 180;
  const yTile = ((1 - Math.log(Math.tan(phi) + 1 / Math.cos(phi)) / Math.PI) / 2) * 2 ** 11;
  close(latToPx(HOUSE[0], 11) / 256, yTile, 1e-9);
  assert.equal(Math.floor(lonToPx(HOUSE[1], 11) / 256), 1110);
  assert.equal(Math.floor(latToPx(HOUSE[0], 11) / 256), 742);
  assert.deepEqual(tileRange([14.86, 43.98, 15.72, 44.6], 11), { x0: 1108, x1: 1113, y0: 739, y1: 744 });
});

const META = { bbox: [14.86, 43.98, 15.72, 44.6], zoom: 11, pixelOrigin: [lonToPx(14.86, 11), latToPx(44.6, 11)], width: 0, height: 0 };

test('projection: scene km are plausible and invertible', () => {
  const proj = createProjection(META);
  const nin = proj.toScene(44.2417, 15.1847);
  const house = proj.toScene(...HOUSE);
  // Nin is about 2.8 km SE of the house: east = +x, south = +z.
  const km = Math.hypot(nin.x - house.x, nin.z - house.z);
  close(km, 2.8, 0.15, 'house-Nin distance');
  assert.ok(nin.x > house.x && nin.z > house.z);
  const back = proj.fromScene(house.x, house.z);
  close(back.lat, HOUSE[0], 1e-9);
  close(back.lon, HOUSE[1], 1e-9);
  const [minX, minZ, maxX, maxZ] = proj.extent;
  close(minX, -maxX, 1e-9, 'symmetric x');
  close(minZ, -maxZ, 1e-9, 'symmetric z');
  close(maxX - minX, 0.86 * 111.32 * Math.cos((44.29 * Math.PI) / 180), 0.01, 'width km');
  // Pixel lookup: the bbox corners land on the image corners.
  const nw = proj.toPixel(44.6, 14.86);
  close(nw.x, 0, 1e-6);
  close(nw.y, 0, 1e-6);
});

test('sampleBilinear interpolates between pixel centres and clamps at edges', () => {
  const grid = new Float32Array([0, 10, 20, 30]); // 2x2
  assert.equal(sampleBilinear(grid, 2, 2, 0.5, 0.5), 0);
  assert.equal(sampleBilinear(grid, 2, 2, 1, 0.5), 5);
  assert.equal(sampleBilinear(grid, 2, 2, 1, 1), 15);
  assert.equal(sampleBilinear(grid, 2, 2, -5, 99), 20);
});

test('resampleToScene + gridSampler reproduce a linear ramp', () => {
  const w = 64;
  const h = 64;
  const heights = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) heights[y * w + x] = x; // rises to the east
  const z = 11;
  const meta = { bbox: [pxToLon(1000, z), pxToLat(1064, z), pxToLon(1064, z), pxToLat(1000, z)], zoom: z, pixelOrigin: [1000, 1000], width: w, height: h };
  const proj = createProjection(meta);
  const cols = 33;
  const rows = 33;
  const grid = resampleToScene(heights, meta, proj, cols, rows);
  // Monotonic west -> east, constant north -> south.
  for (let i = 1; i < cols; i++) assert.ok(grid[16 * cols + i] >= grid[16 * cols + i - 1]);
  close(grid[0], grid[(rows - 1) * cols], 1e-4);
  const at = gridSampler(grid, cols, rows, proj.extent);
  const mid = at(0, 0);
  close(mid, grid[16 * cols + 16], 1e-4);
  close(mid, 31.5, 0.6, 'centre of a 0..63 ramp');
});

test('hillshade: flat ground = cos(zenith), sun-facing slope brighter', () => {
  const n = 8;
  const flat = new Float32Array(n * n);
  const s = hillshade(flat, n, n, 10, 10, { azimuth: 315, altitude: 45 });
  close(s[27], Math.cos(Math.PI / 4), 1e-6);
  // Terrain rising to the south-east faces the NW sun.
  const slope = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) slope[j * n + i] = (i + j) * 3;
  const lit = hillshade(slope, n, n, 10, 10, { azimuth: 315, altitude: 45 });
  const dark = hillshade(slope.map((v) => -v), n, n, 10, 10, { azimuth: 315, altitude: 45 });
  assert.ok(lit[27] > s[27] && dark[27] < s[27]);
});

test('hillshade equals the textbook slope/aspect formula', () => {
  const n = 12;
  const grid = new Float32Array(n * n);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) grid[j * n + i] = 40 * Math.sin(i * 0.7) + 25 * Math.cos(j * 0.9) + i * j;
  const opts = { azimuth: 300, altitude: 40, zFactor: 1.8 };
  const fast = hillshade(grid, n, n, 30, 25, opts);
  const rad = (d) => (d * Math.PI) / 180;
  const at = (i, j) => grid[Math.min(Math.max(j, 0), n - 1) * n + Math.min(Math.max(i, 0), n - 1)];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const dzdx = (at(i + 1, j - 1) + 2 * at(i + 1, j) + at(i + 1, j + 1) - (at(i - 1, j - 1) + 2 * at(i - 1, j) + at(i - 1, j + 1))) / (8 * 30);
      const dzdy = (at(i - 1, j + 1) + 2 * at(i, j + 1) + at(i + 1, j + 1) - (at(i - 1, j - 1) + 2 * at(i, j - 1) + at(i + 1, j - 1))) / (8 * 25);
      const zen = rad(90 - opts.altitude);
      const az = rad(360 - opts.azimuth + 90);
      const slope = Math.atan(opts.zFactor * Math.hypot(dzdx, dzdy));
      const aspect = Math.atan2(dzdy, -dzdx);
      const ref = Math.cos(zen) * Math.cos(slope) + Math.sin(zen) * Math.sin(slope) * Math.cos(az - aspect);
      close(fast[j * n + i], Math.min(Math.max(ref, 0), 1), 1e-5, `cell ${i},${j}`);
    }
  }
});

test('boxBlur keeps the mean and smooths a step', () => {
  const src = new Float32Array(10 * 10);
  for (let j = 0; j < 10; j++) for (let i = 5; i < 10; i++) src[j * 10 + i] = 1;
  const out = boxBlur(src, 10, 10, 1);
  close(out[5 * 10 + 4], 1 / 3, 1e-6);
  close(out[5 * 10 + 5], 2 / 3, 1e-6);
  assert.equal(out[5 * 10 + 0], 0);
  // Same along columns (transposed step).
  const v = new Float32Array(10 * 10);
  for (let j = 5; j < 10; j++) for (let i = 0; i < 10; i++) v[j * 10 + i] = 1;
  const vo = boxBlur(v, 10, 10, 1);
  close(vo[4 * 10 + 3], 1 / 3, 1e-6);
  close(vo[5 * 10 + 3], 2 / 3, 1e-6);
  close(vo.reduce((a, b) => a + b, 0), 50, 1e-4, 'mass preserved');
});

test('colour ramp: sea is blue, lowland warm, peaks pale', () => {
  const [sr, , sb] = elevationColor(-30);
  assert.ok(sb > sr + 60, 'sea is blue');
  const low = elevationColor(5);
  const peak = elevationColor(1700);
  assert.ok(low[0] > low[2], 'lowland is warm');
  assert.ok(peak.every((c) => c > 225), 'peaks are pale');
});

test('gridMesh matches a flattened three.js PlaneGeometry', () => {
  const cols = 6;
  const rows = 4;
  const extent = [-3, -2, 7, 4];
  const grid = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) grid[j * cols + i] = 0.5 * i + 0.25 * j; // planar slope
  const m = gridMesh(grid, cols, rows, extent);
  const geo = new THREE.PlaneGeometry(10, 6, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2);
  geo.translate(2, 0, 1);
  const pos = geo.attributes.position;
  for (let k = 0; k < pos.count; k++) pos.setY(k, grid[k]);
  geo.computeVertexNormals();
  assert.deepEqual([...m.index], [...geo.index.array]);
  for (let k = 0; k < pos.array.length; k++) close(m.position[k], pos.array[k], 1e-5, `position[${k}]`);
  for (let k = 0; k < m.uv.length; k++) close(m.uv[k], geo.attributes.uv.array[k], 1e-6, `uv[${k}]`);
  const nrm = geo.attributes.normal.array;
  for (let k = 0; k < nrm.length; k++) close(m.normal[k], nrm[k], 1e-5, `normal[${k}]`);
});

test('paintTerrain: sea shades by distance from the coast and ends at the outer-sea colour', () => {
  // Flat land in the west quarter, flat 1 m deep sea elsewhere (like the source data).
  const tw = 400;
  const th = 100;
  const m = new Float32Array(tw * th);
  for (let j = 0; j < th; j++) for (let i = 0; i < tw; i++) m[j * tw + i] = i < 100 ? 50 : -1;
  const { rgb, rough } = paintTerrain(m, tw, th, 100);
  assert.equal(rgb.length, tw * th * 3);
  const px = (i) => [...rgb.slice((50 * tw + i) * 3, (50 * tw + i) * 3 + 3)];
  const sum = (c) => c[0] + c[1] + c[2];
  const land = px(40);
  assert.ok(land[0] > land[2], 'land is warm');
  assert.equal(rough[50 * tw + 40], 255, 'land is matte');
  assert.equal(rough[50 * tw + 250], SEA_ROUGHNESS, 'sea is glossy');
  const coast = px(104);
  const mid = px(114);
  const open = px(250);
  assert.ok(sum(coast) > sum(mid) && sum(mid) > sum(open), `lighter towards the coast: ${coast} > ${mid} > ${open}`);
  open.forEach((c, k) => close(c, SEA_DEEP[k], 2, 'open water = outer sea colour'));
  px(tw - 1).forEach((c, k) => close(c, SEA_DEEP[k], 2, 'border = outer sea colour'));
});

test('shipped heightmap meta is consistent', () => {
  const meta = JSON.parse(readFileSync(new URL('../public/terrain/meta.json', import.meta.url), 'utf8'));
  assert.equal(meta.encoding, 'terrarium');
  const [w, s, e, n] = meta.bbox;
  assert.ok(w < 14.92 && e > 15.62 && s < 44.02 && n > 44.56, 'covers the required region');
  close(lonToPx(e, meta.zoom) - meta.pixelOrigin[0], meta.width, 0.5, 'width');
  close(latToPx(s, meta.zoom) - meta.pixelOrigin[1], meta.height, 0.5, 'height');
  assert.ok(meta.minElev < 0 && meta.maxElev > 1600, 'sea and Velebit present');
  for (const file of ['heightmap.png', meta.texture.color, meta.texture.roughness]) {
    assert.ok(readFileSync(new URL(`../public/terrain/${file}`, import.meta.url)).length > 1000, `${file} shipped`);
  }
});
