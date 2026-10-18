// Copies of data that the core (first-paint) code keeps inline, so it does not
// have to load the full data files: check they still match their source.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AUDIENCES } from '../src/content/audiences.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('index.html hero preload map matches every audience hero photo', () => {
  const map = JSON.parse(read('index.html').match(/var M = (\{.*?\});/)[1]);
  const expected = Object.fromEntries(AUDIENCES.map((a) => [a.id, a.hero.photo]));
  assert.deepEqual(map, expected);
});

test('the airport drive in core-shared.js matches travel.json', () => {
  const [, km, min] = read('src/sections/core-shared.js').match(/AIRPORT_DRIVE = \{ km: ([\d.]+), min: (\d+) \}/);
  const drive = JSON.parse(read('src/data/travel.json')).transfers.find((t) => t.id === 'transfer-drive');
  assert.equal(Number(km), drive.distanceKm);
  assert.equal(Number(min), drive.durationMin);
});
