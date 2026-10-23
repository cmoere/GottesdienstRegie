# Loop feeds, football, clocks and issue-screen evidence

Implementation in progress; not released.

## Sources checked 2026-10-23

- Westfalen-Blatt exact requested RSS URL returned HTTP200/application/xml,91372bytes, RSS2.0, no redirect. Fields title/link/pubDate/guid observed. Only structural prefix inspected; no article images downloaded.
- WDR exact requested .feed returned HTTP200/text/xml;charset=UTF-8,43269bytes, Atom, no redirect. Fields entry/title/link@href/id/published/updated observed.
- Official WDR feed conditions: https://www1.wdr.de/global/feeds100.amp — private/noncommercial usage, attribution, restrictions on passing on and archiving. Public-feed availability alone not treated as authorization.
- User directly states permission exists and specifies "quellenangaben mit logo". Subsequently explicitly authorized storage ("du darfst sie auhc speichern"). Include original source branding and attribution, not article/football artwork. Use originally approved24h bounded persisted cache, not a permanent archive. Do not enable public source rendering without the original mark. This records user-provided permission, not an independently verified license grant.
- https://github.com/lddubeau/saxes read: evented strict XML parser; no fetching external DTD entities; own size/DTD limits still necessary. Repository archived2025-12-31; npm latest6.0.0, ISC, Node>=12.22.7. Already present transitively as dev dependency; proposed exact direct runtime6.0.0 will be declared, with no broad upgrades.

## Verification

Baseline unit suite PASS:186files/777tests,81.53s; work/loop-external-baseline.log.

No installer, release, tag, push, installation, live monitor or audio configuration changed.

## Task1 in progress

- RED import probe exposed absent modules; subsequent behavioral RED with minimal exports:18 failing assertions (work/loop-external-task1-red-behavior.log). Not counted as a green verification.
- Initial new tests passed20/20. Author review added RED→GREEN regressions for whole-body cancellation, XML depth64, mathematical title text, disposal during cache reads and physical expiration of a continuously running adapter's disk snapshot.
- Current targeted run:24/24PASS across4files (work/loop-external-task1-green-final.log). Direct strict TypeScript compilation of every nested externalLoop module/test passed, not just root Electron include patterns.
- A compiled Node probe using the actual bounded service returned ready/ten entries from both sources, public keys only, two cache files: work/loop-external-task1-live.log. These remain ignored task-owned cache files, not product/publication state.
- First expanded suite:190files/800testsPASS. A later concurrent run had799PASS/oneexisting timeout: src/regional/inventory.test.ts, assembled-current-help inventory,5000ms. No timeout or test behavior changed. Frozen serial rerun PASS:190files/801tests,101.49s, work/loop-external-task1-suite-verified.log. No suite-success claim for the timed-out run.

## Football API reconnaissance (Task2 not yet implemented)

Read official OpenLigaDB GitHub/API docs. Actual HTTP200 responses checked for getmatchdata/bl1 (nine current matchday records), getavailableteams/bl1/2026 (18teams), getbltable/bl1/2026 (18rows). Current match fields include leagueSeason, leagueShortcut, matchDateTimeUTC, matchIsFinished, matchResults. Table has teamInfoId/teamName/matches/goals/opponentGoals/goalDiff/points; API row order supplies ranking.

Completed match from getmatchdata/bl1/2026/6 has resultTypeKind HalfTime/type1 and After90Minutes/type2. Parse by documented result metadata, never by array position. Empty result arrays observed for future games, not fabricated0:0. Team icon URLs are deliberately not forwarded/downloaded.

## Task2 verification

- Nine football behavioral tests RED→GREEN.33combined external-data testsPASS. Direct strict TypeScript compilePASS.
- Compiled realservice probe: all9 combinations of leagues bl1/bl2/bl3 and modes matchday/upcoming/table returnedready. Season2026 discovered from API; team counts18/18/20; tablecounts18/18/20; currentmatchcounts9/9/10. Live log: work/loop-external-task2-live.log.
- Default full-suite run809PASS/oneexisting regional inventory5000ms timeout. A purported two-worker npm launch actually dropped its forwarding argument (printed command onlyvitest run):808PASS/twoexisting timeouts in regional/inventory and regional/documentationSource corpus export. No assertion or timeout changed.
- Direct invocation retained worker arguments: `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --minWorkers=1` —191files/810testsPASS,279.75s, work/loop-external-task2-suite-two-workers.log. This verifies the complete suite with lower CPU contention, not a filtered subset. Default-parallel instability remains disclosed.

## Task3 verification

- Controller/model/placement/IPC behavioral RED:9failures/2passes. Added RED→GREEN tests for direct insertion protection and rejection of private transport fields/nonblocking preflight warnings.
-57targeted testsPASS, including actual production preload imports (no externalLoop on MAIN/STAGE), actual LiveEngine.start and operator mirrored store, shared datarevision/activation time, existing protectedpost-program take tests. The delivery timing assertion was made independently against literal1100ms; its earlier broad Slide annotation lacked the transport-only property and failed TypeScript. Corrected assertion without a runtime change; frontend typecheck and7controller tests thenPASS.
- Shared public snapshot validation extracted from cache so cache and IPC consumer do not grow separate normalization logic. Source loading only on operator mainframe; initialON AIR and normal take use the same immutable controller method. No network call added to MAIN/SlideRenderer/LiveEngine.
- Existing typed Window bridge file mechanically reformatted with TypeScript printer before adding the optional member. No runtime behavior from that formatting.
- Desktop buildPASS, Vite13.81s, Electron typesPASS and31regionalassets copied. Existing largechunk warning remains.
- Frozen complete suite with2workers825/825PASS(263.00s); final stronger assertion build/typecheck verification followed by complete4worker suite196files/825testsPASS(177.84s), work/loop-external-task3-suite-final.log. No timeout/assertion weakened.
- AppClock remains the existing local wallclock (externallyTrusted=false); no claim of externally authenticated time. No actual native output windows, device routing or installed app touched in this task.

Original source logo URLs discovered on official pages, then read and checked for script/foreignObject/image/href/src/url() content (none). WDR SVG sha25639bef66d1683386da5925ac27e5ae47d0a053303afccd413d3c03269936ffb45; WB SVG sha2569af482cb2de2b3a3f43297f16064f75992bb5d3f2e4429fe8b0103c03de17b1f. Actual assets still to be added with Task4; no fake logo substituted.
# Task4 editor and composed output verification

Source toggles, league/known-team choices, mode selection, persisted reload, data status and minimum duration: 22 targeted tests passed after eight expected initial failures. Complete suite: 198 files / 832 tests passed (192.74 seconds, four workers). Frontend TypeScript noEmit passed.

Native Electron 37 isolated hidden fixture captured news, matchday, upcoming and a 24-row table. Original source logos are bundled unchanged with source names; their differing ink colors require white (WB) and black (WDR) display backgrounds. Logo box and composed-pixel assertions exposed the initial unreadable logos, then passed after correction. Capture waits for image decode, fonts and actual renderer frames. News and table captures were visually inspected. Evidence folder: work/external-loop-native-gW4YGx. No physical display, audio device, installed app or production ON AIR was operated.

The new native fixture is partial at task4: clock/technical phase and immutable-take integrated assertions remain task6 work. No publication claim.

## Task5 clock and technical issue screen

Six selectable preview tiles, scalar persistence, legacy HH:mm, four date formats, 12/24-hour time, seconds/analog second hand, alignment and validated colors implemented through one shared clock renderer. Static preview tiles have no timer; mounted clock cleanup verified.

Technical screen uses native information SVG, preserved German custom text/background and separately editable English text. Its DE/EN phase derives from the one dispatched activation epoch, eight seconds per language; static tiles remain German. Restored/reopened output receives the same phase without restarting navigation or audio.

Tests: eight initial failures plus missing editor controls reproduced before implementation; 28 targeted tests passed, including exact 7999/8000/16000-ms boundaries, malformed optional fields, mounted/static timer lifecycle, previous logo variants, Bible navigation and screen-test regressions. Full suite 202 files / 841 tests passed (192.66s); two further lifecycle/boundary tests passed in the final targeted run and will be included in task6 full suite. Frontend typecheck passed.

Native Electron37 probe first failed at missing clock integration, then passed six clock designs and an English-phase late mirror window. Captures in work/external-loop-native-uW2vuR visually inspected for all six clocks, technical icon/text/watermark and the four external-data modes. Physical display and audio were not exercised.
