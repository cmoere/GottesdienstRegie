# Song-Editor und Element-Editor – Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lange Songtexte sicher auf Folien verteilen und den Canvas-Editor mit Raster, Magnetismus, Mehrfachausrichtung, Ebenen und stabilen Tastatur-/Mausgesten verbessern.

**Architecture:** Reine Layout- und Geometrie-Helfer kapseln Berechnungen und bleiben unabhängig von React und Zustand. `ProductionWorkspace` verbindet diese Helfer mit dem bestehenden Song- und Canvas-Editor; der Store erhält nur atomare Endzustandsänderungen. MAIN/STAGE/LiveEngine bleiben getrennt.

**Tech Stack:** React 19, TypeScript 5.9, Zustand, bestehende `SongStructure`, `lyricPreflight`, CSS und Electron/Vite.

**Spec:** `docs/superpowers/specs/2026-09-13-song-canvas-improvements-design.md`

## Global Constraints

- Keine Editorberechnung darf MAIN, STAGE, Audio oder Recording blockieren.
- Eine Mausgeste erzeugt höchstens einen Undo-/History-Eintrag beim Loslassen.
- Songabschnitte dürfen durch automatische Aufteilung nicht in den Grundlyrics dupliziert werden.
- Gesperrte Elemente reagieren weder auf Maus- noch Tastaturbewegungen.
- Ungültige Geometrie wird auf die Foliengrenzen und Mindestgrößen begrenzt.

---

### Task 1: Reine Song-Layout-Berechnung

**Files:**
- Create: `src/songLayout.ts`
- Test: `scripts/song-layout-test.mjs`

**Interfaces:**
- `estimateLyricLines(text: string, options: { charactersPerLine: number }): number`
- `splitLyrics(text: string, options: { maxLines: number }): string[]`
- `hasLyricOverflow(text: string, options: { maxLines: number }): boolean`

- [ ] **Step 1: Write the failing tests**

```js
assert.deepEqual(splitLyrics('A\nB\nC\nD', { maxLines: 2 }), ['A\nB', 'C\nD']);
assert.deepEqual(splitLyrics('A\n\nB\n\nC', { maxLines: 2 }), ['A', 'B\nC']);
assert.equal(hasLyricOverflow('A\nB\nC', { maxLines: 2 }), true);
```

- [ ] **Step 2: Run the test and verify RED**

Run the test through the repository’s TypeScript VM runner because direct Node execution is restricted by the Windows sandbox. It must fail because `src/songLayout.ts` does not yet export the helpers.

- [ ] **Step 3: Implement the minimal pure helpers**

Split only at blank lines or line boundaries; trim empty chunks; never return an empty slide. Preserve line order and do not alter the source `SongStructure`.

- [ ] **Step 4: Run the test and verify GREEN**

Run `scripts/song-layout-test.mjs` through the same VM runner and verify all assertions pass.

- [ ] **Step 5: Commit**

```bash
git add src/songLayout.ts scripts/song-layout-test.mjs
git commit -m "feat: add deterministic lyric slide layout helpers"
```

### Task 2: Song-Editor-Aufteilung und Überlaufanzeige

**Files:**
- Modify: `src/songStructure.ts`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/lyricPreflight.ts`
- Modify: `src/song-editor.css`
- Test: `scripts/song-layout-test.mjs`

**Interfaces:**
- `songPatch(item, structure)` bleibt kompatibel.
- `autoSplitSongSection(section, layout)` erzeugt Teilfolien mit stabilen IDs und `metadata.songAutoSplit === true`.

- [ ] **Step 1: Extend the failing test**

Add an assertion that a long section produces multiple slides, retains the original section ID in its generated IDs, and never emits an empty body.

- [ ] **Step 2: Verify RED**

Run the test and confirm the automatic section helper is missing.

- [ ] **Step 3: Implement automatic split integration**

Add a Song-Editor action `LYRICS AUFTEILEN`, calculate max lines from the first text element’s height, font size, line height and padding, and write only generated slides to the selected section. Keep manual folienumbrüche intact.

- [ ] **Step 4: Add visible overflow diagnostics**

Use the same line-count logic in `lyricPreflight`; mark affected Song-Editor sections and slide cards with an `overflow` class and an accessible warning. Clicking the warning selects the first affected slide.

- [ ] **Step 5: Compact the song header and strengthen STAGE output**

Keep title, arrangement and key in one compact header row. Add a structured STAGE preview block for current lyrics, parsed chord tokens and next lyrics while leaving MAIN’s text unchanged.

- [ ] **Step 6: Run song tests and typecheck**

Verify automatic splitting, overflow warnings, stable IDs and existing chord/lyric preflight tests.

- [ ] **Step 7: Commit**

```bash
git add src/songStructure.ts src/ProductionWorkspace.tsx src/lyricPreflight.ts src/song-editor.css scripts/song-layout-test.mjs
git commit -m "feat: improve song layout and lyric preflight"
```

### Task 3: Pure Canvas-Geometrie

**Files:**
- Create: `src/canvasGeometry.ts`
- Test: `scripts/canvas-geometry-test.mjs`

**Interfaces:**
- `snapValue(value, grid, enabled): number`
- `snapRect(rect, options): Rect`
- `alignRects(rects, mode): Rect[]`
- `distributeRects(rects, axis): Rect[]`
- `nudgeRect(rect, key, amount, bounds): Rect`

- [ ] **Step 1: Write failing geometry tests**

```js
assert.equal(snapValue(127, 16, true), 128);
assert.deepEqual(alignRects([{x:10,y:20,width:40,height:20},{x:80,y:60,width:30,height:10}], 'left').map(r=>r.x), [10,10]);
assert.deepEqual(nudgeRect({x:10,y:10,width:50,height:40}, 'ArrowRight', 10, {width:1920,height:1080}).x, 20);
```

- [ ] **Step 2: Verify RED**

Run the geometry test and confirm the module is missing.

- [ ] **Step 3: Implement pure snapping, alignment, distribution and nudge**

Use deterministic arithmetic, preserve width/height, clamp to slide bounds and handle fewer than two rectangles without changing their order.

- [ ] **Step 4: Verify GREEN**

Run the geometry test and confirm all cases pass.

- [ ] **Step 5: Commit**

```bash
git add src/canvasGeometry.ts scripts/canvas-geometry-test.mjs
git commit -m "feat: add deterministic canvas geometry operations"
```

### Task 4: Canvas-Interaktion, Raster und Ebenen

**Files:**
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/store.ts`
- Modify: `src/shared-device.css`
- Modify: `src/preferences.ts`
- Test: `scripts/canvas-geometry-test.mjs`

**Interfaces:**
- Editor preferences: `canvasGridSize`, `canvasSnapEnabled`, `canvasSnapGuides`.
- Store actions: `alignSelectedElements(mode)`, `distributeSelectedElements(axis)`, `nudgeSelectedElements(key, amount)`.

- [ ] **Step 1: Add failing static/geometry assertions**

Assert that pointer gestures use `setPointerCapture`, the editor exposes grid/snap controls, and the store exposes the three atomic multi-selection actions.

- [ ] **Step 2: Verify RED**

Run the acceptance script and confirm the new controls/actions are absent.

- [ ] **Step 3: Add local grid and snap preferences**

Persist grid size and snap toggles in existing preferences. Apply `snapRect` to move/resize drafts only; commit the snapped end state once on pointer release.

- [ ] **Step 4: Stabilize pointer gestures**

Capture the pointer on the active hit target, cancel on pointercancel/blur/context change, and prevent stale drafts from committing after selection changes. Keep rAF rendering for local preview.

- [ ] **Step 5: Add keyboard nudging and multi-selection actions**

Handle Arrow keys only when the canvas is focused and no input/textarea/select is active. Use Shift for 10-pixel steps. Add align/distribute commands to the existing Arrange menu and create one history entry per command.

- [ ] **Step 6: Add layer panel and visual controls**

Render selected-slide elements sorted by z-index with visibility/lock toggles and drag-and-drop reorder. Add grid overlay and snap guides without changing live output.

- [ ] **Step 7: Run acceptance checks and typecheck**

Verify geometry tests, static editor assertions, existing selection/undo tests and TypeScript diagnostics.

- [ ] **Step 8: Commit**

```bash
git add src/ProductionWorkspace.tsx src/store.ts src/shared-device.css src/preferences.ts scripts/canvas-geometry-test.mjs
git commit -m "feat: stabilize canvas editing with grid snap and layers"
```

### Task 5: Release Notes und Gesamtprüfung

**Files:**
- Modify: `RELEASE_NOTES.md`
- Modify: `CHANGELOG.md`
- Test: `scripts/song-layout-test.mjs`, `scripts/canvas-geometry-test.mjs`

- [ ] **Step 1: Document user-visible changes**

Describe automatic lyric splitting, STAGE chord preview, overflow warnings, grid/snap, keyboard movement, alignment and layer management without claiming changes to live output.

- [ ] **Step 2: Run all focused tests**

Run the song and geometry VM tests, the existing loop checks, `git diff --check`, and the TypeScript diagnostic runner.

- [ ] **Step 3: Commit final documentation**

```bash
git add RELEASE_NOTES.md CHANGELOG.md
git commit -m "docs: document song and canvas editor improvements"
```

