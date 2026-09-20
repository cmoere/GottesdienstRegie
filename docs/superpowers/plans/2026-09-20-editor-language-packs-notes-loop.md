# GottesdienstRegie Editor and Language Packs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver section-safe loop insertion, searchable multilingual language packs, rich private notes, a searchable 2D-object gallery, responsive contrast fixes, and operator-only black-and-white mode.

**Architecture:** Pure policy modules own section eligibility, language-pack state, note sanitization and shape registration. React components consume those policies instead of duplicating rules, while Electron services own model downloads and persistence. Output rendering remains isolated from operator appearance state.

**Tech Stack:** Electron 37, React 19, TypeScript 5.9, Vite 7, Zustand, `@huggingface/transformers` 3.8.1, Node `assert`, existing CSS design tokens.

**Spec:** `docs/superpowers/specs/2026-09-20-editor-language-packs-notes-loop-design.md`

## Global Constraints

- Loop-only elements are valid exclusively in Vorprogramm and Nachprogramm through every insert, move, duplicate and load path.
- The 15 standard languages are German, English, French, Spanish, Italian, Dutch, Polish, Portuguese, Ukrainian, Russian, Turkish, Arabic, Danish, Swedish and Norwegian.
- Additional supported languages stay searchable and show a cloud action until their directional model is installed.
- Stored translations remain visible on other PCs without models; a model is required only to create or regenerate text.
- Notes never enter presentation sync data, output snapshots, MAIN, STAGE, LIVESTREAM, LOBBY, NOTES or exports.
- Language-model preparation must not block the editor or any live output.
- Black-and-white mode applies only to the operator window.
- Existing saved presentations remain loadable; invalid legacy loop placement is marked, not deleted.
- No help copy may advertise that an API key is unnecessary.

## Review Focus

- A legacy presentation with an unknown section ID must retain content and visibly mark invalid loop placement instead of silently deleting it (Task 1).
- A language direction that has only its reverse model installed must still display a cloud icon and refuse translation until the exact direction exists (Task 3).
- A model download interrupted after checksum creation must never be reported as installed after restart (Task 4).
- Rich-text paste containing scripts, event handlers or external markup must produce safe supported blocks only (Task 2).
- Changing black-and-white while MAIN is live must not alter the live snapshot or output document styling (Task 7).

---

### Task 1: One section-eligibility policy for every insertion path

**Files:**
- Create: `src/itemPlacementPolicy.ts`
- Modify: `src/loopDomain.ts`
- Modify: `src/store.ts`
- Modify: `src/App.tsx`
- Create: `scripts/check-version41.cjs`

**Interfaces:**
- Produces: `canInsertItemType(type, section): boolean`, `allowedItemTypes(section): ItemType[]`, `placementViolation(item, section): string | null`.
- Consumes: `ItemType`, `ServiceSection`, `isLoopOnlyItem`.

- [ ] **Step 1: Write failing placement tests**

Add assertions for every loop type in pre/post versus service/warmup, normal content in all sections, an unknown legacy section, rejected store insertion and rejected move. The production change that makes the tests fail is removal or bypass of the central policy.

```js
for(const type of loopTypes){
  assert.equal(canInsertItemType(type, pre), true)
  assert.equal(canInsertItemType(type, service), false)
}
assert.equal(placementViolation(weather, unknown), 'LOOP_SECTION_REQUIRED')
```

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL because `itemPlacementPolicy.ts` is missing.

- [ ] **Step 3: Implement the pure policy**

Use `sectionSupportsLoopItems` as the sole loop decision and return normal types for every known section. Keep violation strings stable for UI and migration.

```ts
export function canInsertItemType(type: ItemType, section: ServiceSection): boolean
export function allowedItemTypes(section: ServiceSection): ItemType[]
export function placementViolation(item: ServiceItem, section?: ServiceSection): 'LOOP_SECTION_REQUIRED'|'SECTION_MISSING'|null
```

- [ ] **Step 4: Enforce it in store and menus**

Guard `addItem`, `moveItemToSection`, duplicate/paste targets and load normalization. Filter both global and section plus menus with `allowedItemTypes`. Mark invalid legacy rows with a warning and a `Verschieben` action; never remove them.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version41.cjs && node scripts/loop-acceptance-test.cjs && npm run typecheck`

```powershell
git add src/itemPlacementPolicy.ts src/loopDomain.ts src/store.ts src/App.tsx scripts/check-version41.cjs
git commit -m "fix: enforce loop item section placement"
```

### Task 2: Rich private presentation and slide notes

**Files:**
- Create: `src/personalNoteDocument.ts`
- Create: `src/PersonalNotesDialog.tsx`
- Modify: `src/PersonalNotesPanel.tsx`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/personalNotes.ts`
- Modify: `src/preview-workspace.css`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Produces: `PersonalNoteDocument`, `sanitizePersonalNote(input)`, `serializePersonalNote`, `PersonalNotesDialog`.
- Consumes: existing user/presentation/slide-scoped storage keys.

- [ ] **Step 1: Write failing sanitizer and isolation tests**

Test bold/italic/underline/list/alignment blocks, undo-safe immutable changes, plain-text paste, rejection of script/event attributes, account separation and absence from `presentationDocument` plus rendered snapshots.

```js
const safe=sanitizePersonalNote('<b>Text</b><script>x()</script><img onerror="x()">')
assert.deepEqual(safe.blocks,[{type:'paragraph',runs:[{text:'Text',bold:true}]}])
assert.equal(JSON.stringify(presentationDocument(state)).includes('secret note'),false)
```

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL with missing `personalNoteDocument`.

- [ ] **Step 3: Implement block storage and toolbar commands**

Support paragraph, bullet and ordered-list blocks; runs support `bold`, `italic`, `underline`; block alignment is `left|center|right`. Convert clipboard input to plain text before applying the active run style.

- [ ] **Step 4: Place the UI correctly**

Move `Meine Präsentationsnotiz` directly below the presentation title. Open a modal editor with toolbar and shortcuts. Keep slide notes compact and remove the sentence `Privat · nicht synchronisiert · nicht in Ausgaben sichtbar`; display only active save/error states.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version41.cjs && npm run typecheck && npm run build`

```powershell
git add src/personalNoteDocument.ts src/PersonalNotesDialog.tsx src/PersonalNotesPanel.tsx src/ProductionWorkspace.tsx src/personalNotes.ts src/preview-workspace.css scripts/check-version41.cjs
git commit -m "feat: add rich private presentation notes"
```

### Task 3: Searchable language catalog with directional availability

**Files:**
- Create: `src/languageCatalog.ts`
- Create: `src/LanguagePicker.tsx`
- Create: `src/language-picker.css`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/songTranslation.ts`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Produces: `LanguageDefinition`, `LanguageDirection`, `languageCatalog`, `searchLanguages(query)`, `LanguagePicker`.
- Consumes: installed-direction states from Task 4 through `getPackState(direction)`.

- [ ] **Step 1: Write failing catalog tests**

Assert 15 exact standard codes, flag/name/native-name search, diacritic-insensitive matching, additional languages remaining visible, and directional status where `de→ja` differs from `ja→de`.

```js
assert.deepEqual(standardLanguages.map(x=>x.code),['de','en','fr','es','it','nl','pl','pt','uk','ru','tr','ar','da','sv','no'])
assert.equal(searchLanguages('francais')[0].code,'fr')
assert.equal(directionKey('de','ja'),'de-ja')
```

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL with missing language catalog.

- [ ] **Step 3: Implement catalog and picker**

Catalog entries contain code, flag emoji, German name, native name, standard flag and supported direction IDs. Picker has search, keyboard navigation, installed/cloud/downloading state and a separate cloud action that does not select accidentally.

- [ ] **Step 4: Integrate source and target selectors**

Replace hardcoded `en→de`. Persist source/target codes and model revision with the translation. Prevent identical language pairs. Existing translations render without consulting pack state.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version41.cjs && npm run typecheck`

```powershell
git add src/languageCatalog.ts src/LanguagePicker.tsx src/language-picker.css src/ProductionWorkspace.tsx src/songTranslation.ts scripts/check-version41.cjs
git commit -m "feat: add searchable translation languages"
```

### Task 4: Electron language-pack manager and startup preparation

**Files:**
- Create: `electron/LanguagePackManager.ts`
- Create: `electron/languagePackManifest.ts`
- Modify: `electron/LocalTranslationService.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Create: `src/LanguagePackSettings.tsx`
- Modify: `src/App.tsx`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Produces: `LanguagePackState`, `prepareStandardPacks`, `downloadPack`, `cancelDownload`, `removePack`, `translate`, IPC progress events.
- Consumes: Task 3 `LanguageDirection` and exact direction keys.

- [ ] **Step 1: Write failing manager tests with an injected downloader**

Use a temporary directory. Test atomic `.partial` download, checksum mismatch, cancel/restart, reverse-direction independence, free-space rejection, concurrency limit two, standard-pack startup queue and incomplete-file recovery.

```js
await manager.downloadPack({source:'de',target:'ja'})
assert.equal(manager.getPackState({source:'de',target:'ja'}).status,'installed')
assert.equal(manager.getPackState({source:'ja',target:'de'}).status,'available')
```

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL because manager does not exist.

- [ ] **Step 3: Implement manifest and atomic lifecycle**

Each entry has model ID, immutable revision, direction, compressed/download size and SHA-256. Write `.partial`, validate checksum, rename to final, then atomically update state. Never infer installed state from a partial file.

- [ ] **Step 4: Add startup queue and settings**

After the main window reports ready, queue all missing standard directions at concurrency two. Show total and per-pack size, progress, pause/cancel and removable extra packs. Live-critical IPC never awaits the queue.

- [ ] **Step 5: Add editor progress**

Translation reports `0–100`, spinner and current stage. Missing packs produce an inline download card. Abort leaves completed slide drafts and discards the active unfinished result.

- [ ] **Step 6: Verify and commit**

Run: `node scripts/check-version41.cjs && npm run typecheck && npm run build`

```powershell
git add electron/LanguagePackManager.ts electron/languagePackManifest.ts electron/LocalTranslationService.ts electron/main.ts electron/preload.ts src/vite-env.d.ts src/LanguagePackSettings.tsx src/App.tsx src/ProductionWorkspace.tsx scripts/check-version41.cjs
git commit -m "feat: manage multilingual local model packs"
```

### Task 5: Searchable 2D-object gallery

**Files:**
- Create: `src/shapeCatalog.ts`
- Create: `src/ShapeGallery.tsx`
- Create: `src/shape-gallery.css`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/SlideRenderer.tsx`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Produces: `ShapeDefinition`, `shapeCatalog`, `searchShapes(query, category)`, `ShapeGallery`.
- Consumes: existing `addShape(kind, name)` and shape rendering.

- [ ] **Step 1: Write failing catalog tests**

Assert unique keys, all seven categories, required shapes, German synonym search (`kirche`, `pfeil`, `ablauf`, `person`) and valid geometry/icon definitions.

```js
assert.ok(searchShapes('kirche').some(x=>x.key==='church'))
assert.equal(new Set(shapeCatalog.map(x=>x.key)).size,shapeCatalog.length)
```

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL with missing shape catalog.

- [ ] **Step 3: Implement catalog and renderer geometry**

Register existing shapes plus double/curve arrows, thought bubble, ribbons, pennant, braces, document, process, decision, database, person/group, location, calendar, clock, music, microphone, camera, cross, Bible, dove, chalice and candle. Use local CSS/SVG path data only.

- [ ] **Step 4: Replace select with gallery**

Button opens a searchable categorized grid with preview icon and name. Keyboard selection and Escape work. Choosing creates the same normal shape element and closes the gallery.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version41.cjs && npm run typecheck && npm run build`

```powershell
git add src/shapeCatalog.ts src/ShapeGallery.tsx src/shape-gallery.css src/ProductionWorkspace.tsx src/SlideRenderer.tsx scripts/check-version41.cjs
git commit -m "feat: add searchable 2D object gallery"
```

### Task 6: Responsive menus, number fields and contrast

**Files:**
- Create: `scripts/version41-ui-test.tsx`
- Create: `scripts/version41-ui-test.html`
- Modify: `src/App.tsx`
- Modify: `src/settings-v08.css`
- Modify: `src/v010.css`
- Modify: `src/preview-workspace.css`
- Modify: `src/language-picker.css`
- Modify: `src/shape-gallery.css`

**Interfaces:**
- Produces: reusable `.settings-number-row` and responsive categorized-menu layout.
- Consumes: Tasks 1–5 UI components.

- [ ] **Step 1: Create a failing viewport and contrast harness**

Render settings number rows, section add menu, notes, language picker and shape gallery at widths matching 100/125/150 percent scaling. Assert no bounding-box intersections, no clipped focus ring, internal rather than document scrolling, and calculated text/background contrast at least 4.5:1.

- [ ] **Step 2: Verify RED**

Run the Vite harness and confirm screenshot 1 number inputs and screenshot 2 menu fail their bounding-box assertions.

- [ ] **Step 3: Implement layouts**

Give numeric inputs 96 px minimum width with separate units. Make add-menu category headers sticky, use a compact auto-fill grid, limit height to viewport and scroll internally. Apply explicit high-contrast text, hover, selected, disabled and focus tokens to all new surfaces.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/check-version41.cjs && npm run typecheck && npm run build`

Open the harness and confirm PASS at all three scales in dark, light and monochrome operator themes.

```powershell
git add scripts/version41-ui-test.tsx scripts/version41-ui-test.html src/App.tsx src/settings-v08.css src/v010.css src/preview-workspace.css src/language-picker.css src/shape-gallery.css
git commit -m "fix: improve editor layout and contrast"
```

### Task 7: Operator-only black-and-white mode

**Files:**
- Create: `src/operatorAppearance.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/i18n.ts`
- Modify: `electron/main.ts`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Produces: `applyOperatorAppearance(root, {blackWhite})`.
- Consumes: existing `blackWhite` preference; never passes it through output IPC.

- [ ] **Step 1: Write failing isolation tests**

Assert the operator root gets `data-bw=true`, output BrowserWindow bootstrap contains no monochrome state, snapshots remain byte-identical when the preference changes and every localized help string says operator interface only.

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL because current help promises output-window filtering.

- [ ] **Step 3: Isolate appearance state**

Apply grayscale only below `.production-app[data-operator-bw=true]`. Remove the document-root `data-bw` mutation. Output HTML, `SlideRenderer`, snapshot builder and IPC receive no appearance preference.

- [ ] **Step 4: Update all translations and verify**

Change each `blackWhiteHelp` to the language-equivalent of “Applies black and white only to the operator interface; output windows retain their colors.”

Run: `node scripts/check-version41.cjs && npm run typecheck && npm run build`

```powershell
git add src/operatorAppearance.ts src/App.tsx src/styles.css src/i18n.ts electron/main.ts scripts/check-version41.cjs
git commit -m "fix: isolate monochrome mode from outputs"
```

### Task 8: Help, release metadata and publication gate

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/helpV39.ts`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `public/releases.json`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/release.yml`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Consumes: all Tasks 1–7.
- Produces: discoverable version `0.41.0` update and release assets.

- [ ] **Step 1: Add failing copy and release assertions**

Assert help contains pack/cloud/second-PC/loop/note guidance, contains no case-insensitive `API-Schlüssel` text, historical releases remain intact, the next version is the sole `current` build and release workflow runs `check-version41.cjs`.

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL on old help and version metadata.

- [ ] **Step 3: Write help and long release notes**

Explain standard versus cloud packs, device-specific downloads, second-PC behavior, storage management, loop-only placement, note formatting and output isolation. Do not mention API keys. Preserve all historical notes and keep version 1.0 text exactly `Los gehts!`.

- [ ] **Step 4: Run complete release verification**

```powershell
npm ci
node scripts/check-version40.cjs
node scripts/check-version41.cjs
node scripts/loop-acceptance-test.cjs
npm run typecheck
npm run build
npm run installer
```

Expected: all commands exit 0 and installer/update artifacts contain the next version.

- [ ] **Step 5: Manual smoke tests**

Verify both screenshots at 100/125/150 percent; all insert/move paths; note formatting/paste/account switch; standard and cloud pack download/cancel/restart; second-PC missing-pack prompt; translation progress; shape search; live color output while toggling monochrome.

- [ ] **Step 6: Commit, tag and publish**

```powershell
git add package.json package-lock.json CHANGELOG.md RELEASE_NOTES.md public/releases.json .github/workflows/release.yml src/App.tsx src/helpV39.ts scripts/check-version41.cjs
git commit -m "release: publish multilingual editor update"
git tag -a v0.41.0 -m "GottesdienstRegie 0.41.0"
git push origin main
git push origin v0.41.0
```

Wait for the GitHub workflow. Verify the public release, installer, `latest.yml`, release-notes site and raw update manifest all return success before reporting publication.
