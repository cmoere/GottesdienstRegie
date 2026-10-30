# Public v0.95.0 verification — 30 October 2026

Normal/latest release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.95.0

The public release is neither a draft nor a prerelease. Its source tag resolves to `0c124bbba5e0b53d7982ec60192734374e199e99`. All 11 required platform assets are present. Windows, macOS and Linux updater manifests name `0.95.0` and reference actual assets with matching sizes. The current public history, RSS and all nine refreshed help PNGs were independently fetched and verified.

## Windows download and package

- Installer: `GottesdienstRegie-Setup-0.95.0.exe`
- Bytes: `762199822`
- SHA-256: `de680bdce0b419e4db825e18cbcb6f694538bd99722e1417e623e665dca2a374`
- SHA-512: `gk0eCioE7DeOWTlt9yzXoQ+FNlVEAZzJZRIPUU6/MASqNTFw2Wf3GfGxIGZ8npCYtT1Yv4M3nSdAcCiPYCumkA==`

Downloaded bytes match the public updater SHA-512 and GitHub asset SHA-256. Read-only extraction verifies package version 0.95.0, 9 tested native modules/resources (with source line endings normalized), all 31 matching regional interface/native packs, nine help images and the normal GitHub update provider. The installer was not executed; user installation and settings remain untouched.

## Functional verification

The isolated full suite passed **277 files / 1186 tests**. Renderer/Electron build, strict all31 completion (0 pending / 0 issues), 48 native shell cases, six actual App cases and 31 regional settings surfaces passed. The native original PowerPoint fixture passed with a **60-second extended soak**, original builds/timing, pause/resume, selection independence, quick-screen pause, test watermark, protected postprogram handoff and OFF-AIR drain. This is bounded native regression evidence, not certification of arbitrary decks or physical cable/projector/audio hardware.

Original playback still requires installed Microsoft PowerPoint under Windows. UI regionalization does not alter visitor slides, event/room data, Bible/song text, source documents or spoken announcement content. The old partial-release disclosure is historical; v95 uses the complete 31-variant manifest.

## Publication evidence

- Release workflow: https://github.com/cmoere/GottesdienstRegie/actions/runs/41023086612
- Initial Pages workflow: https://github.com/cmoere/GottesdienstRegie/actions/runs/41023086587
- Source/verification ledger: `docs/v95-verification.md`
- Local reports: `work/v95-public-verification.log`, `work/v95-package-inspection.json`, `work/v95-public-pages-verification.json`, `work/v95-release-status.json`

Only translation authoring was delegated; integration, review, tests and publication were performed natively by root. The unrelated startup diagnostic remains untracked and unchanged.
