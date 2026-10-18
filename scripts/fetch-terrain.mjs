// Downloads AWS Terrarium elevation tiles for the region around Sabunike and
// stitches them (with ImageMagick) into one Terrarium-encoded PNG plus a meta
// file, then paints the map texture (hypsometric tint, hillshade, sea) from it.
// The browser decodes the heightmap through canvas getImageData and uses the
// painted images as they are, so it does no per-pixel work.
//
//   node scripts/fetch-terrain.mjs [--zoom 11] [--force] [--paint-only]
//
// Output: public/terrain/heightmap.png, meta.json, color.webp, rough.png
// Tile cache: tmp/terrain-cache/ (re-runs only download missing tiles).
// --paint-only re-paints the textures from the existing heightmap.png.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TILE_SIZE,
  createProjection,
  decodeHeights,
  latToPx,
  lonToPx,
  metersPerPixel,
  paintTerrain,
  pxToLat,
  pxToLon,
  resampleToScene,
  tileRange,
} from '../src/maps/terrain-math.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const ZOOM = Number(opt('zoom', 11));
const FORCE = args.includes('--force');
const PAINT_ONLY = args.includes('--paint-only');

// Nin, Privlaka, Vir, Zadar, southern Pag with the bridge, Velebit and
// Paklenica, plus a small margin so the camera region never shows the cut edge.
const BBOX = [14.86, 43.98, 15.72, 44.6]; // [w, s, e, n]
const URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png';
const CACHE = join(ROOT, 'tmp', 'terrain-cache', String(ZOOM));
const OUT = join(ROOT, 'public', 'terrain');
const PNG = join(OUT, 'heightmap.png');
const TEX_WIDTH = 2048; // colour texture; 2048 is supported by every WebGL device
const ROUGH_WIDTH = 1024; // roughness is only a soft land/sea mask

async function download(x, y) {
  const file = join(CACHE, `${x}_${y}.png`);
  if (existsSync(file) && !FORCE) return file;
  const url = URL.replace('{z}', ZOOM).replace('{x}', x).replace('{y}', y);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  console.log(`  fetched ${ZOOM}/${x}/${y}`);
  return file;
}

async function stitch() {
  mkdirSync(CACHE, { recursive: true });
  const { x0, x1, y0, y1 } = tileRange(BBOX, ZOOM);
  console.log(`zoom ${ZOOM}: tiles x ${x0}..${x1}, y ${y0}..${y1} (${(x1 - x0 + 1) * (y1 - y0 + 1)} tiles)`);

  const rows = [];
  for (let y = y0; y <= y1; y++) {
    const row = [];
    for (let x = x0; x <= x1; x++) row.push(await download(x, y));
    rows.push(row);
  }

  // Crop window in mosaic pixels, snapped to whole pixels.
  const left = Math.floor(lonToPx(BBOX[0], ZOOM));
  const right = Math.ceil(lonToPx(BBOX[2], ZOOM));
  const top = Math.floor(latToPx(BBOX[3], ZOOM));
  const bottom = Math.ceil(latToPx(BBOX[1], ZOOM));
  const width = right - left;
  const height = bottom - top;
  const cropX = left - x0 * TILE_SIZE;
  const cropY = top - y0 * TILE_SIZE;

  // Point-exact operations only: resampling would corrupt the RGB encoding.
  const im = [];
  for (const row of rows) im.push('(', ...row, '+append', ')');
  im.push('-append', '-crop', `${width}x${height}+${cropX}+${cropY}`, '+repage', '-alpha', 'off', '-strip');
  // Drop the sub-metre blue channel: invisible at this scale, and it is mostly
  // noise that would triple the file size.
  im.push('-channel', 'B', '-evaluate', 'set', '0', '+channel');
  im.push('-define', 'png:color-type=2', '-define', 'png:compression-level=9', `PNG24:${PNG}`);
  execFileSync('convert', im, { stdio: 'inherit' });

  const heights = readHeights(width, height);
  let minElev = Infinity;
  let maxElev = -Infinity;
  for (const h of heights) {
    if (h < minElev) minElev = h;
    if (h > maxElev) maxElev = h;
  }

  return {
    // Exact geographic bounds of the cropped image (pixel edges).
    bbox: [pxToLon(left, ZOOM), pxToLat(bottom, ZOOM), pxToLon(right, ZOOM), pxToLat(top, ZOOM)].map((v) => +v.toFixed(6)),
    width,
    height,
    encoding: 'terrarium',
    projection: 'webmercator',
    zoom: ZOOM,
    pixelOrigin: [left, top],
    metersPerPixel: +metersPerPixel((BBOX[1] + BBOX[3]) / 2, ZOOM).toFixed(1),
    minElev: Math.round(minElev),
    maxElev: Math.round(maxElev),
    generated: new Date().toISOString().slice(0, 10),
    sources: [
      'AWS Open Data "Terrain Tiles" (Mapzen / Tilezen Joerd), Terrarium encoding: https://registry.opendata.aws/terrain-tiles/',
      'Underlying data: SRTM, GMTED2010, ETOPO1, EU-DEM (produced using Copernicus data and information funded by the European Union)',
    ],
    attribution: 'Elevation: Mapzen Terrain Tiles (AWS Open Data) · SRTM, ETOPO1, EU-DEM (Copernicus)',
  };
}

function readHeights(width, height) {
  const raw = execFileSync('convert', [PNG, '-depth', '8', 'rgb:-'], { maxBuffer: 64 * 1024 * 1024 });
  if (raw.length !== width * height * 3) throw new Error(`unexpected raw size ${raw.length}`);
  return decodeHeights(raw, width, height, 3);
}

// Raw pixels in, image file out (ImageMagick reads raw RGB / grey from stdin).
// `spec` may carry an ImageMagick format prefix, e.g. PNG8:file.
function writeImage(bytes, w, h, format, outArgs, file, spec = file) {
  execFileSync('convert', ['-size', `${w}x${h}`, '-depth', '8', `${format}:-`, ...outArgs, spec], { input: Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength) });
  console.log(`wrote ${file} (${Math.round(statSync(file).size / 1024)} KB)`);
}

function paint(meta) {
  const proj = createProjection(meta);
  const [minX, minZ, maxX, maxZ] = proj.extent;
  const tw = TEX_WIDTH;
  const th = Math.round(tw * ((maxZ - minZ) / (maxX - minX)));
  const m = resampleToScene(readHeights(meta.width, meta.height), meta, proj, tw, th);
  const cell = ((maxX - minX) * 1000) / (tw - 1); // metres per texel
  const { rgb, rough } = paintTerrain(m, tw, th, cell);
  writeImage(rgb, tw, th, 'rgb', ['-strip', '-quality', '88', '-define', 'webp:method=6'], join(OUT, 'color.webp'));
  const rh = Math.round(ROUGH_WIDTH * (th / tw));
  writeImage(rough, tw, th, 'gray', ['-resize', `${ROUGH_WIDTH}x${rh}!`, '-strip', '-define', 'png:compression-level=9'], join(OUT, 'rough.png'), `PNG8:${join(OUT, 'rough.png')}`);
  return { color: 'color.webp', roughness: 'rough.png', width: tw, height: th };
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const metaFile = join(OUT, 'meta.json');
  const meta = PAINT_ONLY ? JSON.parse(readFileSync(metaFile, 'utf8')) : await stitch();
  if (!PAINT_ONLY) console.log(`wrote ${PNG} (${meta.width}x${meta.height}), elevation ${meta.minElev}..${meta.maxElev} m`);
  meta.texture = paint(meta);
  writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
