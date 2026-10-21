# GottesdienstRegie 0.85.0 – verification

Date: 2026-10-21. Scope: the user-approved announcement/navigation/RSS update.
The original-fidelity PowerPoint player is not enabled by this release.

## Approval and scope

The user approved the three-package design, including a 60-second minimum for
the mandatory post-program notice with emergency Quick Screens and OFF AIR still
available. The user separately approved a normal update with the disclosed,
incomplete 15-variant regional UI scope. The manifest remains version-pinned and
source-fingerprint-pinned; missing resources/documents remain release blockers.

Only translation work was delegated. The author performed the code review and
native verification; this is not an independent code review.

## Local evidence

- Full final Vitest run: **179 files, 718 tests passed**, exit 0.
  `node node_modules/vitest/vitest.mjs run --maxWorkers=2`
- `npm run build`: exit 0, including renderer and Electron TypeScript compilation.
  The existing large-chunk advisory remains; it is not a build error.
- Historical release guards 39–75, 43.1, 45.1, 52.1, 71.1, 72.1, 83 and 84 passed.
- New `node scripts/check-version85.cjs`: **30 focused tests passed**. The RSS
  catalog comparison also passed with Windows CRLF line endings.
- Regional documentation: 15 packs, 63 source help articles, 1,468 release fields,
  no missing documentation. All prior pack fields were compared against HEAD;
  exactly 12 new release fields per pack were added (180 total).
- `git diff --check`: exit 0.

Regression tests were observed failing before their corresponding fixes. The
older post-program preview test now checks both rejection during protection and
successful advancement after expiry; its service-to-post transition assertions
were retained.

## Native rendering

`tests/smoke/live-announcement-update.cjs` passed in an isolated, hidden Electron
window at 1920 × 1080, using the actual Cera Pro assets and production renderers.
No physical audience output or installed application was started by this check.

The check covers first/last scroll positions in five announcement layouts, a
fixed 360-pixel QR code, the repeated bold ribbon across wrap boundaries, the
visible web RSS link and valid complete release feed. Screenshots were inspected.
The long-ribbon test reproduced an approximately 3,465-pixel empty gap before
the measurement fix; the corrected gap measured approximately 63 pixels against
a 64-pixel target, including more than 7,000 characters of text.

The navigation tests also cover direct takes, NEXT/PREV, OFF AIR, initial ON AIR
on the protected notice, stale callbacks, and reconciliation of an unavailable
placeholder without replacing a valid already-visible notice.

## Publication

Local verification does not itself certify publication. The GitHub release jobs,
normal-update status, exact source tag, all platform manifests, public RSS feed,
and downloaded Windows installer hash must be verified after the source push.

### Confirmed public release

Verified at 2026-10-21T02:41:33.434Z. The release is public, non-draft,
non-prerelease and the normal latest update:
[v0.85.0](https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.85.0).

- Installer/tag source: `69cb4f48bdcbdd472130fb9c76d502a7dad971da`.
- Cross-platform release run: [39533738689](https://github.com/cmoere/GottesdienstRegie/actions/runs/39533738689), success.
- Source website run: [39533738672](https://github.com/cmoere/GottesdienstRegie/actions/runs/39533738672), success.
- Website-only RSS deep-link correction: `e0245ad494890d6937986de072ab45602a9f4d18`;
  [39534125322](https://github.com/cmoere/GottesdienstRegie/actions/runs/39534125322), success.
  Native regression reproduced the dotted-ID selector error before correction;
  the public page was checked for the corrected fragment resolution afterwards.
- All **11 release assets** are present and non-empty. `latest.yml`,
  `latest-mac.yml` and `latest-linux.yml` identify 0.85.0 and reference uploaded
  assets with matching byte sizes.
- The Windows installer was streamed from the public release and hashed without
  execution: **290177220 bytes**. Its SHA-512 matches `latest.yml`:
  `8IoY+VwGrcwZI08El5HBiBL3JnxLAwiR9VY9I1B2j1MkHPnxPPdP0Gw9MKUSm+rl9fcIA+jTDO+uGHgx0SZOxQ==`.
- Windows SHA-256: `ee6db0aa1d8760d56c512ee0238f4beb8429bf4c466ed4cb4ff6656679402433`.
- [Public RSS feed](https://cmoere.github.io/GottesdienstRegie/release-notes/feed.xml) contains 0.85.0.

No installer was executed, no existing presentation was removed, and unfinished
PowerPoint diagnostics and the unrelated startup diagnostic were not included
in the release commit.
