# GottesdienstRegie 0.40.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Version 0.40.0 liefert private Notizen, lokale Songübersetzung, Gemeinwohl-Hinweise, Radiosuche, geschützte Loop-Kerninhalte, identische Preview/MAIN-Snapshots und die gemeldeten Designkorrekturen als geprüftes Windows-Release.

**Architecture:** Live-kritische Daten werden als unveränderliche Snapshots vom Editorzustand getrennt. Netzwerk- und Modellfunktionen laufen über schmale Electron-IPC-Dienste mit validierten DTOs; private Daten liegen in einem eigenen lokalen Repository und niemals im synchronisierten Präsentationsdokument. Pure Domänenfunktionen werden mit dem vorhandenen Node/TypeScript-Teststil geprüft, während ein Browser-Harness die responsiven UI-Verträge prüft.

**Tech Stack:** Electron 37, React 19, TypeScript 5.9, Vite 7, Zustand, Node `assert`, `@huggingface/transformers` 3.8.1, ONNX Runtime Web/Node, Radio Browser HTTP API.

**Spec:** `docs/superpowers/specs/2026-09-20-version-040-external-content-notes-translation-design.md`

## Global Constraints

- Zielversion ist exakt `0.40.0`; neue Einstellungen sind Gemeinwohl aus, Bildschirmschutz an und kein Radiosender ausgewählt.
- Keine kommerzielle Werbung, Affiliate-Links, Einnahmen, Nutzerverfolgung oder editierbare externe Kampagneninhalte.
- Private Notizen verlassen das Gerät nicht und erscheinen weder im Präsentationsdokument noch in MAIN, STAGE, LIVESTREAM, NOTES, Export oder Änderungshistorie.
- Songtext wird ausschließlich lokal übersetzt; Version 0.40.0 unterstützt Englisch ↔ Deutsch und benötigt keinen API-Schlüssel.
- Externe Abrufe, Modell-Downloads und Notizspeichern dürfen den Live-Schaltpfad niemals blockieren.
- MAIN bleibt bis zu TAKE unverändert und übernimmt bei TAKE exakt den bereits erzeugten Preview-Snapshot.
- Loop-Kerninhalte liegen außerhalb von `slide.elements`, können nicht gelöscht werden und erscheinen nicht unter `Zusätzliche Ebenen`.
- Keine fremden Webseiten als HTML rendern; nur validierter Klartext, erlaubte HTTPS-Ziele und MIME-geprüfte Bilder.
- Gemeinwohl-Hinweise werden maximal sieben Tage gecacht und bei fehlendem gültigen Inhalt ersatzlos übersprungen.
- Alle Abnahmekriterien gelten bei 100 %, 125 % und 150 % Windows-Skalierung sowie im F11-Modus.

## Review Focus

- Beschädigte oder sehr alte Präsentationen: Normalisierung muss virtuelle Loop-Inhalte entfernen, echte Nutzer-Overlays aber erhalten (Task 1).
- Ein Editorwechsel genau während TAKE: MAIN muss eine atomare Kopie des zuletzt sichtbaren Preview-Snapshots erhalten (Task 2).
- Konto- und Präsentationswechsel während eines verzögerten Notizspeicherns: Die Eingabe darf nicht beim falschen Schlüssel landen (Task 3).
- Abgebrochener Modell-Download, Radio-Timeout oder ungültiger Feed: Kein Fehler darf MAIN oder laufendes lokales Audio verändern (Tasks 4–6).
- Kleine Fenster, hohe Skalierung und lange Profilnamen: Profil und native Fensterknöpfe müssen erreichbar bleiben, ohne andere Steuerelemente zu überdecken (Task 8).

---

### Task 1: Geschützte Loop-Kerninhalte und Overlay-Normalisierung

**Files:**
- Create: `src/loopCoreLayer.ts`
- Modify: `src/loopDomain.ts`
- Modify: `src/LoopPreview.tsx`
- Modify: `src/ProductionWorkspace.tsx`
- Create: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `type LoopCoreLayer`, `getLoopCoreLayer(slide, item): LoopCoreLayer | null`, `getUserOverlayElements(slide, item): SlideElement[]`, `normalizeLoopOverlays(slide, item): Slide`.
- Consumes: existing `Slide`, `SlideElement`, `ServiceItem` and loop item type guards from `src/store.ts` and `src/loopDomain.ts`.

- [ ] **Step 1: Write the failing domain tests**

Add a TypeScript-loading test to `scripts/check-version40.cjs` that creates weather, clock and normal slides. Assert that `getLoopCoreLayer` returns immutable descriptors for loop slides, `getUserOverlayElements` returns only user text/image/shape/QR overlays, and `normalizeLoopOverlays` removes legacy system elements without removing an overlay with a user ID. Include a malformed legacy slide with no `elements` array.

```js
assert.deepEqual(getUserOverlayElements(weatherSlide, weatherItem).map(x => x.id), ['user-text'])
assert.equal(getLoopCoreLayer(weatherSlide, weatherItem)?.kind, 'weather')
assert.deepEqual(normalizeLoopOverlays(malformedSlide, weatherItem).elements, [])
assert.equal(getLoopCoreLayer(normalSlide, normalItem), null)
```

- [ ] **Step 2: Run the test and confirm the red state**

Run: `node scripts/check-version40.cjs`

Expected: FAIL because `src/loopCoreLayer.ts` does not exist.

- [ ] **Step 3: Implement the pure loop-layer contract**

Define the exact discriminated union and pure filters:

```ts
export type LoopCoreLayer = Readonly<{
  id: `loop-core:${string}`
  protected: true
  kind: 'weather' | 'clock' | 'birthdays' | 'events' | 'screen-message'
}>

export function getUserOverlayElements(slide: Slide, item: ServiceItem): SlideElement[]
export function normalizeLoopOverlays(slide: Slide, item: ServiceItem): Slide
```

Recognize legacy system elements only by the existing persisted system marker/type, never by visible text. Return new arrays and never mutate persisted objects.

- [ ] **Step 4: Integrate renderer and editor**

Render the protected layer directly in `LoopPreview.tsx`. In `ProductionWorkspace.tsx`, build `Zusätzliche Ebenen`, delete, multi-select and context-menu actions exclusively from `getUserOverlayElements`; do not render a remove/visibility control for `LoopCoreLayer`.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version40.cjs && node scripts/loop-domain-test.mjs && node scripts/loop-acceptance-test.cjs && npm run typecheck`

Expected: all commands exit 0.

```powershell
git add src/loopCoreLayer.ts src/loopDomain.ts src/LoopPreview.tsx src/ProductionWorkspace.tsx scripts/check-version40.cjs
git commit -m "fix: protect loop core content"
```

### Task 2: Deterministischer Preview/MAIN-Snapshot

**Files:**
- Create: `src/renderedSlideSnapshot.ts`
- Modify: `src/SlideRenderer.tsx`
- Modify: `src/LiveEngine.ts`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `RenderedSlideSnapshot`, `buildRenderedSlideSnapshot(state, profile)`, `cloneRenderedSlideSnapshot(snapshot)`.
- Consumes: Task 1 `getLoopCoreLayer` and existing output-profile/render models.

- [ ] **Step 1: Add failing snapshot tests**

Test that the builder includes resolved background, translated text, core layer and overlays; freezes the result; and that modifying the source document afterwards cannot change the snapshot. Simulate preview A, edit source to B, TAKE A and assert live still equals A.

```js
const preview = buildRenderedSlideSnapshot(stateA, 'main')
stateA.slides[0].elements[0].text = 'B'
const live = cloneRenderedSlideSnapshot(preview)
assert.equal(live.elements[0].text, 'A')
assert.notEqual(buildRenderedSlideSnapshot(stateA, 'main').hash, live.hash)
```

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL with missing `renderedSlideSnapshot` module.

- [ ] **Step 3: Implement the immutable snapshot builder**

Use structured cloning of serializable fields, a stable content hash, `createdAt`, `slideId`, `profile`, resolved core layer and resolved text. Deep-freeze the returned object in development and tests.

```ts
export type RenderedSlideSnapshot = Readonly<{
  slideId: string
  profile: OutputProfile
  hash: string
  createdAt: number
  background: ResolvedBackground
  elements: readonly RenderedElement[]
  coreLayer: LoopCoreLayer | null
}>
```

- [ ] **Step 4: Route preview and live through the same object**

Build preview once per editor state revision. Change TAKE, ON AIR start and next-slide switching so they copy the current preview snapshot into LiveEngine. `SlideRenderer` accepts a snapshot rather than recalculating presentation state. Preserve the live snapshot until the next explicit TAKE/navigation.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

Expected: snapshot assertions pass and production build exits 0.

```powershell
git add src/renderedSlideSnapshot.ts src/SlideRenderer.tsx src/LiveEngine.ts src/ProductionWorkspace.tsx scripts/check-version40.cjs
git commit -m "fix: share deterministic preview and live snapshots"
```

### Task 3: Kontogetrennte persönliche Notizen

**Files:**
- Create: `electron/PersonalNotesRepository.ts`
- Create: `src/PersonalNotesPanel.tsx`
- Create: `src/personalNotes.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `PersonalNoteKey`, `PersonalNotesRepository.get/set/delete/exportPresentation`, IPC methods `personalNotes:get`, `personalNotes:set`, `personalNotes:delete`, `personalNotes:exportPresentation`.
- Consumes: authenticated `userId`, current `presentationId` and optional `slideId`; never consumes or modifies `Slide.notes` or `ServiceItem.notes`.

- [ ] **Step 1: Add failing repository tests**

Use a temporary directory and two users. Assert identical presentation/slide IDs cannot cross accounts; slide and presentation notes are distinct; atomic rewrite survives a new repository instance; export returns only the active user's presentation; a delayed write whose key was captured before navigation still writes to its captured key.

```js
await repo.set({ userId: 'a', presentationId: 'p', slideId: 's' }, 'A')
await repo.set({ userId: 'b', presentationId: 'p', slideId: 's' }, 'B')
assert.equal(await repo.get({ userId: 'a', presentationId: 'p', slideId: 's' }), 'A')
assert.equal((await repo.exportPresentation('a', 'p')).notes.length, 1)
```

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL because `PersonalNotesRepository` is missing.

- [ ] **Step 3: Implement storage and IPC**

Store one JSON file per hashed user/presentation pair beneath `app.getPath('userData')/personal-notes`. Write to a sibling `.tmp`, fsync/close, then rename. Validate every IPC DTO with maximum note length 50,000 characters and reject empty IDs.

- [ ] **Step 4: Implement the debounced panels**

`PersonalNotesPanel` captures the complete key with each 500 ms debounce, cancels timers on unmount, flushes the last draft before key changes, and exposes `Speichert …`, `Gespeichert` or an inline local error. Add `Meine Präsentationsnotiz` in the presentation header and `Meine Notiz zu dieser Folie` in the selected-slide editor.

- [ ] **Step 5: Prove output isolation and commit**

Add an assertion that neither snapshot serialization nor presentation serialization contains the private note text.

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

```powershell
git add electron/PersonalNotesRepository.ts src/PersonalNotesPanel.tsx src/personalNotes.ts electron/main.ts electron/preload.ts src/vite-env.d.ts src/ProductionWorkspace.tsx scripts/check-version40.cjs
git commit -m "feat: add private presentation and slide notes"
```

### Task 4: Lokale automatische Songübersetzung

**Files:**
- Create: `electron/LocalTranslationService.ts`
- Create: `src/translationDraft.ts`
- Create: `src/AutomaticTranslationControls.tsx`
- Modify: `src/songTranslation.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `LocalTranslationProvider.translate(request, signal)`, `maskChordTokens`, `restoreChordTokens`, `translatePreservingLines`, IPC progress/cancel contract.
- Consumes: existing six `SongTranslationMode` variants and existing manual translation fields.

- [ ] **Step 1: Add failing pure tests**

Test `[D] Amazing grace` preserves `[D]`, blank lines and line count; cancellation keeps completed drafts but does not save the active partial result; existing translations are skipped in batch mode; unsupported pairs return `unsupported-language-pair`; no-text slides remain suppressed in all six modes.

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL with missing translation helpers.

- [ ] **Step 3: Install the pinned local runtime**

Run: `npm install --save-exact @huggingface/transformers@3.8.1`

Expected: `package.json` and lockfile contain exactly `3.8.1`.

- [ ] **Step 4: Implement an injectable local provider**

Use model IDs `Xenova/opus-mt-en-de` and `Xenova/opus-mt-de-en`. Keep the pipeline behind an injected factory so tests use a deterministic fake and never download a model. Store models in `userData/models/translation`, validate a checked-in manifest containing model ID, revision and SHA-256 before activation, and emit download/translation progress through one request ID.

```ts
export interface LocalTranslationProvider {
  translate(request: { requestId: string; source: 'de'|'en'; target: 'de'|'en'; text: string }, signal: AbortSignal): Promise<string>
}
```

- [ ] **Step 5: Add editor controls and confirmation state**

Add `Automatisch übersetzen`, `Neu übersetzen`, language selectors, `Fehlende Songfolien übersetzen`, progress and cancel. Write results into the existing editable manual field as `machineGenerated: true`; clear that flag only after user confirmation. Preflight reports unconfirmed translations without blocking manual translation.

- [ ] **Step 6: Verify and commit**

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

```powershell
git add electron/LocalTranslationService.ts src/translationDraft.ts src/AutomaticTranslationControls.tsx src/songTranslation.ts electron/main.ts electron/preload.ts src/vite-env.d.ts src/ProductionWorkspace.tsx package.json package-lock.json scripts/check-version40.cjs
git commit -m "feat: add local automatic song translation"
```

### Task 5: Trackingfreie Gemeinwohl-Hinweise

**Files:**
- Create: `src/publicInterest.ts`
- Create: `electron/PublicInterestFeedService.ts`
- Create: `electron/publicInterestSources.ts`
- Create: `public/public-interest-catalog.json`
- Create: `src/PublicInterestSettings.tsx`
- Create: `src/PublicInterestCard.tsx`
- Modify: `src/preferences.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/LoopPreview.tsx`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `PublicInterestSettings`, `PublicInterestItem`, `parsePublicInterestFeed`, `selectPublicInterestItems`, `PublicInterestFeedService.refresh/getCached`, IPC `publicInterest:list`.
- Consumes: immutable loop snapshot from Task 2.

- [ ] **Step 1: Add failing parser, selector and cache tests**

Test HTTPS allowlist acceptance; rejection of HTTP, unknown hosts, HTML content types, payloads over 1 MiB, expired entries and text over 240 characters; selection after exactly 3/5/10 normal items; seven-day cache cutoff; empty result on timeout without cache; no cookies, referrer or tracking parameters in normalized URLs.

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL with missing public-interest modules.

- [ ] **Step 3: Implement feed service and bundled catalog**

Use a 5-second timeout, 1 MiB response limit, accepted MIME types for JSON/RSS/Atom and a fixed source registry. The bundled catalog contains factual evergreen cards and official HTTPS destinations only; it includes no copied third-party imagery. Cache validated normalized JSON atomically and return stale/empty status explicitly.

- [ ] **Step 4: Implement settings and loop cards**

Add the route `Präsentation → Sonstiges → Extern → Gemeinwohl-Hinweise`, default off. Expose only placement, categories, duration 8–30 (default 12), interval 3/5/10 (default 5) and QR toggle. Do not expose content editing. Insert virtual cards only when building the preview loop snapshot; frozen live loops retain their existing selection.

- [ ] **Step 5: Verify failure isolation and commit**

Assert a rejected/failed feed returns the unchanged normal loop sequence and cannot mutate a live snapshot.

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

```powershell
git add src/publicInterest.ts electron/PublicInterestFeedService.ts electron/publicInterestSources.ts public/public-interest-catalog.json src/PublicInterestSettings.tsx src/PublicInterestCard.tsx src/preferences.ts electron/main.ts electron/preload.ts src/vite-env.d.ts src/LoopPreview.tsx scripts/check-version40.cjs
git commit -m "feat: add privacy-safe public interest loop cards"
```

### Task 6: Radiosuche und getestetes Hintergrundaudio

**Files:**
- Create: `electron/RadioBrowserService.ts`
- Create: `src/radioStations.ts`
- Create: `src/RadioStationBrowser.tsx`
- Modify: `src/BackgroundAudioPanel.tsx`
- Modify: `src/preferences.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `normalizeRadioStation`, `RadioBrowserService.search`, `RadioStationBrowser`, IPC `radio:search` and `radio:resolve`.
- Consumes: existing background audio controller and frozen audio state.

- [ ] **Step 1: Add failing normalization and failure tests**

Test malformed results, duplicate station UUIDs, non-HTTPS streams, invalid bitrate, broken stations and a timeout. Assert quality ordering is stable and a search failure leaves a supplied current-audio state byte-for-byte unchanged.

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL with missing radio modules.

- [ ] **Step 3: Implement the Electron service**

Resolve a Radio Browser mirror, call `/json/stations/search`, send a fixed `GottesdienstRegie/0.40.0` User-Agent, cap responses at 1 MiB and 5 seconds, normalize fields and retain only HTTPS resolved streams. Do not autoplay search results.

- [ ] **Step 4: Implement the RADIOSTATION UI**

Add `RADIOSENDER` under the music icon with search, country/language/tag filters, `TESTEN`, favorite and add actions. Require three successful seconds before add. Favorites persist only UUID, name and HTTPS stream URL. Keep manual HTTPS stream entry.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

```powershell
git add electron/RadioBrowserService.ts src/radioStations.ts src/RadioStationBrowser.tsx src/BackgroundAudioPanel.tsx src/preferences.ts electron/main.ts electron/preload.ts src/vite-env.d.ts scripts/check-version40.cjs
git commit -m "feat: add radio station background audio"
```

### Task 7: Bildschirmschutz mit verlässlichem Laufzeitstatus

**Files:**
- Modify: `electron/DisplaySleepProtection.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/App.tsx`
- Modify: `scripts/check-version39.cjs`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: `DisplaySleepProtectionStatus = 'active'|'disabled'|'unavailable'`, idempotent `setEnabled`, `getStatus` and IPC status update.
- Consumes: existing persisted `preventDisplaySleep` preference.

- [ ] **Step 1: Extend failing blocker tests**

Assert repeated enable starts one blocker, disable stops the same ID once, OS start failure becomes `unavailable`, restart restores the persisted on/off choice, and status events mirror the controller state.

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version39.cjs && node scripts/check-version40.cjs`

Expected: at least the new status assertions fail.

- [ ] **Step 3: Implement controller and setting row**

Keep one private blocker ID, verify `powerSaveBlocker.isStarted(id)`, catch platform failure and expose `Aktiv`, `Deaktiviert` or `Vom Betriebssystem nicht verfügbar` next to the existing default-on switch under `Allgemein → Fenster & Start`.

- [ ] **Step 4: Verify and commit**

Run: `node scripts/check-version39.cjs && node scripts/check-version40.cjs && npm run typecheck`

```powershell
git add electron/DisplaySleepProtection.ts electron/main.ts electron/preload.ts src/vite-env.d.ts src/App.tsx scripts/check-version39.cjs scripts/check-version40.cjs
git commit -m "fix: expose display sleep protection status"
```

### Task 8: Responsive Designkorrekturen und Equalizer-Beschriftung

**Files:**
- Create: `scripts/version40-ui-test.html`
- Create: `scripts/version40-ui-test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Modify: `src/version39.css`
- Modify: `src/MediaBrowser.tsx`
- Modify: `src/media-browser.css`
- Modify: `src/settings-v08.css`
- Modify: `src/AudioEqualizerSettings.tsx`
- Modify: `src/audio-equalizer.css`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Produces: reusable `.settings-number-row`, responsive AI grid and accessible equalizer labels; no new domain dependency.
- Consumes: Electron window-control inset exposed by the existing shell/header code.

- [ ] **Step 1: Add failing semantic assertions**

In `check-version40.cjs`, render/inspect component output with the project compiler and assert every equalizer slider has an accessible name containing group, frequency and dB; numeric settings clamp animation to its documented range and opacity to 0–100; AI controls have labels associated by `htmlFor`/`id`.

- [ ] **Step 2: Add the viewport harness**

Create `version40-ui-test.tsx` with isolated stories for header, AI motives, numeric rows and equalizer. For widths 1280/1600/1920 and device scale equivalents 1/1.25/1.5, calculate bounding boxes and fail if profile intersects the native-control safe area, controls overlap, focus rings clip or a horizontal document scrollbar appears.

- [ ] **Step 3: Confirm red state**

Run: `node scripts/check-version40.cjs && npm run dev -- --host 127.0.0.1`

Expected: semantic assertions fail; visual harness reproduces at least one reported overlap before CSS changes.

- [ ] **Step 4: Fix the four layouts**

Reserve the actual Windows caption-button inset with a CSS custom property and flexible action group; collapse text labels before hiding icons. Convert AI motives to a max-width grid with full rows and a two-column responsive selector row. Apply a 96 px minimum numeric input width and visible unit. Group the ten EQ bands as Tiefen (31/63/125), Untere Mitten (250/500), Mitten (1/2 kHz) and Höhen (4/8/16 kHz), with three visible label lines per slider.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

Open the harness and verify all viewport cases show PASS.

```powershell
git add scripts/version40-ui-test.html scripts/version40-ui-test.tsx src/App.tsx src/styles.css src/version39.css src/MediaBrowser.tsx src/media-browser.css src/settings-v08.css src/AudioEqualizerSettings.tsx src/audio-equalizer.css scripts/check-version40.cjs
git commit -m "fix: correct responsive editor and settings layouts"
```

### Task 9: Hilfe, Datenschutztexte und integrierte Akzeptanzprüfung

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/helpV39.ts`
- Modify: `scripts/check-version40.cjs`
- Create: `docs/manual/version-040.md`

**Interfaces:**
- Consumes: all Tasks 1–8 public UI routes and behavior.
- Produces: user-facing help and one integrated 0.40 acceptance command.

- [ ] **Step 1: Add failing copy and navigation assertions**

Assert help contains searchable sections for private notes, local translation/model download, Gemeinwohl privacy/source attribution, radio streams, protected loop content and Preview/MAIN behavior. Assert every setting link navigates to an existing route.

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL listing missing help topics.

- [ ] **Step 3: Write complete help content**

Document what is local, what uses the network, how to cancel downloads/searches, why Gemeinwohl content is not editable, how TAKE freezes MAIN, and recovery steps for each inline error. Include screenshots only from GottesdienstRegie assets; do not copy third-party product screenshots into the shipped help.

- [ ] **Step 4: Add integrated acceptance assertions**

Make `check-version40.cjs` run each pure suite and print named PASS lines for: protected loops, snapshots, note isolation, translation, public-interest feeds, radio, sleep protection, accessibility and release metadata.

- [ ] **Step 5: Verify and commit**

Run: `node scripts/check-version40.cjs && npm run typecheck && npm run build`

```powershell
git add src/App.tsx src/helpV39.ts scripts/check-version40.cjs docs/manual/version-040.md
git commit -m "docs: add version 0.40 feature guidance"
```

### Task 10: Version 0.40.0, lange Release Notes und Veröffentlichung

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `public/releases.json`
- Modify: `.github/workflows/release.yml`
- Modify: `scripts/check-version40.cjs`

**Interfaces:**
- Consumes: the verified implementation from Tasks 1–9.
- Produces: discoverable update manifest and signed/published `v0.40.0` release assets.

- [ ] **Step 1: Add failing release metadata assertions**

Assert package and lockfile are `0.40.0`, the newest manifest entry is `0.40.0`, version `1.0.0` still says exactly `Los gehts!`, 0.40 notes mention every delivered subsystem in full sentences, download URL/tag use `v0.40.0`, and the release workflow runs `check-version40.cjs` before packaging.

- [ ] **Step 2: Confirm failure**

Run: `node scripts/check-version40.cjs`

Expected: FAIL because current metadata is still `0.39.0`.

- [ ] **Step 3: Update version and release documentation**

Run: `npm version 0.40.0 --no-git-tag-version`

Write detailed German notes covering user outcome, privacy/offline behavior, defaults, error behavior and fixed bugs. Preserve every historical release entry and keep `1.0.0` exactly `Los gehts!`.

- [ ] **Step 4: Run the complete local release gate**

Run:

```powershell
npm ci
node scripts/check-version39.cjs
node scripts/check-version40.cjs
node scripts/loop-domain-test.mjs
node scripts/loop-data-test.mjs
node scripts/loop-acceptance-test.cjs
npm run typecheck
npm run build
npm run installer
```

Expected: every command exits 0 and the installer/checksum/update artifacts report version `0.40.0`.

- [ ] **Step 5: Perform manual release smoke tests**

Install the produced Windows build in a disposable test profile. Verify: F11 header controls; sleep toggle across restart; note account isolation; offline translation fallback; one EN→DE local translation; feed timeout; radio timeout while local audio plays; weather core non-removability; Preview edit not changing MAIN until TAKE; EQ labels; AI/numeric layouts at 100/125/150 %.

- [ ] **Step 6: Commit, tag and publish**

```powershell
git add package.json package-lock.json CHANGELOG.md RELEASE_NOTES.md public/releases.json .github/workflows/release.yml scripts/check-version40.cjs
git commit -m "release: publish version 0.40.0"
git tag -a v0.40.0 -m "GottesdienstRegie 0.40.0"
git push origin main
git push origin v0.40.0
```

Create or verify the GitHub release and attach installer, update metadata and checksum artifacts. Do not announce completion until the public `releases.json` and asset URLs return HTTP 200 and the in-app Updates page discovers `0.40.0` from a `0.39.0` client.
