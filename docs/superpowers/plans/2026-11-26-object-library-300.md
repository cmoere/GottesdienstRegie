# Object Library and Color Selection Plan

**Spec:** ../specs/2026-11-26-object-library-300.md
**Execution:** Inline in the current worktree. No coding delegation.

- [x] Add failing catalog, spatial geometry, paint and picker/library interaction tests.
- [x] Add deterministic expanded 2D and projected spatial geometry modules, exactly 300 catalog entries and canonical DE/EN labels.
- [x] Share SVG paint/layers between object previews and actual outputs; expose depth/projection and preserve old geometry.
- [x] Add persistent color palette state and shared color popover with validation, gradients, opacity, supported pipette and restoration.
- [x] Upgrade library browsing with category/dimension/favorites/recent/size controls and keyboard handling.
- [x] Refresh label resources/inventory, verify catalog counts, browser geometry, interactions and layouts, then unit suite and build.

Review focus: transparent frame centers across widths; finite bounded projected geometry at depth/angle extremes; unique IDs and meaningful paths; no gradients with shared SVG IDs; cancel preserves old styling; disabled selection/focus behavior; 300 previews remain static; existing saved slides and author-defined colors remain stable. Initial scope was implementation; the user explicitly requested publication on 2026-11-27, so the prepared normal update is 0.99.20.

## Decisions and checks so far
- Spatial objects are projected SVG layers. They preserve proportions within their resizable element box; projection direction and depth remain primitive document properties.
- All 300 canonical paths are distinct. Existing unsupported legacy direction/symbol previews now use real vector paths; supported legacy CSS geometry remains unchanged for ordinary filled shapes.
- Local palette/library favorites and recent selections are stored separately from the presentation. No Firebase initialization, network assets or new runtime dependency.
- Browser checks: 300 previews, finite bounded paths, 60 spatial filter results, favorite selection, actual output paint changes, gradients, opacity, RGB focus retention, cancel and mobile bounds passed. Observed library opening time: 363–441 ms in the test browser, not a venue hardware guarantee.
- Focused unit checks passed, including gradient-ID isolation, bounded spatial inputs, native-pipette user initiation and preservation of imported CSS colors on cancel. All31-region resource gate passed; new technical names use standard German in regional variants.

## Release verification
The local full sweep covered 338 files: 1376 checks passed and one obsolete inventory assertion still expected the previous 2D-only search label. The assertion was corrected to the current unified object label. The subsequent focused release run passed all 47 checks, including inventory, documentation coverage, object selection, geometry and color interactions; the latest proportional-rendering and imported-color regressions also passed. Desktop build passed. V72/V75/V83/V84 guards passed, V85 passed 39 checks and V86 passed 145 checks. Browser verification passed 300 object previews, 80 frame-width cases and 360 projected-solid configurations, plus paint, favorites, keyboard and narrow-window behavior. Whitespace check passed with Windows line-ending policy.

Normal-release metadata, DE/EN notes, all regional release records and RSS are prepared for 0.99.20 dated 2026-11-27. The publication workflow must run the entire fresh suite successfully before making the cross-platform release public.
