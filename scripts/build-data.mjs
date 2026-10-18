// research/*.json (verified research dumps) → src/data/*.json (what the site imports).
// Keeps facts, sources and confidence; drops working notes and verification logs;
// adds straight-line distance from the house. Fails loudly on bad coordinates.
//
//   node scripts/build-data.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const IN = join(ROOT, 'research');
const OUT = join(ROOT, 'src/data');
const HOUSE = [44.2587142, 15.1589155];
// Generous bounding box for anything "local" (Zadar county coast incl. Pag, Velebit, Krka, Plitvice).
const LOCAL_BBOX = { s: 43.5, n: 45.2, w: 14.5, e: 16.2 };

const read = (name) => JSON.parse(readFileSync(join(IN, `${name}.json`), 'utf8'));
mkdirSync(OUT, { recursive: true });

function km([a, b], [c, d]) {
  const r = (x) => (x * Math.PI) / 180;
  const h = Math.sin(r(c - a) / 2) ** 2 + Math.cos(r(a)) * Math.cos(r(c)) * Math.sin(r(d - b) / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.sqrt(h));
}
const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

const problems = [];
function checkLocal(where, lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) {
    problems.push(`${where}: missing coordinates`);
    return false;
  }
  if (lat < LOCAL_BBOX.s || lat > LOCAL_BBOX.n || lon < LOCAL_BBOX.w || lon > LOCAL_BBOX.e) {
    problems.push(`${where}: ${lat},${lon} outside the local bounding box`);
    return false;
  }
  return true;
}

// Remove internal working fields recursively.
const DROP = new Set(['notes', 'verification', 'methodNotes', 'method', 'methodology', 'fieldNotes', 'retrievalNotes', 'crossCheck', 'generatedAt', 'topic']);
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).filter(([k]) => !DROP.has(k)).map(([k, v]) => [k, clean(v)]));
  }
  return value;
}

function withDistance(item, where) {
  const lat = item.lat ?? item.location?.lat;
  const lon = item.lon ?? item.location?.lon;
  if (lat == null || lon == null) return { ...item, km: null };
  checkLocal(where, lat, lon);
  return { ...item, km: round(km(HOUSE, [lat, lon])) };
}

function write(name, data) {
  const json = JSON.stringify(data);
  writeFileSync(join(OUT, `${name}.json`), json);
  console.log(`  src/data/${name}.json  ${(json.length / 1024).toFixed(0)} kB`);
}

console.log('Building src/data from research/ …');

// Beaches
{
  const r = read('beaches');
  const items = r.items.filter((b) => checkLocal(`beach ${b.id}`, b.lat, b.lon)).map((b) => withDistance(clean(b), `beach ${b.id}`));
  items.sort((a, b) => a.km - b.km);
  write('beaches', { items, unmapped: clean(r.unmappedCandidates || []), openQuestions: r.openQuestions || [] });
}

// Points of interest
{
  const r = read('pois');
  const items = r.items.filter((p) => checkLocal(`poi ${p.id}`, p.lat, p.lon)).map((p) => withDistance(clean(p), `poi ${p.id}`));
  items.sort((a, b) => a.km - b.km);
  write('pois', { areas: clean(r.areas || []), items, openQuestions: r.openQuestions || [] });
}

// Activities & events
{
  const r = read('activities');
  const items = r.items.map((a) => withDistance(clean(a), `activity ${a.id}`));
  write('activities', { items, windSeasons: clean(r.windSeasons || []), openQuestions: r.openQuestions || [] });
}

// Cycling routes (large: coordinates + elevation profiles)
{
  const r = read('cycling');
  const routes = r.items.map((route) => {
    const c = clean(route);
    for (const [i, p] of (c.coordinates || []).entries()) {
      if (i % 50 === 0) checkLocal(`route ${c.id} pt ${i}`, p[0], p[1]);
    }
    c.coordinates = (c.coordinates || []).map(([lat, lon]) => [round(lat, 5), round(lon, 5)]);
    c.elevationProfile = (c.elevationProfile || []).map(([d, e]) => [round(d, 2), Math.round(e)]);
    return c;
  });
  write('cycling', { routes, info: clean(r.cyclingInfo || {}), openQuestions: r.openQuestions || [] });
}

// Travel (flights are international, so no local bbox check)
{
  const r = read('travel');
  const routes = clean(r.items).filter((f) => {
    const ok = typeof f.lat === 'number' && typeof f.lon === 'number';
    if (!ok) problems.push(`flight ${f.id}: missing coordinates`);
    return ok;
  });
  write('travel', {
    airport: clean(r.airport),
    routes,
    flightStats: clean(r.flightStats || null),
    transfers: clean(r.transfers || []),
    drives: clean(r.drives || []),
    localDrives: clean(r.localDrives || []),
    tolls: clean(r.tolls || null),
    ferries: clean(r.ferries || []),
    alternativeAirports: clean(r.alternativeAirports || []),
    publicTransport: clean(r.publicTransport || []),
    openQuestions: r.openQuestions || [],
  });
}

// Listing facts + climate
{
  const r = read('listing');
  write('listing', { apartments: clean(r.items), property: clean(r.property), reviews: clean(r.reviews || []), openQuestions: r.openQuestions || [] });
  write('climate', { months: clean(r.climate), sources: r.climateSources || [] });
}

// Retreats
{
  const r = read('retreats');
  write('retreats', {
    items: r.items.map((x) => withDistance(clean(x), `retreat ${x.id}`)),
    sampleAgendas: clean(r.sampleAgendas || []),
    venueChecklist: clean(r.venueChecklist || []),
    whatCompaniesLookFor: clean(r.whatCompaniesLookFor || []),
    invoicingAndTax: clean(r.invoicingAndTax || null),
    offSeason: clean(r.offSeason || null),
    openQuestions: r.openQuestions || [],
  });
}

// Niche audiences & direct-booking know-how
{
  const r = read('niches');
  write('niches', {
    segments: clean(r.items),
    directBooking: clean(r.directBooking || []),
    competitors: clean(r.competitors || []),
    keyDistances: clean(r.keyDistancesFromVilla || null),
    openQuestions: r.openQuestions || [],
  });
}

// Every owner question in one place.
{
  const all = {};
  for (const name of ['beaches', 'pois', 'activities', 'cycling', 'travel', 'listing', 'retreats', 'niches']) all[name] = read(name).openQuestions || [];
  write('open-questions', all);
}

if (problems.length) {
  console.log(`\n${problems.length} data problem(s):`);
  for (const p of problems) console.log(`  - ${p}`);
  if (process.argv.includes('--strict')) process.exit(1);
}
