# Loop News, Football, Clock and Issue Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The user selected native execution; do not delegate programming or review.

**Goal:** Add visitor-facing RSS and football loop elements, configurable clocks and a bilingual technical-issue quick screen without disrupting live output.

**Architecture:** One Electron-owned external-data service fetches, normalizes and caches approved sources. The operator prepares immutable loop snapshots at existing take boundaries; output windows render those snapshots without network access. Clock and technical-screen rendering share the existing AppClock and output composition.

**Tech Stack:** TypeScript, Electron 37, React 19, Vitest, existing Playwright/native smoke harnesses; saxes 6 for bounded RSS XML parsing after dependency verification.

**Spec:** `docs/superpowers/specs/2026-10-23-loop-news-football-clock-design.md` (approved in chat).

## Global Constraints

- Only PRE-/POST placements already permitted by the loop domain; no changes to protected post-program navigation or Firebase schema.
- Fixed feeds: Westfalen-Blatt Bielefeld and WDR OWL; football from api.openligadb.de. HTTPS only, approved hosts only, no arbitrary URLs.
- Requests: 10 seconds, 2 MiB response maximum; XML: no DTD/external entities, maximum 100 entries per source.
- News: five-minute refresh, ten displayed entries by default, 24-hour cache validity. Football: matches 60 seconds, tables five minutes, teams/leagues six hours; six-hour stale-content validity.
- Updates become visible at the next safe take, never halfway through the current output. EMPTY skips without black frames.
- Colors #699F3E, #608F9A, #B6BEC3; Cera Pro with existing fallback. No images/logos, auto font shrinking, title truncation or article HTML.
- Six clock designs, computed German dates, existing AppClock, persistent settings; technical screen alternates DE/EN every eight seconds with one shared activation epoch.
- Existing test watermark remains above all new content. No new audio action, physical monitor change, app/runtime upgrade or production ON AIR during probes.
- Preserve unrelated `tests/smoke/startup-diagnostic.cjs`. Stage only task files. Commit each passing task.
- Publication remains gated by the earlier explicit PowerPoint/regional-text completion condition unless the user changes it; no version bump/push/tag/upload during implementation.

## Review Focus

1. Slow or failed one-of-two RSS sources must not discard the successful source or block a take (tasks 1, 3).
2. Late responses after a source/league selection change must not overwrite the new selection (tasks 2, 3).
3. Reopening an output window midway through an EN interval must show EN immediately, not restart German (task 5).
4. Cached data from another schema or future clock time must not be trusted silently (task 1).
5. Missing score, completed score and intermediate score must remain distinct; numeric zero is valid (task 2).

## File map and stable interfaces

- `shared/externalLoop.ts`: transport types only; no Node/DOM imports.
- `electron/externalLoop/http.ts`, `cache.ts`, `news.ts`, `football.ts`, `service.ts`: bounded transport, cache, two adapters, lifecycle/coalescing.
- `electron/main.ts`, `electron/preload.ts`, `src/vite-env.d.ts`: validated operator-only bridge and lifecycle hooks; outputs do not receive fetch methods.
- `src/externalLoop/model.ts`, `controller.ts`, `Designer.tsx`, `View.tsx`, `styles.css`: normalize metadata, manage pending data, editor and pure snapshot view.
- `src/loopDomain.ts`, `loopItemFactory.ts`, `loopCoreLayer.ts`, `addElementCatalog.ts`, `store.ts`, `App.tsx`, `SlideRenderer.tsx`, `LiveEngine.ts`, `liveDynamicData.ts`, `loopDataService.ts`: narrow integration points, not new large inline subsystems.
- `src/clockLoop/model.ts`, `ClockLoopView.tsx`, `ClockLoopDesigner.tsx`, `styles.css`: one shared clock implementation replacing duplicated simple renderers.
- `src/TechnicalIssueScreen.tsx`, `QuickScreenSettings.tsx`, `preferences.ts`, `quickScreenUi.ts`, `screenTest.css`: preserve the technical screen ID and custom-text behavior.
- New colocated tests; `tests/smoke/external-loop-output.*`, `scripts/test-external-loop-native.cjs`: isolated native verification.

Transport contract in `shared/externalLoop.ts`:

```ts
type NewsSource = 'westfalen-blatt' | 'wdr-owl';
type FootballLeague = 'bl1' | 'bl2' | 'bl3';
type FootballMode = 'matchday' | 'upcoming' | 'table';
type NewsEntry = { id:string; title:string; source:NewsSource; publishedAt:string|null; url:string };
type FootballTeam = { id:number; name:string };
type FootballMatch = { id:number; startsAt:string; home:FootballTeam; away:FootballTeam;
  status:'scheduled'|'in-progress'|'finished'; score:null|{home:number;away:number} };
type FootballTableRow = { rank:number; team:FootballTeam; played:number; goalsFor:number;
  goalsAgainst:number; goalDifference:number; points:number };
type ExternalPayload = {kind:'news';entries:NewsEntry[]} | {kind:'football';league:FootballLeague;
  season:number;mode:FootballMode;teams:FootballTeam[];matches:FootballMatch[];table:FootballTableRow[]};
type ExternalRequest = {kind:'news';sources:NewsSource[]} | {kind:'football';league:FootballLeague;mode:FootballMode};
type ExternalSnapshot = {version:1; key:string; revision:string; fetchedAt:number;
  stale:boolean; payload:ExternalPayload};
type ExternalReply = {snapshot:ExternalSnapshot|null;status:'ready'|'stale'|'empty'|'unavailable'};
type ExternalSettings = ({kind:'news';sources:NewsSource[];limit:number} |
  {kind:'football';league:FootballLeague;mode:FootballMode;teamId:number|null}) & {durationSeconds:number};
```

No raw exception/HTML/provider object is part of this contract. Operator diagnostics are local fixed-code status plus last-success timestamp, not MAIN content. API arrays are capped at 100 news entries/source and 1000 sports rows before normalization.

### Task 1: Safe central news fetching and cache

**Files:** Create shared types and `electron/externalLoop/{http,cache,news,service}.ts`; create corresponding `.test.ts` files and small fixture XML/JSON under `tests/fixtures/external-loop/`; modify package manifest/lock only to declare a verified runtime XML parser.

**Interfaces:** `fetchBounded(url:string, signal:AbortSignal):Promise<string>`; `parseNews(xml:string,source:NewsSource):NewsEntry[]`; `NewsAdapter.load(sources:NewsSource[]):Promise<ExternalReply>`; `ExternalLoopService.read(request:ExternalRequest):Promise<ExternalReply>`, `.dispose():void`. Inject fetch/clock/cache filesystem in tests. Cache envelope `{version:1,key,fetchedAt,payload}` lives only under app cache directory; schema validation on write/read; failed writes do not fail a successful fetch.

- [ ] Check both live feed URLs with a ten-second bounded HTTP request; inspect actual RSS structure and source reuse conditions. Record status/structure and conditions in evidence. If access or permissions cannot support the approved display, report that source as blocked; do not scrape the website or silently substitute another source.
- [ ] Read upstream saxes documentation/security and current dependency metadata; declare a direct runtime dependency only after verification. Do not rely on the already-transitive dev copy or perform a broad dependency upgrade.
- [ ] Write failing tests named `rejectsDtdAndOversizedXml`, `stripsHtmlAndKeepsSource`, `deduplicatesCanonicalLinks`, `keepsSuccessfulSourceWhenOtherFails`, `coalescesAndRespectsFiveMinutes`, `rejectsWrongSchemaAndFutureCache`. Assertions: 2 MiB+1 rejects; 101 entries normalize to at most100; default merge takes ten; 24h+1ms cache expires; future timestamp beyond one-minute tolerance rejects.
- [ ] Run `npx vitest run electron/externalLoop/news.test.ts electron/externalLoop/cache.test.ts electron/externalLoop/http.test.ts`; confirm meaningful RED before implementation.
- [ ] Implement the declared interfaces using streaming byte counting, explicit redirect validation (maximum three), local doctype rejection plus SAX parsing, plain-text extraction and safe HTTPS article URLs. Coalesce each source request independently. Persist atomically; retain at most32 hashed cache keys/32MiB total, evict oldest expired first and never delete outside the app-owned external-loop cache directory. Avoid source-failure deletion of a good snapshot.
- [ ] Run the task tests GREEN, including timeout, malformed XML, blocked host/loopback redirect and cache write failure. Confirm existing Electron compilation includes nested imports from main.
- [ ] Commit only types, news/cache/HTTP/service code, fixtures/tests and the reviewed dependency declaration: `feat: add bounded cached loop news sources`.

### Task 2: Football adapter with real league/team selection

**Files:** Create `electron/externalLoop/football.ts`, `.test.ts`; extend service and fixture set; use the shared football types from task1.

**Interfaces:** `FootballAdapter.load(request:Extract<ExternalRequest,{kind:'football'}>):Promise<ExternalReply>` uses task1 bounded HTTP/cache. Resolve current season from returned league/match data; validate returned league and season before caching. Team filtering is a pure renderer/controller operation, not a new network endpoint.

- [ ] Read official OpenLigaDB GitHub/API docs, verify read endpoints for league/current season, matches, teams and table with bounded requests. Record actual field names and result-type semantics in fixtures/evidence; no hardcoded seasonal year or invented score/status mapping.
- [ ] Write failing tests `preservesZeroButNotMissingScore`, `choosesFinalVsIntermediateResult`, `resolvesSeasonRollover`, `keepsTableRankingAndTeamIds`, `deduplicatesFootballRefresh`, `rejectsMismatchedLeagueAndSeason`. Assert missing score null, real0:0 retained, completed match distinct from intermediate, intervals60s/300s/21600s and expiry6h+1ms. Include a late old-league response that must remain keyed to the old request.
- [ ] Run `npx vitest run electron/externalLoop/football.test.ts` RED.
- [ ] Implement the adapter and extend `ExternalLoopService.read`. Normalize numeric provider IDs, dates and totals; reject malformed rows individually, do not fabricate rows or use API order as a score-type selector. Use documented result metadata; when ambiguous, show unavailable score rather than guessed final score.
- [ ] Run task1 and2 tests GREEN. Check a provider endpoint failure does not clear another league's valid cache.
- [ ] Commit: `feat: add cached football fixtures results and tables`.

### Task 3: Operator bridge and immutable loop takes

**Files:** Modify Electron main/preload/types and the existing domain, catalog, factory, store, LiveEngine/liveDynamicData and App take hooks. Create `src/externalLoop/{model,controller}.ts` and tests. Extend loop/preflight tests.

**Interfaces:** Preload `externalLoop.read(request):Promise<ExternalReply>` available to operator main-frame only; validate enums and arrays in main (unique sources, max2). `ExternalLoopController.prepare(request):Promise<ExternalReply>`, `peek(request):ExternalReply`, `freeze(request,startedAt:number):ExternalSnapshot|null`, `dispose():void`. Controller keys each request and uses generation tokens. `hydrateExternalLoopData(slide:Slide,snapshot:ExternalSnapshot,startedAt:number):Slide` clones and stamps `externalSnapshotJson`, `externalRevision`, `externalStartedAtMs` on matching loop elements before existing output revision hashing. No cache or window global as a live renderer fallback.

- [ ] Write failing IPC tests for renderer/output/subframe rejection and malformed request; loop tests for onlyPRE/POST, EMPTYskip and original sections unaffected. Test `prepareDoesNotMutateVisibleSnapshot`, `lateSelectionResponseCannotReplaceNewSelection`, `takeAndMirrorShareRevisionAndEpoch`, `failedSourceDoesNotBlockTake`.
- [ ] Run new controller/domain tests RED using Vitest and the repository's existing IPC test style.
- [ ] Implement bridge with one service instance and stop/dispose on app shutdown. Start demand only for configured elements; one operator-owned 60-second scheduler prepares unique configured requests, with first preparation immediate and network intervals enforced by backend cache. Cleanup on unmount/presentation close; no per-output polling. Web without native bridge reports unavailable in operator UI and does not circumvent via a proxy.
- [ ] Add `news`/`football` to all exhaustive type maps and loop placement policies. Defaults: news bothsources/max10; football bl1/matchday/allteams. Carry settings in existing scalar metadata; hydrated snapshot JSON only in output copy, not saved slides. Keep source selection/preview available before ON AIR.
- [ ] Integrate freeze at both regular live take and initialON AIR take; readiness/minimum duration at existing navigation preparation points. EMPTY skip uses current candidate selection and never bypasses the protected post-program notice or emergency quick actions. Preflight warnings remain nonblocking.
- [ ] Run controller/domain/IPC tests GREEN and `npm run typecheck`. Confirm no MAIN fetch methods or network timers; immutable output and mirrored slide use the same envelope.
- [ ] Commit: `feat: integrate external loop snapshots at safe live takes`.

### Task 4: News/football editors and full-width renderers

**Files:** Create `src/externalLoop/{Designer,View}.tsx`, `styles.css`, corresponding tests; modify App editor dispatch and SlideRenderer loop dispatch. Reuse existing `src/eventScroll.ts`/`EventScrollViewport.tsx` APIs after reading their exact exports; do not fork a second scrolling algorithm.

**Interfaces:** `ExternalLoopDesigner({item}:{item:ServiceItem})` writes normalized settings through existing store actions. `ExternalLoopView({snapshot,startedAt,settings}:{snapshot:ExternalSnapshot;startedAt:number;settings:ExternalSettings})` consumes only task3 frozen data. `normalizeExternalSettings(metadata:Record<string,unknown>):ExternalSettings` and `externalLoopMinimumDuration(snapshot:ExternalSnapshot,settings:ExternalSettings):number` define the single readiness/duration source for take preparation and view scroll planning. News limit is clamped1–10 (default10), duration>=1s, and palette fixed as approved. Reuse `prepareEventScrollPlan({contentHeight,viewportHeight,horizontalOverflow,roundTrip:true})`, `EventScrollViewport({plan,elapsed,reduced,children})` and existing shared elapsed timing; all distances use1920×1080 coordinates.

- [ ] Write failing UI tests for two RSS source toggles, available leagues/teams only, allteams default, switching modes, empty/unavailable operator status, timestamp visibility and persisted reload. Output tests reject rawHTML/image/technical error rendering, preserve static metadata while title scrolls, keep full table rank when highlighting a club, and require minimum scroll duration for overflowing rows.
- [ ] Run `npx vitest run src/externalLoop` RED.
- [ ] Implement designer cards/controls and data status; changes to league clear an unavailable team selection explicitly. Implement text-only full-width news list and score/table views with Cera Pro, approved palette and existing measured scroll primitives. Do not use ellipsis or font shrink. A short operator duration is clamped to computed readable minimum.
- [ ] Run task UI/controller tests GREEN; capture all modes with long titles,20+rows, no score and stale data. Assert preview and MAIN frozen payload/epoch match. Use CSS-local rules, not application-wide typography changes.
- [ ] Commit: `feat: add configurable news and football loop views`.

### Task 5: Six clock designs and bilingual technical issue

**Files:** Create `src/clockLoop/{model,ClockLoopView,ClockLoopDesigner}.ts(x)` and CSS/tests; modify existing ClockLoopElement, LoopPreview, App editor dispatch and factory. Modify TechnicalIssueScreen, QuickScreenSettings, preferences/quickScreenUi and their tests.

**Interfaces:** `normalizeClockSettings(metadata):ClockSettings`, `clockSettingsPatch(settings):Record<string,string|number|boolean>`; design IDs `digital-classic`, `digital-compact`, `digital-seconds`, `analog-light`, `analog-dark`, `analog-digital`; date formats `dmy`, `day-month`, `long`, `iso`. `ClockLoopView({settings,now})` is pure; one wrapper uses existing AppClock subscription and cleans it up. `technicalIssueLanguage(activatedAt:number,now:number):'de'|'en'` uses `Math.floor(Math.max(0,now-activatedAt)/8000)%2`. Add optional `technicalIssueEnglishText` and shared `activatedAtMs` to QuickScreenConfig, validating imported settings independently.

- [ ] Write failing tests for six selectable previews; 12/24, seconds/secondhand, date/weekday variants, exact German date punctuation, threealignments/colors and reload. Test legacy metadata.format conversion including HH:mm withoutseconds; invalid fields fall back independently rather than reset all settings.
- [ ] Write issue-screen tests for7999msDE/8000EN/16000DE, late reopened EN window, custom German/English text, unchanged logo variant/background, informationSVG instead of line, and watermark above output. StaticPreview is always German. Imported activation time missing/invalid is initialized once in the controlling dispatch, never independently per output.
- [ ] Run clock/technicalQuickScreen/quickScreenUi tests RED.
- [ ] Implement models/views/editors; remove duplicated clock output markup by delegating both existing renderer entrypoints to the same view. Tick only while mounted; respect 12-hour labels and existing timezone. Persist scalar settings without altering unrelated elements.
- [ ] Replace technical line with repo-native informationSVG, reserve equal DE/EN layout and add English textarea. Stamp activation epoch on each new technical quick invocation, preserve it across redispatch/restoration; derive language from AppClock. Do not restart the quick overlay or content navigation at language change.
- [ ] Run clock/technical/Bible paging/screenTest regression tests GREEN. Native comparison must show same EN phase in output+mirror and static DE tile.
- [ ] Commit: `feat: add clock design controls and bilingual issue screen`.

### Task 6: Integrated native verification and release handoff

**Files:** Create isolated `tests/smoke/external-loop-output.{html,tsx,cjs}` and `scripts/test-external-loop-native.cjs` following existing screen-test harness; add `docs/superpowers/evidence/2026-10-23-loop-news-football-clock.md`. Release files remain untouched until gate satisfied.

- [ ] Add a failing native probe assertion set: actual output pixels for long news and table, revisionstable acrosspendingupdate then changes at take, sixclock designs, Englishphase onnewwindow, testwatermark above technicalscreen, no new audio/device calls. Use deterministic fixture data and explicit shared AppClock; no internet needed for correctness.
- [ ] Run probe RED, then complete only missing integration. Use loopback server, task-owned userData/hidden windows, bounded process deadline and finally cleanup. Do not kill all Electron processes, change monitor1 assignment or install the app.
- [ ] Run `npm run test:unit`, `npm run build`, `npm run build:web`, `npm run test:web` serially, plus `node scripts/test-screen-test-native.cjs` and new `node scripts/test-external-loop-native.cjs`. Record exact totals/exitcodes and visually inspect screenshots; no pass claim on skipped tests.
- [ ] Verify both actual RSS HTTP responses and bounded football endpoints separately. Record unavailable sources honestly. Check current usage conditions before enabling any restricted public display; pause that source rather than substitute scraping.
- [ ] Perform root author review against every spec section, dependency/runtime manifest diff, privacy/IPC/cache boundaries, testwatermark, pending requests and shutdown cleanup. This is not independent review. Run `git diff --check`, check unrelated file SHA and task-owned process cleanup. Commit evidence/probe changes only after successful checks.
- [ ] Report implemented versus blocked items. Recheck the PowerPoint/regional-text publication gate; if stillopen, stop before version/package/tag/push and ask whether the user explicitly wants to change release scope. Do not imply the update is discoverable.
- [ ] Only after gatefulfillment or explicitwaiver: select the next unused normalrelease version from actual tags/releases; update existing version/release note process, build installer, inspect packagedentry, upload matching installer/blockmap/latest.yml to a nonprerelease release. Read back checksums and feed asset URLs; verify installed updater's configuredprovider sees a newer eligible version. Do not execute installation or restart on user's machine without request.

## Plan self-review

Spec coverage: sources/security/cache/tasks1–2; placement/immutabletake/offline/preflight/task3; selection/layout/scroll/task4; clock and DE/EN/task5; native safety/regression and truthful publication/task6. Review-focus cases each have named owning tests. New interfaces are declared above; no unfinished behavior is delegated to an unspecified future phase. Task1–4 share one data boundary; task5 can be reviewed independently but is included here because it is part of the same approved update request. Existing PowerPoint work is not replaced or declared complete by this plan.

Execution remains pending user review of this plan; preserve the already selected root/native method.
