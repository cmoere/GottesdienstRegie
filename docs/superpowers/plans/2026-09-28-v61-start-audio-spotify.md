# GottesdienstRegie V61 Start, Audio and Spotify Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship version 0.61.0 with a reliable packaged startup, deterministic first-slide live start, precise background-audio controls, optional operator sounds, and compliant Spotify account/search links.

**Architecture:** Keep live selection and audio-state derivation as small pure domain functions consumed by both desktop modes and the existing React workspace. Add Spotify behind explicit platform services: a secure desktop OAuth/token boundary, a normalized catalog client, and a presentation-safe reference type that can only open Spotify externally.

**Tech Stack:** React 19, TypeScript, Zustand, Electron 37, Spotify Web API with Authorization Code PKCE, Vitest, Vite, electron-builder.

**Spec:** `docs/superpowers/specs/2026-09-28-v61-start-audio-spotify-design.md`

## Global Constraints

- Version is `0.61.0`.
- Spotify audio must never be downloaded, embedded, automatically played, synchronized with slides, or broadcast by GottesdienstRegie.
- Spotify OAuth uses Authorization Code with PKCE and no client secret.
- Spotify tokens must never enter presentation documents, logs, cloud synchronization, or user-facing error messages.
- Pre- and post-program remain mandatory loops.
- Disabling operator sounds must not affect presentation, radio, video, or background audio.
- Existing `.superpowers/` files are unrelated user files and must not be staged or modified.

## Review Focus

- Clean packaged builds with no stale `dist-electron` files must resolve main, preload, and renderer paths.
- Empty, disabled, or invalid pre-loop content must fall through to the next valid section without diverging between ON AIR and test mode.
- Section stop cues must not leave contradictory start/stop state when audio is reassigned.
- OAuth callback state mismatch, expired refresh tokens, missing Client ID, and API rate limits must fail without leaking tokens or blocking local media.
- Serialized presentations containing Spotify references must contain metadata and official URLs only, and must never trigger playback automatically.

---

### Task 1: Repair clean packaged startup and expose a recoverable load failure

**Files:**
- Modify: `electron/main.ts`
- Modify: `electron/windowStartup.ts`
- Modify: `electron/windowStartup.test.ts`
- Modify: `scripts/check-version60.cjs`
- Create: `scripts/check-packaged-entry.cjs`

**Interfaces:**
- Produces: `resolveRendererEntry(compiledDirectory:string, appRoot:string):string` and a reusable packaged-entry check.
- Consumes: the package main path `dist-electron/electron/main.js` established in V60.

- [ ] **Step 1: Write failing tests** for a clean nested Electron output resolving root `dist/index.html`, a missing renderer returning a load-failure state, and retry invoking the same validated load path.
- [ ] **Step 2: Run** `npx vitest run electron/windowStartup.test.ts` and `node scripts/check-packaged-entry.cjs`; verify failures identify the old relative renderer path and missing script.
- [ ] **Step 3: Implement** `resolveRendererEntry` and update `load()` to use it; add a bounded startup failure page with one retry action and no indefinite black state.
- [ ] **Step 4: Run** the focused tests, `npm run build`, and the packaged-entry script from a TypeScript-cleaned output; expect all entry files to exist.
- [ ] **Step 5: Commit** with `fix(startup): repair packaged renderer loading`.

### Task 2: Use one deterministic first-slide selector for ON AIR and test mode

**Files:**
- Modify: `src/release53Model.ts`
- Modify: `src/release53Model.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/store.ts`

**Interfaces:**
- Produces: `firstActiveTarget(items, sections):{itemId:string;slideId:string}|undefined` ordered by the actual section sequence.
- Consumes: `ServiceItem`, `ServiceSection`, placement rules, enabled/disabled state.

- [ ] **Step 1: Write failing tests** covering active pre-loop first, disabled/empty pre-loop fallback, warm-up fallback, service fallback, and identical selection for requested live modes.
- [ ] **Step 2: Run** `npx vitest run src/release53Model.test.ts`; verify the current selector fails at least the section-aware case.
- [ ] **Step 3: Implement** the section-aware pure selector and make both `startLiveSession` call paths consume the same result before `goLive` and `setOnAir`.
- [ ] **Step 4: Run** focused tests and `npm run typecheck`.
- [ ] **Step 5: Commit** with `fix(live): start every session at first active slide`.

### Task 3: Preserve mandatory loop insertion targets

**Files:**
- Modify: `src/itemPlacementPolicy.ts`
- Modify: `src/itemPlacementPolicy.test.ts`
- Modify: `src/store.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: stable `addItem(type,{sectionId})` behavior for `pre` and `post` with mandatory loop restrictions.
- Consumes: existing `canInsertItemType` and add-item menu options.

- [ ] **Step 1: Write failing tests** proving allowed pre/post items are inserted into the requested loop, disallowed service items are rejected, and insertion never falls back to the selected service section.
- [ ] **Step 2: Run** `npx vitest run src/itemPlacementPolicy.test.ts`; verify the target regression fails.
- [ ] **Step 3: Implement** explicit target preservation in store and menu callbacks without reintroducing editable loop toggles or adjacent section plus buttons.
- [ ] **Step 4: Run** focused tests plus `npm run typecheck`.
- [ ] **Step 5: Commit** with `fix(loops): preserve pre and post insertion targets`.

### Task 4: Restrict audio highlighting to the speaker and support section stop cues

**Files:**
- Modify: `src/audioTimelineModel.ts`
- Modify: `src/audioTimelineModel.test.ts`
- Modify: `src/audioStopCue.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/version59.css`
- Modify: `src/background-audio.css`

**Interfaces:**
- Produces: derived item/section audio states `none|starts|active|stops` and section-level stop mutation.
- Consumes: existing background-audio assignments and stop metadata.

- [ ] **Step 1: Write failing tests** for section stop before its first item, audio reassignment removing a contradictory stop, and icon-only class mapping.
- [ ] **Step 2: Run** the audio timeline and stop-cue tests; verify failures reflect missing section handling or row-neutral styling.
- [ ] **Step 3: Implement** section stop commands and derived state; move blue/red presentation exclusively to the speaker icon and remove row/grid tint rules.
- [ ] **Step 4: Run** focused tests and scan generated CSS assertions to ensure no `.service-item.audio-timeline-*` background remains.
- [ ] **Step 5: Commit** with `feat(audio): add section stops and icon-only status`.

### Task 5: Localize background-audio actions

**Files:**
- Create: `src/audioLabels.ts`
- Create: `src/audioLabels.test.ts`
- Modify: `src/App.tsx`
- Modify: localization dictionaries used by `t()` in `src/App.tsx`

**Interfaces:**
- Produces: `backgroundAudioLabel(key, language):string` with German fallback.
- Consumes: application `Language` and current settings language.

- [ ] **Step 1: Write failing tests** for German and English stop/start labels plus unsupported-language German fallback.
- [ ] **Step 2: Run** `npx vitest run src/audioLabels.test.ts`; verify missing module failure.
- [ ] **Step 3: Implement** labels and replace hard-coded `BACKGROUND AUDIO STOPPEN`/English variants in item and section menus.
- [ ] **Step 4: Run** focused tests, `rg "BACKGROUND AUDIO STOPPEN|Stop background music" src`, and `npm run typecheck`; expect no unlocalized UI copy.
- [ ] **Step 5: Commit** with `feat(i18n): localize background audio controls`.

### Task 6: Add a global operator-sounds preference

**Files:**
- Modify: `src/preferences.ts`
- Create: `src/operatorSounds.ts`
- Create: `src/operatorSounds.test.ts`
- Modify: `src/audioRouting.ts`
- Modify: `src/AudioRoutingSettings.tsx`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: preference `operatorSoundsEnabled:boolean` defaulting to `true` and `playOperatorTone(enabled,routing,...):Promise<void>`.
- Consumes: existing routed notification/sound-effect tone functions.

- [ ] **Step 1: Write failing tests** proving default-on migration, disabled tones producing no oscillator/output call, and presentation/background routes remaining unchanged.
- [ ] **Step 2: Run** `npx vitest run src/operatorSounds.test.ts`; verify missing preference/helper failures.
- [ ] **Step 3: Implement** migration, Audio settings control, and the central guard used by completion/message/notification tone sites.
- [ ] **Step 4: Run** focused tests and `npm run typecheck`.
- [ ] **Step 5: Commit** with `feat(audio): make operator sounds optional`.

### Task 7: Define presentation-safe Spotify references and platform contracts

**Files:**
- Create: `src/spotify/types.ts`
- Create: `src/spotify/spotifyReference.ts`
- Create: `src/spotify/spotifyReference.test.ts`
- Modify: `src/platform/types.ts`
- Modify: `src/platform/PlatformServices.ts`
- Modify: `src/platform/capabilities.ts`
- Modify: `src/store.ts`

**Interfaces:**
- Produces: `SpotifyTrackReference`, `SpotifyConnectionStatus`, `SpotifySearchPage`, `SpotifyService`, and `sanitizeSpotifyReference(input)`.
- Consumes: official `open.spotify.com` URLs and `spotify:track:` URIs only.

- [ ] **Step 1: Write failing tests** for valid normalized metadata, rejected hosts/schemes, stripped unknown/token fields, and presentation round-trip with no credentials.
- [ ] **Step 2: Run** `npx vitest run src/spotify/spotifyReference.test.ts`; verify missing module failure.
- [ ] **Step 3: Implement** types, sanitizer, serializable metadata, and explicit desktop/web capability contracts with no playback method.
- [ ] **Step 4: Run** focused tests and `npm run typecheck`.
- [ ] **Step 5: Commit** with `feat(spotify): add safe track reference contracts`.

### Task 8: Implement Spotify PKCE and secure desktop token storage

**Files:**
- Create: `electron/SpotifyAuthService.ts`
- Create: `electron/SpotifyAuthService.test.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/platform/electron/createElectronServices.ts`

**Interfaces:**
- Produces: `connect()`, `completeCallback(url)`, `status()`, `accessToken()`, and `disconnect()` exposed through narrow IPC.
- Consumes: `SPOTIFY_CLIENT_ID`, PKCE authorize/token endpoints, Electron `safeStorage`, validated callback state.

- [ ] **Step 1: Write failing tests** for verifier/challenge generation, state mismatch, missing Client ID, encrypted refresh token persistence, refresh, disconnect deletion, and redacted errors.
- [ ] **Step 2: Run** `npx vitest run electron/SpotifyAuthService.test.ts`; verify missing service failure.
- [ ] **Step 3: Implement** the auth service and IPC without client secret, playback scopes, token logging, or renderer token exposure.
- [ ] **Step 4: Run** focused tests, `npm run typecheck`, and grep serialized/logged structures for token fields.
- [ ] **Step 5: Commit** with `feat(spotify): add secure PKCE account connection`.

### Task 9: Add Spotify catalog search, settings, and manual open workflow

**Files:**
- Create: `src/spotify/SpotifyCatalogService.ts`
- Create: `src/spotify/SpotifyCatalogService.test.ts`
- Create: `src/spotify/SpotifySettings.tsx`
- Create: `src/spotify/SpotifySettings.test.tsx`
- Create: `src/spotify/SpotifyBrowser.tsx`
- Create: `src/spotify/SpotifyBrowser.test.tsx`
- Modify: `src/MediaBrowser.tsx`
- Modify: `src/App.tsx`
- Modify: `src/audio-browser.css`

**Interfaces:**
- Produces: paginated normalized search, settings connection UI, browser results, stored references, and `openTrack(reference)`.
- Consumes: Task 7 `SpotifyService` and Task 8 desktop bridge; calls external open only after an explicit user click.

- [ ] **Step 1: Write failing tests** for title/artist/album search, pagination, retryable 429/network errors, missing Premium/Client ID messages, connect/disconnect status, adding a reference, and explicit-only external opening.
- [ ] **Step 2: Run** the new Spotify test files; verify missing components/services fail.
- [ ] **Step 3: Implement** catalog normalization, settings section, responsive media-browser tab, saved reference card, and manual „In Spotify öffnen“ action.
- [ ] **Step 4: Run** focused tests, `npm run typecheck`, and verify no autoplay/playback/streaming API exists in the Spotify contracts.
- [ ] **Step 5: Commit** with `feat(spotify): add account search and manual track links`.

### Task 10: Prepare, verify, and publish version 0.61.0

**Files:**
- Create: `scripts/check-version61.cjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/release.yml`
- Modify: `CHANGELOG.md`
- Modify: `RELEASE_NOTES.md`
- Modify: `public/releases.json`

**Interfaces:**
- Produces: public V61 metadata and a release guard included by local and GitHub workflows.
- Consumes: all prior task outputs.

- [ ] **Step 1: Write the failing V61 release guard** checking version, current release entry, clean packaged entry, first-slide selector, operator sound setting, section stop control, Spotify reference/auth/search surfaces, and absence of playback scopes/APIs.
- [ ] **Step 2: Run** `node scripts/check-version61.cjs`; verify it fails on `0.60.0` and missing metadata.
- [ ] **Step 3: Update** version, lockfile, changelog, detailed notes, public releases, and GitHub release checks.
- [ ] **Step 4: Run** `npm run test:unit`, `npm run typecheck`, `npm run build`, `npm run build:web`, clean packaged-entry verification, and `npm run installer`; all must exit zero.
- [ ] **Step 5: Perform** whole-branch review, fix critical/important findings, rerun the complete verification, and commit `chore(release): prepare version 0.61.0`.
- [ ] **Step 6: Publish** to `main` only with the user's explicit authorization, then monitor both release-notes and cross-platform workflows to success and verify the `v0.61.0` assets through the GitHub Releases API.
