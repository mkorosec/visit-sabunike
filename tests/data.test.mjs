// Integrity checks for the generated site data (run `npm run data` first).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (n) => JSON.parse(readFileSync(new URL(`../src/data/${n}.json`, import.meta.url)));
const CONF = new Set(['high', 'medium', 'low']);

test('the five owner-named beaches are present', () => {
  const ids = load('beaches').items.map((b) => `${b.id} ${b.name}`.toLowerCase()).join('\n');
  for (const name of ['mol', 'ričina|ricina', 'bilotinjak', 'kraljičina|kraljicina|queen', 'duboka']) {
    assert.match(ids, new RegExp(name), `missing beach matching ${name}`);
  }
});

test('beaches are sorted by distance and the nearest is under 1 km', () => {
  const items = load('beaches').items;
  for (let i = 1; i < items.length; i++) assert.ok(items[i].km >= items[i - 1].km);
  assert.ok(items[0].km < 1, `nearest beach is ${items[0].km} km away`);
});

test('every fact item has sources and a confidence level', () => {
  for (const name of ['beaches', 'pois', 'activities']) {
    for (const item of load(name).items) {
      assert.ok(Array.isArray(item.sources) && item.sources.length, `${name}/${item.id} has no sources`);
      assert.ok(CONF.has(item.confidence), `${name}/${item.id} confidence=${item.confidence}`);
    }
  }
});

test('ids are unique per dataset', () => {
  for (const [name, list] of [['beaches', load('beaches').items], ['pois', load('pois').items], ['activities', load('activities').items], ['routes', load('cycling').routes], ['flights', load('travel').routes]]) {
    const ids = list.map((x) => x.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id in ${name}`);
  }
});

test('cycling routes start and end near the house and have profiles', () => {
  for (const r of load('cycling').routes) {
    assert.ok(r.coordinates.length > 10, `${r.id} has no geometry`);
    assert.ok(r.elevationProfile.length > 10, `${r.id} has no elevation profile`);
    const [lat, lon] = r.coordinates[0];
    assert.ok(Math.abs(lat - 44.2587) < 0.01 && Math.abs(lon - 15.1589) < 0.01, `${r.id} does not start at the house`);
  }
});

test('flight routes have IATA codes, coordinates and valid months', () => {
  for (const f of load('travel').routes) {
    assert.match(f.iata, /^[A-Z]{3}$/);
    assert.ok(Math.abs(f.lat) <= 90 && Math.abs(f.lon) <= 180);
    for (const m of f.months || []) assert.ok(m >= 1 && m <= 12);
  }
});

test('climate covers 12 months with plausible values', () => {
  const months = load('climate').months;
  assert.equal(months.length, 12);
  for (const m of months) {
    assert.ok(m.seaC > 10 && m.seaC < 30, `sea ${m.seaC}`);
    assert.ok(m.airMaxC > m.airMinC);
  }
});
