// Headless smoke test: opens the page in several versions, scrolls through it
// so lazy sections mount, records console errors and saves screenshots.
//
//   node scripts/smoke.mjs [baseUrl] [--out dir] [--only audience=families,theme=postcard] [--width 1280] [--section villa]
//
// Exit code 1 when any page logs an error or an uncaught exception.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) || 'http://localhost:5180/';
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const out = opt('out', '/tmp/visit-sabunike-smoke');
const width = Number(opt('width', 1280));
const section = opt('section', null);
const only = opt('only', null);
mkdirSync(out, { recursive: true });

const VARIANTS = only
  ? [Object.fromEntries(only.split(',').map((kv) => kv.split('=')))]
  : [
      { audience: 'general' },
      { audience: 'families', theme: 'postcard' },
      { audience: 'cyclists', theme: 'minimal' },
      { audience: 'retreats', theme: 'editorial' },
    ];

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
let failures = 0;

for (const v of VARIANTS) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => {
    const url = r.url();
    // Third-party tiles / fonts may be blocked in CI; only flag our own assets.
    if (url.startsWith(base)) errors.push(`requestfailed: ${url} ${r.failure()?.errorText}`);
  });
  const url = new URL(base);
  for (const [k, val] of Object.entries(v)) url.searchParams.set(k, val);
  await page.addInitScript(() => localStorage.clear());
  await page.goto(url.toString(), { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push(`goto: ${e.message}`));
  const name = Object.entries(v).map(([k, val]) => `${k}-${val}`).join('_') || 'default';

  if (section) {
    await page.locator(`#${section}`).scrollIntoViewIfNeeded().catch(() => errors.push(`no section #${section}`));
    await page.waitForTimeout(2500);
    await page.locator(`#${section}`).screenshot({ path: join(out, `${name}_${section}.png`) }).catch((e) => errors.push(`shot: ${e.message}`));
  } else {
    // Scroll in steps so IntersectionObserver-driven mounts run.
    const height = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < height; y += 700) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      await page.waitForTimeout(250);
    }
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(out, `${name}.png`), fullPage: true });
  }
  const sections = await page.$$eval('section[data-section]', (els) => els.map((e) => e.id));
  const webgl = await page.evaluate(() => {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  });
  console.log(`\n[${name}] sections: ${sections.join(', ')}  webgl=${webgl}`);
  if (errors.length) {
    failures += errors.length;
    for (const e of errors) console.log(`  ERROR ${e}`);
  } else console.log('  no console errors');
  await page.close();
}
await browser.close();
process.exit(failures ? 1 : 0);
