# V69 Firebase Loop Services Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize Firebase event and announcement data, expose normalized public snapshots, and feed stable PRE-/POST-loop output and preflight.

**Architecture:** One Electron-owned `FirebaseGemeindeService` observes the existing paths. Focused event and announcement services normalize/filter raw data, while IPC exposes public snapshots and commands; loop renderers never receive raw Firebase records.

**Tech Stack:** TypeScript, Electron IPC, Firebase Realtime Database REST/SDK boundary, React, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-30-v69-firebase-loops-now-playing-design.md`

## Global Constraints

- Keep Firebase project `philippusgemeindebie` and paths `veranstaltungen/` and `meldungen/` unchanged.
- Preserve every Firebase Child-Key as `eventKey` or `messageId`.
- Do not create another event/message database or duplicate time/filter logic.
- MAIN receives public normalized fields only and never technical errors.
- Freeze visible snapshots until a safe loop transition; LIVE has priority.

## Review Focus

- Malformed dates and German `dd.mm.yyyy`/ISO inputs must not crash filtering; tests belong to Task 2.
- Missing `gottesdienstRegie.loopTargets` must not accidentally cross PRE/POST boundaries; tests belong to Task 3.
- Reconnect events must not duplicate child records or subscriptions; tests belong to Task 1.
- Expired offline records must not reappear on MAIN; tests belong to Task 4.
- Deleting the currently visible record must preserve it only until the next safe transition; tests belong to Task 5.

---

### Task 1: Single Firebase ownership and realtime snapshots

**Files:**
- Create: `electron/FirebaseGemeindeService.ts`
- Test: `electron/FirebaseGemeindeService.test.ts`
- Modify: `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`

**Interfaces:**
- Produces: `subscribeEvents(listener)`, `subscribeAnnouncements(listener)`, `connectionState()`, `dispose()` and IPC snapshot subscriptions.

- [ ] Write failing tests proving one initialization, Child-Key preservation, child add/change/remove, and reconnect deduplication.
- [ ] Run `npx vitest run electron/FirebaseGemeindeService.test.ts`; expect failures for the missing service.
- [ ] Implement the service with one configured database instance and controlled listener cleanup.
- [ ] Add typed IPC/preload subscription methods; expose no raw database handle.
- [ ] Re-run the focused test; expect all tests to pass.
- [ ] Commit `feat: centralize firebase community data`.

### Task 2: EventService and EventCommandService

**Files:**
- Create: `src/community/EventService.ts`, `src/community/EventCommandService.ts`
- Test: `src/community/EventService.test.ts`, `src/community/EventCommandService.test.ts`
- Modify: `src/events.ts`, `src/App.tsx`, `src/EventLinkStatus.tsx`

**Interfaces:**
- Produces: `EventService.getByKey`, `getPlannedStart`, `getPlannedEnd`, `getEffectiveStart`, `getEffectiveEnd`, `isCancelled`, `getEffectiveLocation`, `isPublic`, `getUpcomingEvents`, `toPublicEvent`.
- Produces: `EventCommandService.updateEffectiveServiceTime(eventKey, serviceTime)`.

- [ ] Write failing table tests for planned/effective time, compatible delay/cancel shapes, replacement location, public filtering, stable renames, malformed dates, and public-field projection.
- [ ] Run both focused tests; expect missing interfaces.
- [ ] Implement immutable normalization and `PublicEvent` projection.
- [ ] Implement commands that write only effective/delay fields and reject empty Child-Keys.
- [ ] Replace direct reads/writes in `events.ts` and UI with service calls/subscriptions.
- [ ] Re-run focused tests and event-link tests; expect pass.
- [ ] Commit `feat: add central event domain services`.

### Task 3: AnnouncementService and screen renderer adapter

**Files:**
- Create: `src/community/AnnouncementService.ts`
- Test: `src/community/AnnouncementService.test.ts`
- Modify: `src/loopData.ts`, `src/screenmeldungAdapter.ts`, `public/screenmeldung/screenmeldung.js`

**Interfaces:**
- Produces: `AnnouncementService.forLoop(target, now)`, `isPublicForMessageScreen`, `toPublicAnnouncement`.

- [ ] Write failing tests for trash/status/messageScreen, `giltAb`, `showFrom`, `Bis auf Weiteres`, text fallback, QR identity, PRE-only/POST-only, missing targets, and internal-field removal.
- [ ] Run the focused test; expect failure.
- [ ] Implement normalization/filtering and public projection.
- [ ] Remove Firebase initialization/listeners from `screenmeldung.js`; make it consume adapter payload only.
- [ ] Re-run focused and `screenmeldungAdapter` tests; expect pass.
- [ ] Commit `feat: normalize firebase announcements`.

### Task 4: Offline cache and operator status

**Files:**
- Create: `electron/CommunitySnapshotCache.ts`
- Test: `electron/CommunitySnapshotCache.test.ts`
- Modify: `electron/FirebaseGemeindeService.ts`, `src/App.tsx`

**Interfaces:**
- Produces: `{mode:'online'|'offline-cache'|'empty'|'error', updatedAt, events, announcements}`.

- [ ] Write failing tests for persistence, restoration, age/status reporting, and filtering expired cached records.
- [ ] Run focused tests; expect failure.
- [ ] Implement atomic cache writes in Electron user data and safe reads.
- [ ] Show `Offline · letzter Stand HH:mm Uhr` only in operator UI.
- [ ] Re-run tests; expect pass.
- [ ] Commit `feat: cache community snapshots offline`.

### Task 5: Stable PRE-/POST-loop snapshots and EMPTY behavior

**Files:**
- Create: `src/community/StableLoopSnapshot.ts`
- Test: `src/community/StableLoopSnapshot.test.ts`
- Modify: `src/loopDataService.ts`, `src/loopDomain.ts`, `src/App.tsx`, `src/SlideRenderer.tsx`

**Interfaces:**
- Produces: `prepare(next)`, `beginDisplay(id)`, `completeDisplay()`, `current()` and `isEmpty`.

- [ ] Write failing tests for safe-boundary activation, deletion during display, EMPTY skip, effective-event sorting, and PRE/POST separation.
- [ ] Run focused tests; expect failure.
- [ ] Implement pending/current snapshot buffers and wire loop resolution to service data.
- [ ] Ensure current output receives only `PublicEvent`/`PublicAnnouncement`.
- [ ] Re-run focused and loop-controller tests; expect pass.
- [ ] Commit `feat: stabilize dynamic loop snapshots`.

### Task 6: Community preflight and integration

**Files:**
- Create: `src/community/communityPreflight.ts`
- Test: `src/community/communityPreflight.test.ts`
- Modify: `src/App.tsx`, `src/platform/PlatformServices.ts`, `electron/DisplayManager.ts`

**Interfaces:**
- Produces: `communityPreflight(snapshot, linkedEventKey, loopItems)` returning warnings, counts and resolved-event state.

- [ ] Write failing tests for online/offline, missing linked key, counts, empty optional loops, and non-blocking warnings.
- [ ] Run focused tests; expect failure.
- [ ] Implement and merge results into existing preflight without exposing technical errors.
- [ ] Run `npm run test:unit` and `npm run typecheck`; expect pass.
- [ ] Commit `feat: add firebase community preflight`.

