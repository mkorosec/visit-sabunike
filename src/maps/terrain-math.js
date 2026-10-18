// Pure helpers for the 3D terrain map: Terrarium decoding, Web Mercator pixel
// maths, the lat/lon <-> scene projection, sampling, hillshade and the colour
// ramp. No DOM, no three.js, so `node --test` can check it and the fetch script
// can reuse the tile maths.

export const TILE_SIZE = 256;
const R_EQ_KM = 6378.137; // WGS84 equatorial radius
const KM_PER_DEG_LAT = 110.574;
const KM_PER_DEG_LON_EQ = 111.32;
const rad = (d) => (d * Math.PI) / 180;
const deg = (r) => (r * 180) / Math.PI;

export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, v) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// Terrarium: elevation in metres = R * 256 + G + B / 256 - 32768.
export function decodeTerrarium(r, g, b) {
  return r * 256 + g + b / 256 - 32768;
}

export function encodeTerrarium(m) {
  const v = m + 32768;
  const r = Math.floor(v / 256);
  const g = Math.floor(v - r * 256);
  const b = Math.round((v - r * 256 - g) * 256);
  return b === 256 ? [r, g + 1, 0] : [r, g, b];
}

// RGBA (canvas ImageData) or RGB (raw) bytes -> Float32Array of metres.
export function decodeHeights(bytes, width, height, channels = 4) {
  const out = new Float32Array(width * height);
  for (let i = 0, p = 0; i < out.length; i++, p += channels) out[i] = decodeTerrarium(bytes[p], bytes[p + 1], bytes[p + 2]);
  return out;
}

/* Web Mercator, in global pixels at zoom z (256 px tiles). */

export function lonToPx(lon, z) {
  return ((lon + 180) / 360) * TILE_SIZE * 2 ** z;
}

export function latToPx(lat, z) {
  const s = Math.sin(rad(lat));
  return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * TILE_SIZE * 2 ** z;
}

export function pxToLon(px, z) {
  return (px / (TILE_SIZE * 2 ** z)) * 360 - 180;
}

export function pxToLat(py, z) {
  const n = Math.PI - (2 * Math.PI * py) / (TILE_SIZE * 2 ** z);
  return deg(Math.atan(Math.sinh(n)));
}

// Inclusive tile index range covering a bbox [w, s, e, n].
export function tileRange([w, s, e, n], z) {
  return {
    x0: Math.floor(lonToPx(w, z) / TILE_SIZE),
    x1: Math.floor(lonToPx(e, z) / TILE_SIZE),
    y0: Math.floor(latToPx(n, z) / TILE_SIZE),
    y1: Math.floor(latToPx(s, z) / TILE_SIZE),
  };
}

// Ground size of one pixel in metres at a latitude.
export function metersPerPixel(lat, z) {
  return (2 * Math.PI * R_EQ_KM * 1000 * Math.cos(rad(lat))) / (TILE_SIZE * 2 ** z);
}

/* Projection between lat/lon, heightmap pixels and scene kilometres.
   Scene: x = east, z = south (three.js -z is north), origin = bbox centre.
   Equirectangular with cos(lat0) scaling; error < 0.3 % across this region. */

export function createProjection(meta) {
  const [w, s, e, n] = meta.bbox;
  const lat0 = (s + n) / 2;
  const lon0 = (w + e) / 2;
  const kx = KM_PER_DEG_LON_EQ * Math.cos(rad(lat0));
  const kz = KM_PER_DEG_LAT;
  const [ox, oy] = meta.pixelOrigin; // global mercator pixel of the image's top-left corner
  const z = meta.zoom;
  return {
    lat0,
    lon0,
    toScene: (lat, lon) => ({ x: (lon - lon0) * kx, z: -(lat - lat0) * kz }),
    fromScene: (x, zz) => ({ lat: lat0 - zz / kz, lon: lon0 + x / kx }),
    toPixel: (lat, lon) => ({ x: lonToPx(lon, z) - ox, y: latToPx(lat, z) - oy }),
    // Scene extent of the bbox: [minX, minZ, maxX, maxZ].
    extent: [(w - lon0) * kx, -(n - lat0) * kz, (e - lon0) * kx, -(s - lat0) * kz],
  };
}

// Bilinear sample of a row-major grid at fractional pixel coords (pixel centres at i + 0.5).
export function sampleBilinear(grid, width, height, px, py) {
  const x = clamp(px - 0.5, 0, width - 1);
  const y = clamp(py - 0.5, 0, height - 1);
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, width - 1);
  const y1 = Math.min(y0 + 1, height - 1);
  const fx = x - x0;
  const fy = y - y0;
  const a = grid[y0 * width + x0];
  const b = grid[y0 * width + x1];
  const c = grid[y1 * width + x0];
  const d = grid[y1 * width + x1];
  return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
}

// Resample the mercator heightmap onto a regular cols x rows grid in scene space
// (row 0 = north edge, grid points include both edges). Returns metres.
// In both projections lon depends only on the column and lat only on the row,
// so the pixel coordinates are computed once per column / row.
export function resampleToScene(heights, meta, proj, cols, rows) {
  const [minX, minZ, maxX, maxZ] = proj.extent;
  const pxs = new Float64Array(cols);
  for (let i = 0; i < cols; i++) pxs[i] = proj.toPixel(proj.lat0, proj.fromScene(lerp(minX, maxX, i / (cols - 1)), 0).lon).x;
  const out = new Float32Array(cols * rows);
  for (let j = 0; j < rows; j++) {
    const py = proj.toPixel(proj.fromScene(0, lerp(minZ, maxZ, j / (rows - 1))).lat, proj.lon0).y;
    for (let i = 0; i < cols; i++) out[j * cols + i] = sampleBilinear(heights, meta.width, meta.height, pxs[i], py);
  }
  return out;
}

// Bilinear lookup into a scene-space grid (as built by resampleToScene) at scene x/z.
export function gridSampler(grid, cols, rows, [minX, minZ, maxX, maxZ]) {
  const sx = (cols - 1) / (maxX - minX);
  const sz = (rows - 1) / (maxZ - minZ);
  return (x, z) => sampleBilinear(grid, cols, rows, (x - minX) * sx + 0.5, (z - minZ) * sz + 0.5);
}

// Triangle mesh buffers for a scene-space height grid (row 0 = north, heights in
// scene units). Same layout and winding as a three.js PlaneGeometry rotated flat,
// but built straight into typed arrays, with normals from central differences:
// several times faster than PlaneGeometry + computeVertexNormals at 512².
export function gridMesh(grid, cols, rows, [minX, minZ, maxX, maxZ]) {
  const n = cols * rows;
  const position = new Float32Array(n * 3);
  const normal = new Float32Array(n * 3);
  const uv = new Float32Array(n * 2);
  const dx = (maxX - minX) / (cols - 1);
  const dz = (maxZ - minZ) / (rows - 1);
  for (let j = 0; j < rows; j++) {
    const up = Math.max(j - 1, 0);
    const dn = Math.min(j + 1, rows - 1);
    for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      const l = Math.max(i - 1, 0);
      const r = Math.min(i + 1, cols - 1);
      const sx = (grid[j * cols + r] - grid[j * cols + l]) / ((r - l) * dx);
      const sz = (grid[dn * cols + i] - grid[up * cols + i]) / ((dn - up) * dz);
      const inv = 1 / Math.sqrt(sx * sx + 1 + sz * sz);
      position[k * 3] = minX + i * dx;
      position[k * 3 + 1] = grid[k];
      position[k * 3 + 2] = minZ + j * dz;
      normal[k * 3] = -sx * inv;
      normal[k * 3 + 1] = inv;
      normal[k * 3 + 2] = -sz * inv;
      uv[k * 2] = i / (cols - 1);
      uv[k * 2 + 1] = 1 - j / (rows - 1);
    }
  }
  const index = new Uint32Array((cols - 1) * (rows - 1) * 6);
  let p = 0;
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = j * cols + i;
      const b = a + cols;
      index[p++] = a;
      index[p++] = b;
      index[p++] = a + 1;
      index[p++] = b;
      index[p++] = b + 1;
      index[p++] = a + 1;
    }
  }
  return { position, normal, uv, index };
}

// Lambertian hillshade in [0, 1] (Horn's gradient). cellX/cellY and heights in the same unit.
// Same result as the textbook slope/aspect form, written as a dot product with
// the surface normal so it needs one sqrt per cell instead of three trig calls.
export function hillshade(grid, cols, rows, cellX, cellY, { azimuth = 315, altitude = 45, zFactor = 1 } = {}) {
  const out = new Float32Array(cols * rows);
  const zen = rad(90 - altitude);
  const az = rad(360 - azimuth + 90);
  const cz = Math.cos(zen);
  const kx = (-Math.sin(zen) * Math.cos(az) * zFactor) / (8 * cellX);
  const ky = (Math.sin(zen) * Math.sin(az) * zFactor) / (8 * cellY);
  const gx = zFactor / (8 * cellX);
  const gy = zFactor / (8 * cellY);
  for (let j = 0; j < rows; j++) {
    const up = Math.max(j - 1, 0) * cols;
    const mid = j * cols;
    const dn = Math.min(j + 1, rows - 1) * cols;
    for (let i = 0; i < cols; i++) {
      const l = i > 0 ? i - 1 : 0;
      const r = i < cols - 1 ? i + 1 : i;
      const a = grid[up + l], b = grid[up + i], c = grid[up + r];
      const d = grid[mid + l], f = grid[mid + r];
      const g = grid[dn + l], h = grid[dn + i], k = grid[dn + r];
      const ex = c + 2 * f + k - (a + 2 * d + g);
      const ey = g + 2 * h + k - (a + 2 * b + c);
      const v = (cz + kx * ex + ky * ey) / Math.sqrt(1 + (gx * ex) ** 2 + (gy * ey) ** 2);
      out[mid + i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
  return out;
}

/* Colour ramps (sRGB 0..255). Stylised for a light page: sand coast, olive
   lowland, grey-green karst, pale stone peaks; calm Adriatic blues. */

export const LAND_RAMP = [
  [0, [233, 222, 189]],
  [6, [214, 211, 166]],
  [40, [190, 194, 146]],
  [150, [168, 178, 132]],
  [400, [158, 166, 140]],
  [800, [176, 175, 160]],
  [1200, [205, 201, 189]],
  [1700, [240, 237, 230]],
];

export const SEA_RAMP = [
  [0, [152, 210, 222]],
  [4, [128, 194, 217]],
  [15, [98, 170, 207]],
  [40, [76, 148, 195]],
  [80, [64, 132, 185]],
];

// Open water (far from any coast) uses the SEA_RAMP colour at this depth. It is
// also the colour of the outer sea plane: a mid-depth tone, so the far sea does
// not read as a dark band under the fog.
export const SEA_OPEN_M = 22;
export const SEA_DEEP = ramp(SEA_RAMP, SEA_OPEN_M).map(Math.round);
export const SEA_ROUGHNESS = 92; // 0..255, as in the roughness texture

// Vertical exaggeration of the 3D terrain (mesh and hillshade agree on it).
export const EXAG = 1.8;

export function ramp(stops, v) {
  if (v <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [e1, c1] = stops[i];
    if (v <= e1) {
      const [e0, c0] = stops[i - 1];
      const t = (v - e0) / (e1 - e0);
      return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
    }
  }
  return stops[stops.length - 1][1];
}

export function elevationColor(m) {
  return m > 0 ? ramp(LAND_RAMP, m) : ramp(SEA_RAMP, -m);
}

// Ramp sampled every metre from 0..max, as a flat [r, g, b, r, g, b, ...] table.
export function rampTable(stops, max) {
  const out = new Float32Array((max + 1) * 3);
  for (let v = 0; v <= max; v++) out.set(ramp(stops, v), v * 3);
  return out;
}

// Colour + roughness texture of the terrain, in scene space (row 0 = north).
// `m` is a tw x th grid of metres, `cell` its spacing in metres. Runs offline in
// scripts/fetch-terrain.mjs, so the browser only decodes two images.
//
// The source has almost no seabed data here (nearly all sea is 0..-4 m), so the
// sea is shaded by distance from the coast instead: a wide blur of the land mask
// is ~0.5 at the shore and falls to 0 in open water. Open water ends at SEA_DEEP,
// the colour of the outer sea plane, so the data edge does not show.
export function paintTerrain(m, tw, th, cell) {
  const shade = hillshade(m, tw, th, cell, cell, { azimuth: 315, altitude: 42, zFactor: EXAG });
  const land = new Float32Array(m.length);
  for (let i = 0; i < m.length; i++) land[i] = m[i] > 0 ? 1 : 0;
  // The source coastline is stair-stepped at ~55 m pixels. A blurred land mask,
  // blended around 0.5, gives a rounded, anti-aliased shore at any texture size.
  const r1 = Math.max(1, Math.round(tw / 1000));
  const soft = boxBlur(boxBlur(land, tw, th, r1), tw, th, r1);
  const halo = boxBlur(soft, tw, th, Math.max(3, Math.round(tw / 340)));
  const rw = Math.max(2, Math.round(tw / 45));
  const wide = boxBlur(boxBlur(boxBlur(land, tw, th, rw), tw, th, rw), tw, th, rw); // sigma ~ 2.5 km
  const edge = Math.round(tw * 0.1);
  const landLut = rampTable(LAND_RAMP, 2000);
  const seaLut = rampTable(SEA_RAMP, SEA_OPEN_M);

  const rgb = new Uint8ClampedArray(m.length * 3);
  const rough = new Uint8ClampedArray(m.length);
  for (let j = 0; j < th; j++) {
    for (let i = 0; i < tw; i++) {
      const k = j * tw + i;
      const e = m[k];
      const s = soft[k];
      const a = smoothstep(0.38, 0.62, s); // 1 = land

      // Land: hypsometric tint x hillshade, sandier right at the shore.
      const li = Math.min(Math.max(Math.round(e), 1), 2000) * 3;
      const f = clamp(1 + 1.05 * (shade[k] - 0.74), 0.58, 1.18);
      const rim = (1 - smoothstep(0.62, 0.92, s)) * 0.5;
      const lr = lerp(landLut[li] * f, 196, rim);
      const lg = lerp(landLut[li + 1] * f, 181, rim);
      const lb = lerp(landLut[li + 2] * f, 140, rim);

      // Sea: turquoise near the coast deepening to open-water blue, a soft
      // shallow halo, a thin foam line at the shore.
      const open = 1 - smoothstep(0.01, 0.42, wide[k]);
      const depth = Math.min(Math.max(open * SEA_OPEN_M, -e), SEA_OPEN_M);
      const si = Math.round(depth) * 3;
      let sr = seaLut[si];
      let sg = seaLut[si + 1];
      let sb = seaLut[si + 2];
      const h = smoothstep(0, 0.6, halo[k]) * 0.6;
      sr = lerp(sr, 172, h);
      sg = lerp(sg, 220, h);
      sb = lerp(sb, 228, h);
      const foam = smoothstep(0.04, 0.38, s) * 0.8;
      sr = lerp(sr, 243, foam);
      sg = lerp(sg, 247, foam);
      sb = lerp(sb, 240, foam);
      // Fade to the outer sea colour at the border so the seam disappears.
      const fade = 1 - smoothstep(0, edge, Math.min(i, j, tw - 1 - i, th - 1 - j));
      sr = lerp(sr, SEA_DEEP[0], fade);
      sg = lerp(sg, SEA_DEEP[1], fade);
      sb = lerp(sb, SEA_DEEP[2], fade);

      const p = k * 3;
      rgb[p] = lerp(sr, lr, a);
      rgb[p + 1] = lerp(sg, lg, a);
      rgb[p + 2] = lerp(sb, lb, a);
      // Glossy sea for a soft sun sheen, matte land.
      rough[k] = lerp(SEA_ROUGHNESS, 255, a);
    }
  }
  return { rgb, rough };
}

// Separable box blur (edges clamped), used to soften the coastline. Both passes
// walk memory row by row; the vertical one keeps a running sum per column.
export function boxBlur(src, cols, rows, radius) {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const inv = 1 / (2 * radius + 1);
  for (let j = 0; j < rows; j++) {
    const row = j * cols;
    let acc = 0;
    for (let t = -radius; t <= radius; t++) acc += src[row + clamp(t, 0, cols - 1)];
    for (let i = 0; i < cols; i++) {
      tmp[row + i] = acc * inv;
      const add = i + radius + 1;
      const sub = i - radius;
      acc += src[row + (add < cols ? add : cols - 1)] - src[row + (sub > 0 ? sub : 0)];
    }
  }
  const acc = new Float64Array(cols);
  for (let t = -radius; t <= radius; t++) {
    const row = clamp(t, 0, rows - 1) * cols;
    for (let i = 0; i < cols; i++) acc[i] += tmp[row + i];
  }
  for (let j = 0; j < rows; j++) {
    const row = j * cols;
    const add = Math.min(j + radius + 1, rows - 1) * cols;
    const sub = Math.max(j - radius, 0) * cols;
    for (let i = 0; i < cols; i++) {
      out[row + i] = acc[i] * inv;
      acc[i] += tmp[add + i] - tmp[sub + i];
    }
  }
  return out;
}

// Ease for camera moves.
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
