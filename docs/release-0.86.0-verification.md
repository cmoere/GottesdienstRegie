# GottesdienstRegie 0.86.0 – release verification

Date: 23 October 2026. This is the user-authorized normal update with disclosed incomplete regional UI. The user explicitly superseded the earlier wait-for-full-PowerPoint/localization gate with “jetzt alles so veröffentlichen”.

## Scope and review

New local-news and football loop types; six clock designs; bilingual technical-issue screen; automatic MAIN screen test and Bible Quick Screen paging; immutable live data snapshots and readable reduced-motion continuation frames.

Programming, testing and review were performed by the root author. This is not an independent code review. Only translation of the twelve new release fields into each of the fifteen existing regional packs was delegated under the user's translation-only authorization. Existing regional help/release prose was compared against HEAD and retained unchanged: exactly 180 new fields. All fifteen documentation corpora validate against 63 help articles and 1,480 release fields. This does not certify complete UI localization.

The original-fidelity PowerPoint player remains unapproved and inactive. Its separate GPU probe still fails the production cadence gate; no Electron upgrade or failed experimental transport was enabled in the product. Physical audience displays and audio routing were not changed.

## Local evidence

- Final runtime suite: 202 files / 846 tests passed, 190.02 seconds, direct Vitest with four workers. Release-ready metadata/docs suite also passed: 202 files / 846 tests, 188.29 seconds.
- Desktop and web builds passed; the five browser integration tests passed. Known large-bundle warnings remain.
- New v86 guard: 88 focused tests passed.
- Previous v85 guard: 35 regression tests passed. Release-ready desktop build passed (Vite14.65s plus Electron compile and31regionalassets); compiled package entry path verified.
- Explicit partial-release approval was tested RED→GREEN for precisely 0.86.0; unapproved future versions, missing fingerprints and misleading disclosure remain rejected.
- New source-corpus size assertion reproduced the expected release-field count change before updating it from 1,468 to 1,480 while retaining historical identity assertions.
- Regional publication gate passes with a regenerated, exact source fingerprint and the unchanged visible Standard German fallback notice.
- Native external-loop probe: work/external-loop-native-kqGhi2. Four public data modes, readable original source logos, six clocks, shared late English phase, watermark and stable pending-refresh pixels all passed.
- Existing native screen-test probe: work/screen-test-native-659fs5. Eight renderer receipts/pixel checks and Bible navigation passed.
- Full evidence and author-review findings: docs/superpowers/evidence/2026-10-23-loop-news-football-clock.md.

## Publication

Published and publicly verified on 23 October 2026 at 13:09 UTC. Normal latest release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.86.0. No installer was executed during verification.

### First CI run and recovery

Source commit 4a6f704 started run39955556526. Windows failed at historical v57/v58 source-regex guards after the previously implemented radio-browser localization. Both failures were reproduced locally; guards now assert the actual translation calls and the original German dictionary values. No radio behavior was modified and no tests were disabled. All46 workflow version guards then passed locally.

The existing per-platform publisher exposed a partially populated release before Windows succeeded. The failed run was cancelled and the same release was reversibly held as a draft; no assets or tags were deleted. Eight macOS/Linux files had already uploaded and were retained. Recovery adds a Windows-only dispatch, uploads as draft, and a final publication job that requires successful requested platforms plus all eleven nonempty expected binary/update assets. Missing/empty asset cases and publication ordering were observed RED→GREEN. The successful final source/tag and workflow IDs are recorded after verification below.

Recovery verification: 204 files / 848 tests passed (198.31 seconds), TypeScript passed, and the expanded v86 guard passed all 90 focused tests. The recovery commit changes only CI, release guard scripts, tests and this verification document; application runtime sources remain identical to the existing v0.86.0 tag at 4a6f704. Existing macOS/Linux artifacts are therefore retained without rewriting the tag. The unrelated untracked startup diagnostic remains untouched (SHA256 B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5).

### Final public verification

- Recovery source: 5f9cb0be28d4d456b5eb5ef66e8274b2640e31bb, fast-forward push to main. Windows-only workflow dispatch 39957978040: prepare, Windows and final publish successful; retained macOS/Linux jobs intentionally skipped.
- Application source tag remains 4a6f704db5682f92a103b05cfd0ee8252c7a4bb3; no tag rewrite or artifact deletion. Runtime-source equivalence checked between tag and recovery commit.
- Public release API confirms v0.86.0 is latest, draft=false and prerelease=false. All eleven expected artifacts are nonempty. All three update manifests report 0.86.0 and every referenced artifact filename/size matches the public release.
- Downloaded Windows installer: 290,321,259 bytes. SHA256 a16505cb45a795f36f18b090e37abfc821a117552f415f0ef04db4b3f53f1f54; SHA512 matches latest.yml exactly. Public API digest also matches. Readonly verification report: work/release-verify-sI0mYC/report.json.
- Installer inspected only as archives using 7-Zip and @electron/asar; not executed. Packaged version 0.86.0, main dist-electron/electron/main.js, compiled preload, renderer entry and saxes dependency all present. ASAR lookups require platform-normalized paths on Windows; an initial slash-path lookup failed, then the native-path lookup and archive listing confirmed the files.
- Packaged app-update.yml uses GitHub cmoere/GottesdienstRegie, releaseType=release, matching the normal update channel. Public release-notes RSS contains 0.86.0; Pages workflow 39957956845 succeeded.
- No installed application, audience monitor, audio device or physical output route was changed. Original-fidelity PowerPoint remains inactive; partial regional UI status remains disclosed.
