# Apartments Napros model integration

Imported from `../threejs/digital-twin-of-a-building`, building
`sabunike-napros`, run `openai-sol-01`: **GPT-6.1 Sol (high)**,
completed 2026-10-27. Input fingerprint:
`2e19e3e73d9bfac7376d10ff79d1c14aad28728560abf3a69289c331780fd83f`.
This is the original named output, before the separate anonymized public export.
`model.js` and `model-data.js` are copied without geometry changes.

`twin.html` uses the original explorer, adapted to the site's paths and return
link, with responsive perspective framing so the building fits on phones. It retains the apartment names, address, floor-specific layouts, garage,
caretaker apartment, furnishings, cutaway and calibrated drawing comparisons.
The existing four rentable apartment cards retain their `apt1`–`apt4` IDs;
the embedded viewer maps these to the model's `app1`–`app4` regions. App 5 and
the garage remain visible building geometry, without becoming booking options.
The embedded viewer rotates the model 180° to match its existing cameras.
Both views import the same model, so future geometry fixes apply to both.

The six source drawing files in `assets/` and two analytical overlays in
`validation/` are byte-for-byte copies. Photos reuse `public/photos/web/`
instead of duplicating the original run's larger images. Photo links open the
site's web-sized copies. Vite bundles drawings, interpretation and overlays
with relative URLs; no neighboring repository is needed at runtime.

## Verification

- `npm test` includes the source run's 11 actual-mesh geometry checks in
  `tests/twin.test.mjs`, alongside the existing site tests.
- `npm run build` builds both pages and their shared model.
- `node scripts/twin-smoke.mjs [baseUrl]` checks the built explorer at desktop
  and mobile widths, selection, floors, layers, source links, drawing overlays,
  embedded and hero rendering, disposal and the graphics fallback.

The integration passes the complete site tests and production build. Browser
checks passed in headless Chromium 153 with SwiftShader at 1280 and 390 px,
including full-building initial framing. Desktop and mobile screenshots were
inspected. Screenshots are saved by the smoke check to
`/tmp/visit-sabunike-twin/`.

## Remaining source limitations

The upper width annotations conflict with the shared ground footprint. A
0.70 m discrepancy remains between the straight stair arrivals on the two
sheets. Heights, roof, stair rises and vertical landing connections are
provisional. Owner areas describe apartments and do not calibrate geometry.
See `plan-interpretation.md` for the original run's detailed evidence record;
its validation section records the upstream run, including its browser limits
and original workspace paths. Integration verification is recorded here and
in the commit description separately from that historical record.
