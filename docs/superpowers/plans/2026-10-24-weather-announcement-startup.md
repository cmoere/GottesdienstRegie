# Weather / announcement / startup implementation plan

> **For agentic workers:** Native superpowers:executing-plans; no technical delegation. Proceed on the user's requested corrections and explicit OFF AIR test choice.

**Goal:** Weather matches actual conditions, warnings remain readable, startup workspace has correct geometry and announcements are audible and testable.
**Architecture:** Existing weather snapshots/output composition; one shared announcement run owner; native geometry before renderer load; bounded PCM gain on synthesized speech only.
**Tech stack:** Electron, React/TypeScript, SVG/CSS, existing MaryTTS WAV, Vitest/native muted fixtures.
**Spec:** `docs/superpowers/specs/2026-10-24-weather-announcement-startup-design.md`.

## Global constraints
- User approved full OFF AIR gong/text probe with Stop. Keep native programming and established routing, emergency priority, output settings and Firebase schema.
- Do not edit foreign `tests/smoke/startup-diagnostic.cjs` (SHA B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5).
- No physical sound during automated tests; no unrequested switch ON AIR on the installed app.

## Review focus
- Speech gain never clips or modifies source/gong; route/master mute still respected.
- Probe and scheduled speech cannot overlap; cancel during native synthesis and final audio restores music.
- Public test text revoked mid-probe; OFF AIR→ON AIR/service/emergency interrupts safely.
- Slow auth/device/network cannot capture an initially 410px workspace.
- Snow and thunder/hail are not rendered as rain; long warning text remains accessible after reserve shrinks.

### Task 1: Correct speech PCM level
Files: `electron/announcements/BundledSpeechService.ts` and tests.
- [x] Add failing waveform-level/gain-cap/clipping tests; observe RED.
- [x] Normalize validated generated speech to -1 dBFS peak, cap +18 dB, preserve source bytes; keep existing route volume separate.
- [x] Run tests and real speech metrics, record evidence.

### Task 2: Correct native startup geometry
Files: `electron/windowStartup.ts`, tests, `electron/main.ts`, native probe if required.
- [x] Add failing lifecycle test proving target geometry precedes renderer load/readiness and no late narrow resize.
- [x] Start at stored working geometry and apply fullscreen/maximize before loading, retain post-ready update scheduling.
- [x] Verify native viewport with isolated hidden/offscreen probe and tests.

### Task 3: Weather visuals and warning readability
Files: `src/externalLoop/WeatherView.tsx`, condition helper/tests, styles; `src/outputComposition.css` and output/banner tests/visual fixture.
- [x] Add failing condition/wind/SVG tests for WMO examples and unknown codes.
- [x] Implement distinct icons, condition/wind classes and restrained reduced-motion-safe animation; no output data fetching.
- [x] Reserve 24%, increase typography, keep combined ticker geometry consistent; inspect renders.

### Task 4: Shared manual announcement test
Files: `src/announcements/AutomaticAnnouncements.tsx`, small request/controller module, status, Settings and tests.
- [x] Add failing tests for OFF AIR start, selection/general text, Stop, overlap rejection, closing, routing/revocation/ON AIR interruption.
- [x] Expose one guarded test entry on existing run owner; keep scheduler separate from test eligibility but share run/ducking/player/indicator.
- [x] Add settings controls and real muted gong/voice/cancel test.

### Task 5: Verification and delivery
- [x] Full suite (bounded worker parallelism), build, historical guards, regional/release disclosures if publishing.
- [x] Separate root author review, record measured proof and unresolved limits. Commit only owned work.
- [ ] Deliver verified normal update according to established publication authorization; public artifact verification before claiming release.
