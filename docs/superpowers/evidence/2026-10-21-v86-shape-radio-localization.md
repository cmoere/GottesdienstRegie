# v86 continuation: shape gallery and radio-browser operator localization

## Scope and boundaries

Continuation of Tasks 1/3/6 of the approved regional-interface plan, not a new
release or a claim that all operator surfaces are translated. Root implements
and reviews; the previously authorized three translation workers authored only
their assigned JSON packs. The existing linked worktree is reused; unrelated
`tests/smoke/startup-diagnostic.cjs` stays unedited and unstaged.

- 43 canonical operator labels cover the production workspace's shape gallery,
  all 35 known shapes, category labels, search, and artwork accessibility.
- 15 canonical operator labels cover radio search/clear/add/pagination and
  loading/error/preview feedback. Stored errors retain a kind plus untouched
  detail rather than a pretranslated sentence, so changing language also updates
  an existing empty/error state or pending search.
- All 58 keys have DE/EN templates and authored values in each of the 15 approved
  regional packs: **870 additions**. Root independently compared every pack with
  HEAD, verified the exact added key set, and confirmed all earlier fields/IDs
  are unchanged. Other base languages use the existing defensive English
  fallback for these new keys; no new complete-language claim is made for them.
- Gallery search accepts both the current operator labels and original German
  aliases. Selecting a shape passes the original kind/name to storage; changing
  language never renames existing document elements or changes SVG paths.
- Radio station names, stream URLs, country/language/codec/bitrate and saved
  media metadata remain intact. No audio-routing, radio playback engine,
  Firebase, ON AIR or visitor-content behavior was changed.

## Inventory review

The full six-line `shapeCatalog.ts` was manually reviewed. It now supplies only
canonical document metadata, stable aliases and geometry to the localized
consumer; its exact LF-normalized source hash guards that classification.
All actual operator labels remain independently inventoried as app-owned keys.
The legacy canvas-editor shape palette in App.tsx is still pending its own
migration; this increment does not claim every shape-related UI is complete.

Seven additional entry-specific reviews distinguish keyboard `Enter`, hidden
Material Symbols glyphs, the invariant bitrate unit, canonical saved format
fallback and search-only interpolation from operator prose. No mixed UI file
was blanket-excluded. Tests retain hash/text-change revocation and require the
new canonical shape/radio resources to stay in the app-owned inventory.

Fresh inventory: 6,078 entries, 3,496 still requiring classification,
`complete:false` (108 fewer pending entries than the previous checkpoint).
This is not 3,496 confirmed untranslated sentences: the remaining candidates
also contain technical and protected-content entries that require review.
The strict publication check still fails with 3,497 issues including the
incomplete-inventory marker (`work/v86-ui-release-gate.log`). No pinned partial
approval, readiness flag, version or release gate was broadened.

## Verification record

- Behavior-first shape RED: `work/v86-shapes-red.log`: three failures for missing
  translated UI/accessibility; disabled-selection behavior already passed.
  Initial GREEN: `work/v86-shapes-green.log`.
- Radio RED: `work/v86-radio-ui-red.log`: three expected missing-translation
  failures. GREEN and combined regional checks:
  `work/v86-ui-regional-green.log`: 24 files, 111 tests pass.
- New tests verify live language changes, localized search, all arrow/church
  labels, unknown/inherited shape keys, original saved names, unchanged document
  and audio references, paginated results, exact added radio metadata and raw
  error interpolation (including URL/placeholder-like content).
- The pre-existing German radio clear-button test now explicitly selects
  German and restores preferences. Its assertions remain unchanged. It had
  previously relied on hardcoded German UI regardless of the active locale.
- Initial build caught an unsupported Testing Library `exact` option in a new
  test (`work/v86-shapes-build.log`). This was corrected to the API's default
  exact string-name matching, not by suppressing TypeScript errors.
  Desktop build then passed: `work/v86-shape-radio-build.log`, exit 0.
- The native harness uses the real components, local fonts/icons and actual
  Electron text input. It covers 17 selections, requires all 35 shapes, tests
  localized search/canonical selection and radio clear controls, checks layout
  at 900x1100 and preserves in-memory nondefault display/audio sentinels. It never
  searches the network, starts a radio stream or opens an audience output.
- Early native runs exposed fixture assumptions: reusing a filtered gallery
  across scenarios and relying on short fixed waits/implicit keyboard focus
  inside an offscreen window. Scenarios now mount under distinct keys, await
  actual DOM conditions and explicitly focus before native text entry, following
  the existing desktop-interaction test. Assertions and the three-second DOM
  deadline were not relaxed. Failed logs remain in `work/v86-shape-radio-native*`
  and `work/v86-ui-native-final.log`; no failure was counted as a passing run.

- Final full unit suite: `work/v86-ui-full-unit.log`, exit 0: **183 files,
  756 tests pass**, 331.32 seconds, direct Vitest with `--maxWorkers=2`.
- Final native visual run: `work/v86-ui-native-final-visual.log`, exit 0:
  `NATIVE_REGIONAL_UI_PASS 17`, alongside the existing desktop editing and
  live-announcement/reminder/ribbon checks. Representative gallery and radio
  screenshots under `work/regional-shapes-native/` were visually inspected.
  Known source geometry is intentionally unchanged; this does not repair the
  pre-existing artwork implementation for every shape or verify real radio audio.
- JS syntax checks and `git diff --check` pass. Existing development Electron
  CSP notices and production bundle-size warnings are recorded, not suppressed.
- Final Web build/browser smoke: `work/v86-ui-web-smoke.log`, exit 0: five
  Playwright checks pass, including desktop/tablet/phone layout, reactive settings
  localization, preserved audio preferences and the visible partial-coverage
  disclosure. The dynamically-and-statically-imported help-module chunk warning
  remains; no startup-performance improvement is claimed for this increment.

## Author review and open work

Root performed a separate author review, not independent review, in accordance
with the user's restriction to translation-only delegation. Checked mapping
coverage, inherited-key safety, error-state localization, literal station/error
data, source-classification boundaries and the actual production-workspace
consumer. Linguistic authorship is not a claim of native-speaker proofreading.

PowerPoint's original-player latency and audio isolation remain unverified; the
previous Monitor 1 evidence still blocks its capability. No further Office
window, user document or monitor setting was touched in this increment. Overall
regional completion and v86 publication remain open. Package stays 0.85.0; no
installer, tag, push or public release is created.
