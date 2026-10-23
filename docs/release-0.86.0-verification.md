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

Pending. Local commits/builds do not prove an uploaded update. After the authorized fast-forward source push, verify the release workflow, normal/non-draft release state, installer/blockmap/update manifests, source SHA, installer hash and public release-feed entry. No installer is executed during verification.
