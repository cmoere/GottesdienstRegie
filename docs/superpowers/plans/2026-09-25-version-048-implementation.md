# GottesdienstRegie 0.48.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship version 0.48.0 with a reliable desktop-sized startup, cross-links between desktop and web, a redesigned media workflow, downloadable licensed-safe Bible packs and timer-independent MAIN quick overlays.

**Architecture:** Extract testable pure state and validation modules from the existing large React and Electron entrypoints, then let the existing windows and stores consume those interfaces. Media usage and Bible package installation are persisted by Electron repositories; React owns presentation-only dialog state. MAIN quick overlays remain a separate layer over immutable live snapshots.

**Tech Stack:** Electron, React 19, TypeScript, Zustand, Vitest, Testing Library, Playwright, Vite, electron-builder.

**Spec:** `docs/superpowers/specs/2026-09-25-version-048-design.md`

## Global Constraints

- Release version is exactly `0.48.0`.
- Default Bible translation is Luther 1912.
- The catalog target is 26 German and 4 English records, but the normal picker shows only installed or legally direct-installable records.
- Protected translations without an integrated redistribution license are hidden, not presented with a warning status.
- Public Bible downloads use fixed HTTPS release URLs, SHA-256 verification, schema validation and atomic activation without a personal API key.
- Media names contain 1–300 trimmed characters and are always rendered as text.
- `lastUsedAt` changes only when a medium is applied, never when selected or renamed.
- MAIN quick overlays are not replaced by slide timers, service-item countdowns or ordinary live-navigation events.
- External links are restricted to the fixed HTTPS web-editor and latest-release URLs.
- Existing presentation, media and preference data remain backward compatible.
- No new runtime dependency is added unless an existing platform API cannot satisfy the requirement.

## Review Focus

- Renderer readiness never arrives: the operator window still appears at valid desktop bounds and remains resizable; covered by Task 1 window-policy tests.
- A media title is whitespace-only or 301 characters: saving is refused without mutating the repository; covered by Tasks 3 and 4.
- A Bible manifest has a valid URL but the wrong checksum or a path traversal name: installation fails and no active package appears; covered by Task 7.
- A user changes slides while a Bible or countdown quick screen is visible: the quick screen stays visible and restoration uses the latest normal snapshot; covered by Task 9.
- Reduced-motion is enabled during AI generation: loading state changes remain understandable without animated transforms; covered by Task 6.

---

### Task 1: Make operator-window startup independent of renderer readiness

**Files:**
- Create: `electron/windowStartup.ts`
- Create: `electron/windowStartup.test.ts`
- Modify: `electron/main.ts:84-122`

**Interfaces:**
- Consumes: `AppPreferencesData`, Electron `Display` work-area geometry.
- Produces: `resolveOperatorWindowStartup(preferences, displays, primaryId): OperatorWindowStartup` where the result contains `bounds`, `startMode`, `minimumSize`, `resizable` and `maximizable`.

- [ ] **Step 1: Write the failing policy tests**

```ts
import {describe, expect, it} from 'vitest';
import {resolveOperatorWindowStartup} from './windowStartup';

const displays=[{id:1,workArea:{x:0,y:0,width:1920,height:1040},bounds:{x:0,y:0,width:1920,height:1080}}];

describe('resolveOperatorWindowStartup',()=>{
  it('starts at desktop bounds without waiting for lifecycle ready',()=>{
    const result=resolveOperatorWindowStartup({windowStartMode:'window',operatorDisplayTarget:'primary'},displays,1);
    expect(result.bounds.width).toBeGreaterThanOrEqual(960);
    expect(result.bounds.height).toBeGreaterThanOrEqual(620);
    expect(result.resizable).toBe(true);
    expect(result.maximizable).toBe(true);
  });
  it('discards stored bounds that do not intersect an attached display',()=>{
    const result=resolveOperatorWindowStartup({windowStartMode:'restore',operatorDisplayTarget:'last',lastDisplayId:99,lastWindowState:'window',bounds:{x:9000,y:9000,width:410,height:700}},displays,1);
    expect(result.bounds.x).toBeGreaterThanOrEqual(0);
    expect(result.bounds.width).toBeGreaterThanOrEqual(960);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run electron/windowStartup.test.ts --reporter=verbose`

Expected: FAIL because `./windowStartup` does not exist.

- [ ] **Step 3: Implement the pure startup policy**

```ts
export function resolveOperatorWindowStartup(preferences:Partial<AppPreferencesData>,displays:DisplayGeometry[],primaryId:number):OperatorWindowStartup {
  const primary=displays.find(display=>display.id===primaryId)??displays[0];
  const requested=preferences.operatorDisplayTarget==='last'?displays.find(display=>display.id===preferences.lastDisplayId):undefined;
  const target=requested??primary;
  const stored=preferences.bounds;
  const visible=Boolean(stored&&displays.some(display=>intersects(stored,display.bounds)));
  const bounds=visible?stored!:{x:target.workArea.x+Math.round(target.workArea.width*.05),y:target.workArea.y+Math.round(target.workArea.height*.05),width:Math.max(960,Math.round(target.workArea.width*.9)),height:Math.max(620,Math.round(target.workArea.height*.9))};
  return {bounds,startMode:preferences.windowStartMode==='restore'?(preferences.lastWindowState??'fullscreen'):(preferences.windowStartMode??'fullscreen'),minimumSize:{width:960,height:620},resizable:true,maximizable:true};
}
```

- [ ] **Step 4: Integrate it into `createControlWindow`**

Construct `BrowserWindow` with the resolved bounds, minimum size, `resizable:true` and `maximizable:true`. Remove the `410x700` bootstrap, `center()` and readiness-dependent bound mutation. Keep `lifecycle:ready` only as an idempotent application-readiness signal. Apply fullscreen/maximized once from `ready-to-show` after the window has desktop bounds.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run electron/windowStartup.test.ts --reporter=verbose && npm run typecheck`

```bash
git add electron/windowStartup.ts electron/windowStartup.test.ts electron/main.ts
git commit -m "fix: open operator window at desktop size"
```

### Task 2: Add safe desktop/web cross-links

**Files:**
- Create: `src/platformLinks.ts`
- Create: `src/platformLinks.test.ts`
- Modify: `src/App.tsx` help/about menu construction
- Modify: `src/platform/CapabilityNotice.tsx`
- Modify: `src/platform/CapabilityNotice.test.tsx`

**Interfaces:**
- Produces: `WEB_EDITOR_URL`, `DESKTOP_RELEASE_URL`, `platformLinkFor(action:'web-editor'|'desktop-download'):string`.
- Consumes: existing `window.desktop.openExternal` and web `window.open` behavior.

- [ ] **Step 1: Write failing URL and platform-rendering tests**

```ts
it('uses only the approved public destinations',()=>{
  expect(platformLinkFor('web-editor')).toBe('https://cmoere.github.io/GottesdienstRegie/editor/');
  expect(platformLinkFor('desktop-download')).toBe('https://github.com/cmoere/GottesdienstRegie/releases/latest');
});
```

Extend `CapabilityNotice.test.tsx` to render web capabilities and expect a link named `Desktop-App herunterladen`. Add an App menu assertion for `Webversion öffnen` when desktop services exist.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/platformLinks.test.ts src/platform/CapabilityNotice.test.tsx --reporter=verbose`

Expected: FAIL because URLs and links are not implemented.

- [ ] **Step 3: Implement fixed URL helpers and UI links**

```ts
export const WEB_EDITOR_URL='https://cmoere.github.io/GottesdienstRegie/editor/';
export const DESKTOP_RELEASE_URL='https://github.com/cmoere/GottesdienstRegie/releases/latest';
export const platformLinkFor=(action:'web-editor'|'desktop-download')=>action==='web-editor'?WEB_EDITOR_URL:DESKTOP_RELEASE_URL;
```

Desktop clicks call `window.desktop.openExternal(WEB_EDITOR_URL)`. Web links use an ordinary safe anchor to `DESKTOP_RELEASE_URL` with `target="_blank"` and `rel="noopener noreferrer"`.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/platformLinks.test.ts src/platform/CapabilityNotice.test.tsx --reporter=verbose && npm run typecheck`

```bash
git add src/platformLinks.ts src/platformLinks.test.ts src/platform/CapabilityNotice.tsx src/platform/CapabilityNotice.test.tsx src/App.tsx
git commit -m "feat: connect desktop and web editions"
```

### Task 3: Define media metadata, name validation and recent ordering

**Files:**
- Create: `src/mediaLibraryModel.ts`
- Create: `src/mediaLibraryModel.test.ts`
- Modify: `src/platform/types.ts`
- Modify: `electron/MediaRepository.ts`
- Create: `electron/MediaRepository.test.ts`

**Interfaces:**
- Extends `MediaAsset` and `CloudMediaAsset` with `aiGenerated?:boolean` and `lastUsedAt?:string`.
- Produces: `validateMediaName(value):{ok:true;value:string}|{ok:false;reason:'empty'|'too-long'}`, `isAiGenerated(asset):boolean`, `sortRecentlyUsed(items):CloudMediaAsset[]`.
- Adds `MediaRepository.markUsed(id:string, usedAt?:string):Promise<MediaAsset>`.

- [ ] **Step 1: Write failing pure-model tests**

```ts
it.each([['',false],['   ',false],['a'.repeat(300),true],['a'.repeat(301),false]])('validates media name length', (value,ok)=>expect(validateMediaName(value).ok).toBe(ok));

it('does not treat metadata updates as recent use',()=>{
  const items=[asset({id:'edited',updatedAt:'2026-09-25T12:00:00Z'}),asset({id:'used',updatedAt:'2026-09-20T12:00:00Z',lastUsedAt:'2026-09-24T12:00:00Z'})];
  expect(sortRecentlyUsed(items).map(item=>item.id)).toEqual(['used']);
});

it('migrates the historical KI tag',()=>{
  expect(isAiGenerated(asset({tags:['KI-generiert']}))).toBe(true);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/mediaLibraryModel.test.ts --reporter=verbose`

- [ ] **Step 3: Implement model helpers and repository persistence**

The repository `update` method rejects invalid names before mutation. `list()` derives `aiGenerated` from the legacy tag when the boolean is absent. `markUsed` only patches `lastUsedAt`, leaving `updatedAt` unchanged so usage does not masquerade as editing.

- [ ] **Step 4: Add repository behavior tests**

Use a temporary directory. Import a fixture, rename it, mark it used and assert that `updatedAt` changes only on rename while `lastUsedAt` changes only on `markUsed`. Assert a 301-character rename throws `MEDIA_NAME_TOO_LONG` and the old name remains.

- [ ] **Step 5: Verify and commit**

Run: `npx vitest run src/mediaLibraryModel.test.ts electron/MediaRepository.test.ts --reporter=verbose && npm run typecheck`

```bash
git add src/mediaLibraryModel.ts src/mediaLibraryModel.test.ts src/platform/types.ts electron/MediaRepository.ts electron/MediaRepository.test.ts
git commit -m "feat: track media usage and generation metadata"
```

### Task 4: Expose media rename and usage through the Electron bridge

**Files:**
- Modify: `electron/main.ts` media IPC handlers
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/platform/types.ts`
- Modify: `src/platform/electron/createElectronServices.ts`
- Modify: `src/platform/electron/createElectronServices.test.ts`

**Interfaces:**
- Adds bridge method `media.markUsed(id:string):Promise<MediaAsset>`.
- Reuses `media.update(id,{name})` for rename after repository validation.

- [ ] **Step 1: Extend the failing Electron service contract test**

Assert that `createElectronServices(window.desktop)` exposes a callable media `markUsed` service and forwards exactly one ID.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/platform/electron/createElectronServices.test.ts --reporter=verbose`

- [ ] **Step 3: Add IPC, preload and service adapters**

Register `media:mark-used`, expose it through preload, type it in `vite-env.d.ts`, and map it in the Electron platform service. Do not add a second rename IPC because `media:update` already provides the required validated mutation.

- [ ] **Step 4: Verify and commit**

Run: `npx vitest run src/platform/electron/createElectronServices.test.ts --reporter=verbose && npm run typecheck`

```bash
git add electron/main.ts electron/preload.ts src/vite-env.d.ts src/platform/types.ts src/platform/electron/createElectronServices.ts src/platform/electron/createElectronServices.test.ts
git commit -m "feat: expose media usage tracking"
```

### Task 5: Redesign media selection details, zoom, rename and recents

**Files:**
- Create: `src/MediaDetailPanel.tsx`
- Create: `src/MediaDetailPanel.test.tsx`
- Create: `src/MediaZoomDialog.tsx`
- Create: `src/MediaZoomDialog.test.tsx`
- Modify: `src/MediaBrowser.tsx`
- Modify: `src/media-browser.css`
- Modify: `src/media-browser-fixes.css`

**Interfaces:**
- `MediaDetailPanel` consumes `{asset,onRename,onFavorite,onDelete,onZoom,busy}`.
- `MediaZoomDialog` consumes `{asset,onClose}` and owns bounded zoom state from fit through 400 percent.
- `MediaBrowser.useSelected()` calls `api.markUsed(selected.id)` only after successful selection/application.

- [ ] **Step 1: Write failing detail-panel tests**

Test the `42/300` counter, rejection of empty and 301-character names, `smart_toy` plus `KI-generiert: Ja/Nein`, and absence of duplicate top-bar favorite/delete buttons.

- [ ] **Step 2: Write failing zoom-modal tests**

Render an image, open zoom, assert controls for fit, 100 percent, plus and minus, then assert Escape closes and the backdrop prevents underlying pointer actions.

- [ ] **Step 3: Run and verify RED**

Run: `npx vitest run src/MediaDetailPanel.test.tsx src/MediaZoomDialog.test.tsx --reporter=verbose`

- [ ] **Step 4: Implement focused components**

Keep rename draft local until Save. Render names with JSX text nodes only. Clamp zoom to `[0.25,4]`. Move favorite and delete into the detail panel.

- [ ] **Step 5: Recompose `MediaBrowser`**

Use the three-column body, set upload button `margin-inline-start:auto`, replace recent filtering on `updatedAt` with `sortRecentlyUsed`, and call `markUsed` after successful select, background application or playlist submission.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/MediaDetailPanel.test.tsx src/MediaZoomDialog.test.tsx src/mediaLibraryModel.test.ts --reporter=verbose && npm run typecheck`

```bash
git add src/MediaDetailPanel.tsx src/MediaDetailPanel.test.tsx src/MediaZoomDialog.tsx src/MediaZoomDialog.test.tsx src/MediaBrowser.tsx src/media-browser.css src/media-browser-fixes.css
git commit -m "feat: redesign media details and recent usage"
```

### Task 6: Rebuild AI motif workflow with 15 accessible loading variants and retry

**Files:**
- Create: `src/AiGenerationStatus.tsx`
- Create: `src/AiGenerationStatus.test.tsx`
- Create: `src/aiGenerationModel.ts`
- Create: `src/aiGenerationModel.test.ts`
- Modify: `src/MediaBrowser.tsx`
- Modify: `src/media-browser.css`

**Interfaces:**
- Produces `AI_LOADING_VARIANTS` as an immutable array of exactly or more than 15 named variants.
- Produces `nextLoadingVariant(current:number,total:number):number`.
- `AiGenerationStatus` consumes `{active,error,onRetry,reducedMotion}`.

- [ ] **Step 1: Write failing model tests**

```ts
it('provides at least fifteen distinct loading variants',()=>{
  expect(AI_LOADING_VARIANTS.length).toBeGreaterThanOrEqual(15);
  expect(new Set(AI_LOADING_VARIANTS.map(item=>item.id)).size).toBe(AI_LOADING_VARIANTS.length);
});
it('cycles back to the first variant',()=>expect(nextLoadingVariant(14,15)).toBe(0));
```

- [ ] **Step 2: Write failing component tests**

Assert timed variant changes with fake timers, no animated class when reduced motion is true, stable `aria-live` copy, and a compact `Erneut versuchen` button after error that invokes the supplied retry once.

- [ ] **Step 3: Run and verify RED**

Run: `npx vitest run src/aiGenerationModel.test.ts src/AiGenerationStatus.test.tsx --reporter=verbose`

- [ ] **Step 4: Implement the model and status component**

Use 15 CSS variants based on gradients, dots, rings, scan lines and simple geometric transforms. Do not report fake percentages. Under reduced motion, show the current static symbol and rotate only the explanatory text at a slower interval.

- [ ] **Step 5: Recompose the KI editor**

Keep prompt, output type, scene, style and duration in one visible form; render status/result beside it. Preserve all settings on failure. `onRetry` calls the same `generateLocal` path with the current state. Generated assets set `aiGenerated:true` in addition to the compatibility tag.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/aiGenerationModel.test.ts src/AiGenerationStatus.test.tsx --reporter=verbose && npm run typecheck`

```bash
git add src/AiGenerationStatus.tsx src/AiGenerationStatus.test.tsx src/aiGenerationModel.ts src/aiGenerationModel.test.ts src/MediaBrowser.tsx src/media-browser.css
git commit -m "feat: rebuild AI motif creation workflow"
```

### Task 7: Implement safe downloadable Bible packages

**Files:**
- Create: `src/bible/catalog.ts`
- Create: `src/bible/catalog.test.ts`
- Create: `electron/BiblePackService.ts`
- Create: `electron/BiblePackService.test.ts`
- Create: `public/bible/catalog.json`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- `BibleCatalogEntry={id,language:'de'|'en',name,shortName,scope,version,sourceUrl,licenseName,licenseUrl,attribution,downloadUrl,sha256,size,availability:'downloadable'|'licensed'}`.
- `visibleBibleEntries(entries,installedIds)` returns only installed or downloadable entries.
- `BiblePackService.install(entry,signal?)`, `.listInstalled()`, `.read(reference,translationId)`.

- [ ] **Step 1: Write failing catalog visibility tests**

Create 26 German and 4 English fixture records. Assert that `licensed` entries disappear, installed entries remain, Luther 1912 sorts first, and the four English IDs are KJV, ASV, WEB and BSB.

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/bible/catalog.test.ts --reporter=verbose`

- [ ] **Step 3: Implement catalog types and checked-in manifest**

The manifest may contain hidden licensed records to preserve the 26/4 target model, but must not include a `downloadUrl` for them. Downloadable records require a verified source, license URL and 64-character SHA-256. The UI never receives hidden records from `visibleBibleEntries`.

- [ ] **Step 4: Write failing package-service tests**

Use a temporary root and injected `fetch`. Cover successful atomic installation, wrong checksum, invalid schema, `../` path traversal content, abort cleanup and Luther-1912 fallback. Assert no failed package appears from `listInstalled()`.

- [ ] **Step 5: Implement streaming download and atomic activation**

Write to `<id>.<nonce>.tmp`, hash bytes while streaming, parse only after checksum success, validate `books -> chapters -> verses` string maps, then rename to `<id>/<version>/bible.json`. Store source and attribution beside the text.

- [ ] **Step 6: Expose Bible IPC and preload methods**

Add catalog, installed, install, progress and read channels. Restrict downloads to the manifest URL and entry URL selected by ID; never accept an arbitrary renderer URL.

- [ ] **Step 7: Verify and commit**

Run: `npx vitest run src/bible/catalog.test.ts electron/BiblePackService.test.ts --reporter=verbose && npm run typecheck`

```bash
git add src/bible/catalog.ts src/bible/catalog.test.ts electron/BiblePackService.ts electron/BiblePackService.test.ts public/bible/catalog.json electron/main.ts electron/preload.ts src/vite-env.d.ts
git commit -m "feat: add verified offline Bible packages"
```

### Task 8: Build the Bible reference parser and modal preview

**Files:**
- Create: `src/bible/reference.ts`
- Create: `src/bible/reference.test.ts`
- Create: `src/BibleTextDialog.tsx`
- Create: `src/BibleTextDialog.test.tsx`
- Modify: `src/App.tsx` Bible command
- Modify: `src/styles.css`

**Interfaces:**
- `parseBibleReference(value:string):ParsedBibleReference|ReferenceError` supports `Johannes 3,16`, `Joh 3:16-18` and structured book/chapter/verse fields.
- `BibleTextDialog` consumes installed/catalog services and calls `onShow({translationId,reference,text,attribution})`.

- [ ] **Step 1: Write failing parser tests**

Cover full German book name, common abbreviation, comma/colon separators, reversed range, unknown book, zero chapter and missing verse.

- [ ] **Step 2: Run and verify parser RED**

Run: `npx vitest run src/bible/reference.test.ts --reporter=verbose`

- [ ] **Step 3: Implement the parser and canonical reference output**

Return either `{ok:true,book:'JHN',chapter:3,fromVerse:16,toVerse:18,label:'Johannes 3,16–18'}` or `{ok:false,message:string}`. Keep the alias table local and immutable.

- [ ] **Step 4: Write failing dialog tests**

Assert Luther 1912 default, picker visibility rules, install action with progress, preview before MAIN, no `onShow` on invalid/missing verse, and exact `onShow` payload after valid preview.

- [ ] **Step 5: Implement modal behavior and replace command copy**

Rename the command to `Bibeltext anzeigen`. Opening it creates no service item. Focus starts in reference search, Escape closes, and the background is inert. Remember the last explicit translation in local preferences but fall back to Luther 1912 when unavailable.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/bible/reference.test.ts src/BibleTextDialog.test.tsx --reporter=verbose && npm run typecheck`

```bash
git add src/bible/reference.ts src/bible/reference.test.ts src/BibleTextDialog.tsx src/BibleTextDialog.test.tsx src/App.tsx src/styles.css
git commit -m "feat: add Bible search and preview dialog"
```

### Task 9: Isolate MAIN quick overlays from slide and countdown timing

**Files:**
- Create: `src/live/quickOverlayState.ts`
- Create: `src/live/quickOverlayState.test.ts`
- Modify: `src/preferences.ts` quick-screen type definitions
- Modify: `src/QuickOverlay.tsx`
- Modify: `src/App.tsx` live/quick command handling
- Modify: `src/ProductionWorkspace.tsx`

**Interfaces:**
- Adds quick type `bible` with `reference`, `text`, `translation` and `attribution`.
- Produces reducer `reduceQuickOverlay(state,event):QuickOverlayState` with events `SHOW_QUICK`, `UPDATE_NORMAL_SNAPSHOT`, `QUICK_TICK`, `RESTORE`, `CLEAR`.

- [ ] **Step 1: Write failing reducer tests**

```ts
it('keeps a Bible overlay visible while normal slides advance',()=>{
  const shown=reduceQuickOverlay(initial,{type:'SHOW_QUICK',quick:bibleQuick,normalSnapshot:slideA});
  const advanced=reduceQuickOverlay(shown,{type:'UPDATE_NORMAL_SNAPSHOT',snapshot:slideB});
  expect(advanced.visibleQuick).toEqual(bibleQuick);
  expect(reduceQuickOverlay(advanced,{type:'RESTORE'}).normalSnapshot).toEqual(slideB);
});
it('updates only countdown quick time on a quick tick',()=>{
  const next=reduceQuickOverlay(countdownState,{type:'QUICK_TICK'});
  expect(next.visibleQuick?.remainingSeconds).toBe(299);
  expect(next.normalSnapshot).toEqual(countdownState.normalSnapshot);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run src/live/quickOverlayState.test.ts --reporter=verbose`

- [ ] **Step 3: Implement reducer and integrate live commands**

Normal slide navigation updates the stored normal snapshot even while the quick layer remains visible. Timer callbacks dispatch `UPDATE_NORMAL_SNAPSHOT` or `QUICK_TICK` to the correct layer and never call the quick-clear path.

- [ ] **Step 4: Render the Bible quick overlay**

Show reference, text, translation and attribution with output-safe contrast. The preview sidebar treats it like every other quick screen. `MAIN-FOLIE WIEDERHERSTELLEN` dispatches `RESTORE`.

- [ ] **Step 5: Connect `BibleTextDialog.onShow`**

Build an ephemeral quick config and send it through the same `SHOW_QUICK` path. Do not insert it into persistent quick-screen settings or the service order.

- [ ] **Step 6: Verify and commit**

Run: `npx vitest run src/live/quickOverlayState.test.ts src/BibleTextDialog.test.tsx --reporter=verbose && npm run typecheck`

```bash
git add src/live/quickOverlayState.ts src/live/quickOverlayState.test.ts src/preferences.ts src/QuickOverlay.tsx src/App.tsx src/ProductionWorkspace.tsx
git commit -m "feat: add timer-independent Bible quick overlay"
```

### Task 10: Add browser regression coverage and accessibility checks

**Files:**
- Modify: `tests/smoke/browser-shell.spec.ts`
- Create: `tests/smoke/media-browser.spec.ts`
- Modify: `playwright.config.ts` only if a second route needs a named project.

**Interfaces:**
- Consumes the finished UI routes and fixed public links.
- Produces end-to-end coverage only; no production interface.

- [ ] **Step 1: Add failing web-link test**

At desktop width in the web build, expect `Desktop-App herunterladen` and an href ending in `/releases/latest`.

- [ ] **Step 2: Add failing responsive media layout test**

Open the media route with fixture platform services, select an image, assert three visible columns, upload button aligned after filters, one favorite action, one delete action, zoom dialog and `0/300`-style name count.

- [ ] **Step 3: Run and verify RED**

Run: `npm run test:web -- --grep "Desktop-App|Medienbrowser"`

- [ ] **Step 4: Make only test-harness adjustments required by the real UI**

Inject deterministic media fixtures through the existing web platform adapter. Do not add production-only test switches.

- [ ] **Step 5: Verify and commit**

Run: `npm run test:web`

```bash
git add tests/smoke/browser-shell.spec.ts tests/smoke/media-browser.spec.ts playwright.config.ts
git commit -m "test: cover version 0.48 browser workflows"
```

### Task 11: Prepare and publish version 0.48.0

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `public/releases.json`
- Create: `scripts/check-version48.cjs`
- Modify: `scripts/check-version47.cjs`
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Produces release metadata and CI gate for 0.48.0.
- Consumes all prior tasks and their tests.

- [ ] **Step 1: Write the failing release check**

`check-version48.cjs` asserts package version `0.48.0`, only 0.48.0 is current, release notes mention complete startup, media redesign, AI retry/loading, safe Bible downloads and quick-overlay isolation, and the release workflow invokes the check.

- [ ] **Step 2: Run and verify RED**

Run: `node scripts/check-version48.cjs`

Expected: FAIL while package metadata remains 0.47.0.

- [ ] **Step 3: Update version and detailed release metadata**

Run: `npm version 0.48.0 --no-git-tag-version`

Prepend the release notes and changelog, insert 0.48.0 as current in `public/releases.json`, mark 0.47.0 non-current, make the 0.47 checker forward-compatible, and add the 0.48 checker to the release workflow.

- [ ] **Step 4: Run the complete verification suite**

```powershell
node scripts/generate-terms.cjs
node scripts/check-version39.cjs
node scripts/check-version40.cjs
node scripts/check-version41.cjs
node scripts/check-version42.cjs
node scripts/check-version43.cjs
node scripts/check-version431.cjs
node scripts/check-version44.cjs
node scripts/check-version45.cjs
node scripts/check-version451.cjs
node scripts/check-version46.cjs
node scripts/check-version47.cjs
node scripts/check-version48.cjs
npm run test:unit
npm run typecheck
npm run build
npm run build:web
npm run test:web
```

Expected: every command exits 0. Chunk-size warnings may remain informational; test, type or build failures may not be ignored.

- [ ] **Step 5: Commit release preparation**

```bash
git add package.json package-lock.json CHANGELOG.md RELEASE_NOTES.md public/releases.json scripts/check-version47.cjs scripts/check-version48.cjs .github/workflows/release.yml
git commit -m "release: prepare version 0.48.0"
```

- [ ] **Step 6: Publish only after verification**

Fetch `origin/main`, verify it is an ancestor of HEAD, push HEAD to main, create annotated tag `v0.48.0`, and push the tag. Monitor the release workflow until `latest.yml`, `latest-mac.yml` and `latest-linux.yml` return a redirect or successful response. Confirm the GitHub Pages editor exposes the new desktop-download link.

## Final self-review checklist

- Every numbered section of the approved spec maps to Tasks 1–11.
- The plan never requires a renderer-supplied arbitrary download URL.
- The media metadata names are consistent: `aiGenerated` and `lastUsedAt`.
- The Bible quick type and reducer event names remain consistent through Tasks 8 and 9.
- The tests cover all five Review Focus failure modes.
- Release publication is after, not before, the full verification suite.
