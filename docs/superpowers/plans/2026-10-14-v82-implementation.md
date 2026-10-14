# GottesdienstRegie v82 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver safe startup-test teardown, native countdown presets, independent announcement banners, and thoroughly revised help/release documentation without disrupting live outputs.

**Architecture:** Extend existing AnnouncementService, media selection, native countdown items and OutputWindowManager. Separate banner revisions from slide/quick revisions and share composition between MAIN and its mirrors. Deliver the four subsystems in independently testable commits, followed by one release integration gate; do not replace existing Firebase, live or audio services.

**Tech Stack:** TypeScript, React 19, Zustand, Electron 37, Firebase Realtime Database, Vitest, Playwright, electron-builder; existing bundled fonts and CSS/SVG assets.

**Spec:** `docs/superpowers/specs/2026-10-14-v82-help-countdowns-announcement-banner-design.md` (approved by user).

## Global Constraints

- Keine zweite Datenbank, keine zusätzliche Firebase-Initialisierung, keine kostenpflichtige API und keine Änderungen am Audioverhalten durch den Banner.
- Dauern: 20, 15, 10, 5, 3, 2 und 1 Minute sowie 30, 20 und 10 Sekunden. Designs: Klar, Natur, Licht, Kreuz, Kerze und Geometrisch. Ton ist standardmäßig ausgeschaltet.
- Bannerposition oben oder unten; Standard unten. Referenz 1920×1080: 84 px Höhe, Weiß, Text #A65353, Cera Pro regulär 44 px, ca. 60 px/s.
- Banner nur bei Live-Vor-/Nachprogramm oder aktivem Countdown; andere Quick Screens haben Vorrang. Selected ≠ Live. Testwasserzeichen liegt darüber.
- Bestehende Präsentationen, geschützte Nachprogrammfolien, Audio-/Radio-Routen und Ausgabezuordnungen bleiben kompatibel.
- 17 vorhandene Hilfesprachen; keine erfundenen Screenshots oder historischen Release-Aussagen. 81 bisherige Versionslinien / 118 Builds vollständig erhalten.
- Untracked `tests/smoke/startup-diagnostic.cjs` gehört nicht zu dieser Arbeit und bleibt unverändert. Bestehenden isolierten Worktree weiterverwenden.
- Native-Ausführung ist bereits gewählt. Vor Umsetzung Planfreigabe einholen. Release erst nach Verifikation; dieser Plan löst keinen Release aus.

## Review Focus

1. HTML/entity-only banner text and unusually long words: no markup execution, blank ticker or clipped final text (Tasks 4, 6).
2. Device-sized output late join and delayed/reordered IPC: current banner without resetting playing media (Task 5).
3. Countdown restored after app restart or selected on a different editor item: no accidental live restart or insertion into protected slide (Tasks 2, 3).
4. Time moving across announcement expiry while offline or reduced motion active: no further expired cycle, complete readable segments (Tasks 4, 6).
5. Legacy help prefix contradicting current workflow and historical note counts drifting: reconciliation without inventing features or dropping versions (Tasks 7, 8).

## File ownership map

- `tests/smoke/native-v81-login.cjs`: existing real-main startup harness. New parent-runner and source regression tests belong under `tests/smoke/` and `src/test/` respectively.
- New `src/countdownPresets.ts`, `src/countdownClock.ts`, `src/CountdownPresetBrowser.tsx`, `src/CountdownView.tsx`: pure catalog, time calculation, library UI, shared countdown presentation. Integrate in `src/store.ts`, `src/App.tsx`, `src/MediaBrowser.tsx`, `src/QuickOverlay.tsx`, `src/ProductionWorkspace.tsx`, `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`.
- `src/community/AnnouncementService.ts`: shared validity and public banner normalization. New `src/announcementBannerModel.ts`: timing, queue and live-context rules. No parallel Firebase reader.
- `src/outputState.ts`, `electron/OutputWindowManager.ts`, preload/main bridges: additive independent layer state. New `src/OutputComposition.tsx` and `src/AnnouncementBanner.tsx`: proportional content layout and ticker only; reuse in MAIN/mirrors, never audio ownership.
- `src/preferences.ts`, `src/App.tsx`: persisted technical banner position setting and operator control. `src/community/communityRuntime.ts`: existing community subscription, reused rather than duplicated.
- `src/help/index.ts`, `english.ts`, `localesWest.ts`, `translated.json`, `legacyTranslated.json`, `legacyGerman.ts`, `src/App.tsx`, `public/help/`: canonical help, translations, rendering and verified screenshots.
- `public/releases.json`, `RELEASE_NOTES.md`: factual historical notes. `package.json`, `package-lock.json`, `.github/workflows/release.yml`: release integration only; workflow modification only if needed by an actual failing check.

## A. Startup-test regression

### Task 1: Lock-safe test-process teardown

**Files:** modify `tests/smoke/native-v81-login.cjs`; create `tests/smoke/run-login-profile.cjs` and `src/test/loginSmokeCleanup.test.ts`.

**Interfaces:** parent runner launches built main via the existing harness and owns the isolated profile lifecycle. `run-login-profile.cjs` accepts no arbitrary deletion path; extracts the harness's reported profile and validates it as an absolute temp child with prefix `regie-login-smoke-`. Normal exit retains the profile if cleanup is unsafe or locked.

- [ ] Write regression `does_not_delete_profile_in_electron_exit_handler`: assert harness has no profile-removing exit callback; test parent rejects workspace/userData/root paths and tolerates an injected EBUSY cleanup failure without throwing or changing a successful child exit to an uncaught exception.
- [ ] Run `npx vitest run src/test/loginSmokeCleanup.test.ts`; expect FAIL for missing parent-runner contract, not for the already-correct harness.
- [ ] Implement parent cleanup after confirmed child-process exit only, with bounded retry (3 attempts) and retained-profile diagnostic on failure. Do not add exception swallowing to product main.
- [ ] Run the test again; expect PASS. After a build, run `node tests/smoke/run-login-profile.cjs`; expect `LOGIN_BACKGROUND_SMOKE_PASS`, zero windows/login writes, exit 0, no EBUSY dialog.
- [ ] Commit only the runner, its regression and any necessary harness adjustment: `test: guard locked Chromium smoke profiles`.

## B. Local countdown library

### Task 2: Presets, persisted metadata and one clock

**Files:** create `src/countdownPresets.ts`, `src/countdownPresets.test.ts`, `src/countdownClock.ts`, `src/countdownClock.test.ts`; modify `src/store.ts`.

**Interfaces:** `CountdownDesignId = 'clear'|'nature'|'light'|'cross'|'candle'|'geometric'`; `CountdownPreset = {id:string;durationSeconds:number;designId:CountdownDesignId}`. Export `countdownPresets: readonly CountdownPreset[]`, `getCountdownPreset(id:string): CountdownPreset|undefined`, `createCountdownPresetMetadata(id:string): Record<string,string|number|boolean>|undefined`. IDs are `countdown:<seconds>:<designId>`. Metadata keys: `countdownPresetId`, `countdownDesign`, `countdownDurationSeconds`, `countdownSoundEnabled:false`. Export `remainingCountdownMs(durationMs:number,startedAtMs:number,nowMs:number):number`; callers supply existing synchronized app time, never system time directly.

- [ ] Write tests asserting exactly 60 unique combinations of `[1200,900,600,300,180,120,60,30,20,10]` and six designs, rejects invalid IDs, sound false, metadata round-trips through existing document loader. Clock assertions: 60_000 at start, 59_000 after 1 second, 0 after expiry, no negative or NaN output for invalid/negative duration; future anchor returns full duration.
- [ ] Run `npx vitest run src/countdownPresets.test.ts src/countdownClock.test.ts`; expect missing-module FAIL.
- [ ] Implement catalog/clock and compatible metadata initialization. Existing manually created countdowns retain their current defaults. Keep native `ServiceItem.type='countdown'`; no new file asset or new item type.
- [ ] Run both tests and existing `src/presentationStartup.test.ts`, `src/itemPlacementPolicy.test.ts`, `src/postProgramSystemSlide.test.ts`; expect PASS.
- [ ] Commit: `feat: add offline countdown preset catalog and anchored timing`.

### Task 3: Countdown browser selection and rendering

**Files:** create `src/CountdownPresetBrowser.tsx`, `src/CountdownPresetBrowser.test.tsx`, `src/CountdownView.tsx`, `src/CountdownView.test.tsx`; modify `src/MediaBrowser.tsx`, `src/App.tsx`, `src/QuickOverlay.tsx`, `src/ProductionWorkspace.tsx`, `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`.

**Interfaces:** `CountdownPresetBrowser({purpose,onSelect}:{purpose:'item'|'background'|'foreground'|'audio';onSelect:(presetId:string)=>void})`; `CountdownView({presetId,durationMs,startedAtMs,nowMs}:{presetId?:string;durationMs:number;startedAtMs:number;nowMs:number})`. Bridge `mediaWindow.selectCountdown(presetId:string):Promise<boolean>` uses `media-window:select-countdown`; main validates with Task 2 catalog, returns existing selection target context plus discriminant `{kind:'countdown-preset',presetId}`. It never registers a media file.

- [ ] Write UI/IPC tests: 60 static cards with duration/design filters; audio purpose hides tab; background/foreground action explicitly adds an item rather than becoming a background URL; invalid IPC preset rejected; a valid preset inserts one countdown in permitted target section without changing a protected system item. Verify existing image/audio selection remains unchanged.
- [ ] Run `npx vitest run src/CountdownPresetBrowser.test.tsx src/CountdownView.test.tsx`; expect FAIL.
- [ ] Add the tab and typed IPC path, consume selection in App using existing insertion policy, render six distinct CSS/SVG-based quiet designs using existing licensed resources only. Only selected preview advances. Share the anchored calculation with ordinary/quick countdown output and actual mirror, respecting existing end/advance settings and default hold at 00:00.
- [ ] Run new tests plus `src/previewTimer.test.ts`, `src/quickScreenAvailability.test.ts`, `src/postProgramNavigation.test.ts`; expect PASS. Test fake-clock delayed delivery and reload: new preview joins current time, editor selection does not restart live countdown. Do not serialize a stale runtime anchor as the start of a future new take.
- [ ] Commit: `feat: browse and present native countdown designs`.

## C. Independent Firebase announcement banner

### Task 4: Channel eligibility and public queue model

**Files:** modify `src/community/AnnouncementService.ts` and its `.test.ts`; create `src/announcementBannerModel.ts` and `.test.ts`.

**Interfaces:** add `PublicBannerAnnouncement={id:string;text:string;priority:AnnouncementPriority;validFrom?:string;validUntil?:string}` and `AnnouncementService.getBanners(records:RawAnnouncement[],now:Date):PublicBannerAnnouncement[]`. Extract shared validity privately without changing existing `getForPlacement` semantics. Model exports `BannerPosition='top'|'bottom'`, `BannerContext={liveSection:'pre'|'service'|'post'|'other';quickType:string|null;countdownActive:boolean}`, `isBannerAllowed(context:BannerContext):boolean`, `bannerCycleDurationMs(textWidth:number,viewportWidth:number):number` (speed 60 reference px/s, 1000 ms pause at either end). Public banner text is sanitized plain text.

- [ ] Add table tests: public/trash/master-enabled/time checks, truthy existing flags, `showMeldungBanner` independent of `messageScreen`/loopTargets, banner-only vs slide-only, text fallback order `textBanner → textLaufbanner → textMeldung → beschreibung → titel`, all-whitespace/HTML-only excluded, entities decoded without execution, internal fields absent. Assert urgent/important/normal ordering then stable ID; malformed timestamps follow existing service handling rather than a new parser. Exact existing expiry boundary remains valid, subsequent tick is excluded.
- [ ] Run `npx vitest run src/community/AnnouncementService.test.ts src/announcementBannerModel.test.ts`; expect FAIL for missing banner API.
- [ ] Implement shared validity and model. Preserve normal rich-text announcement behavior; banner flattening must not strip formatting from normal slides. Online/cache snapshots come from existing runtime.
- [ ] Run tests; expect PASS. Add context matrix: PRE/POST allowed, service not, countdown allowed, black/logo/bible/other quick disallowed. Add finite timing assertions for zero width and exceptionally long text.
- [ ] Commit: `feat: normalize public banner announcements centrally`.

### Task 5: Output state without retaking slides

**Files:** modify `src/outputState.ts`, `src/outputState.test.ts`, `electron/OutputWindowManager.ts`, `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`, `src/App.tsx`; create `src/bannerOutputState.test.ts`.

**Interfaces:** `BannerOutputState={revision:number;position:BannerPosition;items:PublicBannerAnnouncement[];cycleStartedAtMs:number;reserved:boolean}`. Add optional `banner:BannerOutputState|null`, `slideRevision:number`, `quickRevision:number` to snapshots for compatibility. `OutputWindowManager.setBanner(banner:BannerOutputState|null)` updates MAIN only; real mirror consumers reuse that state. `desktop.sendAnnouncementBanner(banner:BannerOutputState|null):Promise<boolean>` is accepted only from control window. Output application updates each layer only on its own revision, with legacy slide/quick IPC retained until all callers migrate.

- [ ] Write failing state/manager tests: banner update increments banner/global revision but not slide/quick revision, retains slide identity and timing; appMode-only update does not retake slide; stale/reordered revisions ignored; late-joining MAIN receives full latest state; other standalone output roles receive no banner. Unauthorized/malformed renderer payload rejected, including arbitrary private fields.
- [ ] Run `npx vitest run src/outputState.test.ts src/bannerOutputState.test.ts`; expect FAIL.
- [ ] Implement additive manager/bridge/state changes and controller-side publication. Reuse current community subscription and app clock; remove no existing output role or initial state. In Output(), do not setSlide/setQuick for banner-only updates. Preserve native window lifecycle guards and startup hydration.
- [ ] Run tests plus `src/outputProfileHydration.test.tsx`, `src/appMode.test.ts`, `src/liveOutputPreview.test.ts`; expect PASS.
- [ ] Commit: `feat: transport independent banner output state`.

### Task 6: Shared composition, safe ticker boundaries and settings

**Files:** create `src/OutputComposition.tsx`, `src/OutputComposition.test.tsx`, `src/AnnouncementBanner.tsx`, `src/AnnouncementBanner.test.tsx`; modify `src/App.tsx`, `src/ProductionWorkspace.tsx`, `src/preferences.ts`; add `src/bannerSettings.test.ts`.

**Interfaces:** `OutputComposition({children,banner,testOverlay}:{children:React.ReactNode;banner:BannerOutputState|null;testOverlay?:React.ReactNode})` owns 16:9 contain area, independent banner and highest overlay. `AnnouncementBanner({state,nowMs,reducedMotion}:{state:BannerOutputState;nowMs:number;reducedMotion:boolean})` owns text measurement/position only. Persist `announcementBannerPosition:BannerPosition='bottom'` in technical presentation preferences, with no per-user silent override of technical output styling.

- [ ] Write failing tests: top/bottom band 84/1080 reference height, white/red #A65353/Cera Pro regular, contain layout without distortion, watermark outside scaled transition area; ticking banner does not remount child video or change slide start anchor. Same queue/time gives identical mirror progress. Current full text finishes when changed/removed; pending data starts at next cycle. Reduced motion uses static complete segments with reading duration `max(4000, characters*80)` ms and never restarts neighboring slide.
- [ ] Run `npx vitest run src/OutputComposition.test.tsx src/AnnouncementBanner.test.tsx src/bannerSettings.test.ts`; expect FAIL.
- [ ] Implement controller queue staging: text changes at full cycle boundary, space-reservation changes at next live take/loop boundary; countdown quick takes apply reservation atomically. When context disallows banner immediately hide it as part of that take, preserving priority of Schwarz/OSB. Queue expires against existing clock even offline. Empty queue eventually removes reserved area at safe take. Cycle anchor survives ordinary slide switches.
- [ ] Integrate composition in actual MAIN and genuine MAIN mirrors only. Add top/bottom control under presentation output settings. Do not insert watermark on operator help/modals; use the existing TestModeWatermark exclusively inside actual output surfaces. No modifications to AudioEngine/AudioRouteService.
- [ ] Run new tests plus `src/MainOutputSurface.test.tsx`, `src/TestModeWatermark.test.tsx`, `src/LiveMediaMirror.test.tsx`, `src/radioPlayback.test.ts`; expect PASS. Add native smoke coverage in Task 9 for real web/video stacking and layout.
- [ ] Commit: `feat: compose live-safe banners above proportional output`.

## D. Help and release documentation

### Task 7: Reconciled help content and accessible presentation

**Files:** modify `src/help/index.ts`, `src/help/english.ts`, `src/help/localesWest.ts`, `src/help/translated.json`, `src/help/legacyTranslated.json`, `src/help/legacyGerman.ts`, `src/help/catalog.test.ts`, `src/App.tsx`; create `src/help/HelpArticleView.tsx`, `src/help/HelpArticleView.test.tsx`, `src/help/help-article.css`.

**Interfaces:** add `HelpArticleView({article,locale}:{article:HelpArticle;locale:string})`; preserve existing `{id,title,body,section?}` and catalog callers. Structured body blocks may be introduced through optional `blocks`, with a text-body fallback and search index derived from visible text. Do not duplicate the catalog across UI layers.

- [ ] Add failing behavior tests: article search includes steps, empty locale falls back to English, Arabic dir=rtl, local TOC links valid, keyboard navigable controls, screenshot alt/caption not hardcoded to v77, current article contains no contradictory legacy instructions. Pin catalog ID and locale inventory before editing, then assert no article was dropped.
- [ ] Run `npx vitest run src/help/catalog.test.ts src/help/HelpArticleView.test.tsx`; expect FAIL for new rendering requirements.
- [ ] Implement article view/layout and reconcile canonical text, then translate every changed article across all 17 supported locales. Each article includes relevant prerequisites, task steps, expected result, troubleshooting and links; omit empty sections. Use evangelical community examples and actual current labels. Remove obsolete legacy duplication only after its useful content is reconciled. Do not invent arbitrary minimum word counts as a quality proxy.
- [ ] Run both tests; expect PASS. Manually read representative setup, event link, test operation, audio, OSB, banner and countdown articles in German/English; inspect Arabic layout, long German headings and keyboard focus in narrow/dark/light views.
- [ ] Commit content/layout separately if needed, with no half-translated state marked complete: `docs: revise and localize congregational operator help`.

### Task 8: Real screenshots and factual historical release notes

**Files:** replace relevant `public/help/` screenshots and references in help catalog; modify `public/releases.json`, `RELEASE_NOTES.md`; create `src/help/helpAssets.test.ts` and `src/releaseHistoryIntegrity.test.ts`.

**Interfaces:** preserve public release schema and release/build identities. Asset references resolve to bundled public/help files, with explicit alt text and caption. No screenshot generator may write fake UI and label it a real capture.

- [ ] Before editing notes, record a fixture of existing release/build IDs, dates and ordering in `src/test/fixtures/releases-v81-inventory.json` using apply_patch; test equality for all historical entries after revision. Write asset tests checking referenced files exist, image type/dimensions are readable, no v77 hardcoded caption. Unit tests can verify structure, not truth or translation quality.
- [ ] Run `npx vitest run src/help/helpAssets.test.ts src/releaseHistoryIntegrity.test.ts`; expect initial FAIL for obsolete caption/coverage checks, never manufacture failure by changing historical facts.
- [ ] Rewrite all existing release text professionally, conserving the historical feature/fix meaning and stated limitations. Keep JSON/Markdown facts aligned; preserve translated fields. Capture the actual updated app with fictional users/community data: operator workspace, event link, audio output, test preparation, protected postprogram, countdown library, announcements/banner/settings. Inspect every referenced existing image; refresh outdated ones rather than adding a version label to an old screenshot.
- [ ] Run tests; expect PASS. Visually review images at displayed help size, check no private data and current UI, audit every historical note against its original meaning. Document unverifiable historical claims rather than embellishing them.
- [ ] Commit: `docs: refresh help captures and professionalize release history`.

## E. Integration and release gate

### Task 9: Real output smoke and complete verification

**Files:** create `tests/smoke/native-v82.cjs`, `tests/smoke/native-v82.html`, `tests/smoke/native-v82.tsx`, using existing native-v81 and native-v78 harness patterns; no changes to unrelated diagnostic file.

**Interfaces:** harness uses isolated profiles, synthetic public announcements and fixed clock; it invokes real compiled output/IPC/composition paths, not a replacement application. Emit `NATIVE_V82_PASS` only when assertions finish. Close owned windows/processes; retain active profiles safely as Task 1 requires.

- [ ] Write smoke assertions before final integration: countdown insertion/reopen, PRE→SERVICE→POST banner visibility, countdown quick exception, Schwarz/OSB priority, top/bottom contain geometry, normal/test ON AIR watermark, banner over video/website, no leaked watermark on help, late output join, offline expiry, unchanged media start/currentTime across banner updates. Collect MAIN/mirror timestamps from shared anchor and detect the previously reported ~2 s delay rather than masking it with independent timers.
- [ ] Build with `npm run build`, run harness against built sources. Initial failure must identify a real uncovered integration requirement; fix through owning task tests, not a broad renderer rewrite.
- [ ] Run `npm run verify:release`, `npm run typecheck`, `npm run build:web`, `npm run test:web`, Task 1 parent runner and `native-v82.cjs`; expect exit 0 and explicit smoke pass. Browser tests needing a server use the repository's existing Playwright configuration. Confirm no new Firebase initialization/direct renderer writes and no new dependency required.
- [ ] Open actual screens and compare captures for legibility, 16:9 contain, long ticker, reduced motion, Arabic help, countdown designs and normal outputs. Check real radio/background route remains active. If physical audio, streaming or recording cannot be exercised, report that as unverified, not passed.
- [ ] Commit regression harness and integration fixes: `test: verify v82 native banner countdown and help flows`.

### Task 10: Reviewed v82 package and publication

**Files:** modify `package.json`, `package-lock.json`, `public/releases.json`, `RELEASE_NOTES.md`; generated installer is a release artifact, not repository source.

**Interfaces:** release target `0.82.0`, releaseSeries `0.82`, installer `GottesdienstRegie-Setup-0.82.0.exe`; retain existing updater channel and Windows display/profile data. Publication authorization comes from the user's request; never claim publication from a local build alone.

- [ ] Run final whole-branch review using requesting-code-review workflow after implementation, with approved spec and this plan. Resolve blocking findings and rerun affected tests before any version bump/push.
- [ ] Add factual v82 notes for verified delivered work only, bump version/lock consistently, rerun release checks. Confirm old inventory still intact; current/new release is excluded from the historical equality fixture only by its new identity.
- [ ] Run `npm run installer` and `npm run verify:package-entry`; inspect packaged asar/metadata/assets to confirm current code, fonts, help and countdown assets and absence of smoke scripts. Run native regression against the packaged build too. Never compile concurrently into directories being packaged.
- [ ] Follow existing release/main integration process without overwriting unrelated edits. Commit release changes, publish through existing workflow, verify Windows build completes and installer plus updater metadata are reachable. Download the actual published installer for checksum comparison with published metadata; ensure update feed advertises 0.82.0 on the intended channel.
- [ ] Deliver verified download link, concise change summary and any unverified hardware checks. Do not mark done while release workflow, package verification or required corrective work remains.

## Self-review record

Spec sections 1–3 map to Tasks 1, 7, 8; section 4 to Tasks 2–3; sections 5–6 to Tasks 4–6; acceptance/release sections to Tasks 9–10. Review Focus cases are pinned in their owning task tests. All later countdown/banner interfaces use the signatures defined above. Content editing/captures use structural checks and human-facing visual/editorial review, not artificial prose unit tests. No implementation has begun at plan creation.
