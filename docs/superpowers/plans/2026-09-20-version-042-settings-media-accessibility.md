# GottesdienstRegie 0.42.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Version 0.42.0 liefert echte verwaltbare Übersetzungspakete, verlässliche Video- und Radioabläufe, korrekte 2D-Objekte sowie eine skalierbare, barrierearme und plattformgerechte Bedienoberfläche.

**Architecture:** Fachzustände werden aus den großen React-Dateien in kleine Domainmodule ausgelagert und über schmale, typisierte Schnittstellen konsumiert. Electron verwaltet Dateien und Plattformfähigkeiten; React zeigt Zustand und Bedienung. Ein gemeinsames Popover und zentrale Kataloge verhindern erneut auseinanderlaufende UI- und Rendererdefinitionen.

**Tech Stack:** TypeScript, React 19, Zustand, Electron 37, Vite, CSS, Node-Prüfskripte, Hugging Face Transformers, Radio Browser API.

**Spec:** `docs/superpowers/specs/2026-09-20-version-042-settings-media-accessibility-design.md`

## Global Constraints

- Zielversion ist exakt `0.42.0`.
- In der Oberfläche werden keine Emoji-Zeichen als Icons verwendet.
- Bedienhilfen, Anzeigegröße, Liquid Glass und Schwarz-Weiß-Modus verändern keine Ausgabefenster.
- Ein Sprachpaket ist nur bei vollständig geprüftem lokalen Modellstatus „Bereit“.
- Vor- und Nachprogramm bieten ausschließlich Loop-Elemente an.
- Bestehende Präsentationen und gespeicherte Übersetzungstexte bleiben lesbar.
- Fehlerzustände dürfen laufende Ausgaben nicht verändern.

## Review Focus

- Unterbrochener Modelldownload hinterlässt kein fälschlich bereites Paket; Task 2 testet Abbruch und temporäre Dateien.
- Ein sehr kleines Bedienfenster hält Sprach- und Objekt-Popovers vollständig erreichbar; Task 3 testet alle vier Kollisionsrichtungen.
- Ein Videoasset falschen Typs erzeugt kein leeres ServiceItem; Task 5 testet Ablehnung und Abbruch.
- Ein ausgefallener Radio-Browser-Mirror fällt auf den nächsten Mirror zurück, ohne HTTP-Streams anzubieten; Task 6 testet beides.
- Anzeigegröße, reduzierte Transparenz und Liquid Glass gelangen nicht in Output-Dokumente; Tasks 8 und 9 testen diese Grenze.

---

### Task 1: Abschnittsabhängige Hinzufügen-Menüs

**Files:**
- Modify: `src/itemPlacementPolicy.ts`
- Modify: `src/App.tsx` (`AddContentPopover`)
- Modify: `src/store.ts`
- Modify: `scripts/check-version41.cjs`

**Interfaces:**
- Consumes: `canInsertItemType(type, section)` und `allowedItemTypes(section)`.
- Produces: `menuItemTypesForSection(section: ServiceSection): ItemType[]`.

- [ ] **Step 1: Write the failing policy tests**

```js
const {menuItemTypesForSection}=load('src/itemPlacementPolicy.ts');
assert.deepEqual(menuItemTypesForSection(sections.pre).sort(), loopOnlyItemTypes.slice().sort());
assert.equal(menuItemTypesForSection(sections.pre).includes('song'), false);
assert.equal(menuItemTypesForSection(sections.service).includes('weather'), false);
assert.equal(menuItemTypesForSection(sections.service).includes('song'), true);
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `node scripts/check-version41.cjs`

Expected: FAIL because `menuItemTypesForSection` is missing.

- [ ] **Step 3: Implement the single menu policy**

```ts
export function menuItemTypesForSection(section:ServiceSection):ItemType[]{
  return sectionSupportsLoopItems(section) ? [...loopOnlyItemTypes] : [...standardItemTypes];
}
```

Use the result in `AddContentPopover`; do not render the normal list beneath the loop list. Retain store-level validation for non-menu entry paths.

- [ ] **Step 4: Verify GREEN and type safety**

Run: `node scripts/check-version41.cjs && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/itemPlacementPolicy.ts src/App.tsx src/store.ts scripts/check-version41.cjs
git commit -m "fix: separate loop and service item menus"
```

### Task 2: Echte Sprachpaketverwaltung

**Files:**
- Create: `electron/TranslationPackService.ts`
- Create: `src/translationPackTypes.ts`
- Create: `src/TranslationPackSettings.tsx`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/global.d.ts`
- Modify: `src/translationPackManager.ts`
- Modify: `src/App.tsx`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `TranslationPackDescriptor`, `TranslationPackProgress`, `desktop.translationPacks.list()`, `download()`, `cancel()`, `remove()` and `onProgress()`.
- Consumes: `translationLanguages`, model IDs and Electron `app.getPath('userData')`.

- [ ] **Step 1: Write failing domain tests**

```js
const {TranslationPackService}=load('electron/TranslationPackService.ts');
const service=new TranslationPackService(tempDir,fakeDownloader);
assert.equal((await service.list()).find(x=>x.key==='en-de').status,'not-downloaded');
await assert.rejects(service.download('en-de',abortSignal),/ABORT/);
assert.equal((await service.list()).find(x=>x.key==='en-de').status,'not-downloaded');
assert.equal(fs.existsSync(path.join(tempDir,'en-de.tmp')),false);
```

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/check-version42.cjs`

Expected: FAIL because service/types do not exist.

- [ ] **Step 3: Implement atomic pack state**

```ts
export type TranslationPackStatus='not-downloaded'|'queued'|'downloading'|'ready'|'error'|'update-available';
export interface TranslationPackDescriptor{key:string;source:string;target:string;model:string;revision:string;status:TranslationPackStatus;size?:number;downloadedBytes?:number;error?:string}
```

Download into `<key>.tmp`, validate declared files and checksums, then `rename()` to `<key>/<revision>`. Cancellation removes `.tmp`. Persist only the manifest, never optimistic UI state.

- [ ] **Step 4: Add IPC and typed preload bridge**

Expose list/download/cancel/remove and progress events. Validate keys against `translationLanguages` before filesystem access.

- [ ] **Step 5: Build the settings page**

Add **Präsentation → Song → Übersetzungen** with search, status filter, model size/version, progress bar and actions. Use Material Symbols `cloud_download`, `cancel`, `refresh`, `delete`, `check_circle`; do not use emoji glyphs.

- [ ] **Step 6: Replace optimistic startup preparation**

`prepareStandardTranslationPacks()` queries real descriptors and queues only missing configured standard directions at idle priority. It never writes `ready` directly.

- [ ] **Step 7: Verify**

Run: `node scripts/check-version42.cjs && npm run typecheck`

Expected: PASS including ready, error, cancel, retry and stale-revision cases.

- [ ] **Step 8: Commit**

```powershell
git add electron/TranslationPackService.ts electron/main.ts electron/preload.ts src/translationPackTypes.ts src/translationPackManager.ts src/TranslationPackSettings.tsx src/global.d.ts src/App.tsx scripts/check-version42.cjs
git commit -m "feat: add verified translation pack management"
```

### Task 3: Gemeinsame kollisionssichere Popovers

**Files:**
- Create: `src/popoverGeometry.ts`
- Create: `src/AnchoredPopover.tsx`
- Modify: `src/LanguagePicker.tsx`
- Modify: `src/ShapeGallery.tsx`
- Modify: `src/version41.css`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `placePopover(anchor, popup, viewport, gap): PopoverPlacement` and `<AnchoredPopover>`.

- [ ] **Step 1: Write failing geometry tests**

```js
assert.deepEqual(placePopover({left:450,right:500,top:350,bottom:380},{width:420,height:300},{width:600,height:500},6),{left:174,top:44,side:'top'});
assert.equal(placePopover({left:10,right:40,top:10,bottom:30},{width:300,height:220},{width:320,height:240},6).left>=6,true);
```

- [ ] **Step 2: Run and confirm RED**

Run: `node scripts/check-version42.cjs`

Expected: missing module failure.

- [ ] **Step 3: Implement geometry and focus behavior**

Clamp left/top to viewport margins, prefer bottom when it fits and top otherwise. Portal the popup to `document.body`; close on Escape/outside pointer and restore focus to the anchor.

- [ ] **Step 4: Migrate both pickers**

Language rows and shape tiles retain internal scrolling. Give listbox/dialog semantics and stable accessible names.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add src/popoverGeometry.ts src/AnchoredPopover.tsx src/LanguagePicker.tsx src/ShapeGallery.tsx src/version41.css scripts/check-version42.cjs
git commit -m "fix: keep editor popovers inside the viewport"
```

### Task 4: Notizstatus und iconografische Bereinigung

**Files:**
- Modify: `src/PersonalNotesPanel.tsx`
- Modify: `src/version41.css`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `noteStatusMessage(status): string` and five-second saved-state lifetime.

- [ ] **Step 1: Write failing tests**

```js
assert.equal(noteStatusMessage('idle'),'Diese Notiz ist nur für dich sichtbar.');
assert.equal(noteStatusMessage('saved'),'Gespeichert');
assert.equal(PERSONAL_NOTE_SAVED_MS,5000);
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version42.cjs`

- [ ] **Step 3: Implement minimal behavior**

Replace `📝` with `<Icon name="edit_note"/>`. On successful save, schedule status back to `idle` after 5000 ms and clean both save and status timers on key change/unmount. Errors remain until a successful save.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add src/PersonalNotesPanel.tsx src/version41.css scripts/check-version42.cjs
git commit -m "fix: clarify personal note status"
```

### Task 5: Video-Hinzufügen reparieren

**Files:**
- Create: `src/mediaSelection.ts`
- Modify: `src/App.tsx`
- Modify: `src/MediaBrowser.tsx`
- Modify: `electron/preload.ts`
- Modify: `electron/main.ts`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `MediaSelectionRequest { purpose:'service-item'; mediaKind:'video'; sectionId:string }` and `createVideoItemFromAsset(asset, sectionId)`.

- [ ] **Step 1: Write failing selection tests**

```js
assert.equal(createVideoItemFromAsset(videoAsset,'service').type,'video');
assert.equal(createVideoItemFromAsset(videoAsset,'service').slides[0].elements[0].type,'video');
assert.throws(()=>createVideoItemFromAsset(imageAsset,'service'),/VIDEO_ASSET_REQUIRED/);
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version42.cjs`

- [ ] **Step 3: Implement typed request and return path**

Send the full request through `media-window:open`, retain it in the media window, and include it in `media:selected`. In the operator window, create exactly one ServiceItem and one full-canvas video element after a valid selection. Do nothing on cancellation.

- [ ] **Step 4: Preserve URL providers**

YouTube/Vimeo create web elements with validated embed URLs; direct HTTPS media creates video elements. Reject non-HTTPS remote input with a visible error.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add src/mediaSelection.ts src/App.tsx src/MediaBrowser.tsx electron/main.ts electron/preload.ts scripts/check-version42.cjs
git commit -m "fix: restore typed video item selection"
```

### Task 6: Radiosuche und Übernahme stabilisieren

**Files:**
- Modify: `electron/RadioBrowserClient.ts`
- Modify: `src/radioStations.ts`
- Modify: `src/RadioStationBrowser.tsx`
- Modify: `src/BackgroundAudioPanel.tsx`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `searchRadioStations(query, fetcher): Promise<RadioSearchResult>` with typed error codes and `radioStationToTrack(station)`.

- [ ] **Step 1: Write failing fallback tests**

```js
const result=await searchRadioStations('Worship',fetchFirstFailsSecondWorks);
assert.equal(result.stations[0].url.startsWith('https://'),true);
assert.equal(result.attemptedMirrors,2);
assert.equal(radioStationToTrack(result.stations[0]).source,'radio-browser');
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version42.cjs`

- [ ] **Step 3: Implement deterministic mirror fallback**

Use sequential HTTPS mirrors, five-second timeout, 1 MiB limit and normalized error codes `NETWORK`, `TIMEOUT`, `NO_RESULTS`, `NO_PLAYABLE_STREAMS`. Retain only successful HTTPS streams.

- [ ] **Step 4: Unify preview and saved track URL**

Both use `station.urlResolved`. Display loading, empty and error states as sentences with retry action. Never autoplay search results.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add electron/RadioBrowserClient.ts src/radioStations.ts src/RadioStationBrowser.tsx src/BackgroundAudioPanel.tsx scripts/check-version42.cjs
git commit -m "fix: make radio search and selection reliable"
```

### Task 7: Einheitlicher SVG-Formenkatalog

**Files:**
- Modify: `src/shapeCatalog.ts`
- Create: `src/ShapeArtwork.tsx`
- Modify: `src/ShapeGallery.tsx`
- Modify: `src/SlideRenderer.tsx`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `ShapeDefinition { kind; name; category; viewBox; path }` and `<ShapeArtwork kind>`.

- [ ] **Step 1: Write failing completeness tests**

```js
for(const shape of shapeCatalog){assert.ok(shape.path||shape.paths,`${shape.kind} lacks artwork`)}
assert.notEqual(shapeByKind('church').path,shapeByKind('rectangle').path);
assert.equal(/[\u{1F300}-\u{1FAFF}]/u.test(shapeCatalog.map(x=>x.symbol??'').join('')),false);
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version42.cjs`

- [ ] **Step 3: Add genuine vector definitions**

Store normalized `viewBox="0 0 100 100"` paths for every catalog entry. Use original simple geometry or permissively licensed Material Symbols paths already distributed with the application; record attribution if an external permissive source is used.

- [ ] **Step 4: Share rendering**

`ShapeGallery` and `SlideRenderer` both render `ShapeArtwork`. Unknown kinds show an outlined question-mark placeholder and accessible label rather than a rectangle.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add src/shapeCatalog.ts src/ShapeArtwork.tsx src/ShapeGallery.tsx src/SlideRenderer.tsx scripts/check-version42.cjs
git commit -m "feat: render complete vector shape catalog"
```

### Task 8: Fünfstufige Anzeigegröße und Barrierefreiheit

**Files:**
- Modify: `src/preferences.ts`
- Create: `src/operatorAccessibility.ts`
- Modify: `src/App.tsx`
- Modify: `src/i18n.ts`
- Create: `src/version42.css`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `OperatorScale = 0|1|2|3|4`, `operatorScaleFactor(scale)`, new accessibility preference booleans and root data attributes.

- [ ] **Step 1: Write failing scale tests**

```js
assert.deepEqual([0,1,2,3,4].map(operatorScaleFactor),[0.85,0.925,1,1.1,1.2]);
assert.equal(normalizeOperatorScale(9),4);
assert.equal(normalizeOperatorScale(-2),0);
```

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version42.cjs`

- [ ] **Step 3: Add persisted preferences and stepped slider**

Use `min=0`, `max=4`, `step=1`, datalist labels and visible selected label. Apply `--operator-scale` only to `.app:not(.output-app)`.

- [ ] **Step 4: Add accessibility controls**

Persist large controls, strong focus, high contrast, reduced transparency, underlined interactive text and non-color status cues. Apply operator-only data attributes and explanatory copy.

- [ ] **Step 5: Verify output isolation and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add src/preferences.ts src/operatorAccessibility.ts src/App.tsx src/i18n.ts src/version42.css scripts/check-version42.cjs
git commit -m "feat: expand operator scaling and accessibility"
```

### Task 9: macOS 26 Liquid Glass und schattenlose Einzelvorschau

**Files:**
- Create: `electron/platformAppearance.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/App.tsx`
- Modify: `src/version42.css`
- Modify: `src/preview-workspace.css`
- Test: `scripts/check-version42.cjs`

**Interfaces:**
- Produces: `platformAppearance(platform, release): {liquidGlass:boolean; vibrancy?:string}` and `desktop.platform.appearance()`.

- [ ] **Step 1: Write failing platform tests**

```js
assert.equal(platformAppearance('darwin','25.0.0').liquidGlass,true);
assert.equal(platformAppearance('darwin','24.6.0').liquidGlass,false);
assert.equal(platformAppearance('win32','10.0.0').liquidGlass,false);
```

Darwin 25 corresponds to macOS 26 in the Electron/Node kernel version check.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-version42.cjs`

- [ ] **Step 3: Configure the Electron window safely**

On supported macOS, use transparent title-bar/vibrancy options supported by Electron. Return a capability flag to React. Do not alter output windows.

- [ ] **Step 4: Apply controlled materials**

Set `data-liquid-glass=true` only on the operator root. Style navigation, sidebars, toolbars and transient popovers. Disable backdrop filtering when reduced transparency is active.

- [ ] **Step 5: Remove only the single-preview slide shadow**

Target the single-preview canvas selector explicitly with `box-shadow:none`; leave grid thumbnails and dialogs unchanged.

- [ ] **Step 6: Verify and commit**

Run: `node scripts/check-version42.cjs && npm run typecheck`

```powershell
git add electron/platformAppearance.ts electron/main.ts electron/preload.ts src/App.tsx src/version42.css src/preview-workspace.css scripts/check-version42.cjs
git commit -m "feat: add macOS glass appearance and clean preview"
```

### Task 10: Version, Hilfe, vollständige Prüfung und Veröffentlichung

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `public/releases.json`
- Modify: `RELEASE_NOTES.md`
- Modify: `.github/workflows/release.yml`
- Modify: `src/helpV39.ts`
- Modify: `scripts/check-release-notes.cjs`

**Interfaces:**
- Consumes: all finished 0.42 functionality.
- Produces: public release `v0.42.0` and update metadata.

- [ ] **Step 1: Extend release assertions before changing metadata**

Assert package version and sole current manifest entry are `0.42.0`; notes mention real language-pack state, loop-only menus, video, radio, vectors, accessibility, five scale levels, macOS 26 and shadowless single preview. Assert 1.0 remains exactly `Los gehts!`.

- [ ] **Step 2: Confirm RED**

Run: `node scripts/check-release-notes.cjs`

Expected: FAIL on version/current release.

- [ ] **Step 3: Update version and long release notes**

Run: `npm version 0.42.0 --no-git-tag-version`

Add a complete German and English manifest entry, set 0.41.0 `current:false`, prepend `RELEASE_NOTES.md`, extend help and add `check-version42.cjs` to CI.

- [ ] **Step 4: Run full local verification**

```powershell
npm run typecheck
node scripts/check-version39.cjs
node scripts/check-version40.cjs
node scripts/check-version41.cjs
node scripts/check-version42.cjs
npm run build
npm run installer
```

Expected: all commands exit 0; installer, blockmap and `latest.yml` contain 0.42.0.

- [ ] **Step 5: Self-review the complete diff**

Check spec coverage, no emoji UI text, no output selectors carrying operator preferences, no unchecked external URLs, and no tracked build artifacts.

- [ ] **Step 6: Commit and publish**

```powershell
git add package.json package-lock.json public/releases.json RELEASE_NOTES.md .github/workflows/release.yml src/helpV39.ts scripts/check-release-notes.cjs
git commit -m "release: publish version 0.42.0"
git tag -a v0.42.0 -m "GottesdienstRegie 0.42.0"
git push origin main
git push origin v0.42.0
```

- [ ] **Step 7: Verify public availability**

Wait for the tag workflow. Confirm GitHub release is non-draft, Windows/macOS/Linux assets exist, `latest.yml` is downloadable, `public/releases.json` exposes 0.42.0 as the only current version, and the in-app update endpoint discovers it.
