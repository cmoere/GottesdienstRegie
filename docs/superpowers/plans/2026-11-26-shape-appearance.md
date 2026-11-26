# Shape Appearance Follow-up Plan

**Goal:** Extend the approved object work with editable frame width, no-fill mode, reliable polygon outlines and twelve more objects.
**Spec:** ../specs/2026-11-26-shapes-design.md (follow-up).
**Architecture:** Keep saved styling in element properties. Add frameGeometry.ts for bounded even-odd frame paths; shapeGeometry selects original or edited geometry. Reuse the current toolbar, translations and SlideRenderer in all outputs.

- [x] Read existing controls and renderer; identify fixed-width frame paths and clipped rectangular polygon borders.
- [x] Add failing appearance-control and renderer tests, then implement width and fill properties and real polygon outlines.
- [x] Extend catalog and labels by twelve items, retaining all existing stable IDs.
- [x] Verify transparent centers at widths 1, 12 and 24 for all ten frame types, plus gallery selection and consistent gallery/output paths.
- [x] Run relevant regression tests, full build and regional resource gate; inspect screenshots and final diff.

Review focus: preserve chosen color when fill toggles; keep outlines visible without fill; invalid widths remain finite and bounded; old frame paths remain unchanged until edited; no presentation/output side effects from operator labels. New standard geometric terminology uses standard German in regional variants, matching the preceding task's approach.

## Results
Seven appearance regressions verified (missing controls/geometry and polygon-outline regression observed before fixes). Full suite: 336 files / 1370 tests passed. Desktop TypeScript/Vite/runtime build passed (existing large-chunk advisory remains). All-31-region publication resource gate passed. Browser check passed for all 32 added objects and all 10 adjustable frames at widths 1/12/24, including transparent centers and changed band thickness; screenshots in light/dark inspected. Whitespace check passed with the repository's Windows line-ending policy. No version bump or publication performed.

Polygon fill-only rendering remains on the existing CSS path; an outlined or unfilled polygon uses the same coordinates as real SVG geometry. SVG outlines can extend to their full width; the overall slide still clips at its own edge. Unknown kinds do not resolve inherited object properties as polygon definitions.
