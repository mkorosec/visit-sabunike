// Production browser checks. Uses Playwright's browser by default; optional
// BROWSER_EXECUTABLE and BROWSER_LIBRARY_PATH support an existing installation.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const base = process.argv[2] || 'http://localhost:5181/';
const out = '/tmp/visit-sabunike-twin';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || undefined,
  env: { ...process.env, ...(process.env.BROWSER_LIBRARY_PATH ? { LD_LIBRARY_PATH: process.env.BROWSER_LIBRARY_PATH } : {}) },
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const errors = [];
async function open(path, width = 1280) {
  const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  page.on('console', m => { if (m.type() === 'error' && /THREE|shader|viewer failed/i.test(m.text())) errors.push(m.text()); });
  await page.goto(new URL(path, base).href);
  return page;
}
try {
  for (const width of [1280, 390]) {
    const page = await open('twin.html', width);
    await page.waitForFunction(() => window.napros?.renderer.info.render.calls > 0);
    assert.equal(await page.locator('#graphics-error').isVisible(), false);
    // All building vertices must fit horizontally in the initial perspective.
    assert.equal(await page.evaluate(() => {
      let fits = true;
      window.napros.model.root.traverse(mesh => {
        const positions = mesh.geometry?.attributes.position;
        if (!positions) return;
        for (let i = 0; i < positions.count; i++) {
          const p = mesh.position.clone().fromBufferAttribute(positions, i);
          mesh.localToWorld(p).project(window.napros.camera);
          if (Math.abs(p.x) > 1) fits = false;
        }
      });
      return fits;
    }), true);
    await page.screenshot({ path: `${out}/twin-${width}.png`, fullPage: true });
    for (const id of ['app1', 'app2', 'app3', 'app4', 'app5', 'garage']) {
      await page.locator(`[data-unit="${id}"]`).click();
      assert.equal(await page.evaluate(() => window.napros.state.selected), id);
      assert.equal(await page.locator('#selection').isVisible(), true);
    }
    await page.locator('[data-unit="all"]').click();
    await page.locator('#roof').click();
    assert.equal(await page.evaluate(() => window.napros.model.roof.visible), false);
    await page.locator('#furniture').click();
    assert.equal(await page.evaluate(() => window.napros.model.furnishings.every(m => !m.visible)), true);
    await page.locator('#compare').click();
    for (const floor of ['0', '1']) {
      await page.locator(`[data-floor="${floor}"]`).click();
      assert.equal(await page.evaluate(() => window.napros.state.currentFloor), floor);
      await page.waitForFunction(() => window.napros.scene.children.some(m => m.renderOrder === 100 && m.material.map.image?.complete));
    }
    await page.locator('#close-compare').click();
    await page.locator('#sources').click();
    await page.locator('#plan-image').waitFor();
    assert.equal(await page.locator('#plan-image').evaluate(img => img.complete && img.naturalWidth > 0), true);
    for (const link of await page.locator('.source-links a').evaluateAll(els => els.map(a => a.href))) {
      assert.equal((await page.request.get(link)).status(), 200);
    }
    await page.locator('[data-tab="photos"]').click();
    assert.equal(await page.locator('.photo-grid a').count(), 16);
    for (const link of await page.locator('.photo-grid a').evaluateAll(els => els.map(a => a.href))) {
      assert.equal((await page.request.get(link)).status(), 200);
    }
    await page.locator('#close-library').click();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.close();
    console.log(`Twin ${width}px: rendered; selection, layers, both plan overlays and sources passed`);
  }
  const page = await open('?audience=general&lang=en&hero=villa3d');
  await page.locator('.vv-hero.is-ready:not(.vv-failed)').waitFor({ timeout: 30000 });
  await page.locator('#villa').scrollIntoViewIfNeeded();
  await page.locator('#villa .vv-embed.is-ready:not(.vv-failed)').waitFor({ timeout: 30000 });
  for (const id of ['apt1', 'apt2', 'apt3', 'apt4']) {
    await page.locator(`#villa .villa-pick[data-pick="${id}"]`).click();
    assert.equal(await page.locator(`#villa .villa-pick[data-pick="${id}"]`).getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('#villa .vv-label.is-selected').count(), 1);
  }
  await page.locator('#villa .vv [data-floor="ground"]').click();
  assert.equal(await page.locator('#villa .vv-roof').isDisabled(), true);
  await page.locator('#villa .vv [data-floor="all"]').click();
  await page.locator('#villa .vv-reset').click();
  await page.locator('#villa').screenshot({ path: `${out}/embedded.png` });
  // Exercise public API and renderer reuse after disposal using the loaded chunk.
  const viewerURL = await page.evaluate(() => performance.getEntriesByType('resource').find(r => /\/assets\/viewer-.*\.js/.test(r.name)).name);
  await page.evaluate(async url => {
    const module = await import(url);
    const create = Object.values(module).find(v => typeof v === 'function');
    const host = document.createElement('div');
    host.style.cssText = 'position:relative;width:600px;height:400px';document.body.append(host);
    for (let i = 0; i < 2; i++) {
      const viewer = await create(host);
      if (!viewer.ok) throw new Error('API viewer failed');
      viewer.select('apt3');viewer.setFloor('upper');viewer.setRoof(false);viewer.resetView();viewer.dispose();
      if (host.childElementCount) throw new Error('Disposed viewer left DOM behind');
    }
    host.remove();
  }, viewerURL);
  await page.close();
  console.log('Embedded and hero: rendering, four apartment mappings, floors and disposal/reuse passed');
  const fallback = await open('twin.html?nogl');
  await fallback.locator('#graphics-error').waitFor();
  await fallback.locator('#sources').click();
  await fallback.locator('#library[open]').waitFor();
  await fallback.close();
  const embedFallback = await open('?audience=general&nogl');
  await embedFallback.locator('#villa').scrollIntoViewIfNeeded();
  await embedFallback.locator('#villa .vv-failed.is-ready').waitFor();
  assert.equal(await embedFallback.locator('#villa .vv-fallback img').evaluate(img => img.complete && img.naturalWidth > 0), true);
  await embedFallback.close();
  assert.deepEqual(errors, []);
  console.log(`Fallbacks passed. Screenshots: ${out}`);
} finally {
  await browser.close();
}
