# Apartments Napros: interface audit and polish

Reviewed 3 November 2026. Applied to the existing Vite site and its shared section styles.

## Assessment

Light slop: polish the existing identity. The site already has real photographs, a flat house-and-wave logo, a distinctive Fraunces/Inter pairing, specific local information, and working booking, map, and seasonal tools. Preserve those assets, all features, and the order of sections.

## Direction

- **Product:** Apartments Napros helps guests plan a stay near Sabunike’s sandy beaches and inquire directly with the owners.
- **Character:** Unhurried, local, welcoming.
- **World:** Pale coastal stone, shaded terraces, Adriatic blue.
- **Moments:** The existing photographs of the coast and apartments; detailed maps and seasonal information where they help planning.
- **Signature:** The existing flat house-and-wave mark, supported by small horizontal rules.

## Audit findings and treatment

| Finding | Location | Treatment |
| --- | --- | --- |
| Long hero headline competes with the photograph | `src/content/audiences.js`, general audience | Shortened in all five languages; detailed beach information remains below |
| Oversized first screen delays the following content | `src/sections/hero.css`, `.hero-overlay`, `.hero-inner` | Reduced desktop height cap from 920 to 800px and centered the composition |
| Wide uppercase tracking adds noise | `.eyebrow`, `.hero-kicker`, section metadata across `src/sections/*.css` | Sentence case and normal tracking |
| Heavy type competes with content | Shared headings and section labels | Default headings use weight 500; reduced 700-weight section labels to 500 |
| Too many filled pills | Shared buttons, navigation and month chips | Shared control radius changes from 999 to 8px |
| Raised-card treatment repeats across sections | Theme shadows and highlight tiles | Flat default cards; restrained neutral shadow for floating surfaces |
| Multiple decorative accent colors compete | Default Adriatic tokens in `src/styles/themes.css` | Blue becomes the shared action/label accent; semantic and map colors retain their meanings |
| Colored surfaces compete with photographs | Default `--surface-3` | Subdued pale neutral |
| Glass effects add visual clutter | Header, month picker, sticky inquiry bar, secondary hero action | Solid surfaces or a plain outlined action |
| Oversized colored icon containers feel generic | Highlights and direct-booking benefits | Small unboxed icons in secondary ink |
| Inconsistent icon scale and stroke | `src/lib/util.js`, shared `.icon` | Shared 18px boxes with 1.5 stroke; existing icon vocabulary retained |
| Uneven spacing in related components | Hero, highlights, inquiry groups, calculator, shared controls | Regularized affected padding and gaps to 4px steps |
| Continuous camera zoom distracts | Hero slideshow | Removed zoom; kept photo changes and the working pause control |
| Hover lift and image zoom create unnecessary movement | Highlights, apartment photos, beach photos | Border/color or opacity feedback |
| Animated width can cause repeated layout work | Direct-price comparison bars | Removed width transition; values still update |
| Colored flashing halo attracts too much attention | Inquiry form `.is-flash` | Quiet border-color highlight |
| House preview precedes explanatory content on phones | Optional 3D hero | Copy/actions now precede the preview |

No decorative emoji, gradient wordmark, fabricated testimonials, or generic generated hero art were found. Real property and coastline photographs remain the appropriate visual material. No image generation or image prompt was needed.

## Pass notes

1. **Spacing:** Updated shared paragraph/heading margins, control padding, hero groups, highlight padding, inquiry groups and calculator spacing. Existing responsive layouts remain.
2. **Color:** Kept warm backgrounds and Adriatic blue, quieted the supporting surface, unified the secondary accent, removed repeated shadows and glass effects.
3. **Icons:** Reused the existing line set. Standardized shared icon dimensions/stroke and removed colored discs from highlights and booking benefits.
4. **Copy:** Shortened the general hero title in English, German, Slovenian, Croatian and Italian. Kept audience-specific copy and factual content.
5. **Type:** Kept Fraunces and Inter, loaded the actual 500 serif weight, reduced heavy labels, and removed wide uppercase treatments from section UI.
6. **Layout:** Preserved section order and the photographic hero. Reduced the hero height cap and improved mobile reading order for the optional house preview.
7. **Details:** Used 8px control corners and 16px default panels. Preserved visible keyboard focus and ensured the mobile menu has a 44px minimum width.
8. **Visuals:** Kept real photography, maps and apartment previews. Highlight information now sits beneath quiet rules rather than inside repeated raised cards.
9. **Motion:** Removed camera zoom, card lift, gallery image scaling and the inquiry halo. Functional photo switching, pause, menus and loading feedback remain.

## Validation and limits

- `npm test`: all four existing test files pass.
- `npm run build`: production build passes.
- `git diff --check`: passes.
- Rendered comparison at 1440 × 1000 and 390 × 844; neither viewport had horizontal page overflow.
- Mobile menu opens and closes with Escape; month selection updates the URL; the hero inquiry action reaches the form.
- September selection propagates to the inquiry’s preferred-month control.
- All five language routes render translated hero copy. General, family, cycling and retreat routes retain their hero and inquiry form without horizontal overflow at the checked desktop width.
- Footer accessibility scan: 0 violations, 0 incomplete checks, 14 passes when the footer is rendered in view.
- The initial full-page accessibility scan reported one footer contrast finding and incomplete checks for offscreen content and the development-only Versions control. The footer finding did not reproduce in the scoped check. This is not a claim of whole-site WCAG conformance.
- No inquiry was sent and no changes were deployed or pushed.

Existing owner-confirmation markers appear only during development. The direct-booking calculator remains illustrative, and its discount is gated by the existing confirmation flag. This polish does not verify property policies, availability, prices or external travel information.

Optional theme experiments retain their identities; shared styles receive the polish, but this is not a new design for each experiment. Existing climate/map visual encodings, photo readability scrims, and useful loading states remain. This was a targeted pass, not a claim that every legacy spacing value or experimental theme meets every unslop token.

## Credit

Audit workflow adapted from **unslop** by [Damir Sokolovsky (@heydamir)](https://heydamir.design/unslop), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
