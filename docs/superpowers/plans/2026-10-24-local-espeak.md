# Local eSpeak Announcements Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. Native implementation is the user's instruction; no technical delegation.

**Goal:** Enable optional local non-neural announcements with safe routing, gong and a truthful output indicator, then publish the verified increment.
**Architecture:** Native eSpeak subprocess produces WAV; a single control-renderer controller schedules eligible normalized announcements and owns routed playback/ducking. Main retains only indicator state for outputs.
**Tech Stack:** Electron/Node child_process, React, existing BackgroundAudioRoute/AnnouncementService, Vitest.
**Spec:** docs/superpowers/specs/2026-10-24-local-espeak-design.md

## Global Constraints
- Separate engine installation only, no AI or Windows speech fallback.
- Preserve Firebase schema, radio routing and independent video ducking.
- Control main-frame authorization; bounded/cancellable synthesis; no raw errors on MAIN.
- Unrelated startup diagnostic remains untouched.

## Review Focus
- Late synthesis after OFF AIR or source revocation must not play.
- Route changes/removal and muted output must restore background audio without fallback.
- Duplicate controller/React cleanup must not overlap or leak indicator/ducking.
- Long text, malformed executable output and failed child process must remain bounded.
- New output window must receive current indicator without speech text/private fields.

### Task 1: Native speech boundary and settings
Files: electron/announcements/EspeakService.ts, SettingsAccess.ts, DeviceSettingsRepository.ts, main.ts/preload.ts; src/announcements/settings.ts.
Consumes selected local eSpeak executable; produces engineStatus/chooseEngine/synthesize/cancel plus boolean indicator channel.
- [x] RED: missing/wrong executable, fixed plain-input synthesis, invalid/oversized WAV, cancellation, settings reject old-neural activation and unauthorized engine access.
- [x] GREEN: implement bounded native service, strict voice settings and control-only IPC.
- [x] Verify targeted Vitest and Electron typecheck; commit.

### Task 2: Single playback owner and overlay
Files: src/announcements/AutomaticAnnouncements.tsx, AnnouncementPlayer.ts, AnnouncementRun.ts, AnnouncementIndicator.tsx, AnnouncementSettings.tsx; App.tsx, OutputComposition.tsx; public/audio/announcement-gong.wav.
Consumes Task 1 bridge and existing store/AnnouncementService; produces one scheduler and routed cancellable gong/speech lifecycle.
- [x] RED: order, interval rotation, revocation/cancellation, errors/route loss and static overlay visibility without content remount.
- [x] GREEN: implement lifecycle, UI controls and global boolean output overlay; add provided gong.
- [x] Verify targeted tests, full suite/build, isolated file-only synthesis and painted output visual test; commit.

### Task 3: Release and evidence
Files: release metadata, notices/help, regional release identity and generated RSS.
- [x] Review changes natively, record known limitations and test evidence.
- [x] Prepare 0.89.0 with radio/warning increment and optional announcements, truthful partial regional/PPT status.
- [ ] Run release gates, publish via existing workflow only after successful checks, verify installer/update manifests and public latest.
