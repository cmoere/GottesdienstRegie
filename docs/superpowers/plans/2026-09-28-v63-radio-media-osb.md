# GottesdienstRegie V63 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Release V63 with the general AI helper removed, improved loop/audio/radio workflows, local downloadable media generation, and centrally managed device-level OSB defaults used by F9.

**Architecture:** Keep the six feature areas isolated behind small domain models and Electron bridges. UI components consume normalized data and never parse raw radio streams, manage model files, or own device-level OSB persistence. MAIN receives a fully resolved quick-overlay payload while editor settings and previews remain local.

**Tech Stack:** React 19, TypeScript, Zustand, Electron IPC, Vitest/Testing Library, Node streams, `stable-diffusion.cpp` command runtime downloaded as a verified optional media model pack.

**Spec:** `docs/superpowers/specs/2026-09-28-v63-radio-media-osb-design.md`

## Global Constraints

- Releaseversion is `0.63.0`; release series is `0.63`.
- New visible controls use existing icons and no emoji.
- Popovers and dialogs have no shadows.
- `SELECTED` is not `LIVE`; settings preview never sends output to MAIN.
- OSB is a MAIN quick overlay and does not mutate presentation selection or live slide position.
- The general AI helper is removed; translation models and media-only generation remain.
- Media generation needs no personal API key and sends no prompt to an external inference service.
- Bible translation selectors show only available and permitted catalog entries.
- Every production-code change follows RED, GREEN, REFACTOR and receives a focused commit.

## Review Focus

- A radio stream that interleaves malformed or oversized ICY metadata must keep playing and never leak metadata into the next station; Task 4 tests this.
- Removing the final audio track while playback is active must clear the assignment and stop or resync only that assignment; Task 3 tests this.
- Invalid or stale device-level OSB settings and missing translations must normalize without disabling the whole settings page; Task 6 tests this.
- Reopening F9 after changing the live slide must restore the most recent underlying live state, not an older snapshot; Task 7 tests this.
- Interrupted or corrupt media-model downloads must never be treated as installed and must be resumable; Task 5 tests this.

---

### Task 1: Remove the general AI helper

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/preferences.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/platform/capabilities.ts`
- Delete: `src/ai/AiAssistantPanel.tsx`
- Delete: `src/ai/AiAssistantPanel.test.tsx`
- Delete: `src/ai/AiSettings.tsx`
- Delete or detach helper-only controller/store/action/context/model files under `src/ai/`
- Delete or detach helper-only `electron/AiModelManager.ts` and tests
- Create: `src/aiFeatureRemoval.test.ts`

**Interfaces:**
- Consumes: existing app menu, settings navigation, preload bridge, and preference migration.
- Produces: no public runtime interface; old stored `aiAssistant` data is ignored during migration.

- [ ] **Step 1: Write failing removal tests**

Add `src/aiFeatureRemoval.test.ts` to assert exported navigation/menu descriptors contain no `KI-Helfer`, helper shortcut, helper settings tab, or `ai:generate` capability. Add a migration test showing an old preference payload containing `aiAssistant` loads without error but does not expose that setting.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/aiFeatureRemoval.test.ts`

Expected: FAIL because the helper button, settings tab, preference branch, and IPC bridge still exist.

- [ ] **Step 3: Remove helper surfaces and runtime wiring**

Remove the panel/controller setup, menu button, Escape handling, settings content, preference setter/default, IPC handlers, preload methods, capability flag, and helper-only model initialization. Preserve media generation and translation code even if it also uses model terminology. Remove help/tutorial copy that advertises the helper.

- [ ] **Step 4: Run focused and full tests**

Run: `npx vitest run src/aiFeatureRemoval.test.ts src/platform/capabilities.test.ts && npm run test:unit && npm run typecheck`

Expected: PASS; no compile references to deleted helper modules.

- [ ] **Step 5: Commit**

```powershell
git add -- src electron
git commit -m "refactor(ai): remove general assistant"
```

### Task 2: Split add-element groups and add `Läuft gerade`

**Files:**
- Create: `src/addElementCatalog.ts`
- Create: `src/addElementCatalog.test.ts`
- Create: `src/AddElementPopover.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/store.ts`
- Modify: `src/itemPlacementPolicy.ts`
- Modify: `src/itemPlacementPolicy.test.ts`
- Modify: `src/app.css` or the active versioned stylesheet owning the popover

**Interfaces:**
- Produces: `getAddElementGroups(section: ServiceSection): AddElementGroup[]`.
- Produces: new `ItemType` value `nowPlaying` with loop-only placement.
- Consumes: existing `canInsertItemType`, `addItem`, and the normal slide editor.

- [ ] **Step 1: Write catalog, placement, and outside-click tests**

Assert two named groups are always returned; loop entries are disabled with a short reason outside pre/post sections; `nowPlaying` is allowed only in mandatory loop sections. Render the popover and assert an outside `pointerdown` closes it while an inside click does not.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/addElementCatalog.test.ts src/AddElementPopover.test.tsx src/itemPlacementPolicy.test.ts`

Expected: FAIL because the catalog and `nowPlaying` type do not exist and outside-click behavior is incomplete.

- [ ] **Step 3: Implement grouped catalog and the loop item**

Extract menu data from `App.tsx`, render group headings and disabled explanations, and use a popover root ref with a capture-safe global pointer handler. Add `nowPlaying` to types, labels, icons, placement policy, normalization, and default slide generation. Default slide text is `Läuft gerade`; it remains fully editable in the existing editor.

- [ ] **Step 4: Run focused and full tests**

Run: `npx vitest run src/addElementCatalog.test.ts src/AddElementPopover.test.tsx src/itemPlacementPolicy.test.ts && npm run test:unit && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src
git commit -m "feat(flow): group add menu and add now-playing loop slide"
```

### Task 3: Add the compact assigned-audio popover

**Files:**
- Create: `src/AssignedAudioPopover.tsx`
- Create: `src/AssignedAudioPopover.test.tsx`
- Create: `src/assignedAudioModel.ts`
- Create: `src/assignedAudioModel.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/store.ts`
- Modify: `src/background-audio.css`

**Interfaces:**
- Produces: `removeAssignedTrack(config: BackgroundAudioConfig, assetId: string): BackgroundAudioConfig | undefined`.
- Produces: `AssignedAudioPopover({ targetType, targetId, config, onChange, onAdd, onClose })`.
- Consumes: existing `updateSectionAudio`, `updateItemAudio`, media-window audio selection, and `backgroundAudioEngine.sync`.

- [ ] **Step 1: Write model and component tests**

Test ordered title/artist rendering, Shuffle mutation, X removal, final-track removal returning `undefined`, `Audio hinzufügen`, keyboard close, and outside click. Test that section and item targets call the correct update callback.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/assignedAudioModel.test.ts src/AssignedAudioPopover.test.tsx`

Expected: FAIL because the model/component do not exist.

- [ ] **Step 3: Implement and connect speaker behavior**

Open the compact popover when a target has tracks. With no tracks, retain the direct audio-browser path. Persist Shuffle through the existing config, remove tracks by stable `assetId`, clear an empty assignment, and resync the active engine without changing slides or MAIN.

- [ ] **Step 4: Run focused and full tests**

Run: `npx vitest run src/assignedAudioModel.test.ts src/AssignedAudioPopover.test.tsx src/audioTimelineModel.test.ts && npm run test:unit && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- src
git commit -m "feat(audio): manage assigned tracks from speaker popover"
```

### Task 4: Read and display radio now-playing metadata

**Files:**
- Create: `electron/RadioMetadataService.ts`
- Create: `electron/RadioMetadataService.test.ts`
- Create: `src/radioNowPlaying.ts`
- Create: `src/radioNowPlaying.test.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/RadioStationBrowser.tsx`
- Modify: `src/RadioStationBrowser.test.tsx`

**Interfaces:**
- Produces: `RadioNowPlaying` from the spec.
- Produces: `RadioMetadataService.start(stationId: string, streamUrl: string, emit: (value: RadioNowPlaying) => void): () => void`.
- Produces bridge methods `radio.startMetadata`, `radio.stopMetadata`, and `radio.onMetadata` scoped by station ID.
- Consumes: HTTPS radio stream responses with `Icy-MetaData: 1` and `icy-metaint`.

- [ ] **Step 1: Write stream-parser and UI tests**

Use deterministic byte fixtures for audio blocks plus ICY metadata. Assert `StreamTitle='Artist - Title';` normalizes correctly, UTF-8/Latin-1 fallback is bounded, malformed and oversized blocks are ignored, cancellation closes the reader, and late events from the previous station are discarded. In the browser test assert title, artist, station fallback, artwork, and loading state.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run electron/RadioMetadataService.test.ts src/radioNowPlaying.test.ts src/RadioStationBrowser.test.tsx`

Expected: FAIL because the service and bridge do not exist and `liveTitle` is never populated.

- [ ] **Step 3: Implement metadata service and UI integration**

Parse only metadata intervals, cap a metadata block at 16 KiB, sanitize control characters, split on the first useful ` - ` separator, and preserve playback when metadata fails. Start metadata with preview playback; stop on pause, station change, unmount, or error. The renderer accepts events only for the current station ID.

- [ ] **Step 4: Run focused and full tests**

Run: `npx vitest run electron/RadioMetadataService.test.ts src/radioNowPlaying.test.ts src/RadioStationBrowser.test.tsx && npm run test:unit && npm run typecheck`

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- electron src
git commit -m "feat(radio): show live title and artist metadata"
```

### Task 5: Replace procedural motifs with a downloadable local media model

**Files:**
- Create: `electron/MediaModelManager.ts`
- Create: `electron/MediaModelManager.test.ts`
- Create: `electron/LocalMediaGenerationService.ts`
- Create: `electron/LocalMediaGenerationService.test.ts`
- Create: `src/mediaGeneration/types.ts`
- Create: `src/mediaGeneration/modelCatalog.ts`
- Create: `src/mediaGeneration/modelCatalog.test.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/MediaBrowser.tsx`
- Modify: `src/MediaBrowser.test.tsx`
- Modify: `src/StorageMaintenanceSettings.tsx` or current storage settings owner
- Modify: `package.json`

**Interfaces:**
- Produces: `MediaModelStatus`, `MediaModelProgress`, and `MediaGenerationRequest` types.
- Produces bridge namespace `mediaGeneration.status/download/cancel/remove/generate/onProgress`.
- Consumes: a version-pinned `stable-diffusion.cpp` executable and compatible openly licensed model artifact declared with platform URLs, byte sizes, licenses, and SHA-256 values in `modelCatalog.ts`.

- [ ] **Step 1: Write manager, runtime, and UI tests**

Test resumable `.partial` downloads, checksum rejection, atomic activation, cancellation, cleanup, platform selection, missing-model errors, unique seed generation, argument escaping, timeout/cancel process termination, PNG validation, preview-only generation, explicit save, and error retry. Confirm prompts appear only in local process arguments and never in HTTP inference requests.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run electron/MediaModelManager.test.ts electron/LocalMediaGenerationService.test.ts src/mediaGeneration/modelCatalog.test.ts src/MediaBrowser.test.tsx`

Expected: FAIL because the model manager/runtime bridge does not exist and `generateLocal` still creates procedural SVG.

- [ ] **Step 3: Implement optional pack management**

Implement pinned catalog downloads into the application user-data model directory. Keep executable and model inactive until all checksums pass, expose progress/cancel/remove, and include sizes/licenses in UI. Never bundle or silently download the pack.

- [ ] **Step 4: Implement local generation and media-browser flow**

Invoke the verified executable without a shell using an argument array. Generate a new cryptographic seed unless a test seed is supplied. Read only the expected output file, validate it as PNG, and return a temporary preview URL. Preserve existing explicit save and local image-to-video motion rendering; replace only the procedural SVG source.

- [ ] **Step 5: Run focused and full tests**

Run: `npx vitest run electron/MediaModelManager.test.ts electron/LocalMediaGenerationService.test.ts src/mediaGeneration/modelCatalog.test.ts src/MediaBrowser.test.tsx && npm run test:unit && npm run typecheck && npm run build`

Expected: PASS; production renderer contains no procedural motif SVG generator and no cloud inference endpoint.

- [ ] **Step 6: Commit**

```powershell
git add -- electron src package.json package-lock.json
git commit -m "feat(media): generate motifs with optional local model"
```

### Task 6: Add device-level OSB settings and animated settings preview

**Files:**
- Create: `src/osb/types.ts`
- Create: `src/osb/settingsModel.ts`
- Create: `src/osb/settingsModel.test.ts`
- Create: `src/osb/OsbSettings.tsx`
- Create: `src/osb/OsbSettings.test.tsx`
- Create: `src/osb/OsbPreview.tsx`
- Create: `src/osb/OsbPreview.test.tsx`
- Create: `electron/DeviceSettingsRepository.ts`
- Create: `electron/DeviceSettingsRepository.test.ts`
- Modify: `src/QuickScreenSettings.tsx`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: OSB/settings stylesheet

**Interfaces:**
- Produces: exact `OsbSettings` interface from the spec and `DEFAULT_OSB_SETTINGS`.
- Produces: `normalizeOsbSettings(input: unknown, availableTranslations: BibleTranslation[]): OsbSettings`.
- Produces bridge `deviceSettings.readOsb()` and `deviceSettings.writeOsb(settings)` stored outside the user profile/presentation document.
- Consumes: the existing permitted Bible translation catalog/provider.

- [ ] **Step 1: Write normalization, persistence, and UI tests**

Assert exact defaults, six style IDs, six colors and hex values, translation filtering/grouping, duplicate-secondary prevention, fallback after a missing default translation, single-field normalization, device persistence independent of user data, all reference positions, speed factors `1.8/1.0/0.7`, and reduced motion. Render the settings page and prove `Vorschau abspielen` changes only its preview and never calls MAIN bridge methods.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/osb/settingsModel.test.ts src/osb/OsbSettings.test.tsx src/osb/OsbPreview.test.tsx electron/DeviceSettingsRepository.test.ts`

Expected: FAIL because the OSB settings model/page/repository do not exist.

- [ ] **Step 3: Implement model and device repository**

Normalize every field independently. Store OSB JSON in Electron `userData/device-settings.json` with atomic replacement and no user ID. Expose only the OSB subtree through a typed bridge.

- [ ] **Step 4: Implement the central settings page and preview**

Make the Bible quick-screen entry open the full OSB editor under MAIN Schnellanzeigen. Render accessible color swatches, translation groups, all toggles/selectors, test reference, and real overlay preview. Preview uses sample/provider text locally and has no output bridge dependency.

- [ ] **Step 5: Run focused and full tests**

Run: `npx vitest run src/osb/settingsModel.test.ts src/osb/OsbSettings.test.tsx src/osb/OsbPreview.test.tsx electron/DeviceSettingsRepository.test.ts && npm run test:unit && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- electron src
git commit -m "feat(osb): add device-level bible overlay settings"
```

### Task 7: Apply OSB defaults to F9 and MAIN without moving live state

**Files:**
- Create: `src/osb/resolveOverlay.ts`
- Create: `src/osb/resolveOverlay.test.ts`
- Create: `src/osb/OsbQuickDialog.tsx`
- Create: `src/osb/OsbQuickDialog.test.tsx`
- Create: `src/osb/OsbOutput.tsx`
- Create: `src/osb/OsbOutput.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/QuickOverlay.tsx`
- Modify: `src/BibleQuickOverlay.tsx`
- Modify: `src/BibleQuickOverlay.test.tsx`
- Modify: `src/preferences.ts`
- Modify: OSB output stylesheet

**Interfaces:**
- Produces: `resolveOsbOverlay(settings, passage, selectedTranslation): QuickScreenConfig` with embedded immutable OSB render values.
- Produces: `OsbQuickDialog({ settings, translations, onShow, onClose })`.
- Consumes: `deviceSettings.readOsb`, Bible provider, existing quick-overlay send/clear channel, and current live-state restoration.

- [ ] **Step 1: Write F9, resolver, six-style, and live-state tests**

Assert F9 opens the compact dialog, defaults to the device translation, conditionally shows translation selection, hides every design control, uses Enter, blocks output on provider failure, and explains disabled OSB. Assert resolved payload contains all immutable render choices. Snapshot semantic class/state output for all six styles and four reference positions. Simulate live slide A, OSB, live slide B under the overlay, then clear OSB and assert B is restored while selected/editor position never changes.

- [ ] **Step 2: Run tests and verify RED**

Run: `npx vitest run src/osb/resolveOverlay.test.ts src/osb/OsbQuickDialog.test.tsx src/osb/OsbOutput.test.tsx src/BibleQuickOverlay.test.tsx`

Expected: FAIL because F9 still uses the old dialog and the overlay payload lacks centralized style values.

- [ ] **Step 3: Implement quick dialog and resolver**

Replace the current Bible quick dialog path. Read settings on open, load the passage, and construct a self-contained payload only after success. Do not start ON AIR implicitly merely to show an unavailable OSB; follow the existing live quick-screen policy.

- [ ] **Step 4: Implement six output styles and restoration behavior**

Render the six style variants from one semantic verse model. Apply accent only to highlights/reference details. Add book-introduction sequencing, speed CSS variable, safe margins, density rules, and reduced-motion behavior. Keep the current quick-overlay layering contract so live updates continue beneath OSB and clearing reveals the latest state.

- [ ] **Step 5: Run focused and full tests**

Run: `npx vitest run src/osb/resolveOverlay.test.ts src/osb/OsbQuickDialog.test.tsx src/osb/OsbOutput.test.tsx src/BibleQuickOverlay.test.tsx src/quickScreenAvailability.test.ts src/live/quickOverlayState.test.ts && npm run test:unit && npm run typecheck && npm run build`

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- src
git commit -m "feat(osb): apply central defaults to f9 and main"
```

### Task 8: Prepare, verify, package, and publish V63

**Files:**
- Create: `scripts/check-version63.cjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `public/releases.json`
- Modify: `RELEASE_NOTES.md`
- Modify: `.github/workflows/release.yml`

**Interfaces:**
- Produces: consistent public release `0.63.0` and downloadable desktop artifacts.
- Consumes: all prior task interfaces and regression suites.

- [ ] **Step 1: Write and run the failing V63 guard**

The guard asserts version/catalog/notes/workflow consistency, absence of general helper UI/IPC, grouped add catalog plus `nowPlaying`, radio metadata service, local media generation bridge without cloud inference URL, central OSB settings, six styles/colors, and F9 resolver wiring.

Run: `node scripts/check-version63.cjs`

Expected: FAIL until release metadata is updated.

- [ ] **Step 2: Update release metadata and workflow**

Set version/series to `0.63.0`/`0.63`, prepend complete German notes, add current release catalog entry, mark V62 non-current, and execute the guard in CI and `verify:release`.

- [ ] **Step 3: Run full verification**

Run: `npm run verify:release && npm run typecheck && npm run build && npm run installer`

Expected: all tests and V55–V63 guards pass; installer `release/GottesdienstRegie-Setup-0.63.0.exe` exists.

- [ ] **Step 4: Perform installer and release checks**

Verify generated license encoding, installer file size, packaged entrypoint, and absence of unstaged product changes. Review `origin/main..HEAD` for secrets, external inference endpoints, accidental AI-helper remnants, and unsafe process spawning.

- [ ] **Step 5: Commit release metadata**

```powershell
git add -- package.json package-lock.json public/releases.json RELEASE_NOTES.md .github/workflows/release.yml scripts/check-version63.cjs
git commit -m "chore(release): prepare version 0.63.0"
```

- [ ] **Step 6: Publish after explicit user authorization**

Fast-forward the verified branch to `origin/main`, monitor the GitHub release workflow, verify Windows/macOS/Linux jobs, and confirm the Windows asset URL returns HTTP 200.

Expected release: `https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.63.0`
