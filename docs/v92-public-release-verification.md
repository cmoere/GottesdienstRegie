# v92 public release verification — 2026-10-25

Version0.92.0 is public as the normal/latest update, not a draft or prerelease.
Source tag/target:64ba5d6e498fa2ef6b80ff61e9fc5c73cd4c9a8d.
Release:https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.92.0
All-platform workflow:https://github.com/cmoere/GottesdienstRegie/actions/runs/40222008029
Release-notes website:https://github.com/cmoere/GottesdienstRegie/actions/runs/40222008039

Windows, Linux, macOS Intel/Apple Silicon and final publication all succeeded. The package hook synthesizes with every one of the five pinned voices on each target before including the private runtime. No application-wide Electron upgrade was made; Electron45 remains isolated diagnostic work.

Public verification found all eleven assets and all three updater manifests pointing to0.92.0 with matching asset sizes. Normal/latest status, exact source tag and public RSS were checked. The downloaded Windows installer is739409101bytes, SHA25698fa4dcce5e9f9d430a7137355e333881e2d663c30058d1a0682432558928a87. Its SHA512 matches latest.yml. The installer was extracted without installation; its normal GitHub updater configuration and unchanged gong were checked.

Pinned model/config/source hashes, packaged worker and compiled reading/date/voice/PPTX modules match the tested sources. Actual synthesis through the extracted packaged service and private runtime passed for Thorsten, Kerstin, Karlsson, Ramona and Eva K. Sample durations are9.1347/10.672/10.944/9.248/11.152seconds, with peaks approximately−1dBFS. Slow speech and longer pauses lengthened the first sample to12.1516seconds. Packaged date preparation expands25.10.2026 correctly. The packaged PPTX inspector preserved IDs256/257/258 and slide2's exact2second timing in the own Office fixture. No physical playback or installer execution is claimed. The two unused pip ARM launcher files were excluded from old7z extraction, as in the previous release; the actual Windows x64 worker and all five voices executed successfully.

Local full regression:253files/1041tests PASS; GPU/native Node115tests PASS; production build PASS. Release metadata10tests, v85guard39tests and v86guard140tests PASS. The disclosed partial-regional publication gate and fifteen documentation packs (63articles/1586release fields) PASS. Existing source help/release values were preserved when adding18release fields per region. Regional UI remains explicitly incomplete.

Native desktop/announcement/scroll/banner/reminder/RSS and17language/regional cases passed. Additional native announcement-settings proof selected Ramona, entered and saved175percent speech loudness, kept automatic announcements disabled and checked that controls fit the window. No audio was played by that UI fixture. Reproducible command:node scripts/test-announcement-reading-native.cjs. Its first temporary runner lacked the work-directory watcher exclusion and timed out while loading the fixture; the corrected runner and promoted fixture passed. Existing build chunk-size warnings remain.

Delivered scope: louder configurable offline announcements, five bundled voices, tempo/pause/delivery controls, spoken date/time preparation, accurate YouTube embed guidance and a safer editable PPTX content import retaining source order/notes/hidden flags/timing. Original PowerPoint live integration is not completed and remains disabled, explicitly stated in import reports and release notes. The isolated covered-source GPU test does not authorize production original playback or audio capture. Those open tasks remain in the v92 plan.

Root implemented and reviewed technical changes. Only regional help/release translation was delegated under the user's translation-only permission; no independent technical review was used. The foreign startup-diagnostic.cjs remains untouched and untracked (SHA256B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5).

Detailed ignored artifacts:work/v92-public-verification.log,work/release-verify-VGWlLp/report.json,work/v92-package-inspection.log,work/release-verify-VGWlLp/package-report.json,work/v92-full-unit-final.log,work/v92-powerpoint-all-node-final2.log,work/v92-release-build.log,work/v92-native-regression-final.log,work/v92-settings-promoted.log.
