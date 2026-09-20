# GottesdienstRegie 0.43.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish version 0.43.0 with shared long-form terms, a separate online terms page, reliable loop insertion and translation downloads, safe cache maintenance, refreshed event linking and local SVG flags.

**Architecture:** Pure domain modules define terms, loop factories, cache categories, model capabilities and flag mappings. Electron owns filesystem traversal, deletion and streamed model downloads; React consumes typed preload APIs. Static legal pages are generated from the same structured terms source used by the application and installer.

**Tech Stack:** TypeScript, React 19, Electron 37, Vite, Node filesystem/streams, GitHub Pages, NSIS, CSS, SVG, Node assertion scripts.

**Spec:** `docs/superpowers/specs/2026-09-20-version-043-terms-cache-loop-translations-design.md`

## Global Constraints

- Target version is exactly `0.43.0`.
- `/terms/` is a dedicated public page and not part of `/release-notes/`.
- Terms shown in app, installer and web are generated from one canonical source.
- Cache deletion is limited to explicitly approved application-owned roots.
- Presentations, preferences, accounts, original library media and saved translations are never cleared.
- Translation packs become ready only after required files pass validation.
- Startup does not automatically download large translation models.
- UI uses local SVG flags or a neutral globe; no emoji flags.
- Operator changes never alter MAIN, STAGE, livestream or recording output.

## Review Focus

- Symlink or `..` paths in cache roots must be rejected before size calculation or deletion (Task 4).
- A model endpoint without `content-length` still reports indeterminate byte progress and completes safely (Task 5).
- Double-clicking a loop option must create only one item (Task 2).
- Missing flag artwork must fall back to the neutral SVG without a broken image (Task 6).
- A terms version change must update app, installer and online page in the same build (Tasks 1 and 8).

---

### Task 1: Canonical long-form terms and dedicated website

**Files:**
- Create: `src/termsContent.ts`
- Create: `scripts/generate-terms.cjs`
- Create: `public/terms/index.html`
- Create: `public/terms/terms.css`
- Modify: `src/App.tsx` (`TermsDialog`)
- Modify: `build/terms.txt`
- Modify: `.github/workflows/release-notes.yml`
- Test: `scripts/check-version43.cjs`

**Interfaces:**
- Produces: `TERMS_VERSION`, `TERMS_EFFECTIVE_DATE`, `termsSections`, `plainTerms()` and generated web/installer outputs.
- Consumes: canonical public base URL `https://cmoere.github.io/GottesdienstRegie/terms/`.

- [ ] **Step 1: Write failing parity tests**

Assert at least fifteen named sections, a version/date, required legal topics, and exact normalized content parity between `plainTerms()`, `build/terms.txt` and the text embedded in `public/terms/index.html`. Assert the terms page contains no release-notes container.

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/check-version43.cjs`

Expected: missing `termsContent.ts`.

- [ ] **Step 3: Implement the canonical terms source**

Create typed sections covering scope, accounts, operator responsibility, live risk, intellectual property, third parties, synchronization, local storage, translation models, updates, availability, prohibited use, warranties, mandatory-law liability limits, unlawful-content responsibility, changes, termination, severability, governing law and contact.

- [ ] **Step 4: Generate installer and web output**

The generator imports/transpiles the canonical source, escapes HTML, creates anchors and writes both outputs deterministically. The page includes its own header, table of contents, print stylesheet, version and effective date.

- [ ] **Step 5: Render canonical content in the app**

Replace duplicated short dialog copy with `termsSections`. Add “Online öffnen” using the approved canonical URL and extend Electron external-URL allowlisting to that exact origin/path.

- [ ] **Step 6: Publish both static directories**

Extend the existing pages workflow to copy `/terms/` beside `/release-notes/`. Fail when generated outputs differ from the canonical source.

- [ ] **Step 7: Verify and commit**

Run: `node scripts/generate-terms.cjs && node scripts/check-version43.cjs && npm run typecheck`

Commit: `feat: publish canonical terms of use`

### Task 2: Reliable loop-only insertion and responsive menu

**Files:**
- Create: `src/loopItemFactory.ts`
- Modify: `src/App.tsx` (`AddContentPopover`)
- Modify: `src/store.ts`
- Modify: `src/version42.css`
- Test: `scripts/check-version43.cjs`

**Interfaces:**
- Produces: `createLoopItem(type, sectionId, now): ServiceItemDraft` and `consumeInsertionGuard(key, now): boolean`.
- Consumes: `menuItemTypesForSection`, `loopOnlyItemTypes`, store `addItem` and selected section id.

- [ ] **Step 1: Write failing factory tests**

For every loop type assert correct type, non-empty title, exact `sectionId`, required default metadata and valid slides. Assert two guard calls inside 400 ms allow only the first.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version43.cjs`

- [ ] **Step 3: Implement factory and guarded insertion**

Keep defaults out of the component. The click handler captures the target section, consumes the guard, inserts one draft, selects it, switches to edit mode and closes after store success.

- [ ] **Step 4: Repair menu layout**

Render one grid in loop sections, remove nested/duplicate routing, clamp it to viewport height and preserve keyboard navigation. At widths below 320 px use one column; otherwise use two or three based on available width.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version43.cjs && npm run typecheck`

Commit: `fix: make loop insertion deterministic`

### Task 3: Refresh event-link control and dialog

**Files:**
- Create: `src/EventLinkStatus.tsx`
- Modify: `src/App.tsx`
- Modify: `src/events.ts`
- Modify: `src/version42.css`
- Test: `scripts/check-version43.cjs`

**Interfaces:**
- Produces: `eventLinkViewModel(link, events, now)` and `<EventLinkStatus>`.

- [ ] **Step 1: Write failing view-model tests**

Assert unlinked copy, linked title/date/time, cancelled warning and missing-event warning. Assert planned time remains the stored snapshot.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version43.cjs`

- [ ] **Step 3: Implement full-width status row**

Use Material Symbol `event`, explicit linked/unlinked state, wrapped details and a “Ändern” affordance. Do not use emoji.

- [ ] **Step 4: Refresh the selection dialog**

Keep HEUTE/MORGEN/KOMMEND groups, search, cancellation labels, staged selection and explicit save. Add empty/loading/error sentences and focus restoration.

- [ ] **Step 5: Verify responsive layout and commit**

Run: `node scripts/check-version43.cjs && npm run typecheck`

Commit: `feat: refresh event linking workflow`

### Task 4: Safe storage measurement and cleanup

**Files:**
- Create: `electron/StorageMaintenanceService.ts`
- Create: `src/storageMaintenance.ts`
- Create: `src/StorageSettings.tsx`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`
- Test: `scripts/check-version43.cjs`

**Interfaces:**
- Produces: `StorageCategory`, `StorageSnapshot`, `desktop.storage.snapshot()` and `desktop.storage.clear(categories)`.

- [ ] **Step 1: Write failing filesystem tests**

Create temporary approved roots with nested files, missing directories and a link escaping the root. Assert byte totals, missing-root zero, rejected escape and deletion limited to selected categories.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version43.cjs`

- [ ] **Step 3: Implement approved-root service**

Resolve and compare real paths before traversal/deletion. Categories are translation packs, Transformers cache, media cache, thumbnails, temporary downloads and Electron web cache. Return per-category errors without hiding successful categories.

- [ ] **Step 4: Add typed IPC**

Reject unknown categories. Refuse clear while ON AIR or while `TranslationPackService` reports active downloads.

- [ ] **Step 5: Build settings UI and confirmation**

Show loading state, formatted current total, categories with checkboxes and sizes. Confirmation repeats categories and total; destructive action uses explicit “Ausgewählten Speicher leeren”. Refresh after completion.

- [ ] **Step 6: Verify and commit**

Run: `node scripts/check-version43.cjs && npm run typecheck`

Commit: `feat: add safe application storage cleanup`

### Task 5: Streamed and capability-aware translation downloads

**Files:**
- Modify: `electron/TranslationPackService.ts`
- Create: `electron/translationPackCatalog.ts`
- Modify: `electron/main.ts`
- Modify: `src/translationPackTypes.ts`
- Modify: `src/translationPackManager.ts`
- Modify: `src/TranslationPackSettings.tsx`
- Modify: `src/LanguagePicker.tsx`
- Test: `scripts/check-version43.cjs`

**Interfaces:**
- Produces: `TranslationPackCapability`, `packForPair(source,target)`, streamed `download`, byte progress and `activeDownloadCount()`.

- [ ] **Step 1: Write failing capability and stream tests**

Assert supported and unsupported pairs, content-length and no-content-length progress, cancellation cleanup, stale `.tmp` cleanup, zero-byte rejection and atomic ready state.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version43.cjs`

- [ ] **Step 3: Replace buffered downloads with streams**

Pipe response bodies to file handles chunk by chunk, accumulate bytes, honor abort between chunks and validate the catalog’s required files. Use unique temp directories and write the manifest last.

- [ ] **Step 4: Stop automatic downloads**

`prepareStandardTranslationPacks()` only refreshes status and removes stale temp state. Downloads begin solely from an explicit user action.

- [ ] **Step 5: Improve UI states**

Show byte progress and percentage when total is known, spinner plus bytes otherwise, and actions for cancel/retry/remove. Unsupported pairs remain selectable for saved text but show “Kein lokales Modell verfügbar”.

- [ ] **Step 6: Verify and commit**

Run: `node scripts/check-version43.cjs && npm run typecheck`

Commit: `fix: stream and validate translation packs`

### Task 6: Local SVG flags

**Files:**
- Create: `src/flags/FlagIcon.tsx`
- Create: `src/flags/flagCatalog.ts`
- Create: `src/flags/assets/*.svg`
- Modify: `src/languageCatalog.ts`
- Modify: `src/LanguagePicker.tsx`
- Modify: `src/TranslationPackSettings.tsx`
- Modify: `src/version42.css`
- Test: `scripts/check-version43.cjs`

**Interfaces:**
- Produces: `flagAssetForLanguage(code)` and `<FlagIcon languageCode decorative>`.

- [ ] **Step 1: Write failing catalog tests**

Assert every language maps to a bundled SVG or neutral globe, paths remain inside `src/flags/assets`, assets contain SVG markup, and catalog/UI source contains no regional-indicator or pictographic emoji.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version43.cjs`

- [ ] **Step 3: Add permissively licensed SVG artwork**

Use compact local flag SVGs and record the source/license in `src/flags/README.md`. Map language codes deliberately; multi-country languages use the neutral globe where appropriate.

- [ ] **Step 4: Replace language badges**

Render a fixed-size SVG beside explicit code/name. Provide useful accessible text only when the image conveys additional meaning.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version43.cjs && npm run typecheck`

Commit: `feat: use local svg language flags`

### Task 7: Integration and visual regression checks

**Files:**
- Modify: `scripts/check-version43.cjs`
- Modify: `src/version42.css`
- Modify: `src/helpV39.ts`

**Interfaces:**
- Consumes all Task 1–6 interfaces.

- [ ] **Step 1: Add cross-feature assertions**

Assert cache clearing cannot remove ready status without refreshing, language removal updates storage size, loop insertion remains valid after menu close, and online terms link is allowlisted.

- [ ] **Step 2: Add responsive CSS checks**

Cover 320 px and normal desktop layouts for loop menu, event row, storage dialog, pack rows and terms dialog. Ensure no output-app selector receives operator styles.

- [ ] **Step 3: Extend help**

Document online terms, storage categories and irreversibility, model availability/errors, loop-only behavior and SVG flag semantics.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/check-version39.cjs && node scripts/check-version40.cjs && node scripts/check-version41.cjs && node scripts/check-version42.cjs && node scripts/check-version43.cjs && npm run typecheck`

Commit: `test: verify version 0.43 integrations`

### Task 8: Version, package and publish 0.43.0

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `public/releases.json`
- Modify: `RELEASE_NOTES.md`
- Modify: `.github/workflows/release.yml`
- Modify: `.github/workflows/release-notes.yml`
- Modify: `scripts/check-release-notes.cjs`

**Interfaces:**
- Produces public tag `v0.43.0`, update metadata and dedicated terms URL.

- [ ] **Step 1: Make release assertions fail on 0.42**

Assert sole current version 0.43.0, detailed German/English notes, 1.0 remains exactly “Los gehts!”, workflow runs version43 checks and static deployment contains `/terms/index.html`.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-release-notes.cjs`

- [ ] **Step 3: Update metadata and long notes**

Run `npm version 0.43.0 --no-git-tag-version`, mark 0.42 non-current and describe terms, loop fix, event linking, storage cleanup, streamed models and SVG flags.

- [ ] **Step 4: Run complete local verification**

Run all version checks, terms generator/parity check, `npm run typecheck`, `npm run build` and `npm run installer`. Verify installer, blockmap and `latest.yml` contain 0.43.0.

- [ ] **Step 5: Review and publish**

Inspect the complete diff, commit `release: publish version 0.43.0`, tag, push branch/tag and monitor every platform job.

- [ ] **Step 6: Verify public availability**

Confirm release is non-draft, Windows/macOS/Linux assets exist, updater metadata says 0.43.0, `/terms/` returns 200 with the canonical version and `/release-notes/` remains separate.
