# GottesdienstRegie v75 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zuverlässige native Ausgabe und Radio-Wiedergabe sowie sichere, referenzgetreue Veranstaltungs- und Nachprogramm-Anzeigen liefern.

**Architecture:** Bestehende zentrale Services erweitern. Native Outputs synchronisieren versionierte Zustände, Radio bleibt in der BackgroundAudioEngine, Gemeindedaten werden vor Darstellung normalisiert. Nachprogramm-Sessions halten Farbe und sichtbaren Snapshot getrennt von vorbereiteten Daten.

**Tech Stack:** Electron 37, React 19, TypeScript, Firebase Realtime Database, Vitest, Playwright, electron-builder.

**Spec:** `docs/superpowers/specs/2026-10-03-v75-live-output-radio-postprogram-design.md`

## Global Constraints

- Native Ausführung ist vom Benutzer gewählt; Implementierer arbeitet selbst in der bestehenden Worktree, abschließend unabhängige Review gemäß Ausführungs-Skill.
- Keine parallele Firebase-Datenbank und keine direkten Firebase-Zugriffe aus Renderern.
- `mode === test` allein aktiviert `TESTBETRIEB`, unabhängig von ON AIR und Audio.
- Raumreferenzen bleiben stabil; technische IDs dürfen nie Besuchertext sein.
- Nachprogramm-Fenster: `start > now && start <= now + 61 * 60_000`; alle Treffer, keine ausgefallenen/gelöschten Events.
- Sessionfarben ausschließlich `#608F9A` und `#699F3E`, einmal pro tatsächlichem Eintritt auswählen.
- Räumungstext exakt: `Wir bitten alle Besucher, den Raum zu verlassen.`
- Veranstaltungstitel weder kürzen noch automatisch verkleinern; Metazeilen bleiben statisch.
- Keine behauptete physische Hörbarkeit ohne Hardwareprüfung; keine synthetischen Pegel als Signalnachweis.
- Änderungen an Produktdateien ausschließlich nach Planfreigabe; Veröffentlichung erst nach verifizierten Tests und Build.

## Review Focus

1. Ein Renderer wird erst nach der ersten IPC-Nachricht bereit: neuestes vollständiges Bild statt leerer Ausgabe (Task 1).
2. Mehrdeutiger Alias oder unbekannter Raum: keine falsche Raumzuordnung und keine Räumungsaufforderung (Tasks 4–5).
3. Audioanalyse ist wegen Browser/CORS nicht verfügbar: hörbarer Wiedergabeweg bleibt unberührt, Signalstatus ehrlich (Tasks 2–3).
4. Während der Anzeige fällt der letzte Nachprogramm-Termin weg: nächster sicherer Wechsel übernimmt den leeren Befund ohne Farbwechsel (Task 5).
5. Font lädt verspätet oder Titelcontainer ändert Größe: erneut messen, vollständiger Titel und statische Metadaten (Task 6).

## Dateigrenzen und Reihenfolge

Tasks 1–3 liefern einzeln testbare Output-/Audio-Reparaturen. Tasks 4–6 erweitern Daten und Ansichten. Task 7 integriert Overlay/Preflight, Task 8 klärt Updates, Task 9 prüft und veröffentlicht. Kein Komplettumbau von `src/App.tsx`: neue Logik in fokussierte Module auslagern, dort nur Anschlussstellen ändern.

### Task 1: Output-Start mit wiederherstellbarem Zustand

**Files:** Modify `electron/OutputWindowManager.ts`, `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`, `src/App.tsx`; Create `src/outputState.ts`, `src/outputState.test.ts`; Test `electron/OutputWindowManager.test.ts`.

**Interfaces:** `OutputStateSnapshot = { revision:number; slide:unknown|null; quick:unknown|null; appMode:AppModeState }`; `OutputWindowManager.getStateForSender(webContentsId:number):OutputStateSnapshot|null`; Desktop `getOutputState():Promise<OutputStateSnapshot|null>`; `shouldApplyOutputState(currentRevision:number,incomingRevision:number):boolean`.

- [ ] Add failing tests `restores_state_after_late_subscription`, `rejects_stale_initial_response`, `isolates_role_specific_quick_state`, `ignores_destroyed_window`: assert latest slide and explicit cleared quick state, strictly increasing state revision, only sender's role available.
- [ ] Run `npx vitest run electron/OutputWindowManager.test.ts src/outputState.test.ts`; confirm new assertions fail for absent replay behavior.
- [ ] Implement manager-owned role snapshots, authenticated sender lookup and preload query. Register renderer listeners before querying; apply only non-stale state. Keep slide `_outputRevision` compatibility distinct from state revision. Retain current state across renderer reload, reset appropriately on new presentation/output session.
- [ ] Trace native route/auth/loading gates and goOnAir error handling in `src/App.tsx` and `electron/main.ts`; add a regression test for any additional observed blank-output cause before fixing it. Report missing display/start failures in operator UI.
- [ ] Run tests above plus `npx vitest run src/MainOutputSurface.test.tsx` and `npm run typecheck`; expect success.
- [ ] Commit only task files: `fix: restore initial native output state reliably`.

### Task 2: Non-invasive measured audio levels

**Files:** Modify `src/audio/AudioLevelProvider.ts`, `src/audio/AudioLevelProvider.test.ts`, `src/BackgroundAudioEngine.ts`; inspect callers in `src/SlideRenderer.tsx`.

**Interfaces:** Preserve `connect(media:HTMLMediaElement)` and `levels():number[]`; add `getSignalState(): 'present'|'silent'|'unavailable'|'idle'` and `getContextState():string`. `disconnect():void` tears down only analysis resources.

- [ ] Replace false-success fallback tests with `analysis_does_not_reroute_media`: assert `createMediaElementSource` never called, no connection to audible destination; `capture_unavailable_preserves_playback`: assert status unavailable and no fabricated measured levels; `resumes_and_cleans_analysis`: suspended context resumed and previous analysis disconnected.
- [ ] Run `npx vitest run src/audio/AudioLevelProvider.test.ts`; verify red.
- [ ] Use supported media capture stream and an analysis-only MediaStreamSource; gracefully report unavailable if capture/security prohibits measurement. Avoid altering media `src`, sink, mute or volume. Manage one analysis lifecycle and async resume/disconnect races; never stop tracks owned by playback. Preserve decorative animations only when explicitly separate from measured signal.
- [ ] Run the same tests and typecheck; verify actual analyser samples map to levels, unavailable remains honest.
- [ ] Commit `fix: prevent audio metering from hijacking radio output`.

### Task 3: Radio route, health and operator diagnosis

**Files:** Modify `src/BackgroundAudioEngine.ts`, `src/audioRouting.ts`, `src/BackgroundAudioPanel.tsx`, `src/App.tsx`; Create `src/audio/backgroundAudioHealth.ts`, `src/audio/backgroundAudioHealth.test.ts`, `src/BackgroundAudioEngine.test.ts`.

**Interfaces:** `BackgroundAudioHealth = {status:'connecting'|'buffering'|'playing'|'no-signal'|'output-unavailable'|'stream-error'|'paused'|'idle'; signal:'present'|'silent'|'unavailable'|'idle'; route:'background'; deviceId:string; deviceName:string; volume:number; muted:boolean; contextState:string; fallback:boolean}`. Expose via `BackgroundAudioState.health` and engine `getHealth():BackgroundAudioHealth`; keep existing consumers backward-compatible during migration.

- [ ] Add tests `play_promise_alone_is_not_playing`, `uses_background_sink`, `missing_device_is_not_playing`, `device_returns_restores_route`, `test_mode_does_not_mute`, `continuing_section_keeps_source`, `stale_route_request_cannot_override_latest`. Assert requested sink ID, actual volume/mute, observable progress and route result.
- [ ] Run `npx vitest run src/BackgroundAudioEngine.test.ts src/audio/backgroundAudioHealth.test.ts src/radioPlayback.test.ts`; confirm new failures.
- [ ] Track media playing/waiting/error/time progress separately from requested play. Await route application; surface failures, explicitly record fallback rather than swallow errors. Listen to device changes and serialize/generation-guard routing. Resume applicable suspended context; retain source across configured continuing sections. Cancel stale fades/start operations so old callbacks cannot mute a new track.
- [ ] Add compact diagnosis using actual health fields and measured levels: Stream, Signal, Route Background Audio, Ausgang, Lautstärke, Mute, AudioContext. Use required German status labels; unavailable measurement is not silence, confirmed silent samples require an observation interval before no-signal.
- [ ] Run tests above, `npx vitest run src/audio/AudioLevelProvider.test.ts` and typecheck; expect green.
- [ ] Commit `fix: route radio through background audio with health diagnostics`.

### Task 4: Canonical rooms and effective event data

**Files:** Modify `src/community/RoomService.ts`, `src/community/EventService.ts`, their `.test.ts` files; inspect `src/community/FirebaseGemeindeService.ts` and its tests; Modify `src/community/communityPreflight.ts`, its test.

**Interfaces:** Retain existing EventService public methods and normalized location types; `RoomService.resolve(reference)` returns a unique normalized room or no match. Do not create competing location/time helpers in renderers.

- [ ] Add tests for all five nested containers, Firebase Child-Key preservation, explicit external place versus room reference, hybrid external subtype, replacement/additional rooms, conflicting aliases, renamed room, unresolved push-ID suppression, effective time-only change retaining plan date and original fields.
- [ ] Run `npx vitest run src/community/RoomService.test.ts src/community/EventService.test.ts src/community/communityPreflight.test.ts`; verify targeted failures.
- [ ] Normalize compatible name/ID/location fields per spec, direct IDs before unique aliases. Suppress unresolved technical references in public output; retain diagnostics internally. Derive effective time components from override plus matching plan components. Use existing command services for writes, not UI/renderer mutation.
- [ ] Correct preflight hybrid subtype and replacement resolution to match EventService. Test Firebase raw-data identity precedence if loading needs modification.
- [ ] Run `npx vitest run src/community` and typecheck; expect all pass.
- [ ] Commit `fix: normalize room references and effective event times`.

### Task 5: Session-stable postprogram and black reference renderer

**Files:** Modify `src/community/PostProgramRoomNoticeService.ts`, its test, `src/App.tsx`; Create `src/community/AppClock.ts`, `src/PostProgramRoomNotice.tsx`, `src/PostProgramRoomNotice.test.tsx`; Modify `src/styles.css`.

**Interfaces:** `PostProgramEventRow={id:string;title:string;start:string;end?:string;room:string}`. `PostProgramRoomNotice = {type:'next-events';events:PostProgramEventRow[]} | {type:'leave-room';text:typeof LEAVE_ROOM_TEXT}`. Service `compute(link:PresentationEventLink,now:Date):PostProgramRoomNotice|null`; null means invalid prerequisites, not no candidates. Controller `enterPostProgram():void`, `prepare(link,now):PostProgramRoomNotice|null`, `beginTransition():PostProgramRoomNoticeSnapshot|null`, `leavePostProgram():void`; snapshot includes `sessionId`, `headerColor`, notice. Inject random function for tests; `AppClock.now():Date` is centralized/injectable and exposes whether clock is externally trusted without claiming synchronization that does not exist.

- [ ] Add deterministic tests: matches at +30/+61, excludes +62/past/self/trash/cancelled; includes private/replacement room matches; preserves ALL sorted results; missing room returns null; color selected once from exact two values; leave/reenter allows another choice; prepare including null/removal does not alter visible snapshot until beginTransition.
- [ ] Run `npx vitest run src/community/PostProgramRoomNoticeService.test.ts`; confirm red.
- [ ] Implement all-match selection and explicit pending-state presence (null must clear old snapshot). Session starts from actual section entry, not data preparation or rendering. Firebase updates and clock ticks prepare candidates; transitions promote immutable snapshots. Output snapshots carry color, never randomize in individual renderers.
- [ ] Implement reference renderer: 17–18% header; black body; specified 25/29/31/15 table, effective times; empty header and exact top-left leave text. Partition excess rows into safe paginated snapshots without dropping candidates, retaining chronological order and session color. Preserve quick-screen priority.
- [ ] Add component tests asserting exact text/color, all rows across pages, no technical IDs or extra leave text. Run service/component tests, `src/MainOutputSurface.test.tsx`, typecheck; inspect 1080p screenshots.
- [ ] Commit `feat: render session-stable postprogram room notices`.

### Task 6: Bright events and overflow-only title animation

**Files:** Modify `src/SlideRenderer.tsx`, `src/dynamicEventSlide.ts`, `src/styles.css`; Create `src/EventTitle.tsx`, `src/EventTitle.test.tsx`; Modify `src/dynamicEventSlide.test.ts`.

**Interfaces:** `EventTitle({title}:{title:string})` owns measurement and animation of title only. Existing event design choices remain available; the normal numbered overview uses the bright reference treatment without removing other working designs.

- [ ] Add tests `fits_one_line`, `wraps_two_lines`, `scrolls_only_when_still_overflowing`, `remeasures_after_resize_and_font_load`, `reduced_motion_preserves_full_title`; assert full exact title text, unchanged font size, metadata outside animated node and cleanup of observers.
- [ ] Run `npx vitest run src/EventTitle.test.tsx src/dynamicEventSlide.test.ts`; confirm red.
- [ ] Implement two-line natural layout measurement after fonts/resize; use measured horizontal travel only for remaining overflow, with slow animation and pauses at both ends. No ellipsis/clamp/truncation or font shrink. Reduced motion uses full wrapping/page capacity adjustment. No render-time global data replacement of a current live snapshot.
- [ ] Style white two-column overview, turquoise heading/circles, black fixed-size titles, light static date/time/room/floor lines. Public location text comes from Task 4. Verify existing selectable designs and empty-element skipping still work.
- [ ] Run tests/typecheck and browser layout checks at 1080p and scaled preview, including long unbroken and hyphenated titles; expect full visible text through wrap or animation.
- [ ] Commit `feat: show complete event titles with isolated overflow scrolling`.

### Task 7: Global watermark and preflight integration

**Files:** Modify `src/TestModeWatermark.tsx`, its test, `src/appMode.ts`, `src/appMode.test.ts`, `src/App.tsx`, `src/MainLivePreview.tsx`, `src/LiveEngine.ts`, `src/styles.css`; Create `src/audio/audioPreflight.ts`, `src/audio/audioPreflight.test.ts`.

**Interfaces:** Preserve AppModeState. `audioPreflight(health:BackgroundAudioHealth|undefined):{warnings:string[]}` consumes Task 3 health; optional audio warnings do not blanket-block ON AIR. Existing community preflight consumes Task 4 resolution and Task 5 preparation.

- [ ] Add full role/mode matrix tests: normal has no mark; test OFF/ON AIR has `TESTBETRIEB` including stage/notes; mode transitions do not reset onAir/audio or session color. Add audio preflight assertions for missing engine/route/device and healthy configured output.
- [ ] Run relevant tests to confirm red.
- [ ] Attach system overlay outside content and transitions in all real output surfaces, including their mirrored previews. Keep highest content-independent layer, fixed sizing/opacity and no pointer events. Audit actual native web content and capture/stream paths; add overlay at final composition if they bypass DOM output.
- [ ] Run mode/watermark/preflight/unit tests and verify video/website/black/transition/new-window behavior; capture actual recording/stream frames where supported. Record unsupported/unverified paths instead of claiming coverage.
- [ ] Commit `fix: preserve test watermark across every output mode`.

### Task 8: Diagnose updater discovery without speculation

**Files:** Inspect `electron/main.ts`, `electron/updatePromptModel.test.ts`, `src/updateStatusSubscription.test.ts`, `src/App.tsx`, installed `app-update.yml`; Create `docs/verification/v75-update-diagnosis.md`. If cause requires extraction, Create `electron/updateCheckCoordinator.ts` and its test, then wire main handler.

**Interfaces:** Keep existing desktop update API. If concurrent/stale status is confirmed, `UpdateCheckCoordinator.check():Promise<UpdateStatus>` shares in-flight work and preserves the actual updater result; use the repository's existing update status type.

- [ ] Reproduce exact installed updater request endpoints and compare installed version, stable release/tag/manifest and returned UI status. Log no credentials or private preferences.
- [ ] For the observed cause only, add a failing regression test before changing code; run that focused test and confirm failure. Do not insert a guessed network bypass or suppress errors.
- [ ] Apply minimal proven fix, or document evidence and remaining runtime limitation if no failure can be reproduced. Preserve delayed startup check and background download ownership.
- [ ] Run `npx vitest run electron/updatePromptModel.test.ts src/updateStatusSubscription.test.ts` plus any new coordinator test; confirm successful packaged update check when possible.
- [ ] Commit scoped correction/evidence `fix: verify update discovery and preserve updater status` (use docs prefix if evidence only).

### Task 9: Full regression, native acceptance and release

**Files:** Modify `package.json`, `package-lock.json`, `public/releases.json`, `RELEASE_NOTES.md`, `.github/workflows/release.yml`; Create `scripts/check-version75.cjs`, `docs/verification/v75-acceptance.md`; update historical strict version guard only to retain forward compatibility.

- [ ] Run `npm run test:unit` and `npm run typecheck`; capture actual results and fix failures through regression tests, not weakened assertions.
- [ ] Execute spec acceptance matrix on native build: MAIN assigned monitor, test OFF/ON AIR, video/website/black/transitions, same-room window boundaries/session behavior and actual Background Audio device. Record pass/fail/unverified per case; no physical-audio claim from mocks.
- [ ] Perform independent whole-branch review using the execution skill's required review step; resolve findings and rerun affected plus full tests.
- [ ] Set version `0.75.0` and releaseSeries `0.75`; add accurate release notes/metadata and v75 guard covering entrypoints, metadata and required integrations. Run `npm run verify:release`, `npm run installer`, `npm run verify:package-entry`; require successful output.
- [ ] Commit verified release files. Publish through the existing authorized main/release workflow without force push or unrelated changes; inspect CI and resolve genuine release failures.
- [ ] Verify public tag `v0.75.0`, installer asset, `latest.yml` version and matching installer hash. Check updater offers it from an older installation where available; do not overwrite user data or force installation.
- [ ] Deliver verified installer link and concise implementation/test summary with any remaining hardware limitations explicitly stated.

## Self-review and handoff

Spec sections 1–2 map to Tasks 1/7, sections 3–6 to Tasks 4–6, section 7 to Tasks 2–3, section 8 to Tasks 7–8, section 9 to Task 9. All five Review Focus cases have explicit tests. Task 5 changes existing notice consumers together, Task 3 exposes health before Tasks 7 consumes it; no dependency on a fabricated service or clock synchronization. Existing native execution choice is preserved. Await plan review before implementation.
