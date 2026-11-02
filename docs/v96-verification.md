# v96 verification ledger

The user authorized implementation and normal publication, with fluid screen sharing from the connected device to MAIN over local HTTPS. Only translation authoring was delegated. Implementation, integration, review, tests and publication are performed by the root agent in the existing native worktree.

## Implemented candidate

- Explicit stable voice gender metadata and `(W)` / `(M)` captions; existing model IDs and device-wide settings remain unchanged.
- German-only regional selection with the active region in the language label; actual same-renderer song translation examples.
- Overview titles below slide pictures, persisted compact view settings, actual next-slide rendering locally and through a private read-only preview renderer for connected monitors. Public HTTP clients receive JPEGs, not raw slides or private notes.
- One news story per actual live visit by default, with independent configurable timed rotation. Rendering and data refresh do not advance the cursor.
- Bottom-right QR layout across all announcement designs, explicit-banner precedence and `Title: Description` fallback. Speech-only conservative typo substitutions leave stored records unchanged.
- Weather effects with reduced-motion support and phase controlled by the common presentation clock.
- Validated pen/line/arrow/rectangle/ellipse tools; explicit annotation and sharing permissions remain separate from read-only monitor access.
- Ephemeral owner-bound HTTPS signaling, operator preview, explicit MAIN take, video-only WebRTC relay, stop/revocation/expiry/OFF AIR cleanup, receiver-ready handshake, quick-screen priority and global test watermark. No system trust-store writes or public relay account.

## Resource review

All 31 runtime regions contain 2295 UI and 124 native entries, 63 complete help articles and 1646 release fields. Root compared every pre-existing interface/native value and historical release field against HEAD; they are unchanged. Only the two intentionally revised help articles were replaced. Evidence: `work/v96-root-regional-audit.json`.

The strict full31 checker passed with zero review-required candidates. The final inventory has 9094 entries. New SVG geometry, internal protocol/error values, authored demonstration lyrics and explicitly selected English remote-page copy have individual documented reviews; operator source is not excluded by a broad wildcard.

## Verification milestones

- Focused QR/voice/banner tests: 6 files / 46 tests passed (`work/v96-display-green.log`).
- Language and translation preview: 3 files / 5 tests passed (`work/v96-language-preview-green.log`).
- Overview controls and actual next renderer: focused tests passed; real Electron overview geometry confirms captions below image bounds (`work/v96-overview-after.log`).
- Authenticated HTTPS lifecycle: plaintext/view-only requests rejected; ownership, revocation and OFF AIR checked (`work/v96-sharing-server-tests.log`).
- Actual three-window WebRTC path delivered the owned moving source to MAIN, retained the test watermark and quick overlay, stopped source tracks and restored ordinary content. The next JPEG was rendered in its real slide design and displayed by the remote client (`work/v96-native-sharing-complete.log`).
- Operator live mirrors, quick priority and output composition: 3 files / 8 tests passed (`work/v96-share-mirror-tests.log`).
- First broad checkpoint: 288 files, 1199 passing tests and two failures for the stale source inventory / old RemoteServer call assertion; both were corrected and their focused tests passed.
- Documentation-integrated broad run: 289 files, 1200 passing tests and two fixed release-field counts expecting 1628 instead of the new 1646. These count assertions were updated without weakening the complete catalog gate. Final candidate rerun is still required.
- Candidate full build passed before the last receiver-ready/CSS refinements. Final candidate build and final regression evidence are recorded below once complete.

## Practical limits

Sharing requires a supported desktop browser, a manually confirmed local HTTPS connection and reachable LAN peers. It carries video, not system audio. The local certificate and private key stay in the application's own user-data directory; the application does not install root certificates. `selfsigned` is pinned to 5.5.0 (MIT; https://github.com/jfromaniello/selfsigned).

Original PowerPoint playback continues to require installed Microsoft PowerPoint on Windows. No new claim of automatic fidelity for editable imports is made. Counts and structural translation validators establish complete resource coverage, not independent linguistic certification.

## Publication

Pending final candidate tests and native regression. No v96 release has been published at this milestone. The unrelated untracked `tests/smoke/startup-diagnostic.cjs` remains untouched and must not be staged; SHA256 is `B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5`.

## Final candidate — 2 November 2026

- Complete fresh unit suite: **289 files / 1202 tests passed**, exit 0, `work/v96-unit-release-candidate.log`. The fixed-count assertions now cover all 1646 historical/current release fields, including the 18 new v96 fields.
- Full candidate build: exit 0, `work/v96-build-release-candidate.log`; all31 regional assets copied. The existing Vite large-chunk advisory remains.
- Native shell regression: **48 combinations passed**, `work/v96-native-shell.log`. Actual App: **six core cases and 31 regional settings surfaces passed**, `work/v96-native-surfaces.log`.
- Final native three-window share/next-frame/weather-phase fixture passed: `work/v96-native-release-candidate.log` (`work/v96-sharing-6EKDGX/`). Incoming preview was not shown on MAIN before the operator take; the actual button took it to MAIN after ON AIR. The receiver-ready handshake was active. A rendered upcoming-slide JPEG was displayed by the authorized remote page; another sender could not read/ack the private preview packet. Weather transforms stayed identical with a fixed common elapsed time, changed when that clock advanced, and stopped under reduced motion.
- PowerPoint original playback: **60-second soak passed**, `work/v96-native-powerpoint.log`, `work/full-app-powerpoint-C4wLvG/report.json`. Native builds/source timing, selection-versus-live, pause/resume, quick-screen pause intent, test watermark over black, protected postprogram handoff, source preservation and OFF AIR drain all passed.
- Additional native paint check confirmed an empty/stopped shared-video element does not obscure the underlying slide (`work/v96-empty-video.log`); original green pixels returned exactly after the active red video stopped.
- Root independently reviewed the code changes and trust/permission boundaries. Coding and review were not delegated. The only delegated changes were authored translations.

Normal publication remains pending until the all-platform CI build and public updater/package verification complete. The user-selected existing worktree is retained.

## Hosted runner recovery

The first cross-platform run `41511955029` passed the full unit verification, Windows build and Linux build. GitHub never assigned the macOS ARM64 job a runner and cancelled it with a hosted-runner acquisition failure plus ARM64 capacity notices (`work/v96-macos-cancelled.json`). No application test failed. The existing Windows artifact was downloaded by its exact run/commit identity and inspected without execution: 15 tested native modules, all31 native/interface packs, all62 regional renderer/documentation chunks, selfsigned5.5.0, all nine help PNGs and normal update-provider configuration matched (`work/v96-ci-package-inspection.json`).

The macOS job now uses the officially supported standard `macos-15-intel` runner (https://docs.github.com/en/actions/reference/runners/github-hosted-runners). The command still builds both x64 and arm64. All-platform success and the eleven-asset normal-release guard are unchanged. Only the workflow host selection and this ledger changed; the application code remains the tested v96 candidate. A new full workflow dispatch is required because the push trigger intentionally watches package.json.

## Intel cross-package verification correction

The Intel-hosted macOS build produced x64 packages but failed when the after-pack check tried to execute the Apple-Silicon Python runtime on Intel (`spawn` error -86). Completion status was initially misread as success in a progress update and immediately corrected after reading the conclusion. The failure is recorded in `work/v96-macos-intel-failure.log`.

Cross-target checks now explicitly separate execution from target integrity: the ARM64 Python executable and all native speech libraries are inspected for their Mach-O CPU architecture; the canonical manifest, worker, notice and every voice file size/SHA256 are verified. All five synthesis tests still run using the matching host runtime and identical pinned models. Rust document-import targets are built for the requested architecture; real .one/.onepkg fixture tests run with the same source built for the host, while the target binary architecture and SHA256 are recorded. Reports explicitly identify whether the target runtime itself was executed. The speech engine/model manifest is unchanged from v95. No application feature or publication-asset guard was disabled.

Red/green tests cover unsupported execution directions, thin/universal Mach-O parsing, wrong CPU rejection, malformed headers and tampered model data: `work/v96-cross-validation-red.log`, `work/v96-cross-validation-final.log` (4 files / 9 tests passed). Syntax checks passed for the affected build scripts. The strict31-region gate remains green. These are packaging checks; the application implementation remains the same tested v96 code.
