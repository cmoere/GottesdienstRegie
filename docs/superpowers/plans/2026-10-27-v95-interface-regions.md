# v95: Bedienoberfläche und 31 Regionalvarianten

> Implementation: root uses executing-plans; only translation work is delegated, as explicitly requested by the user.

**Goal:** Complete and enable all 31 catalogued regional interfaces, and apply a consistent HIG-inspired operator design while preserving visitor slides.

**Architecture:** Keep React/Electron, existing controllers, live state and output rendering. Use a shared, explicitly scoped operator design layer and semantic shell grid areas. Complete actual authored resources before changing availability; a key-only count or copied fallback does not establish translation completeness.

**Tech stack:** React 19, TypeScript, Electron 45, CSS, Vitest, native Electron smoke fixtures.

## Approved scope / design

User confirmed all 31 variants and the entire operator interface; existing MAIN slide designs remain unchanged. Retain Cera Pro and #699f3e / #608f9a / #b6bec3. Apply clear hierarchy, grouped controls, comfortable spacing, consistent sidebars/inspectors, light/dark appearance and keyboard focus. Preserve Windows conventions, output/audio controls, emergency actions, test watermark and selected/live independence. No SwiftUI rewrite, simulated macOS window controls or unrequested Liquid Glass.

References: [Apple layout](https://developer.apple.com/design/human-interface-guidelines/layout), [sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars). Their hierarchy/adaptability principles are adapted to the existing Windows application.

## Review focus

- Conditional format toolbar must never collapse the workspace or enlarge the timeline.
- CSS must not restyle slide trees, embedded websites, output windows or test overlays.
- Longer regional strings and narrow windows must retain access to live and dialog actions.
- Native dialogs, hardcoded operator strings, help and historical version notes count toward completeness.
- Existing translations must remain intact; neither machine substitutions nor German fallback count as completed regional content.

## Task 1 — Resource audit and translations

- [x] Audit all 31 packs: 15 have 399 UI/34 native keys and documentation; 16 have 209 UI/33 native keys and no documentation.
- [x] Assign disjoint, translation-only missing-interface/help batches.
- [ ] Classify actual source prose in the current review-required inventory; migrate authored operator text into resources.
- [ ] Complete all 31 UI/native/help/release packages with placeholders and markup preserved.
- [ ] Validate exact coverage, freshness, runtime selection and missing-content rejection before enabling all 31.

## Task 2 — Operator design foundation and shell

Files: `src/operator-design.css`, `src/main.tsx`, shell in `src/App.tsx`; native visual checks in `scripts/test-operator-design.cjs` and owned smoke fixture.

- [x] Reproduce the layout failure for missing format toolbar, and verify visitor isolation.
- [x] Replace positional shell row coupling with named areas; support edit/preview/original/protected-system selections.
- [x] Introduce scoped spacing, surfaces, controls, navigation, typography, focus and reduced-motion rules.
- [x] Verify native rendered light/dark layouts at 1000/1440/1920 widths and unchanged slide styles.

## Task 3 — Surface integration

- [ ] Apply/review settings, media browser, help, libraries, dialogs, inspectors, timeline and remote/personal-monitor controls.
- [ ] Remove contradictory legacy visual rules in touched areas; avoid broad selectors affecting output content.
- [ ] Verify keyboard operation, labels, long strings, scrolling and modal action availability.

## Task 4 — Completion and release

- [ ] Full unit/type/build/regional strict checks; real native PowerPoint/output smoke regression.
- [ ] Update version/notes/help screenshots only for implemented and verified behavior.
- [ ] Publish normal update only after all requested completeness gates pass; verify public installer/update metadata.

Initial baseline: 0.94.0 / fc99333, inventory 6977 entries, 4127 require review. Foreign untracked startup diagnostic is excluded from all edits/staging.

## Progress, 28 October (still unpublished)

- All 31 interface packs have 1096 UI and 34 native entries. This is resource coverage, not a claim that every remaining literal in the operator source has been migrated.
- All 31 runtime documentation packages are present: 63 help articles, four help controls and 1610 historical release fields each. Moselle/Trier is integrated; conspicuous North Hessian register differences were corrected after sample review.
- Explicit resource bindings now include the media browser, primary workspace, file dialogs, Bible dialog, audio routing, remote settings, notes and selected designer controls. User content and option values remain separate from translated labels.
- Fresh regional/selection/dialog verification: 29 files / 177 tests pass. Shell fixture covers 48 combinations; the actual App fixture covers both themes at three widths plus settings/help/media, and all 31 regional settings surfaces at 1000px. Latest fixture: `work/v95-operator-surfaces-CLEQoL/report.json` and `regional-surfaces.json`.
- Native visual review found the mobile navigation overlapping the modal at narrow widths. Reproduced with actual hit testing, then corrected its stacking layer; the six core and all 31 regional surface cases pass after the fix. PowerPoint original native regression also passed (`work/full-app-powerpoint-SOZ7CD/report.json`).
- Source inventory still has thousands of candidates requiring classification or migration. Availability remains the historical 0.94 partial manifest. No v95 version bump or publication is authorized until the full gate passes.
- Latest full unit run passes: 273 files / 1172 tests (`work/v95-unit-latest.log`). The strict release audit still rejects publication because source review is incomplete, independently of passing unit tests.

## Progress, 29 October (still unpublished)

- All 31 packs now contain 1784 UI and 55 native entries. Translation-only workers completed settings, core conditional captions, loop/clock/weather/OSB/announcement controls, design descriptors, menus/shortcuts, native menus/dialogs and interpolated operator prompts. Existing committed translations remain unchanged.
- Dynamic labels are separate from persisted values. Design/animation/style/route IDs, category values and user document content remain unchanged. The operator resolver performs one interpolation pass; unknown text is not a completion certificate.
- Native context menus, media/history window titles, background update notification, screen-test export and import-summary captions use the central native text snapshot.
- Diagnoses reported a fixed 0.9.0. A native menu-action regression reproduced this and now verifies the actual installed version, including after regional settings checks (`work/v95-diagnostic-version-red-final.log`, `work/v95-diagnostic-version-green.log`). Backup success is shown only when a destination was actually returned.
- The archive-export test legitimately launches two complete source-export child processes. Under full-suite load it exceeded the generic five-second test limit, despite passing alone. Each child now has a hard ten-second deadline and the enclosing test has a 25-second budget; content/idempotence assertions remain intact. The full suite passes 273 files / 1172 tests (`work/v95-unit-29-bounded-export.log`).
- Ruling: canonical speech preparation remains outside regional UI copy, as explicitly requested by the user. Visitor weather/football/slide content, Bible-edition identity data and the existing versioned terms document also remain unchanged; their operator controls are localized separately. Exact reviewed-file hashes revoke these classifications if their implementation changes.
- Inventory checkpoint: 8376 entries, 1618 still require classification or migration. The availability manifest remains the historical 0.94 partial manifest; package/version/release publication has not changed. Continue actual source work; do not waive the full-completion gate.
- Latest complete checkpoint exits 0 for unit/build/native-surface/native-original-PowerPoint verification (`work/v95-checkpoint-*.log`); strict regional release audit exits 1 with 1620 outstanding issues (`work/v95-checkpoint-readiness.json`). This is a verified working milestone, not a completed or released v95.

### Utility/guidance/feedback milestone

- Added 205 authored fields to every regional pack: **1989 UI / 55 native**. Root readback validates all 31 packages with zero schema issues and zero changes to committed translation values. Translation workers edited only their assigned packs.
- Explicit operator bindings now include screen-test dialogs/results, language picker accessibility, reward/profile controls, the introduction tour, shape/media/transition labels, built-in template captions, history filter labels and feedback/cloud-error messages. Raw template/shape defaults, filter IDs, custom templates and public content remain unchanged.
- Screen-test regional switching is exercised while MAIN is running: no restart, unchanged run ID and exact previous-output restoration. Full verification exits 0: **273 files / 1173 tests**, build and six native cases plus 31 regional surfaces (`work/v95-utility-guidance-*.log`, native artifacts `work/v95-operator-surfaces-TuBQlg/`).
- Inventory: **8618 entries / 1310 awaiting review**. Strict release audit still exits 1 with 1312 issues (`work/v95-utility-guidance-readiness.json`). Continue source migration/classification, then current help/release source and its 31 regional versions. Do not enable the complete manifest or publish a partial v95.
