// Building data for the Apartments Napros digital twin.
//
// This module is deliberately free of three.js so it can be checked with
// `node --test`. Every dimension, wall, zone and photo carries a provenance
// tag; nothing here is a survey. Coordinate system (metres):
//   x  along the front (gable) façade, 0 = left corner (external-stair side)
//   y  up, 0 = garden level in front of the house
//   z  toward the street; 0 = outer face of the front façade, the building
//      extends to z = -depth.

import { solarPosition, angleDiff, mod } from './solar.js';

/* ------------------------------------------------------------------ */
/* Provenance vocabulary                                               */
/* ------------------------------------------------------------------ */

export const PROV = {
  stated: {
    label: 'Stated',
    text: 'Fact supplied by the owner in NOTES.md (not re-measured).',
  },
  observed: {
    label: 'Observed',
    text: 'Element is visible in at least one supplied photo. Its size and position are scaled estimates.',
  },
  estimated: {
    label: 'Estimated',
    text: 'Scaled from photos, taking the white balustrades as ≈1.0 m tall. Expect ±10–20 %.',
  },
  inferred: {
    label: 'Inferred',
    text: 'Reasoned from indirect evidence (layout logic, photo viewpoints, sun position). Not seen directly.',
  },
  assumed: {
    label: 'Assumed',
    text: 'No supplied evidence. Placeholder so the 3D model can be built.',
  },
};

/** Geometry is coloured in "evidence" mode by one of these three classes. */
export const GEOMETRY_CLASSES = ['observed', 'inferred', 'assumed'];

/* ------------------------------------------------------------------ */
/* Dimensions                                                          */
/* ------------------------------------------------------------------ */

export const DIMS = {
  totalWidth: { value: 14.4, prov: 'estimated', label: 'Front width incl. annex', note: 'Scaled from the near-frontal photos 20210720_171634 (≈14.7 m) and 20210810_184724 (≈14.2 m).' },
  mainWidth: { value: 10.6, prov: 'estimated', label: 'Main (gable) block width', note: 'The gable apex is ≈5.3 m from the left corner in both frontal photos. The fascia step and wall joint at ≈10.2–10.7 m mark where the annex starts.' },
  ridgeX: { value: 5.3, prov: 'estimated', label: 'Ridge offset from left corner', note: 'Apex position in photos 20210720_171634 and 20210810_184724.' },
  depth: { value: 10.0, prov: 'estimated', label: 'Building depth (front–rear)', note: 'No photo shows the rear. The side wall ends where the pergola terrace ends in app3-entrance, about 6–8 m beyond the camera. The pergola front sits ≈1.5–3 m behind the façade in the frontal photos. Together: ≈8.5–12 m; 10 m is used. Try other values with the "what-if" depth slider.' },
  wall: { value: 0.3, prov: 'assumed', label: 'Wall thickness', note: 'Typical masonry wall; not visible in the evidence.' },
  gfLevel: { value: 0.7, prov: 'estimated', label: 'Ground-floor level (main block)', note: '4 risers up to the arched terrace (photos 20210720_171929, 20210720_171634).' },
  annexGfLevel: { value: 0.1, prov: 'assumed', label: 'Ground-floor level (annex)', note: 'Garage-type door sits at driveway level.' },
  ffLevel: { value: 3.85, prov: 'estimated', label: 'Upper-floor level', note: 'Terrace floor to loggia floor ≈3.1–3.2 m in photo 20210720_171634.' },
  ceiling: { value: 2.7, prov: 'estimated', label: 'Upper-floor clear height', note: 'Loggia opening height: 2.70 m (photo 20210810_184724) and 2.77 m (photo 20210720_171634).' },
  ridge: { value: 9.4, prov: 'estimated', label: 'Ridge height above garden', note: 'Apex ≈5.4–5.6 m above the loggia floor in three frontal photos.' },
  mainPitch: { value: 23, prov: 'estimated', label: 'Main roof pitch (°)', note: 'From the gable verges. The left and right slopes measure 20–25° in the photos, with some lens/yaw distortion.' },
  annexPitch: { value: 14, prov: 'estimated', label: 'Annex roof pitch (°)', note: 'The annex roof continues the right slope at a visibly lower pitch (13.7–14.6° in photos 20210720_171634 and 20210810_184724).' },
  eaveOverhang: { value: 0.45, prov: 'estimated', label: 'Eave overhang' },
  vergeOverhang: { value: 0.3, prov: 'estimated', label: 'Gable verge overhang' },
  roofThickness: { value: 0.25, prov: 'assumed', label: 'Roof build-up' },
  loggiaDepth: { value: 1.8, prov: 'inferred', label: 'Upper loggia depth', note: 'A table for four fits along the loggia (app2-terrace). The depth is not measurable from the front.' },
  terraceDepth: { value: 2.6, prov: 'inferred', label: 'Ground-floor covered terrace depth', note: 'From the interior view app1-terrace. Not measured.' },
  pergolaTerraceWidth: { value: 2.2, prov: 'estimated', label: 'Pergola terrace width (Apt 3)', note: 'From the perspective of app3-entrance.' },
  fenceDistance: { value: 17, prov: 'estimated', label: 'Street fence distance from façade', note: 'Camera position solved from point correspondences in 414970668 (gate, driveway and façade corners). ±3 m.' },
};

export const DEFAULT_PARAMS = Object.freeze({ depth: DIMS.depth.value });
export const DEPTH_RANGE = Object.freeze({ min: 8.5, max: 13, step: 0.5 });

// Upper-floor split between Apt 2 (front + right) and Apt 3 (rear left), both inferred:
// the cross wall sits just in front of the Apt 3 entrance door, the long wall
// continues the loggia end-wall line.
const SPLIT_Z = -4.85; // front face of the cross partition
const SPLIT_X = 6.85; // left face of the long partition

const W = DIMS.totalWidth.value;
const MW = DIMS.mainWidth.value;
const RX = DIMS.ridgeX.value;
const T = DIMS.wall.value;
const GF = DIMS.gfLevel.value;
const AGF = DIMS.annexGfLevel.value;
const FF = DIMS.ffLevel.value;
const CEIL = FF + DIMS.ceiling.value; // 6.55
const SLAB_BOTTOM = FF - 0.25; // 3.6
const ATTIC = CEIL + 0.2; // 6.75 top of upper-floor ceiling slab
const RIDGE = DIMS.ridge.value;
const TAN_MAIN = Math.tan((DIMS.mainPitch.value * Math.PI) / 180);
const TAN_ANNEX = Math.tan((DIMS.annexPitch.value * Math.PI) / 180);
const ROOF_T = DIMS.roofThickness.value;

export const LEVELS = { GF, AGF, FF, CEIL, SLAB_BOTTOM, ATTIC, RIDGE, W, MW, RX, T };

/** Storey bands used for floor isolation and for splitting walls. */
export const FLOOR_BANDS = [
  { id: 'ground', label: 'Ground floor', y0: -1, y1: SLAB_BOTTOM },
  { id: 'upper', label: 'Upper floor', y0: SLAB_BOTTOM, y1: ATTIC },
  { id: 'roof', label: 'Attic & roof', y0: ATTIC, y1: 30 },
];

/** Top surface of the roof at x (left slope, right slope, annex lean-to). */
export function roofTopAt(x) {
  if (x <= RX) return RIDGE - (RX - x) * TAN_MAIN;
  if (x <= MW) return RIDGE - (x - RX) * TAN_MAIN;
  return RIDGE - (MW - RX) * TAN_MAIN - (x - MW) * TAN_ANNEX;
}

/** Underside of the roof build-up at x (where walls stop). */
export function roofUndersideAt(x) {
  const tan = x > MW ? TAN_ANNEX : TAN_MAIN;
  return roofTopAt(x) - ROOF_T * Math.sqrt(1 + tan * tan);
}

/** Roof cross-section (x, y) polygon, extruded along z by the renderer. */
export function roofSection() {
  const eo = DIMS.eaveOverhang.value;
  const xs = [-eo, RX, MW, W + eo];
  const top = xs.map((x) => [x, roofTopAt(x)]);
  const bottom = xs
    .map((x) => {
      const tan = x > MW + 1e-6 ? TAN_ANNEX : TAN_MAIN;
      return [x, roofTopAt(x) - ROOF_T * Math.sqrt(1 + tan * tan)];
    })
    .reverse();
  return [...top, ...bottom];
}

/* ------------------------------------------------------------------ */
/* Walls and openings                                                  */
/* ------------------------------------------------------------------ */
// A wall is described by the outer-face line a→b in plan (x, z); the wall body
// lies on the inner side (to the left of a→b when seen from above) and has
// thickness t. Its outline and openings are given in (w, y) where w is the
// world coordinate along the wall axis (x for walls parallel to x, z otherwise).

export function buildWalls(params = DEFAULT_PARAMS) {
  const D = params.depth;
  const uL = roofUndersideAt(0);
  const uR = roofUndersideAt(W);
  const uMW = roofUndersideAt(MW);
  const uRX = roofUndersideAt(RX);
  const frontOutline = [[0, 0], [W, 0], [W, uR], [MW, uMW], [RX, uRX], [0, uL]];

  return [
    {
      id: 'front', label: 'Front (gable) façade', a: [0, 0], b: [W, 0], t: T, prov: 'observed', exterior: true,
      photos: ['20210720_171634.jpg', '20210810_184724.jpg', '414970668.jpg', 'driveway.jpg'],
      outline: frontOutline,
      openings: [
        { id: 'kitchen-window', label: 'Shuttered window (outside kitchen)', shape: 'rect', w0: 1.3, w1: 2.6, y0: GF + 0.95, y1: GF + 2.15, fill: 'window', shutters: 'closed', prov: 'observed', photos: ['20210720_171929.jpg', 'app1-kitchen.jpg'] },
        { id: 'arch-a', label: 'Entrance arch with steps', shape: 'arch', w0: 4.15, w1: 6.7, y0: GF, spring: GF + 2.0, crown: GF + 2.8, fill: 'open', prov: 'observed', photos: ['20210720_171929.jpg', '20210720_171634.jpg', 'app1-terrace.jpg'] },
        { id: 'arch-b', label: 'Balustraded arch', shape: 'arch', w0: 7.0, w1: 10.3, y0: GF, spring: GF + 2.0, crown: GF + 2.8, fill: 'open', prov: 'observed', photos: ['app1-terrace.jpg', '20210720_171929.jpg', '20210810_184724.jpg'] },
        { id: 'annex-gf-door', label: 'Two-leaf garage-type door', shape: 'rect', w0: 11.0, w1: 13.45, y0: AGF, y1: AGF + 2.45, fill: 'garage', prov: 'observed', photos: ['414970668.jpg', 'driveway.jpg'] },
        { id: 'loggia-left', label: 'Loggia bay (left)', shape: 'rect', w0: 0.35, w1: 2.9, y0: FF, y1: CEIL, fill: 'open', prov: 'observed', photos: ['20210720_171634.jpg', '20210810_184724.jpg'] },
        { id: 'loggia-right', label: 'Loggia bay (right)', shape: 'rect', w0: 3.25, w1: 6.55, y0: FF, y1: CEIL, fill: 'open', prov: 'observed', photos: ['20210720_171634.jpg', '20210810_184724.jpg'] },
        { id: 'upper-window', label: 'Shuttered upper window', shape: 'rect', w0: 7.7, w1: 9.0, y0: FF + 1.0, y1: FF + 2.3, fill: 'window', shutters: 'closed', prov: 'observed', photos: ['20210810_184724.jpg', '414970668.jpg'] },
        { id: 'annex-door', label: 'Glazed two-leaf door (annex upper floor)', shape: 'rect', w0: 11.3, w1: 13.1, y0: FF, y1: FF + 2.05, fill: 'glass', prov: 'observed', photos: ['414970668.jpg', 'driveway.jpg', '20210810_184724.jpg'] },
        { id: 'gable-vent', label: 'Louvred attic vent', shape: 'rect', w0: 4.9, w1: 5.7, y0: FF + 3.7, y1: FF + 4.65, fill: 'louver', prov: 'observed', photos: ['20210720_171634.jpg', '20210810_184724.jpg'] },
      ],
    },
    {
      id: 'left', label: 'Left side wall (stair side)', a: [0, -D + T], b: [0, -T], t: T, prov: 'observed', exterior: true,
      photos: ['20210720_171929.jpg', 'app3-entrance.jpg'],
      outline: [[-D + T, 0], [-T, 0], [-T, uL], [-D + T, uL]],
      openings: [
        { id: 'side-vent', label: 'Small louvred vent', shape: 'rect', w0: -2.8, w1: -2.4, y0: 2.0, y1: 2.5, fill: 'louver', prov: 'observed', photos: ['20210720_171929.jpg'] },
        { id: 'apt3-door', label: 'Apartment 3 entrance door', shape: 'rect', w0: -6.2, w1: -5.3, y0: FF, y1: FF + 2.1, fill: 'door', prov: 'observed', photos: ['app3-entrance.jpg'], note: 'The door is seen in app3-entrance. Its distance from the façade (≈5.3–6.2 m) is estimated from the photo perspective.' },
      ],
    },
    {
      id: 'right', label: 'Right side wall (annex, never photographed)', a: [W, -T], b: [W, -D + T], t: T, prov: 'assumed', exterior: true,
      outline: [[-T, 0], [-D + T, 0], [-D + T, uR], [-T, uR]],
      openings: [],
    },
    {
      id: 'rear', label: 'Rear façade (never photographed)', a: [W, -D], b: [0, -D], t: T, prov: 'assumed', exterior: true,
      outline: frontOutline.map(([x, y]) => [x, y]),
      openings: [],
    },
    {
      id: 'loggia-back', label: 'Loggia back wall (Apt 2)', a: [T, -DIMS.loggiaDepth.value], b: [6.85, -DIMS.loggiaDepth.value], t: T, prov: 'observed',
      photos: ['20210720_171634.jpg', 'app2-terrace2.jpg'],
      // outlines of walls with floor-level doors start 5 cm below the floor
      // (hidden in the slab) so door holes never touch the outline edge
      outline: [[T, FF - 0.05], [6.85, FF - 0.05], [6.85, CEIL], [T, CEIL]],
      openings: [
        { id: 'loggia-window', label: 'Frosted window', shape: 'rect', w0: 1.4, w1: 2.1, y0: FF + 1.15, y1: FF + 2.15, fill: 'frosted', prov: 'observed', photos: ['20210720_171634.jpg', 'app2-terrace2.jpg'] },
        { id: 'loggia-door', label: 'Louvred French door to Apt 2 living room', shape: 'rect', w0: 4.1, w1: 5.4, y0: FF, y1: FF + 2.2, fill: 'glass', shutters: 'open', prov: 'observed', photos: ['20210720_171634.jpg', 'app2-terrace2.jpg', 'app2-livingroom.jpg'] },
      ],
    },
    {
      id: 'loggia-end', label: 'Loggia end wall', a: [6.55, -DIMS.loggiaDepth.value], b: [6.55, -T], t: T, prov: 'observed',
      outline: [[-DIMS.loggiaDepth.value, FF], [-T, FF], [-T, CEIL], [-DIMS.loggiaDepth.value, CEIL]],
      openings: [],
    },
    {
      id: 'terrace-back', label: 'Back wall of covered terrace & outside kitchen', a: [T, -DIMS.terraceDepth.value], b: [MW - 0.15, -DIMS.terraceDepth.value], t: T, prov: 'observed',
      photos: ['20210720_171929.jpg', '20210720_171634.jpg'],
      outline: [[T, GF - 0.05], [MW - 0.15, GF - 0.05], [MW - 0.15, SLAB_BOTTOM], [T, SLAB_BOTTOM]],
      openings: [
        { id: 'apt1-door', label: 'French door with shutters (Apt 1)', shape: 'rect', w0: 4.75, w1: 5.8, y0: GF, y1: GF + 2.2, fill: 'glass', shutters: 'open', prov: 'observed', photos: ['20210720_171929.jpg', '20210720_171634.jpg'] },
      ],
    },
    {
      id: 'kitchen-wall', label: 'Outside-kitchen / terrace wall', a: [4.15, -T], b: [4.15, -DIMS.terraceDepth.value], t: T, prov: 'inferred',
      outline: [[-T, GF - 0.05], [-DIMS.terraceDepth.value, GF - 0.05], [-DIMS.terraceDepth.value, SLAB_BOTTOM], [-T, SLAB_BOTTOM]],
      openings: [
        { id: 'kitchen-door', label: 'Glazed kitchen door onto terrace', shape: 'rect', w0: -2.45, w1: -1.6, y0: GF, y1: GF + 2.1, fill: 'glass', prov: 'inferred', photos: ['app1-kitchen.jpg'] },
      ],
    },
    {
      id: 'annex-divide', label: 'Wall between main block and annex', a: [MW + 0.15, -T], b: [MW + 0.15, -D + T], t: T, prov: 'inferred',
      outline: [[-T, 0], [-D + T, 0], [-D + T, uMW], [-T, uMW]],
      openings: [],
      note: 'Probably the original side wall of the gable house. The fascia step and wall joint suggest the annex was added later.',
    },
    {
      id: 'apt2-apt3', label: 'Partition Apt 2 / Apt 3 (cross wall)', a: [T, SPLIT_Z], b: [SPLIT_X + T, SPLIT_Z], t: T, prov: 'inferred',
      outline: [[T, FF], [SPLIT_X + T, FF], [SPLIT_X + T, CEIL], [T, CEIL]],
      openings: [],
      note: 'Placed just in front of the Apt 3 entrance door so that the door opens into Apt 3. The real layout is unknown.',
    },
    {
      id: 'apt2-apt3-long', label: 'Partition Apt 2 / Apt 3 (long wall)', a: [SPLIT_X + T, SPLIT_Z - T], b: [SPLIT_X + T, -D + T], t: T, prov: 'inferred',
      outline: [[SPLIT_Z - T, FF], [-D + T, FF], [-D + T, CEIL], [SPLIT_Z - T, CEIL]],
      openings: [],
      note: 'Continues the loggia end-wall line toward the rear. Inferred so that both stated areas are plausible; not observed.',
    },
    {
      id: 'landing-wall', label: 'Stair landing support wall with passage', a: [-DIMS.pergolaTerraceWidth.value, -2.0], b: [0, -2.0], t: T, prov: 'observed',
      photos: ['20210720_171929.jpg'],
      outline: [[-DIMS.pergolaTerraceWidth.value, -0.05], [0, -0.05], [0, SLAB_BOTTOM], [-DIMS.pergolaTerraceWidth.value, SLAB_BOTTOM]],
      openings: [
        { id: 'landing-passage', label: 'Passage under landing', shape: 'rect', w0: -1.0, w1: -0.15, y0: 0, y1: 2.1, fill: 'open', prov: 'observed', photos: ['20210720_171929.jpg'] },
      ],
    },
  ];
}

/** Map a wall-axis coordinate w to the local u coordinate (distance from a). */
export function wallAxis(wall) {
  const [ax, az] = wall.a;
  const [bx, bz] = wall.b;
  const alongX = Math.abs(bz - az) < 1e-9;
  const dir = alongX ? Math.sign(bx - ax) : Math.sign(bz - az);
  const start = alongX ? ax : az;
  return { alongX, toU: (w) => (w - start) * dir, length: Math.hypot(bx - ax, bz - az) };
}

/** Polygon (w, y) describing an opening; arches are tessellated. */
export function openingPolygon(op, segments = 16) {
  if (op.shape === 'rect') {
    return [[op.w0, op.y0], [op.w1, op.y0], [op.w1, op.y1], [op.w0, op.y1]];
  }
  // segmental arch: straight jambs up to spring, arc to crown
  const half = (op.w1 - op.w0) / 2;
  const rise = op.crown - op.spring;
  const r = (half * half + rise * rise) / (2 * rise);
  const cx = op.w0 + half;
  const cy = op.crown - r;
  const a0 = Math.atan2(op.spring - cy, op.w1 - cx);
  const a1 = Math.PI - a0;
  const pts = [[op.w0, op.y0], [op.w1, op.y0]];
  for (let i = 0; i <= segments; i++) {
    const a = a0 + ((a1 - a0) * i) / segments;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** Clip a polygon to the horizontal band y0 <= y <= y1 (Sutherland–Hodgman). */
export function clipPolygonToBand(poly, y0, y1) {
  const clip = (pts, inside, intersect) => {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const cur = pts[i];
      const prev = pts[(i + pts.length - 1) % pts.length];
      const cIn = inside(cur);
      const pIn = inside(prev);
      if (cIn) {
        if (!pIn) out.push(intersect(prev, cur));
        out.push(cur);
      } else if (pIn) out.push(intersect(prev, cur));
    }
    return out;
  };
  const atY = (yy) => (p, q) => {
    const t = (yy - p[1]) / (q[1] - p[1]);
    return [p[0] + t * (q[0] - p[0]), yy];
  };
  let out = clip(poly, (p) => p[1] >= y0 - 1e-9, atY(y0));
  if (out.length) out = clip(out, (p) => p[1] <= y1 + 1e-9, atY(y1));
  return dedupe(out);
}

function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    const q = out[out.length - 1];
    if (!q || Math.abs(q[0] - p[0]) > 1e-7 || Math.abs(q[1] - p[1]) > 1e-7) out.push(p);
  }
  if (out.length > 1) {
    const a = out[0];
    const b = out[out.length - 1];
    if (Math.abs(a[0] - b[0]) < 1e-7 && Math.abs(a[1] - b[1]) < 1e-7) out.pop();
  }
  return out.length >= 3 && Math.abs(polygonArea(out)) > 1e-6 ? out : [];
}

/** Split each wall into storey bands; openings go to the band that fully contains them. */
export function wallPieces(wall) {
  const pieces = [];
  for (const band of FLOOR_BANDS) {
    const outline = clipPolygonToBand(wall.outline, band.y0, band.y1);
    if (!outline.length) continue;
    const holes = wall.openings.filter((op) => {
      const ys = openingPolygon(op).map((p) => p[1]);
      return Math.min(...ys) >= band.y0 && Math.max(...ys) <= band.y1;
    });
    pieces.push({ wall, floor: band.id, outline, holes });
  }
  return pieces;
}

/* ------------------------------------------------------------------ */
/* Geometry helpers (pure)                                             */
/* ------------------------------------------------------------------ */

export function polygonArea(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2; // signed
}

export function pointInPolygon([px, py], poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonBounds(poly) {
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

/** Approximate overlap area of two plan polygons by grid sampling (step in m). */
export function overlapArea(a, b, step = 0.05) {
  const ba = polygonBounds(a);
  const bb = polygonBounds(b);
  const minX = Math.max(ba.minX, bb.minX);
  const maxX = Math.min(ba.maxX, bb.maxX);
  const minY = Math.max(ba.minY, bb.minY);
  const maxY = Math.min(ba.maxY, bb.maxY);
  if (minX >= maxX || minY >= maxY) return 0;
  let n = 0;
  for (let x = minX + step / 2; x < maxX; x += step) {
    for (let y = minY + step / 2; y < maxY; y += step) {
      if (pointInPolygon([x, y], a) && pointInPolygon([x, y], b)) n++;
    }
  }
  return n * step * step;
}

export function polygonCentroid(poly) {
  let a = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const f = x1 * y2 - x2 * y1;
    a += f;
    cx += (x1 + x2) * f;
    cy += (y1 + y2) * f;
  }
  a /= 2;
  return [cx / (6 * a), cy / (6 * a)];
}

/* ------------------------------------------------------------------ */
/* Units, zones, sections                                              */
/* ------------------------------------------------------------------ */

export const UNITS = [
  {
    id: 'apt1', number: 1, name: 'Apartment 1', short: 'Apt 1', color: '#d9653b', floor: 'ground',
    stated: { bedrooms: 2, outdoor: 'terrace', area: 68, extras: ['separate outside kitchen'], text: 'Two bedrooms, terrace, 68 m², separate outside kitchen.' },
    placement: {
      confidence: 'moderate',
      reasons: [
        'app1-terrace is shot inside the covered ground-floor terrace behind the two front arches. Its view shows the street fence and the vine pergola over the driveway.',
        'The "separate outside kitchen" (app1-kitchen) opens onto that terrace. Its shuttered window is matched to the ground-floor window under the left loggia bay.',
        'The remaining rooms are assumed to fill the ground floor of the main block. Their layout is unknown.',
      ],
    },
    rooms: [
      { name: 'Covered terrace', photos: ['app1-terrace.jpg'], text: 'Tiled terrace behind two segmental arches: a balustrade in the right arch and entrance steps at the left arch. Table for four.' },
      { name: 'Outside kitchen', photos: ['app1-kitchen.jpg'], text: 'Small separate kitchen with worktop, microwave, kettle and under-counter fridge. Glazed door to the terrace, window with louvred shutters.' },
      { name: 'Living room', photos: ['app1-livingroom.jpg'], text: 'Dark exposed ceiling beams, wood-burning stove with flue pipe, dining table for four, sofa, arched doorway, window with radiator, light laminate floor.' },
      { name: 'Bedroom', photos: ['app1-bedroom.jpg'], text: 'Double bed, wardrobe with mirrored doors, wooden floor, window with louvred shutters.' },
      { name: 'Bathroom', photos: ['app1-bathroom.jpg'], text: 'Shower cubicle, pedestal basin, wall-mounted electric water heater, fully tiled.' },
    ],
  },
  {
    id: 'apt2', number: 2, name: 'Apartment 2', short: 'Apt 2', color: '#2f74c0', floor: 'upper',
    stated: { bedrooms: 2, outdoor: 'balcony', area: 57, extras: [], text: 'Two bedrooms, balcony, 57 m².' },
    placement: {
      confidence: 'moderate',
      reasons: [
        'The balcony photos match the upper two-bay loggia on the front façade. They show the same turned balusters and awnings, a frosted window in the left bay, the louvred French door near the right end wall, and a view over the street to the sea.',
        'The apartment is therefore placed behind the loggia, at the front of the upper floor. Its extension along the right-hand side toward the rear is inferred (see the Apt 2 / Apt 3 partitions).',
      ],
    },
    rooms: [
      { name: 'Balcony (front loggia)', photos: ['app2-terrace.jpg', 'app2-terrace2.jpg'], text: 'Covered two-bay loggia with white balustrade, striped awnings, dining table for four, hanging egg chair. Sea and mountain view beyond the garden.' },
      { name: 'Living / dining room', photos: ['app2-livingroom.jpg'], text: 'White dining table with six chairs, sofa, wall TV, split air-conditioner, glazed balcony door with curtains. Two doorways lead to further rooms.' },
      { name: 'Bathroom', photos: ['app2-bathroom.jpg'], text: 'Shower cubicle, WC, wall-hung basin, electric water heater, window, towel radiator.' },
      { name: 'Two bedrooms', photos: [], text: 'Stated in NOTES.md. Not photographed.' },
    ],
  },
  {
    id: 'apt3', number: 3, name: 'Apartment 3', short: 'Apt 3', color: '#2c9a6b', floor: 'upper',
    stated: { bedrooms: 1, outdoor: 'balcony', area: 46, extras: [], text: 'One bedroom, balcony, 46 m².' },
    placement: {
      confidence: 'moderate',
      reasons: [
        'app3-entrance shows the Apt 3 door on the left side wall. It opens onto the covered pergola terrace at the top of the external stair, which runs along the side to the rear corner.',
        'The apartment is placed in the rear-left part of the upper floor, behind that door. The partitions to Apt 2 are inferred: just in front of the door, and along the loggia end-wall line. Treating the pergola terrace as its "balcony" is also inferred.',
      ],
    },
    rooms: [
      { name: 'Entrance / covered terrace', photos: ['app3-entrance.jpg'], text: 'Long terrace under a dark timber pergola, solid parapet with blue tile capping, white PVC entrance door with three small lights, bistro table for two.' },
      { name: 'Bedroom, living area, bathroom', photos: [], text: 'One bedroom stated. No interior photos.' },
    ],
  },
  {
    id: 'apt4', number: 4, name: 'Apartment 4', short: 'Apt 4', color: '#8a5cc7', floor: 'upper',
    stated: { bedrooms: null, outdoor: null, area: null, extras: [], similarTo: 'apt3', text: 'Similar to apartment 3. Exact area unspecified.' },
    placement: {
      confidence: 'weak',
      reasons: [
        'The only upper-floor space not yet assigned is in the lower-roofed annex. It has its own glazed door, awning and balcony with a dark metal railing (street photos).',
        'The caretaker room is stated to be below Apt 4, and the annex ground floor has a separate garage-type door. That fits this placement but does not prove it.',
      ],
    },
    rooms: [{ name: 'Balcony (annex)', photos: ['414970668.jpg', 'driveway.jpg'], text: 'Balcony with dark metal railing above the vine pergola. Unit assignment inferred.' }],
  },
  {
    id: 'caretaker', number: null, name: 'Caretaker / janitor room', short: 'Caretaker', color: '#c49a1a', floor: 'ground',
    stated: { bedrooms: null, outdoor: null, area: null, extras: [], below: 'apt4', text: 'Fifth space, below apartment 4. Area unspecified.' },
    placement: {
      confidence: 'weak',
      reasons: ['Follows from the Apt 4 placement: the ground floor of the annex, behind the two-leaf door. Whether that door serves a garage, a store or this room is unknown.'],
    },
    rooms: [],
  },
];

export function buildZones(params = DEFAULT_PARAMS) {
  const D = params.depth;
  const back = -(D - T);
  const LD = DIMS.loggiaDepth.value;
  const TD = DIMS.terraceDepth.value;
  const PW = DIMS.pergolaTerraceWidth.value;
  return [
    { id: 'apt1-rooms', unit: 'apt1', name: 'Apt 1 rooms', floor: 'ground', kind: 'interior', level: GF, height: SLAB_BOTTOM - GF, prov: 'inferred', poly: [[T, -TD - T], [MW - 0.15, -TD - T], [MW - 0.15, back], [T, back]] },
    { id: 'apt1-terrace', unit: 'apt1', name: 'Apt 1 covered terrace', floor: 'ground', kind: 'outdoor', level: GF, height: SLAB_BOTTOM - GF, prov: 'observed', poly: [[4.15, -T], [MW - 0.15, -T], [MW - 0.15, -TD], [4.15, -TD]] },
    { id: 'apt1-kitchen', unit: 'apt1', name: 'Apt 1 outside kitchen', floor: 'ground', kind: 'interior', level: GF, height: SLAB_BOTTOM - GF, prov: 'inferred', poly: [[T, -T], [3.85, -T], [3.85, -TD], [T, -TD]] },
    { id: 'caretaker-room', unit: 'caretaker', name: 'Caretaker room (annex ground floor)', floor: 'ground', kind: 'interior', level: AGF, height: SLAB_BOTTOM - AGF, prov: 'inferred', poly: [[MW + 0.15, -T], [W - T, -T], [W - T, back], [MW + 0.15, back]] },
    { id: 'apt2-rooms', unit: 'apt2', name: 'Apt 2 rooms', floor: 'upper', kind: 'interior', level: FF, height: CEIL - FF, prov: 'inferred', poly: [[T, -LD - T], [6.85, -LD - T], [6.85, -T], [MW - 0.15, -T], [MW - 0.15, back], [SPLIT_X + T, back], [SPLIT_X + T, SPLIT_Z], [T, SPLIT_Z]] },
    { id: 'apt2-loggia', unit: 'apt2', name: 'Apt 2 balcony (loggia)', floor: 'upper', kind: 'outdoor', level: FF, height: CEIL - FF, prov: 'observed', poly: [[T, -T], [6.55, -T], [6.55, -LD], [T, -LD]] },
    { id: 'apt3-rooms', unit: 'apt3', name: 'Apt 3 rooms', floor: 'upper', kind: 'interior', level: FF, height: CEIL - FF, prov: 'inferred', poly: [[T, SPLIT_Z - T], [SPLIT_X, SPLIT_Z - T], [SPLIT_X, back], [T, back]] },
    { id: 'apt3-terrace', unit: 'apt3', name: 'Apt 3 pergola terrace', floor: 'upper', kind: 'outdoor', level: FF, height: 2.5, prov: 'observed', poly: [[-PW + 0.2, -2.0 - T], [0, -2.0 - T], [0, -D + 0.2], [-PW + 0.2, -D + 0.2]] },
    { id: 'apt4-rooms', unit: 'apt4', name: 'Apt 4 rooms (annex upper floor)', floor: 'upper', kind: 'interior', level: FF, height: 2.0, prov: 'inferred', poly: [[MW + 0.15, -T], [W - T, -T], [W - T, back], [MW + 0.15, back]] },
    { id: 'apt4-balcony', unit: 'apt4', name: 'Apt 4 balcony (annex)', floor: 'upper', kind: 'outdoor', level: FF, height: 1.0, prov: 'observed', poly: [[MW + 0.05, 0], [W, 0], [W, 1.3], [MW + 0.05, 1.3]] },
  ];
}

/** Plan footprint of the enclosed building (main block + annex). */
export function footprint(params = DEFAULT_PARAMS) {
  return [[0, 0], [W, 0], [W, -params.depth], [0, -params.depth]];
}

export function buildSections(params = DEFAULT_PARAMS) {
  const D = params.depth;
  return [
    { id: 'main-block', name: 'Main block', prov: 'observed', box: [[0, 0, -D], [MW, RIDGE, 0]], text: 'Two storeys plus attic under a ≈23° gable roof. The ridge runs front–back and the gable faces the street. Front width ≈10.6 m (estimated). Depth unknown.' },
    { id: 'annex', name: 'Right-hand annex', prov: 'observed', box: [[MW, 0, -D], [W, roofTopAt(MW), 1.3]], text: 'Two-storey annex under a lower-pitch (≈14°) continuation of the right roof slope. The fascia step and wall joint suggest it was added later. Two-leaf door at ground level, glazed door with awning and metal-railed balcony above.' },
    { id: 'stair-terrace', name: 'External stair & pergola terrace', prov: 'observed', box: [[-DIMS.pergolaTerraceWidth.value - 0.3, 0, -D], [0, 6.8, 2.9]], text: 'Masonry stair with turned balusters rising along the left side to a covered terrace at upper-floor level (timber pergola, solid parapet with blue tiles). Apt 3 is entered from here.' },
  ];
}

/** Which zone contains world point (x, y, z)? Returns the zone or null. */
export function zoneAt(zones, x, y, z) {
  for (const zone of zones) {
    if (y < zone.level - 0.05 || y > zone.level + zone.height + 0.05) continue;
    if (pointInPolygon([x, z], zone.poly)) return zone;
  }
  return null;
}

/** Compare modelled zone areas with the stated (owner) areas. */
export const AREA_BAND = Object.freeze({ min: 0.75, max: 1.6 });

export function unitAreaReport(zones, units = UNITS) {
  return units.map((u) => {
    const own = zones.filter((z) => z.unit === u.id);
    const interior = sum(own.filter((z) => z.kind === 'interior').map((z) => Math.abs(polygonArea(z.poly))));
    const outdoor = sum(own.filter((z) => z.kind === 'outdoor').map((z) => Math.abs(polygonArea(z.poly))));
    const reference = u.stated.area ?? (u.stated.similarTo ? units.find((v) => v.id === u.stated.similarTo).stated.area : null);
    const ratio = reference ? (interior + outdoor) / reference : null;
    let verdict = 'no stated area';
    if (ratio != null) verdict = ratio < AREA_BAND.min ? 'zone too small' : ratio > AREA_BAND.max ? 'zone too large' : 'plausible';
    return { unit: u.id, stated: u.stated.area, reference, referenceIsStated: u.stated.area != null, interior, outdoor, ratio, verdict };
  });
}

/** Depth values (from DEPTH_RANGE) for which every unit with a stated area stays in AREA_BAND. */
export function feasibleDepths(range = DEPTH_RANGE) {
  const ok = [];
  for (let d = range.min; d <= range.max + 1e-9; d += range.step) {
    const depth = Math.round(d * 100) / 100;
    const rep = unitAreaReport(buildZones({ depth }));
    if (rep.filter((r) => r.referenceIsStated).every((r) => r.verdict === 'plausible')) ok.push(depth);
  }
  return ok;
}

function sum(a) {
  return a.reduce((s, v) => s + v, 0);
}

/* ------------------------------------------------------------------ */
/* Site, orientation                                                   */
/* ------------------------------------------------------------------ */

export const SITE = {
  name: 'Apartments Napros',
  address: 'Put kandelica 60, Sabunike, 23233 Privlaka, Croatia',
  addressNote: 'The owner gives house number 60; the context map link says 608. The street photo 414970668 shows a "60" plate on the garden gate, which supports 60. The street name itself cannot be checked from the packet.',
  // mean of the three EXIF GPS fixes (phone GPS; they scatter by ≈25 m)
  lat: 44.25854,
  lon: 15.15908,
  gpsNote: 'EXIF GPS of the three owner photos lies 12–31 m from the map-link pin (44.2587142, 15.1589155). Two photos taken from almost the same spot differ by ≈25 m, so the GPS is too coarse to fix the building outline or orientation.',
};

/**
 * Sun/shadow observations from the timestamped owner photos.
 * surface normals in model terms: front = +z, left = −x, right = +x, rear = −z.
 */
export const ORIENTATION_OBSERVATIONS = [
  { photo: '20210720_171634.jpg', time: '2021-07-20T17:16:34+02:00', surface: 'front', lit: true, strength: 'strong', note: 'Front gable façade in direct sun (mean luminance ≈223 vs ≈117 in the shaded loggia recess).' },
  { photo: '20210720_171929.jpg', time: '2021-07-20T17:19:29+02:00', surface: 'front', lit: true, strength: 'strong', note: 'Front façade sunlit (luminance ≈182). Leaf and hook shadows fall down to the left.' },
  { photo: '20210720_171929.jpg', time: '2021-07-20T17:19:29+02:00', surface: 'left', lit: false, strength: 'strong', note: 'Left (stair-side) wall in shade (luminance ≈131), while the stair treads in front of it carry crisp baluster shadows.' },
  { photo: '20210810_184724.jpg', time: '2021-08-10T18:47:24+02:00', surface: 'front', lit: true, sunSide: '+x', strength: 'weak', note: 'Low evening sun on the façade. Leaf shadows sit to the left of the trees, so the sun is on the right (+x) side of the façade normal.' },
];

const SURFACE_OFFSET = { front: 0, left: 90, rear: 180, right: -90 };

/** Azimuth (deg, clockwise from north) of a model-space horizontal direction. */
export function modelDirToAzimuth(dx, dz, facadeAz) {
  return mod(facadeAz + (Math.atan2(-dx, dz) * 180) / Math.PI, 360);
}

/** Unit model-space direction [dx, dz] for a compass azimuth. */
export function azimuthToModelDir(az, facadeAz) {
  const th = ((az - facadeAz) * Math.PI) / 180;
  return [-Math.sin(th), Math.cos(th)];
}

/** Sun direction (unit vector toward the sun) in model space. */
export function sunDirectionModel(sun, facadeAz) {
  const [dx, dz] = azimuthToModelDir(sun.azimuthDeg, facadeAz);
  const alt = (sun.altitudeDeg * Math.PI) / 180;
  return [dx * Math.cos(alt), Math.sin(alt), dz * Math.cos(alt)];
}

export function observationSun(obs, site = SITE) {
  return solarPosition(new Date(obs.time), site.lat, site.lon);
}

/**
 * Feasible façade azimuths (direction the front façade faces) that satisfy all
 * observations. Returns merged intervals in degrees plus a representative mid value.
 */
export function feasibleFacadeAzimuths(observations = ORIENTATION_OBSERVATIONS, { includeWeak = true, site = SITE, step = 0.1 } = {}) {
  const obs = observations.filter((o) => includeWeak || o.strength !== 'weak').map((o) => ({ ...o, sun: observationSun(o, site) }));
  const ok = [];
  for (let i = 0; i < 360 / step; i++) {
    const A = i * step;
    const pass = obs.every((o) => {
      const normal = A + SURFACE_OFFSET[o.surface];
      const d = Math.abs(angleDiff(o.sun.azimuthDeg, normal));
      if (o.lit && d >= 90) return false;
      if (!o.lit && d <= 90) return false;
      if (o.sunSide === '+x') {
        const s = angleDiff(o.sun.azimuthDeg, A); // +x lies at A − 90
        if (!(s < 0 && s > -90)) return false;
      }
      return true;
    });
    ok.push(pass);
  }
  // merge into circular intervals
  const intervals = [];
  const n = ok.length;
  const startIdx = ok.findIndex((v) => !v);
  if (startIdx === -1) return { intervals: [{ from: 0, to: 360 }], mid: null, observations: obs };
  for (let k = 1; k <= n; k++) {
    const i = (startIdx + k) % n;
    if (ok[i] && !ok[(i - 1 + n) % n]) intervals.push({ from: i * step, to: i * step });
    if (ok[i]) intervals[intervals.length - 1].to = i * step;
  }
  const main = intervals.reduce((best, iv) => (span(iv) > span(best) ? iv : best), intervals[0]);
  const mid = main ? mod(main.from + span(main) / 2, 360) : null;
  return { intervals, mid, observations: obs };
}

function span(iv) {
  return iv ? mod(iv.to - iv.from, 360) : -1;
}

/* ------------------------------------------------------------------ */
/* Photo registry                                                      */
/* ------------------------------------------------------------------ */

export const PHOTOS = [
  {
    file: '20210720_171634.jpg', title: 'Front gable façade (owner photo, July 2021)', kind: 'exterior', units: ['apt1', 'apt2', 'apt4'], duplicates: ['.jpg'],
    exif: { time: '2021-07-20T17:16:34+02:00', lat: 44.25846, lon: 15.15909, camera: 'Samsung SM-N975F', mm35: 26 },
    view: { pos: [7.8, 1.6, 17.0], target: [8.5, 3.9, 0], vfov: 42.5, prov: 'estimated' },
    evidence: [
      'Gable façade with a louvred attic vent at the apex; ridge runs front–back.',
      'Upper two-bay loggia with turned white balusters. The pillar carries a blue "APARTMAN" sign. Window in the left bay; louvred French door and covered AC unit in the right bay.',
      'Ground floor: segmental arch with tiled entrance steps, then a second opening with a balustrade on a stone-clad plinth.',
      'The right roof slope continues at a lower pitch over an annex. A car is parked under the vine pergola on the driveway.',
      'Used for widths, heights and opening positions (balustrade ≈1.0 m as scale) and the sunlit-façade orientation test.',
    ],
  },
  {
    file: '20210720_171929.jpg', title: 'Front-left corner, ultra-wide (owner photo, July 2021)', kind: 'exterior', units: ['apt1', 'apt3'],
    exif: { time: '2021-07-20T17:19:29+02:00', lat: 44.258462, lon: 15.159088, camera: 'Samsung SM-N975F', mm35: 13 },
    view: { pos: [0.2, 1.5, 7.2], target: [3.24, 2.7, -2.33], vfov: 76, prov: 'estimated' },
    evidence: [
      'External masonry stair with turned balusters and newel figures rises along the left side to a timber pergola at upper-floor level.',
      'Landing support wall with a passage; small louvred vent in the side wall; stone-clad plinth on front and side.',
      'Shuttered ground-floor window under the left loggia bay. Entrance arch with four risers and a French door behind it, then a second arch with a balustrade.',
      'Front façade sunlit and side wall shaded at 17:19 local time: a key orientation clue.',
    ],
  },
  {
    file: '20210810_184724.jpg', title: 'Front façade, evening (owner photo, August 2021)', kind: 'exterior', units: ['apt2', 'apt4'],
    exif: { time: '2021-08-10T18:47:24+02:00', lat: 44.258689, lon: 15.159057, camera: 'Samsung SM-N975F', mm35: 26 },
    view: { pos: [6.77, 1.6, 14.1], target: [6.77, 4.75, 0], vfov: 42.5, prov: 'estimated' },
    evidence: [
      'Both loggia bays with blue/green striped awnings; shuttered upper window to the right of the loggia.',
      'Fascia step and vertical wall joint where the lower-pitch annex roof begins.',
      'Annex upper window/door with a light striped awning just below the eave.',
    ],
  },
  {
    file: '414970668.jpg', title: 'Street view through gate No. 60 (listing photo)', kind: 'exterior', units: ['apt2', 'apt4', 'caretaker'],
    view: { pos: [14.0, 1.6, 23.5], target: [5.45, 2.75, 5.42], vfov: 54, prov: 'estimated' },
    evidence: [
      'House-number plate "60" on the garden gate (supports Put kandelica 60, not 608).',
      'Camera position solved from the gate, driveway and façade corners: on the verge ≈6.5 m outside the fence, near the right edge of the driveway, aiming left at the house.',
      'White balustrade fence on a stone base; concrete driveway to the annex.',
      'Annex: two-leaf garage-type door (ground), balcony with dark metal railing above a vine pergola, glazed two-leaf door under a striped awning (upper).',
      'Whole front elevation in one view: the asymmetric roof and the annex at lower pitch.',
    ],
  },
  {
    file: 'driveway.jpg', title: 'View along the driveway (listing photo)', kind: 'exterior', units: ['apt4', 'caretaker'],
    view: { pos: [13.15, 1.6, 22.2], target: [6.84, 1.6, 3.22], vfov: 54, prov: 'estimated' },
    evidence: ['Driveway with vine pergola leading to the annex door; annex balcony and awning; covered terrace balustrade at left.'],
  },
  {
    file: 'grillarea.jpg', title: 'Masonry barbecue (listing photo)', kind: 'exterior', units: [],
    view: null,
    evidence: ['Brick and stone grill with chimney on crazy paving, next to a white pillar on a stone base and a downpipe. Its position on the plot cannot be determined, so it is not placed in the model.'],
  },
  {
    file: 'app1-terrace.jpg', title: 'Apartment 1 – covered terrace', kind: 'interior', units: ['apt1'],
    view: { pos: [9.8, GF + 1.45, -2.25], target: [5.5, GF + 1.3, 0.5], vfov: 54, prov: 'inferred' },
    evidence: ['Two segmental arches, the nearer with a balustrade. Through them: lawn, street fence and the driveway pergola. This places the terrace on the street side.'],
  },
  {
    file: 'app1-kitchen.jpg', title: 'Apartment 1 – separate outside kitchen', kind: 'interior', units: ['apt1'],
    view: { pos: [0.7, GF + 1.5, -2.2], target: [4.0, GF + 1.1, -0.9], vfov: 54, prov: 'inferred' },
    evidence: ['Glazed door opens onto the tiled covered terrace. The terrace table and the French-door shutters are visible through it. Window with louvred shutters.'],
  },
  { file: 'app1-livingroom.jpg', title: 'Apartment 1 – living room', kind: 'interior', units: ['apt1'], view: null, evidence: ['Exposed dark beams, wood stove, arched doorway. Position inside the apartment unknown.'] },
  { file: 'app1-bedroom.jpg', title: 'Apartment 1 – bedroom', kind: 'interior', units: ['apt1'], view: null, evidence: ['Double bedroom with shuttered window. Position unknown.'] },
  { file: 'app1-bathroom.jpg', title: 'Apartment 1 – bathroom', kind: 'interior', units: ['apt1'], view: null, evidence: ['Shower room with electric water heater. Position unknown.'] },
  { file: 'app2-livingroom.jpg', title: 'Apartment 2 – living / dining room', kind: 'interior', units: ['apt2'], view: null, evidence: ['Glazed door to the balcony on the right; AC unit; two doorways to further rooms.'] },
  { file: 'app2-bathroom.jpg', title: 'Apartment 2 – bathroom', kind: 'interior', units: ['apt2'], view: null, evidence: ['Shower room with window. Position unknown.'] },
  {
    file: 'app2-terrace.jpg', title: 'Apartment 2 – balcony (loggia), looking along it', kind: 'exterior', units: ['apt2'],
    view: { pos: [6.2, FF + 1.5, -1.0], target: [0.3, FF + 0.95, -0.5], vfov: 54, prov: 'inferred' },
    evidence: ['Loggia with turned balusters and an awning bracket on the central pillar. Sea and mountains beyond the garden. Matches the front loggia seen from its right end.'],
  },
  {
    file: 'app2-terrace2.jpg', title: 'Apartment 2 – balcony back wall', kind: 'exterior', units: ['apt2'],
    view: { pos: [2.4, FF + 1.45, -0.55], target: [4.9, FF + 1.1, -1.8], vfov: 54, prov: 'inferred' },
    evidence: ['Frosted window (left bay) and louvred French door near the right end wall: the same arrangement as the exterior photo 20210720_171634.'],
  },
  {
    file: 'app3-entrance.jpg', title: 'Apartment 3 – entrance on the pergola terrace', kind: 'exterior', units: ['apt3'],
    view: { pos: [-1.0, FF + 1.27, -2.6], target: [-0.75, FF + 1.0, -8.6], vfov: 50, prov: 'inferred' },
    evidence: [
      'Timber pergola on white posts, solid parapet with blue tile capping, white PVC entrance door on the building side wall.',
      'The side wall ends at the far end of the terrace. This bounds the building depth (≈8.5–12 m) and places the door ≈5–6 m behind the façade.',
    ],
  },
];

export function photoByFile(file) {
  return PHOTOS.find((p) => p.file === file || (p.duplicates || []).includes(file)) || null;
}
