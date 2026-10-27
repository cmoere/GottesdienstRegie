# Public v0.94.0 verification — 27 October 2026

Published normal/latest release:
https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.94.0

The release is public, not a draft or prerelease. Its source tag resolves to
`1c112b7c344918788acc022c435a9d15efb3bfbd`. All 11 required platform files are
present. All three public updater manifests name version `0.94.0` and reference
existing assets with matching sizes. The public RSS contains this release.

## Windows download

- Installer: `GottesdienstRegie-Setup-0.94.0.exe`
- Bytes: `759724593`
- SHA-256: `32d2f79c18df2a2f7fde98d242b8f3ac472d03ba22696bf5ca52c86645578f40`
- SHA-512: `SrgqufJebofKQKTkLpmI818rP/sGzjP2j/628zY86HguAocxRuivcGHkQ7ZZIHjSaEFH2/Da/TgNfOQDbyropw==`

The downloaded bytes match both the public Windows updater's SHA-512 and the
GitHub asset's SHA-256. Installer extraction was read-only; the NSIS installer
was not executed and the user's installed application/settings were not replaced.

## Packaged application and native playback

`work/v94-package-inspection.log` verifies the packaged version and exact tested
Main/preload/coordinator/GPU modules. The two native binaries match their pinned
Electron 45 manifest. The normal update provider, update-settings action,
unchanged original-source storage, gong, speech manifest and speech worker are
preserved.

`work/v94-packaged-native.log` and
`work/full-app-powerpoint-JplKkS/report.json` additionally exercise the actual
published native binaries, ASAR Main modules, ASAR preload and ASAR MAIN renderer
on physical Monitor 1, with an isolated owned deck/profile. Native builds, source
timing, identical paused MAIN/live-preview pixels, independent editor selection,
operator pause/resume, pause retention after a quick screen, black plus test
watermark, protected postprogram handoff and OFF AIR drain passed. The original
file digest is unchanged. This targeted packaged run used zero soak seconds;
the separate earlier real-App run under `full-app-powerpoint-RG2v75` lasted
60 seconds.

Original playback requires Windows x64 with installed Microsoft PowerPoint.
Embedded audio/video, active/external content and interactive triggers are
explicitly rejected. Editable copy remains separate. Regional UI is still
explicitly disclosed as partial; no unrestricted PowerPoint compatibility or
complete regional translation is claimed.

## Publication checks

Successful workflow:
https://github.com/cmoere/GottesdienstRegie/actions/runs/40495097991

All platform jobs and publication succeeded. The exact source passed 267 test
files / 1,086 tests in GitHub Actions (`work/v94-ci-final-verify.log`). A prior
attempt was deliberately cancelled before publication to repair the original
editor's grid row; the corrected full-App fixture checks its workspace height.

One verified-source draft with only the current v94 notes was prepared before
the final job uploaded and checked all assets. This avoids GitHub's release-body
limit for the complete historical changelog. The workflow follow-up now extracts
current notes automatically, with version/length tests, while retaining the full
history in `RELEASE_NOTES.md`, the website and RSS. This follow-up changes release
automation/documentation only; the published application remains the tagged,
verified `1c112b7` build.

Public verification artifacts:
`work/v94-public-verification.log`, `work/release-verify-6Mr92l/report.json`,
`work/release-verify-6Mr92l/package-report.json`.

The foreign untracked startup diagnostic remains unchanged and uncommitted.
