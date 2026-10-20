# v84 Regional Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking. The user's preserved execution preference is native implementation, not delegated implementation.

**Goal:** Provide complete offline operator-interface localization for the approved first15 German regional variants, including help and historical in-app release notes. The user approved this first-release subset on2026-10-20; the long-term31-ID catalog remains stable, with16deferred variants hidden.

**Architecture:** Keep the existing base-language preference and introduce a separate validated regional preference. Resolve app-owned strings through shared data-only catalogs usable by React and Electron. Load large regional documentation packs on demand; do not transform user or output content.

**Tech Stack:** TypeScript, React, Zustand persistence, Electron IPC, Vite, Vitest and existing native/Playwright smoke tests; no new runtime service.

**Spec:** `docs/superpowers/specs/2026-10-15-v84-regional-interface-design.md`

## Global Constraints

- Exactly15 released regional variants plus Hochdeutsch, using the explicit approved IDs in the amended spec. Preserve the31-ID development catalog, but exclude16deferred IDs from selection, stored/native selection and publication checks.
- Default and invalid stored values resolve to Hochdeutsch; date/number locale stays de-DE.
- No changes to Firebase records, user text, Bible/song content, announcements or public outputs.
- TESTBETRIEB remains the literal system output watermark.
- Offline packaged resources; no network translation, speech runtime or added model download.
- Preserve existing language codes, saved display assignments, audio routes and live position.
- Missing resources in the agreed corpus block release; runtime fallback is defensive only.
- No claim of native-speaker verification without actual evidence.
- Preserve unrelated `tests/smoke/startup-diagnostic.cjs` and existing ignored probe artifacts.

## Review Focus

1. Rapid language changes with delayed pack reads must never show a previously requested dialect (Task 4).
2. Migrated preferences containing malformed regional IDs must not break existing startup/display/audio settings (Task 2).
3. Error strings and interpolation values can contain URLs/IDs/user input; only app-owned templates are regionalized (Tasks 3 and 5).
4. Historical release titles may share names but differ by version; stable version-and-section keys prevent text being attached to the wrong build (Task 4).
5. A modal or output window must not gain authority to change localization through unrestricted IPC (Task 5).

## File and ownership map

### Approved first-release adjustment (2026-10-20)

Before enabling or publishing: demonstrate RED→GREEN that the selector accepts
only the exact ordered15-ID manifest, hides all16deferred options, and rejects or
safely normalizes deferred IDs in renderer/native stored selections. Scope both
documentation and interface coverage tooling to these same15IDs without bypassing
inventory completeness, source freshness, missing text or placeholder checks.
Keep readinessfalse and package0.83.0 until every15-pack/UI/final release gate
passes. Complete both Hessian histories and the pending app-owned UI inventory.
All earlier31-count tasks below are interpreted against this approved release
subset where they concern selectable/release-ready variants; registry stability
and existing17base languages remain unchanged. Existing translation-only delegation
authorization remains; program changes/tests/releases are performed by root.

- `shared/regional/catalog.ts`: data-only ID/name registry, German base keys and typed catalog interfaces; importable by both build targets.
- `shared/regional/packs/<id>.json`: complete short UI/native-dialog resources per registered variant.
- `src/regional/resources.ts`: renderer resolver, pack state and bounded cache.
- `src/regional/inventory.json`: app-owned text inventory, canonical text, stable keys, origin files and resource class.
- `scripts/check-regional-resources.cjs`: full coverage, placeholder and format validator.
- `src/regional/docs/<id>.json`: complete help and release-history regional resources.
- `src/preferences.ts`, `src/i18n.ts`, `src/App.tsx`: preference, translation and UI integration.
- `src/help/index.ts`, `src/updateReleaseSummary.ts`: documentation integration without rewriting source objects.
- `electron/regionalSettings.ts`, `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`: validated native locale synchronization.
- Existing components containing app-owned fixed strings: migrate only inventoried text sites; no unrelated refactoring.

### Task 1: Inventory and validated catalog contract

**Interfaces:** `GermanRegionId` derives from `regionalVariants`; `RegionalSelection = { language:string; germanRegion:GermanRegionId|null }`. `RegionalPack = { id:GermanRegionId; ui:Record<string,string>; native:Record<string,string> }`. Canonical inventory owns the expected key sets.

- [ ] Identify all app-owned visible literals in renderer, Electron, help, releases and startup/tray/update surfaces; record stable keys in `src/regional/inventory.json`. Classify dynamic user/output text as excluded rather than rewriting it. Include source locations and an exact-text allowlist for stable technical tokens.
- [ ] Add `src/regional/catalog.test.ts` asserting registry length 31, unique stable ASCII IDs, the exact approved name list, Bielefeld last and no Hochdeutsch entry counted among the 31.
- [ ] Run `npx vitest run src/regional/catalog.test.ts`; confirm it fails before registry implementation.
- [ ] Implement `shared/regional/catalog.ts`; keep it data-only and free of React, DOM, Node and preferences imports so both compiler targets can consume it.
- [ ] Rerun the focused test; require PASS. Commit only this task's files with `feat: define regional interface catalog and text inventory`.

### Task 2: Persisted selection and safe base-language behavior

**Consumes:** Task 1 IDs. **Produces:** `normalizeGermanRegion(value:unknown):GermanRegionId|null`, preference `germanRegion`, action `setGermanRegion(value:GermanRegionId|null):void`.

- [ ] Add `src/regional/preferences.test.ts` covering all 31 IDs, null/unknown/non-string inputs, an existing v63 snapshot and preservation of display/audio-related fields; assert that selecting English leaves its translations unaffected by a stored German region.
- [ ] Run the focused test and confirm RED.
- [ ] Add the preference/action and extend migration/merge validation in `src/preferences.ts`. Keep base `Language` union unchanged; do not overwrite saved unrelated keys or autodetect a dialect from location.
- [ ] Rerun focused preference and existing preference tests, require PASS, then commit `feat: persist validated German regional selection`.

### Task 3: Complete operator text packs and resolver

**Consumes:** Task 1 inventory and Task 2 preference. **Produces:** `resolveRegionalText(selection:RegionalSelection,key:string,values?:Record<string,string|number>):string`, with base-language behavior preserved for non-German selection.

- [ ] Add `src/regional/resources.test.ts` for exact selected templates, literal interpolation values containing URLs/IDs, repeated placeholders, invalid IDs, missing-key defensive German fallback and non-German passthrough.
- [ ] Run focused test to RED.
- [ ] Author all 31 `shared/regional/packs/<id>.json` resources against every inventoried short UI/native key. Preserve template meaning, access warnings, legal/security distinctions and technical facts. Avoid automated substring replacement or representing identical copied packs as completed dialect translations.
- [ ] Implement the resolver and integrate `src/i18n.ts`. Migrate inventoried visible literals in UI components to stable keys, including update categories/statuses, login/errors, preflight, controls and tray/startup-facing text where owned by the app.
- [ ] Add `scripts/check-regional-resources.cjs` and tests asserting exact key coverage for all registered packs, nonempty values, equal placeholder multisets and compatible allowed markup/links.
- [ ] Run focused tests and the validator, require PASS, then commit `feat: localize operator interface in 31 regional variants`.

### Task 4: Full help and historical update/release text

**Consumes:** Registry and resolver. **Produces:** `loadRegionalDocumentation(id:GermanRegionId):Promise<RegionalDocumentation>`, where `RegionalDocumentation = { help:Record<string,{title:string;body:string}>; helpUI:Record<string,string>; releases:Record<string,Record<string,string>> }`. Release keys use version + stable section/item identity, never title alone.

- [ ] Add `src/regional/documentation.test.ts` asserting every stable help article and every historical release text field has an entry for each of 31 variants; preserve article links, screenshot references and release version/date/build facts.
- [ ] Add an asynchronous race test: select region A, then B, resolve B then A; visible state must remain B. Add repeated-read/source-immutability tests.
- [ ] Run focused tests to RED.
- [ ] Author all 31 complete documentation packs from assembled current German help and the entire current release inventory. Do not include retired legacy guidance that existing help intentionally excludes.
- [ ] Implement dynamic imports with a cache by region and a request-generation guard. Integrate help lookup, release views and updater summaries. Do not mutate `translated`, `helpWest` or `public/releases.json` objects during assembly.
- [ ] Translate app-authored updater fallback templates. Remote release content without a matching packaged version remains explicitly source text until a matching resource is shipped; never fabricate regional historical facts or silently call an online translator.
- [ ] Extend coverage validator to assembled help and release histories; run focused tests plus `src/help/catalog.test.ts` and `src/updateReleaseSummary.test.ts`, require PASS, then commit `feat: provide complete regional help and release history`.

### Task 5: Native dialogs and startup/update language consistency

**Consumes:** Data-only catalogs and validated selection. **Produces:** IPC `regional:selection-set` accepting `RegionalSelection`, called only from the trusted control main frame; persisted validated native locale snapshot available before startup dialogs.

- [ ] Add `electron/regionalSettings.test.ts` asserting rejection from output windows/subframes, rejection of malformed IDs/foreign object fields, safe startup default, correct regional native dialog templates and unchanged user/technical interpolation data.
- [ ] Run focused tests to RED.
- [ ] Implement `electron/regionalSettings.ts`; expose a narrow bridge in preload/types. Reuse existing trusted sender checks and settings persistence conventions. The UI remains preference owner; main stores only its validated localization snapshot for startup/native UI.
- [ ] Migrate inventoried main-process confirmation/error/update/tray strings to shared templates. Leave OS-owned file/device picker chrome and third-party pages alone; app-provided picker titles/filter labels are in scope.
- [ ] Run native locale tests and existing update-prompt tests; require PASS. Commit `feat: synchronize regional text with native dialogs`.

### Task 6: Selection UI, documentation and live-safety checks

**Consumes:** Tasks 2–5. **Produces:** German-only regional selector under Settings → General → Language; no separate output-language change.

- [ ] Add `src/regional/RegionalSelector.test.tsx`: 31 variants plus Hochdeutsch, meaningful labels, switching without remounting output/audio, persistence and non-German behavior.
- [ ] Run focused tests to RED.
- [ ] Implement `src/regional/RegionalSelector.tsx` and mount it in the existing language settings flow. Mark the resource language on operator containers where appropriate without changing output documents or spelling dictionaries to invented language tags.
- [ ] Add an integration test selecting all variants while a fake live position/audio route remain unchanged; assert exact TESTBETRIEB watermark and fixture Bible/event/announcement texts are unchanged.
- [ ] Add `docs/v84-regional-interface.md` describing scope, selection, authentic-region limitations, source-content exclusions and how to restore Hochdeutsch. Validate German/English docs are factually consistent.
- [ ] Run focused tests and full coverage validator; commit `feat: expose regional interface selection without changing outputs`.

### Task 7: Whole-feature validation and release readiness

- [ ] Run `npm run verify:release`, `npm run build`, `npm run test:web` and `git diff --check`; record actual commands/outcomes in `docs/superpowers/evidence/2026-10-15-v84-regional-interface.md`.
- [ ] Add/run `tests/smoke/v84-regional-interface.cjs` against compiled Electron using an isolated profile. Check actual preload IPC, persisted selection after reopen, native dialog templates and trusted-frame rejection without touching the user's real settings/Firebase.
- [ ] Capture and inspect settings, long help article, old/new release notes and update prompt at desktop and narrow operator sizes; verify no clipped labels or overflowing dialogs for all 31 selections using layout assertions and representative visual checks.
- [ ] Confirm region selection does not reset MAIN assignment, interrupt audio, restart outputs, change linkedEventKey or modify Firebase data. Check large docs are not all bundled into the initial operator chunk.
- [ ] Obtain one fresh whole-branch review under the applicable review skill; implement findings with failing regression tests first. Do not delegate implementation on the user's old translation-agent approval.
- [ ] Do not mark full localization ready if coverage checks or linguistic-content review reveal missing/misleading translations. Report remaining gaps instead of publishing a renamed partial feature.

### Task 8: v84 publication after all gates pass

- [ ] Update package/lock to 0.84.0 and releaseSeries 0.84, add accurate changelog/release notes and regional resources for the new release itself; keep all historical records and build metadata intact.
- [ ] Extend release metadata/coverage guards and workflow steps for v84; rerun complete release checks/build after version changes.
- [ ] Commit the verified implementation and metadata, push via the established release workflow without resetting the user's main checkout or unrelated work.
- [ ] Wait for all platform and Pages jobs to succeed; verify stable release targets the source commit and updater manifests advertise 0.84.0.
- [ ] Download the public Windows installer without executing it; compare full size and SHA512 against latest.yml, and SHA256 against available release digest. Record results and provide the verified installer link only after publication succeeds.

## Plan self-review

The tasks cover all approved resource surfaces and retain separate base-language,
regional UI and output-content boundaries. No existing audio/TTS subsystem is
activated. Complete historical coverage is a gate, not a best-effort fallback.
Resource authorship and linguistic verification are substantial work: registry and
dropdown completion alone do not satisfy this plan. Native execution preference is
preserved. Implementation awaits the user's review of this written plan.
