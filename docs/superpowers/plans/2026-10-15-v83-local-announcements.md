# v83 Local Announcements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatische lokale KI-Saalansagen mit Gong und sicherer Musikabsenkung, ausschließlich im Vor-/Nachprogramm.

**Architecture:** AnnouncementService liefert normalisierte Sprachtexte. Ein zentraler Renderer-Scheduler koordiniert vorbereitete lokale WAVs, geroutete Wiedergabe und mehrquellenfähige Absenkung; ein validierter Electron-Dienst verwaltet Sprachpaket und Synthese außerhalb der Live-Ausgabe.

**Tech Stack:** Bestehendes React/TypeScript/Electron/Zustand/Vitest; Piper 1.8.0 als zu prüfender Kandidat, deutsche Stimme `de_DE-thorsten-high`; keine Cloud-TTS.

**Spec:** `docs/superpowers/specs/2026-10-15-v83-local-announcements-design.md`, vom Benutzer freigegeben. Dieser Plan benötigt eigene Freigabe vor Produktimplementierung.

## Global Constraints

- Firebase-Struktur und Initialisierung unverändert; stabile `messageId`; keine neue Firebase-Schreibfunktion.
- Kein Werbesystem und keine Windows-/Cloud-Ersatzstimme.
- Ansagen standardmäßig aus; Intervall 5 Minuten, zulässig 1–120; verbleibender Musikpegel 20 %, zulässig 0–100 %.
- Nur aktive Live-Engine in `pre`/`post`, auch im Testbetrieb. Kein Start anhand bloßer Editor-Auswahl.
- Pro Intervall eine Meldung; erstes volles Intervall bei Bereichseintritt, danach ab Ende des Durchlaufs. Keine Überlappung oder Aufholserie.
- Gong vor Sprache; keine Musikneustarts, kein Überschreiben zwischenzeitlicher Pegel-/Muteänderungen.
- Keine Paketinstallation bei Appstart oder aktiver Live-Engine; kein Texttransfer an fremde Dienste.
- Keine vorgetäuschte Lizenzfreigabe durch Prozessgrenze. Keine Projektlizenzänderung. Paket-/Lizenzprüfung muss vor Produktanbindung erfolgreich sein.
- Bestehenden Worktree wiederverwenden; `tests/smoke/startup-diagnostic.cjs` und vorhandene v82-Ausgaben unverändert lassen.
- Native Umsetzung durch den Hauptagenten gemäß bisheriger Benutzerpräferenz; eine unabhängige Abschlussprüfung vor Veröffentlichung. Keine Übersetzungsagenten allein aufgrund früherer v82-Freigaben.

## Review Focus

1. Schlafmodus/verspäteter Timer: nach Rückkehr keine Serie alter Ansagen; Task 4 testet verspätete Zeitgeber.
2. Textänderung während Synthese: altes Ergebnis darf keine neue Meldungsrevision freigeben; Tasks 2/4 testen Revisionen und Abbruch.
3. User ändert Mute/Pegel während Ansage und Video: Task 3 testet aktuelle Basislautstärke und getrennte Ansprüche.
4. Einstellungen schließen/zweites Fenster: Tasks 5/6 testen genau einen Scheduler und keine zweite Saalwiedergabe.
5. Leerer, übergroßer oder manipuliert formatierter Text: Tasks 1/2 testen Unicode, Markup, Limits und nicht ausführbare Nutzdaten.

## File Map

- `docs/superpowers/evidence/2026-10-15-v83-speech-readiness.md`: belegte Paket-, Lizenz- und Firebase-Modusprüfung; verbindliches erstes Gate.
- `src/announcements/{types,settings,textSelection}.ts`: gemeinsame reine Typen, Settingsvalidierung und belegte Textmodi.
- `src/community/AnnouncementService.ts`: eigener Sprachkanal mit gemeinsamer fachlicher Gültigkeitsprüfung.
- `electron/announcements/{SpeechPackageService,LocalSpeechService}.ts`: Paketverwaltung sowie abbrechbare Synthese/Cache.
- `src/announcements/{DuckingClaims,AnnouncementPlayback,AnnouncementScheduler}.ts`: Absenkungsansprüche, Audiotransaktion, Intervallzustand.
- `src/announcements/{useAnnouncementSettings,AnnouncementRuntime,AnnouncementSettings}.tsx` (Settingsstore als `.ts`): genau eine App-Anbindung und UI.
- Bestehende Dateien: `BackgroundAudioEngine.ts`, `DeviceSettingsRepository.ts`, `main.ts`, `preload.ts`, `vite-env.d.ts`, `App.tsx` und passende Hilfe/Releaseprüfung; nur schmale Integrationen.
- Tests jeweils direkt neben der verantwortlichen Datei, native Integration unter `tests/smoke/v83-announcements.cjs`.

## Task 1: Paket-/Lizenz-Gate und belegte Meldungsmodi

**Files:** Create evidence document above and `src/announcements/textSelection.test.ts`; create `src/announcements/textSelection.ts` only after evidence passes. Modify `src/community/AnnouncementService.ts` and its test. Create `src/announcements/types.ts`.

**Interfaces:** `SpokenAnnouncement={id:string,title:string,text:string,revision:string,priority:AnnouncementPriority}`; `SpeechSelection={text:string}|{reason:string}`; `selectSpeechText(raw:RawAnnouncement):SpeechSelection`; `AnnouncementService.getSpoken(records:RawAnnouncement[],now:Date):SpokenAnnouncement[]`. Reuse `AnnouncementPriority` from `src/loopData.ts`.

- [ ] Record the immutable Windows x64 engine candidate: PyPI `piper-tts==1.8.0`, `piper_tts-1.8.0-cp39-abi3-win_amd64.whl`, 34,119,688 bytes, SHA256 `5da9bfdb05dfe15da3536859d422e605483ffa6d2b3ec2c5b9593bae6b5aa6a4`, GPL-3.0-or-later. Source URL: `https://files.pythonhosted.org/packages/12/9c/c736d1961cf9ce0655278731b9430df41892ca2ded7b09dabcb340612158/piper_tts-1.8.0-cp39-abi3-win_amd64.whl`.
- [ ] Record voice candidate at repository revision `c10ece1aade47bb51c153c893d14e5bf8e5b7117`: `https://huggingface.co/rhasspy/piper-voices/resolve/c10ece1aade47bb51c153c893d14e5bf8e5b7117/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx`, 113,895,201 bytes, SHA256 `9df1c43c61149ef9b39e618e2b861fbe41e1fcea9390b2dac62e8761573ea4f1`. Fetch corresponding `.onnx.json` (4,875 bytes) and MODEL_CARD for exact hashes and licensing evidence; dataset card says CC0, which alone is not a complete distribution review.
- [ ] Produce a fully pinned runtime bill of materials: supported Windows embedded CPython, Piper wheel, CPU ONNX Runtime and transitive wheels, voice config, notices, corresponding-source availability and licenses. Verify Windows ABI and compute every size/hash before producing an installable package manifest. Use an explicit isolated workspace, never system Python/package state. Do not claim the two candidate files are a complete runtime.
- [ ] Inspect repository/project distribution terms and Piper plus dependency obligations. Document a compliant packaging/source delivery route. If compatibility or permission is unresolved, STOP before runtime product code, report the exact issue and request direction; do not silently switch engine, use old abandoned binaries, or relicense the app.
- [ ] Locate the authoritative existing Firebase writing-side source or anonymized existing records for `durchsageTextModeSaalscreen`; record each actual value and intended text field as fixtures. No admin writes or broad dumping of private records. If not available, ask for one anonymous example and stop this selector task instead of inventing mode names.
- [ ] Write failing tests named `requiresPublicCurrentHallSpeechChannel`, `manualModeNeverFallsBack`, `unknownModeIsNotSpoken`, `missingModeUsesHallThenManual`, `richTextBecomesPlainParagraphs`, `hostileMarkupAndZeroWidthOnlyAreNotSpoken`: assert `messageScreen:false` does not suppress an otherwise eligible speech channel; `showDurchsage:false` does; trash/expiry suppress; IDs preserved; stable priority/ID order; no raw objects or HTML.
- [ ] Run `npx vitest run src/announcements/textSelection.test.ts src/community/AnnouncementService.test.ts`; expect new cases FAIL before implementation.
- [ ] Implement verified selection and `getSpoken`, reusing existing validity checks rather than copying time/status logic. Revision covers exact selected text and ID. Cap text at 10,000 Unicode code points by rejecting, not silently truncating. Strip unsafe/nonspoken controls and phoneme-directive delimiters; preserve normal German umlauts and paragraph boundaries.
- [ ] Rerun command, require PASS including old channel cases; commit task-specific files as `feat: normalize verified hall announcement texts`.

## Task 2: Managed local synthesis and settings bridge

**Files:** Create `src/announcements/settings.ts`, `electron/announcements/SpeechPackageService.ts`, `electron/announcements/LocalSpeechService.ts` and adjacent tests. Modify `electron/DeviceSettingsRepository.ts`, `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`.

**Interfaces:** `AnnouncementSettings={enabled:boolean,intervalMinutes:number,musicRemainingPercent:number,voiceId:string}`; `normalizeAnnouncementSettings(value:unknown):AnnouncementSettings`; repository `readAnnouncements():Promise<AnnouncementSettings>`, `writeAnnouncements(value:unknown):Promise<AnnouncementSettings>` (strict writes). `SpeechPackageService.status():Promise<SpeechPackageStatus>`, `install(signal:AbortSignal):Promise<void>`; status discriminant `missing|installing|ready|error`, voice ID and displayed total download bytes from verified manifest. `LocalSpeechService.prepare(text:string,voiceId:string,signal:AbortSignal):Promise<{cacheKey:string,url:string}>`, `dispose():Promise<void>`. Only approved voice IDs, never caller paths.

- [ ] Write failing tests for defaults `{enabled:false,intervalMinutes:5,musicRemainingPercent:20,voiceId:'de_DE-thorsten-high'}`, 1/120-minute and 0/100-percent bounds, NaN/Infinity/foreign keys rejected on write, existing device fields retained, serialized atomic writes.
- [ ] Add failing package tests: hash mismatch, oversized archive, traversal/symlink entry, bad destination, missing license, install forbidden while live, interrupted install keeps old package, second install coalesces, no installation on startup. Assert package ready only when all pinned files pass.
- [ ] Add failing synthesis tests: 10,001 code points rejected, one job maximum, no shell, fixed executable/args, UTF-8 text via stdin, timeout 60 seconds, abort kills owned child, stale revision discarded, valid RIFF/WAVE output only, maximum 180 seconds/32 MiB WAV, cache includes voice+engine+text revision. Cache limit 256 MiB; remove least-recently-used unleased files only, never current playback. Model package separate from WAV cache.
- [ ] Run `npx vitest run src/announcements/settings.test.ts electron/announcements electron/DeviceSettingsRepository.test.ts`; require red new tests, then implement minimum passing services using manifest from Task 1. Run subprocess hidden on Windows, one CPU inference thread and low process priority when supported. No HTTP model server or externally bound port.
- [ ] Register narrow main-window-only IPC: `announcements:settings-read`, `announcements:settings-write`, `announcements:package-status`, `announcements:package-install`, `announcements:prepare`, `announcements:cancel`. Cancellation uses sender-owned opaque request IDs; URLs resolve only to validated leased cache files. Main independently checks live state before package install. Output windows cannot request jobs. Do not expose raw process stderr to MAIN.
- [ ] Run targeted tests plus `npm run typecheck` and `npx tsc -p electron/tsconfig.json --noEmit`; require PASS. Commit `feat: add managed offline speech preparation`.

## Task 3: Safe ducking and routed gong/speech transaction

**Files:** Create `src/announcements/DuckingClaims.ts`, `src/announcements/AnnouncementPlayback.ts` and tests; modify `src/BackgroundAudioEngine.ts` and its test. Add managed gong `public/audio/announcement-gong.wav` from the user file with provenance/hash notice, preserving original.

**Interfaces:** `DuckingClaims.set(source:string,factor:number):void`, `delete(source:string):void`, `factor():number` (minimum or 1). Background engine keeps `setDucked(value:boolean)` for video compatibility and adds `setAnnouncementDucking(percent:number|null):Promise<void>`. `AnnouncementPlayback.play(audio:{url:string},signal:AbortSignal):Promise<void>` and `stop():void`, with injected route/settings/ducking dependencies for tests. Preview option is selected at construction, not arbitrary IPC.

- [ ] Verify source gong is valid WAV, hash and record its provenance; copy as binary asset during this implementation task, not via editing source text or altering original. Include in packaging and test asset existence/hash.
- [ ] Write failing tests `announcementWorksWithoutVideoDucking`, `minimumClaimWins`, `videoClaimSurvivesAnnouncementEnd`, `userMuteAndVolumeEditsSurvive`, `radioPositionAndSourceUnchanged`. Assert relative 20 % factor, not absolute master volume 20.
- [ ] Write failing playback tests: prepared audio verified before any gong; fade claim acquired; real gong `ended` before speech `play`; speech `ended` releases claim; each error/abort releases once; missing device no default fallback; double play rejected; hidden/preexisting preview routes not used for automatic announcements; device removal cancels. Watchdog errors after stalled media, never treats a timeout as successful completion.
- [ ] Run `npx vitest run src/announcements/DuckingClaims.test.ts src/announcements/AnnouncementPlayback.test.ts src/BackgroundAudioEngine.test.ts` and confirm red new cases.
- [ ] Implement claims in target-volume calculation including routing and reporting. Use existing `BackgroundAudioRoute` to set the speech media sink and `usePreferences` route device; own speech gain, preserve explicit route mute. Preview uses configured Preview route and does not duck room music. Automatic sequence uses background device and abortable 350 ms attack/900 ms release; current live mute and video claims always win. Verify route readiness before playback and during device changes.
- [ ] Rerun targeted tests, require PASS and commit `feat: coordinate hall gong speech and music ducking`.

## Task 4: Central scheduling and race safety

**Files:** Create `src/announcements/AnnouncementScheduler.ts` and test.

**Interfaces:** `AnnouncementContext={engineActive:boolean,section:'pre'|'post'|'other'}`; `AnnouncementScheduler.update(context:AnnouncementContext,settings:AnnouncementSettings,rows:SpokenAnnouncement[]):void`, `snapshot():AnnouncementStatus`, `subscribe(listener:()=>void):()=>void`, `dispose():void`. Constructor injects clock/timers, prepare and playback. Status has phase `disabled|waiting|preparing|ready|gong|speaking|error`, `nextAtMs?:number`, `currentId?:string`, `error?:string`. Preparation and playback share abort generation; playback phase updates are dependency callbacks.

- [ ] Write fake-clock failing tests: at 299,999 ms no playback; at 300,000 ms first ready message; next deadline is 300,000 ms after prior playback completes; pre/post only; editor selection ignored; test-mode active engine allowed; sorted IDs rotate and removal does not skip neighbors.
- [ ] Add `lateWakeDoesNotCatchUp`, `oldSynthesisCannotPlayAfterSectionChange`, `newTextRevisionInvalidatesPreparedAudio`, `noEligibleOrUnreadyMeansNoGong`, `stoppingGongCannotStartSpeech`, `preToPostResetsInterval`, `settingChangeResetsDeadlineWithoutOverlap`. Assert no simultaneous jobs or timers after dispose.
- [ ] Run `npx vitest run src/announcements/AnnouncementScheduler.test.ts`; expect FAIL.
- [ ] Implement one scheduler with identity cursor, completion-relative deadline and generation fencing. Every deadline revalidates now against fresh `getSpoken`; hold immutable current text while playing; revocation stops transaction. Warm up only bounded queue sequentially, pause/cancel work outside eligible engine section. For stable rows do not regenerate on each render.
- [ ] Rerun tests, require PASS and commit `feat: schedule hall announcements only in pre and post`.

## Task 5: One runtime owner and operator settings

**Files:** Create `src/announcements/useAnnouncementSettings.ts`, `src/announcements/AnnouncementRuntime.tsx`, `src/announcements/AnnouncementSettings.tsx` and tests. Modify `src/App.tsx` only for settings entry and single root runtime mount; use separate CSS module/file for page styling.

**Interfaces:** settings store `{settings:AnnouncementSettings,ready:boolean,error:string}`, `loadAnnouncementSettings():Promise<void>`, `saveAnnouncementSettings(value:AnnouncementSettings):Promise<boolean>`. Runtime consumes committed `useLiveOutputPreview` and central community subscription; never mutable selected item IDs. Resolve engine-active from successful native live state and current output, not ON AIR intent alone. Mount only in authenticated native control UI, never outputs/web-only builds.

- [ ] Write failing UI/integration tests: settings path present, numeric controls save validated values, exact explanatory text from spec shown, selected plain speech texts/readiness shown, probe uses Preview route with stop, package size/licenses visible before explicit install. Opening page is silent and offline friendly.
- [ ] Add `closingSettingsLeavesSchedulerAlive`, `secondOutputDoesNotCreateScheduler`, `strictModeMountCleanupDoesNotDuplicate`, `logoutCancelsOwnedAudio`, `committedSectionNotEditedItemControlsEligibility`. Missing package disables enable/action with useful operator status; never switches to another voice.
- [ ] Run `npx vitest run src/announcements/AnnouncementSettings.test.tsx src/announcements/AnnouncementRuntime.test.tsx`; confirm red tests.
- [ ] Implement settings and runtime using earlier interfaces; no new Firebase initialization. Refresh eligibility at timer boundaries, not whole-app rerenders every second. Throttle operator countdown display to 1 Hz within settings only. Settings close stops only its explicit preview, not automatic audio. App-root teardown stops scheduler and own audio. Updates in place must preserve current playback revision.
- [ ] Rerun tests plus typechecks; require PASS. Commit `feat: expose scheduled announcement settings and diagnostics`.

## Task 6: Native proof, documentation and release readiness

**Files:** Create `tests/smoke/v83-announcements.cjs` and `scripts/check-version83.cjs`; update relevant help articles/catalog and release documentation only when actual behavior verified. Update `package.json`/lock/release history for 0.83.0 only after readiness gates pass.

- [ ] Add native regression assertions using actual main/preload: untrusted output IPC denied; no package downloads on startup; settings retained; real Piper produces German WAV offline; one instance owns audio; section transition cancels late job; black/video/output watermark and ordinary banner unchanged. Test exact bundled asset/model/runtime paths rather than developer-only dependencies.
- [ ] Run native integration in an isolated profile without changing installed user settings. Supply test-only short interval through dependency injection, not a shipped bypass of 1-minute validation. Confirm preparation does not block UI and browser media ended order is correct.
- [ ] Run `npm run verify:release`, `npm run typecheck`, `npm run build`, `npm run build:web`, `npm run test:web` and `node scripts/check-version83.cjs`; every command must pass or record/report limitation without claiming success. Keep Linux/macOS/web builds working; Windows speech availability stated explicitly until equivalent packages are verified.
- [ ] Provide a real German voice+gong sample for user review. Never certify physical saal routing without hearing/testing that device. Distinguish software playback proof from physical loudspeaker proof in report.
- [ ] Update German/English help for setup, interval, percentage meaning, preview vs hall routing, offline package and safe section stops. Follow current locale catalog pattern without silently replacing translated articles with German; report languages not translated. Add exact upstream license notices/source delivery and tested package sizes.
- [ ] Request independent whole-branch review and fix verified findings with regression tests. No publication while package-license gate, text-mode evidence, actual synthesis or tests are unresolved.
- [ ] After user accepts the voice and authorizes publication, stage only task files, commit `release: v83 local scheduled announcements`, build installer in a new explicit output path, inspect packaged assets, publish through established release workflow, and verify public release/update metadata. Do not advertise an unfinished downloadable v83 or alter existing release tags.

## Self-review and handoff

Coverage: text/schema Task 1; license/runtime/IPC/cache Task 2 (license determination starts in Task 1); routing/gong/ducking Task 3; section/timer/races Task 4; settings/ownership Task 5; genuine synthesis, documentation, regression and publication Task 6. Five Review Focus items have named tests. No undefined mode values, dependency hashes or legal conclusions are invented: Task 1 is an explicit stopping gate that produces the full immutable manifest before package code begins.

This plan is native-first per the user's earlier preference. Ask the user to review this document before invoking executing-plans. A plan approval is not a claim that the voice has been auditioned, licensing cleared or v83 released.
