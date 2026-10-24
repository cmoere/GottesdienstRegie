# Bundled German speech implementation plan

> **For agentic workers:** Use superpowers:executing-plans. The user explicitly requests native implementation and publication; no further routine approval questions.

**Goal:** A normal app update includes the classical German announcement voice and its runtime; users install nothing separately.

**Architecture:** Bundle MaryTTS, the unchanged dfki-pavoque-neutral unit-selection voice and a private Java runtime. A bounded native subprocess produces WAVs through stdio; the existing announcement player owns all audible playback and routing.

**Tech Stack:** Electron/TypeScript, Java worker, pinned HTTPS assets, Vitest, cross-platform electron-builder.

**Spec:** `docs/superpowers/specs/2026-10-24-bundled-german-speech-design.md`, approved by user: “ja umsetzten und veröffentlichen!”

## Global constraints

- No separate installation, cloud TTS, neural voice, Windows voice or runtime voice download.
- Existing gong, Background Audio route, ducking, cancellation and speaker overlay remain authoritative.
- No automatic activation when migrating old voice settings.
- Preserve foreign untracked startup-diagnostic.cjs.
- License and dependency checks plus actual offline synthesis and packaged-resource checks are release gates.
- Existing worktree and native implementation; technical self-review disclosed, no technical delegation.

## Review focus

- Unicode and spaces in installed paths; no shell or PATH lookup.
- Child process stalls/crashes, cancellation during startup and late data must not play audio.
- Corrupt/truncated WAVs and excessive text/output are rejected.
- Old enabled eSpeak/neural settings cannot enable the bundled voice implicitly.
- Packaging must contain platform-correct Java and all voice/data/licenses, including macOS dual architectures.

### Task 1: Reproducible offline speech resources

**Files:** `scripts/prepare-bundled-speech.cjs`, `build/speech/manifest.json`, `build/speech/NOTICE.md`, `build/speech/worker/AnnouncementSpeech.java`, packaging configuration.

**Interfaces:** build preparation consumes a fixed platform/architecture and produces `work/bundled-speech/<platform>-<arch>/` with private runtime, jars/data, worker and licenses. Source artifacts must be checksum-pinned, sizes bounded and paths validated.

- [x] Resolve actual MaryTTS language/runtime/voice distributions and private JRE versions; inspect licenses and dependencies before choosing versions.
- [x] Add failing asset-integrity/path/required-resource tests, observe RED, implement preparation, observe GREEN.
- [x] Produce a real offline German WAV without system Java or eSpeak and record size, sample format, signal and license inventory.
- [x] Commit tested build/resource support (combined verified implementation commit).

### Task 2: Native speech and settings migration

**Files:** `electron/announcements/BundledSpeechService.ts` and tests; `electron/main.ts`; `electron/announcements/SettingsAccess.ts`; `src/announcements/settings.ts`; `src/announcements/AnnouncementSettings.tsx` and associated tests.

**Interfaces:** service exposes existing `status()`, `synthesize(unknown):Promise<Uint8Array>`, `cancel()` with no executable picker. Voice ID `marytts:dfki-pavoque-neutral`, speaker 0; old IDs readable but never activated as new voice.

- [x] Add tests for trusted bundled path only, text/WAV bounds, crash/timeout/cancel, migration and no external installer controls; observe RED.
- [x] Implement private Java invocation with fixed classpath/arguments and bounded stdio; readiness is silent, failed resources are explicit.
- [x] Replace main-process engine wiring and settings UI, retain all existing announcement lifecycle guards.
- [x] Run targeted native/settings/lifecycle tests, observe GREEN and commit (combined verified implementation commit).

### Task 3: Packaging, regression and normal release

**Files:** platform release workflow, package preparation/config, smoke checks, announcements docs, release notes/feed and required regional documentation.

- [x] Require build-time resources and package them outside ASAR for each architecture; inspect resulting Windows package and license files. Other architectures are mandatory CI gates before publication.
- [x] Run real synthesis/playback fixture with physical output muted, gong/speech/icon/cancel; run full unit suite, build and historical release gates.
- [x] Perform separate author review of diff/security/license boundaries and fix material findings with regression tests.
- [ ] Publish a fresh normal version, verify public manifests/digests and downloadable installer contains speech resources. Never publish a broken partial package or describe unfinished PowerPoint/regional work as complete.

## Progress

Plan approved for native execution by the user's direct implementation/publication instruction. No product edits made at plan creation.
