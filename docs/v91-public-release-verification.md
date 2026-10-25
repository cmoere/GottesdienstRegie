# v91 public release verification — 2026-10-25

Version: 0.91.0, normal/latest release.
Source tag: 07c7bab7cccced765658e941f00df559ed4d25b5.
Release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.91.0
All-platform workflow: https://github.com/cmoere/GottesdienstRegie/actions/runs/40172120571
Release-notes website: https://github.com/cmoere/GottesdienstRegie/actions/runs/40172120573

Windows, macOS (Intel and Apple Silicon), Linux and final publication jobs succeeded. Packaging executes both bundled Piper voices and genuine .one/.onepkg imports per target, rather than checking only file presence.

Public download verification passed: all eleven assets present, all three updater manifests target 0.91.0 and reference existing matching-size assets, normal/latest status confirmed, RSS includes 0.91.0. Downloaded Windows installer size: 604939448 bytes. SHA-256: 711640e0b7d3bfe4eeb5bd8ade15fe24d616127ff02c94a2cf9b3b77629df022. SHA-512 matches latest.yml.

The downloaded installer was extracted without installation. Checked package version, unchanged gong, normal release updater configuration, pinned model/config/source archive hashes and worker source. Actual synthesis from the extracted private runtime passed for male Thorsten (22050 Hz, 325284 bytes) and female Kerstin (16000 Hz, 305196 bytes). Actual imports from the extracted native worker passed for genuine .one and CAB .onepkg fixtures. The old local decompressor cannot read two unused Python pip ARM launcher files; those two files were excluded from extraction, while the actual Windows x64 voice/import paths were executed successfully. No physical playback or installer execution occurred.

Local full regression passed: 246 files / 1024 tests. Final advertising interval/media-end regression plus inventory passed: 17 tests. Historical release guards and production build passed. Native hidden-output tests passed live annotations, actual authorized monitor frames, permission/stale-take/revocation behavior, retained test watermark, OFF AIR gong/speech cancellation and 1920x1080 weather layout. Physical outputs remained hidden and audio muted.

Delivered import mode preserves readable content and supported images, with explicit reports for reflow, complex layouts, animations and ink. Original PowerPoint playback remains disabled. Regional UI translation is still disclosed as incomplete; the fifteen approved regional documentation variants include the new help and release additions. Commercial campaign inventory/accounts are not supplied; approved files, direct media URLs and provider VAST links are supported.

Detailed local reports (ignored work directory): v91-unit-green.log, v91-final-targeted.log, v91-final-build.log, v91-public-verification.log, v91-package-inspection.log, v91-live-monitor-syscgm/report.json, v91-weather-speech-IBS5Ls/report.json.
