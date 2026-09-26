# V58 Audio, Bible, Timer and Terms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release v0.58.0 with preview-audio policy, clearer attached-audio status, a responsive Bible dialog with more translations, timer hold mode, a clearable radio search, and genuinely localized terms.

**Architecture:** Persist the preview-audio policy in preferences and gate only automatic background playback at the App orchestration boundary. Keep Bible data normalization in the provider and presentation/grouping in the dialog. Reuse the existing live/preview timer pause state, and keep terms as deterministic offline content shared by desktop and web.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Vite, Electron.

**Spec:** Approved v58 design in the conversation dated 2026-09-26.

## Global Constraints

- Preview audio defaults to enabled; disabling it must not prevent deliberate audition controls.
- Do not modify the user-supplied Bible worker.
- Only public, license-compatible Bible translations may be exposed.
- Terms must work offline and use the selected application/web language.
- Release version is `0.58.0`.

## Review Focus

- Migrated preferences without the new audio flag must still default to enabled.
- Failed secondary Bible translation sources must not hide successful primary results.
- Duplicate translation IDs from multiple providers must appear only once.
- Timer hold must prevent automatic advance in both preview and ON AIR paths.
- Small viewport heights must keep Bible actions visible and content independently scrollable.

---

### Task 1: Preview audio policy and attached-audio status

**Files:** `src/preferences.ts`, `src/App.tsx`, `src/background-audio-fixes.css`, `src/audioPreviewPolicy.ts`, `src/audioPreviewPolicy.test.ts`

- [ ] Write and run failing policy/default tests.
- [ ] Add the persisted default-on setting and Settings control.
- [ ] Gate automatic preview sync and stop playback when preview playback is disabled.
- [ ] Add filled configured speaker styling and track-count badge.
- [ ] Run focused and full unit tests; commit.

### Task 2: Bible translation aggregation and language groups

**Files:** `src/bible/provider.ts`, `src/bible/provider.test.ts`, `src/BibleTextDialog.tsx`

- [ ] Write and run failing merge/deduplication tests.
- [ ] Merge worker and GetBible translation lists with graceful partial failure.
- [ ] Render translations in language optgroups.
- [ ] Run focused and full unit tests; commit.

### Task 3: Bible dialog responsive layout

**Files:** `src/BibleTextDialog.test.tsx`, `src/BibleTextDialog.tsx`, `src/version58.css`, `src/main.tsx`

- [ ] Write and run a failing dialog structure test.
- [ ] Give header/body/footer explicit grid rows and independently scrollable panes.
- [ ] Add compact low-height and narrow-screen layouts.
- [ ] Run focused and full unit tests; commit.

### Task 4: Timer hold and clearable radio search

**Files:** `src/previewTimer.ts`, `src/previewTimer.test.ts`, `src/ProductionWorkspace.tsx`, `src/RadioStationBrowser.test.tsx`, `src/RadioStationBrowser.tsx`, `src/version58.css`

- [ ] Write and run failing timer/radio interaction tests.
- [ ] Make the timer ring a toggle button for continuous display.
- [ ] Add an accessible clear control inside the radio query field.
- [ ] Run focused and full unit tests; commit.

### Task 5: Fully localized terms

**Files:** `src/termsContent.ts`, `src/termsContent.test.ts`

- [ ] Write and run failing coverage tests for every supported locale.
- [ ] Supply deterministic localized section titles and explanatory paragraphs for each locale.
- [ ] Ensure app and web continue consuming the same document API.
- [ ] Run focused and full unit tests; commit.

### Task 6: Version, release notes, verification and publication

**Files:** `package.json`, `package-lock.json`, `CHANGELOG.md`, `RELEASE_NOTES.md`, `src/updateReleaseSummary.ts`, `scripts/check-version58.cjs`, `.github/workflows/release.yml` if required

- [ ] Add v0.58.0 metadata and validation.
- [ ] Run unit tests, version check, typecheck, desktop build, and web build.
- [ ] Review the whole change set and fix Important findings test-first.
- [ ] Commit, tag, push, publish, and verify release assets and web metadata.
