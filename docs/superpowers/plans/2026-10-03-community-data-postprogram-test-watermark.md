# Community Data, Post-Program Notice, and Test Watermark Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize Firebase event, room, and announcement data; generate the safe automatic post-program room notice; and place an unavoidable test-mode watermark on every rendered output.

**Architecture:** Extend the existing `FirebaseGemeindeService` and renderer-side community services instead of creating parallel stores. Normalize all event, room, and announcement data before rendering, compute the post-program notice in a focused domain service using an injected trusted clock, and distribute an orthogonal `{mode,onAir}` runtime state to output windows where a final overlay layer renders the watermark.

**Tech Stack:** TypeScript, React 19, Zustand, Electron IPC/BrowserWindow, Firebase Realtime Database, Vitest, Vite, electron-builder.

**Spec:** `docs/superpowers/specs/2026-10-03-community-data-postprogram-test-watermark-design.md`

## Global Constraints

- Keep `philippusgemeindebie` and paths `veranstaltungen/`, `meldungen/`, and `rooms/` as the only source of truth.
- Preserve `eventKey`, `messageId`, and the canonical Firebase room key; never identify records only by visible names.
- Never render raw Firebase records, unresolved room IDs, technical errors, `undefined`, or `[object Object]` on any output.
- Do not update a currently visible dynamic snapshot mid-frame; activate prepared changes only at safe output transitions.
- Use effective room and effective time for the post-program check; search `> now` through `<= now + 61 minutes`.
- Test mode and ON AIR are independent; all final visual outputs show a system watermark whenever `mode === "test"`.
- The watermark cannot be disabled or styled by presentation content, quick screens, remote control, plugins, MIDI, OSC, or HTTP API.

## Review Focus

- A room object nested under compatibility containers or arbitrary Firebase branches still resolves by its exact child key and never leaks that key to MAIN.
- Mixed timestamp shapes and invalid delay values fall back to plan time without creating invalid dates or throwing.
- A post-program candidate moved into or out of the room via replacement location is selected or removed at the next safe transition.
- Test mode changed while outputs are already running reaches every output without being coupled to ON AIR.
- The watermark remains the final composited layer for black quick screens, browser/video content, transitions, livestream, and recording.

---

### Task 1: Central Firebase subscriptions and complete offline snapshot

**Files:**
- Modify: `electron/FirebaseGemeindeService.ts`
- Modify: `electron/CommunitySnapshotCache.ts`
- Modify: `electron/FirebaseGemeindeService.test.ts`
- Modify: `electron/CommunitySnapshotCache.test.ts`

**Interfaces:**
- Produces: `CommunityRealtimeAdapter.watchChildren(path: 'veranstaltungen'|'meldungen'|'rooms', handlers)` and one shared `FirebaseGemeindeService` event/room/message state.
- Produces: `CommunityCachePayload` with `events`, `rooms`, `announcements`, and `updatedAt` on read.
- Preserves: `subscribeEvents`, `subscribeRooms`, `subscribeAnnouncements`, `subscribeConnection`, and `updateEvent` consumer behavior.

- [ ] **Step 1: Write failing child-key and cache tests**

Add tests proving event and room `added/changed/removed` operations preserve the Firebase child key, do not duplicate records, and persist all three collections. Add a cache test that restores rooms together with events and announcements and rejects malformed cache content safely.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- electron/FirebaseGemeindeService.test.ts electron/CommunitySnapshotCache.test.ts`

Expected: FAIL because event/room child subscriptions and room cache payload are not implemented.

- [ ] **Step 3: Implement the minimal central subscription changes**

Make `watchChildren` accept all three collection paths, keep maps keyed by `eventKey`, `messageId`, and `roomId`, include rooms in cache persistence/restoration, and keep Firebase initialization solely inside `createCommunityRealtimeAdapter()`.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- electron/FirebaseGemeindeService.test.ts electron/CommunitySnapshotCache.test.ts`

Expected: all focused tests PASS.

- [ ] **Step 5: Commit**

```bash
git add electron/FirebaseGemeindeService.ts electron/CommunitySnapshotCache.ts electron/FirebaseGemeindeService.test.ts electron/CommunitySnapshotCache.test.ts
git commit -m "refactor: centralize realtime community collections"
```

### Task 2: Recursive RoomService normalization

**Files:**
- Modify: `src/community/RoomService.ts`
- Modify: `src/community/RoomService.test.ts`

**Interfaces:**
- Produces: `RoomService.setRooms(source: unknown): void` accepting flat arrays or nested Firebase structures.
- Produces: `RoomService.resolve(reference: unknown): NormalizedRoom | null` and `RoomService.display(reference, extended?)` that never exposes an unresolved ID.
- Produces: `NormalizedRoom` with `type`, `roomId`, `name`, `shortName?`, `floor`, `building`, `capacity?`, and `accessible?`.

- [ ] **Step 1: Write failing recursive resolution tests**

Cover an exact key such as `-dieJsO8X`, arbitrary nested branches, compatibility containers, canonical-ID fields, all name/floor/building variants, alias arrays, umlauts, code/slug, and composite aliases. Assert an unresolved ID displays only a neutral public fallback.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/community/RoomService.test.ts`

Expected: FAIL on nested input and extended aliases.

- [ ] **Step 3: Implement recursive flattening and alias indexing**

Add focused private helpers for record detection, canonical ID selection, recursive traversal, nested field lookup, and normalized aliases. Exact `roomsById` lookup must always precede alias lookup.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- src/community/RoomService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/community/RoomService.ts src/community/RoomService.test.ts
git commit -m "feat: resolve nested firebase rooms by stable id"
```

### Task 3: EventService store, effective time, and structured locations

**Files:**
- Modify: `src/community/EventService.ts`
- Modify: `src/community/EventService.test.ts`
- Modify: `src/events.ts`
- Modify: `src/loopDataService.ts`

**Interfaces:**
- Produces: `EventService.getAllEvents()`, `upsert(event)`, `remove(eventKey)`, `isTrashed(event)`, `getPlannedLocation(event)`, and `getEffectiveLocation(event)`.
- Changes: location getters return normalized structured locations instead of public label strings.
- Produces: public DTOs that retain planned/effective dates and allowed room details but never raw room references.

- [ ] **Step 1: Write failing event-domain tests**

Test store updates, date/time field variants, invalid delay fallback, cancellation, trash, internal/external/online/hybrid locations, legacy `ort` room references, replacement room, additional rooms, and public DTO redaction. Include a test whose production regression would expose `-dieJsO8X` on MAIN.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/community/EventService.test.ts`

Expected: FAIL because structured getters and store methods are missing.

- [ ] **Step 3: Implement minimal EventService APIs and update consumers**

Use local trusted date parsing, keep plan/effective values separate, resolve room locations only through `RoomService`, and adapt `events.ts` and `loadPublicEvents()` to public DTOs.

- [ ] **Step 4: Run event and loop tests and verify GREEN**

Run: `npm test -- src/community/EventService.test.ts src/loopDataService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/community/EventService.ts src/community/EventService.test.ts src/events.ts src/loopDataService.ts
git commit -m "feat: normalize effective event times and locations"
```

### Task 4: Announcement eligibility and stable public snapshots

**Files:**
- Modify: `src/community/AnnouncementService.ts`
- Modify: `src/community/AnnouncementService.test.ts`
- Modify: `src/community/StableLoopSnapshot.ts`
- Modify: `src/community/StableLoopSnapshot.test.ts`
- Modify: `src/loopDataService.ts`

**Interfaces:**
- Preserves: `AnnouncementService.getForPlacement(records, now, placement)`.
- Produces: sanitized `PublicAnnouncement` only.
- Produces: prepared/current snapshot semantics that retain a removed visible record until `completeDisplay()` and activate updates only at the next safe boundary.

- [ ] **Step 1: Write failing announcement and snapshot tests**

Cover public status compatibility, truthy `messageScreen`, `showFrom` precedence, `Bis auf Weiteres`, invalid date ranges, target-specific loops, text fallback, QR reference, redaction, zero-result `EMPTY`, and removal during current display.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/community/AnnouncementService.test.ts src/community/StableLoopSnapshot.test.ts`

Expected: at least the compatibility or safe-removal assertions FAIL.

- [ ] **Step 3: Implement minimal announcement and snapshot corrections**

Keep the existing screenmeldung renderer and expose no extra Firebase fields. Make `loopDataService` report empty data without creating a blank display.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/community/AnnouncementService.test.ts src/community/StableLoopSnapshot.test.ts src/loopDataService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/community/AnnouncementService.ts src/community/AnnouncementService.test.ts src/community/StableLoopSnapshot.ts src/community/StableLoopSnapshot.test.ts src/loopDataService.ts
git commit -m "fix: stabilize realtime announcement output"
```

### Task 5: Automatic room notice for NACHPROGRAMM

**Files:**
- Create: `src/community/PostProgramRoomNoticeService.ts`
- Create: `src/community/PostProgramRoomNoticeService.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/loopData.ts`
- Modify: `src/LoopPreview.tsx`

**Interfaces:**
- Produces: `PostProgramRoomNoticeService.compute(presentation, now): PostProgramRoomNotice`.
- Produces: `PostProgramRoomNotice` variants `next-event` and `leave-room` with only public render fields.
- Consumes: `EventService`, `RoomService` through EventService, `presentation.linkedEventKey`, and injected `TrustedClock` time.

- [ ] **Step 1: Write failing selection tests**

Assert: current event excluded; now excluded; exactly 61 minutes included; 61 minutes plus 1 ms excluded; earliest candidate wins; private event counts; cancelled/trashed does not; effective replacement room counts; moved-out event does not; unresolved current room returns leave-room; output text is exact and contains no room ID.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/community/PostProgramRoomNoticeService.test.ts`

Expected: FAIL because service does not exist.

- [ ] **Step 3: Implement the domain service**

Implement pure selection and public notice mapping. Keep the leave-room fallback exact: `Wir bitten alle Besucher, den Raum zu verlassen.`

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- src/community/PostProgramRoomNoticeService.test.ts`

Expected: PASS.

- [ ] **Step 5: Integrate safe recomputation into the post-program loop**

Subscribe to normalized event/room revisions while post-program is active, prepare changes immediately, and activate them only when the loop controller reaches a safe transition. Do not create a persistent duplicate slide in presentation data.

- [ ] **Step 6: Add and run integration tests**

Add an App/loop integration test proving cancellation, room change, and time change update the next safe post-program frame without replacing the current frame.

Run: `npm test -- src/community/PostProgramRoomNoticeService.test.ts src/LoopPreview.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/community/PostProgramRoomNoticeService.ts src/community/PostProgramRoomNoticeService.test.ts src/App.tsx src/loopData.ts src/LoopPreview.tsx src/LoopPreview.test.tsx
git commit -m "feat: add automatic post-program room notice"
```

### Task 6: Community preflight and operator-only offline diagnostics

**Files:**
- Modify: `src/community/communityPreflight.ts`
- Modify: `src/community/communityPreflight.test.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `CommunityPreflightSnapshot` including rooms/load states and prepared loop states.
- Produces: operator warnings for unresolved main/replacement rooms and stale cache without exposing them to output payloads.
- Preserves: optional dynamic content does not block ON AIR by default.

- [ ] **Step 1: Write failing preflight tests**

Cover online, offline timestamp, empty/error state, unresolved linked event, unresolved internal/replacement room, missing current room ID, empty optional loops, and successful prepared post-program data.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/community/communityPreflight.test.ts`

Expected: FAIL for room and post-program checks.

- [ ] **Step 3: Implement extended preflight and operator wiring**

Keep `ready: true` for optional dynamic failures, while preserving explicit warnings in the operator preflight dialog only.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- src/community/communityPreflight.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/community/communityPreflight.ts src/community/communityPreflight.test.ts src/App.tsx
git commit -m "feat: validate community data before live output"
```

### Task 7: Orthogonal app mode and output IPC state

**Files:**
- Create: `src/appMode.ts`
- Create: `src/appMode.test.ts`
- Modify: `src/App.tsx`
- Modify: `electron/OutputWindowManager.ts`
- Modify: `electron/OutputWindowManager.test.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Produces: `AppModeState { mode: 'normal'|'test'; onAir: boolean }` and transition helpers that never infer one property from the other.
- Produces: output IPC event `outputs:app-mode` and initial-state delivery for every newly opened output window.
- Consumes: existing ON-AIR session start/stop and test-operation controls.

- [ ] **Step 1: Write failing state tests**

Assert all four state combinations, OFF AIR not clearing test mode, ON AIR not enabling/disabling test mode, and explicit test-mode changes preserving ON AIR.

- [ ] **Step 2: Run app-mode test and verify RED**

Run: `npm test -- src/appMode.test.ts`

Expected: FAIL because the state model does not exist and App currently clears local test mode.

- [ ] **Step 3: Implement global app-mode state and remove coupling**

Replace local `testMode` coupling in `App.tsx`, remove the effect that clears test mode when OFF AIR, and preserve current operator button behavior through explicit mode transitions.

- [ ] **Step 4: Write failing output-manager IPC tests**

Assert a new window receives current `{mode,onAir}`, every existing window receives changes, and destroyed windows are ignored safely.

- [ ] **Step 5: Run output-manager test and verify RED**

Run: `npm test -- electron/OutputWindowManager.test.ts`

Expected: FAIL because app-mode state is not sent.

- [ ] **Step 6: Implement IPC distribution and verify GREEN**

Run: `npm test -- src/appMode.test.ts electron/OutputWindowManager.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/appMode.ts src/appMode.test.ts src/App.tsx electron/OutputWindowManager.ts electron/OutputWindowManager.test.ts electron/main.ts electron/preload.ts src/vite-env.d.ts
git commit -m "feat: separate test mode from on-air state"
```

### Task 8: Final test watermark layer on every visual output

**Files:**
- Create: `src/TestModeWatermark.tsx`
- Create: `src/TestModeWatermark.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Produces: `TestModeWatermark({role, visible})` with `TESTBETRIEB` for main/livestream/virtual roles and `TEST` for stage/personal-monitor roles.
- Consumes: output app-mode IPC state.
- Placement: final child of the actual `.output` root, after content, transitions, and `QuickOverlay`.

- [ ] **Step 1: Write failing overlay tests**

Render normal/test with ON AIR true/false and each role. Assert no normal watermark, mandatory test watermark, correct role text, `aria-hidden`, and stable layer after quick/transition content. Include black quick screen, video, and website fixtures to prove DOM stacking order.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- src/TestModeWatermark.test.tsx`

Expected: FAIL because component and final layer do not exist.

- [ ] **Step 3: Implement the minimal component, CSS, and Output wiring**

Use a neutral system font, responsive equivalent of 18–24 px at 1920×1080, 20–30 px safe inset, 45–65% opacity, `pointer-events:none`, and the system overlay z-index. Do not pass presentation styles into the component.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/TestModeWatermark.test.tsx src/appMode.test.ts electron/OutputWindowManager.test.ts`

Expected: PASS.

- [ ] **Step 5: Add final-frame assertions**

Extend output rendering tests to assert the watermark remains above `SCHWARZ`, transition, livestream lower-third, stage output, and the render path used by recording. If recording has an independent compositor, insert the same final overlay in that compositor and test it there.

- [ ] **Step 6: Commit**

```bash
git add src/TestModeWatermark.tsx src/TestModeWatermark.test.tsx src/App.tsx src/styles.css
git commit -m "feat: watermark every test-mode output"
```

### Task 9: Release regression guard, full verification, and packaging

**Files:**
- Create: `scripts/check-version74.cjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.github/workflows/release.yml`
- Modify: `RELEASE_NOTES.md`
- Modify: `public/releases.json`

**Interfaces:**
- Produces: V74 release metadata and a guard that checks central Firebase ownership, recursive room resolution, post-program boundary rules, independent app-mode state, and final watermark layer.

- [ ] **Step 1: Add the V74 release guard before metadata changes**

Run: `node scripts/check-version74.cjs`

Expected: FAIL because version/release metadata is still V73.

- [ ] **Step 2: Set version and release notes to V74**

Document community data normalization, the automatic room notice, offline/preflight behavior, and test-output watermark. Add the guard to `verify:release` and the release workflow.

- [ ] **Step 3: Run complete verification**

Run: `npm run typecheck`

Run: `npm test`

Run: `npm run verify:release`

Expected: all commands PASS with no unreported failures.

- [ ] **Step 4: Build and inspect the Windows installer**

Run: `npm run installer`

Expected: `release/GottesdienstRegie-Setup-0.74.0.exe` and blockmap are produced successfully.

- [ ] **Step 5: Commit the release metadata**

```bash
git add scripts/check-version74.cjs package.json package-lock.json .github/workflows/release.yml RELEASE_NOTES.md public/releases.json
git commit -m "release: prepare version 0.74.0"
```

- [ ] **Step 6: Verify branch state before publication**

Run: `git diff --check && git status --short && git log --oneline -10`

Expected: only known ignored/unrelated workspace artifacts remain untracked; all implementation and release files are committed.

