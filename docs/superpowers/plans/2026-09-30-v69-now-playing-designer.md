# V69 Now Playing Designer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the now-playing dropdown with visual design cards, expose typography/color/visualizer controls, and fix duration, clipping, and idle skipping.

**Architecture:** A typed presentation model owns all persisted options. One renderer consumes the same model for card previews, editor preview and MAIN; a separate audio-level provider supplies real analyser data or a deterministic fallback.

**Tech Stack:** React, TypeScript, CSS, Web Audio API, Vitest/Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-30-v69-firebase-loops-now-playing-design.md`

## Global Constraints

- Keep exactly ten designs and render cards without a dropdown.
- Anzeigedauer is an integer of at least 1 second.
- Ä/Ö/Ü accents must remain visible in every design.
- Real audio drives the visualizer when analysable; blocked radio streams use an active fallback.
- Idle skip is checked during candidate selection and immediately before MAIN.

## Review Focus

- Missing legacy metadata must migrate to current defaults; tests belong to Task 1.
- Invalid colors/casing/visualizer values must normalize safely; tests belong to Task 1.
- Radio analysis may fail after playback starts; fallback switching belongs to Task 3 tests.
- Reduced-motion users must not receive continuous fallback animation; tests belong to Task 3.
- Audio stopping between loop selection and MAIN dispatch must still skip; tests belong to Task 4.

---

### Task 1: Typed now-playing presentation settings

**Files:**
- Modify: `src/nowPlayingModel.ts`, `src/nowPlayingModel.test.ts`, `src/loopItemFactory.ts`, `src/store.ts`

**Interfaces:**
- Produces: `NowPlayingPresentationSettings`, `normalizeNowPlayingSettings(metadata)`, `nowPlayingSettingsPatch(settings)`.

- [ ] Write failing tests for legacy defaults, 10 valid designs, three casing modes, color validation, visualizer defaults, and duration clamping to 1.
- [ ] Run focused tests; expect failure.
- [ ] Implement types/normalization and creation defaults.
- [ ] Re-run focused tests; expect pass.
- [ ] Commit `feat: model now playing presentation settings`.

### Task 2: Visual design cards and controls

**Files:**
- Create: `src/NowPlayingDesigner.tsx`, `src/NowPlayingDesigner.test.tsx`
- Modify: `src/ProductionWorkspace.tsx`, `src/shared-device.css`

**Interfaces:**
- Consumes: normalized settings from Task 1.
- Produces: `NowPlayingDesigner({item, canEdit})` with 10 accessible cards and all requested controls.

- [ ] Write failing UI tests proving ten cards, no design combobox, selection updates, color/casing/visibility/visualizer controls, and numeric duration min 1.
- [ ] Run focused UI tests; expect failure.
- [ ] Implement the focused component and replace the inline editor block.
- [ ] Re-run UI tests; expect pass.
- [ ] Commit `feat: add visual now playing designer`.

### Task 3: Shared renderer, typography safety and audio visualizer

**Files:**
- Create: `src/audio/AudioLevelProvider.ts`, `src/audio/AudioLevelProvider.test.ts`
- Modify: `src/SlideRenderer.tsx`, `src/shared-device.css`, `src/BackgroundAudioEngine.ts`

**Interfaces:**
- Produces: `AudioLevelProvider.connect(media)`, `levels()`, `mode:'analyser'|'fallback'|'idle'`.

- [ ] Write failing tests for analyser levels, CORS/security failure fallback, stop/idle state and reduced-motion behavior.
- [ ] Run focused tests; expect failure.
- [ ] Implement analyser connection with caught fallback and no impact on playback.
- [ ] Make renderer consume all settings and place/style visualizer in four corners.
- [ ] Add line-height/padding rules and a renderer fixture containing `Ä Ö Ü`; assert layout classes/styles preserve overflow.
- [ ] Re-run focused, renderer and now-playing tests; expect pass.
- [ ] Commit `feat: render configurable audio reactive now playing slides`.

### Task 4: Reliable idle skip and live synchronization

**Files:**
- Modify: `src/nowPlayingModel.ts`, `src/store.ts`, `src/App.tsx`, `src/loopDomain.ts`
- Test: `src/nowPlayingSkip.test.ts`

**Interfaces:**
- Produces: `isLoopCandidateAvailable(item, audioState)` used by loop selection and pre-dispatch guard.

- [ ] Write failing tests for idle candidate skipping, playback candidate selection, audio stopping after selection, and controlled transition after audio ends while visible.
- [ ] Run focused tests; expect failure.
- [ ] Implement the shared candidate predicate at both decision points.
- [ ] Re-run focused and loop tests; expect pass.
- [ ] Commit `fix: skip idle now playing output reliably`.

### Task 5: V69 release verification and publication

**Files:**
- Modify: `package.json`, `package-lock.json`, `.github/workflows/release.yml`, `RELEASE_NOTES.md`, `public/releases.json`
- Create: `scripts/check-version69.cjs`

**Interfaces:**
- Produces: version `0.69.0` and public platform packages.

- [ ] Add release metadata and a guard covering central Firebase ownership, public projections, ten design cards, analyser fallback and double skip guard.
- [ ] Run `npm run verify:release`, `npm run typecheck`, `git diff --check`; expect exit 0.
- [ ] Run `npm run installer`; expect `release/GottesdienstRegie-Setup-0.69.0.exe`.
- [ ] Commit and push `main`.
- [ ] Wait for release and release-notes workflows; require success on Windows, macOS and Linux.
- [ ] Verify the V69 Windows installer URL returns HTTP 200.
