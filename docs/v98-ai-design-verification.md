# v98 local AI design extension — verification ledger

Plan: `docs/superpowers/plans/2026-11-03-v98-ai-design-extension.md`. Existing approved worktree retained. Latest user explicitly authorized completion and normal publication. Coding remains inline; only the new regional translations were delegated under the user's existing authorization.

## Implemented

- View controls moved to Settings → Presentation while retaining the existing persistent preview-options key and thumbnail size. Edit/Preview is a keyboard-accessible two-button selected group; changing it does not alter live item/slide ownership.
- Application-owned sequential automatic model downloads begin after actual workspace readiness, never the timeout fallback. Persistent removal/cancel disables a model until explicit download. Download lifetime is independent of Settings. Inference/downloads yield to active outputs; model hashing is abortable too. Repeated readiness does not undo a live pause.
- Structured drafts accept eight bounded compositions, three community colors and an optional image brief. Title/body remain ordinary editable text elements; shapes and generated images remain editable elements. Previewing does not insert content; acceptance is one Undo and never a live take.
- Larger Qwen3-4B Instruct 2507 ONNX Q4 model: revision `2bdfea4417ee390519508a6bc7dfbc36f3572981`, pinned file hashes and upstream Apache2.0 license. Approximately 3.97 GB downloaded model files. Removal also removes the known obsolete v97 revision. The worker permits local files only and drains private runtime diagnostics without logging prompts or generated text.
- SDXL-Lightning 4-step Q8 full image model: revision `b72e5532aa2e3cefbe64995b439817360e61584a`, 4,098,988,672 bytes, SHA256 `3a8b2ea93d0b0c5e72c82ed518aea715203173e2afbf8b7e47335d7f8799ef78`, pinned OpenRAIL++ license. Images are real native PNG generation, not placeholders, remote search or template substitution.
- Pinned stable-diffusion.cpp runtime `3be23788fc0c9f35a2c24b1211caae11d4a54dbc`: verified Windows Vulkan/CPU binaries; evaluated the Linux prebuilt but rejected its GLIBC2.38 requirement; final Linux CPU is built statically from pinned source. macOS x64/arm64 builds use pinned source/GGML, portable CPU flags and no external OpenMP dependency. Target package checks and final public package verification remain pending until CI completes. Runtime and third-party notices/header-embedded licenses are included; no separate end-user installation.
- Native image calls use fixed bounded arguments without a shell, isolated child processes, cancellation/timeout, owned temporary directories and bounded 1024×576 PNG validation. Draft PNGs stay private until explicit acceptance into the local media library. No automatic cloud upload or MAIN take.
- All 31 regional UI additions and revised current AI help/release additions are present; previous historical release fields retained. v98 version/RSS metadata is prepared locally. New source copy and private protocol/prompt/document defaults have exact source reviews.

## Actual native feasibility

- Initial larger Q4-f16 text experiment exposed the pinned ONNX Runtime/native Float16Array compatibility issue; the isolated worker compatibility shim is tested. That variant then exceeded a ten-minute limit on this hardware and was **not adopted**.
- Adopted CPU Q4 variant produced a valid German slide with the required layout/color/image brief in **205,394 ms**, peak worker working set **4,876,356 KiB**. Evidence: `work/v98-q4-text-proof.json`; no claim of fast generation or guaranteed theological accuracy.
- Initial plain SDXL 8-step 512px feasibility output was visually unfinished and **not accepted as the quality result**.
- Adopted SDXL-Lightning 4-step Q8 generated a visually inspected 1024×576 church/meadow photograph in **130,256 ms** on the GTX1050 2GB, with CPU text encoding and tiled Vulkan diffusion/VAE. Evidence: `work/v98-lightning-proof.json`, `work/v98-lightning-proof-3Qd3Xz/image.png`.
- Actual-App DOM/native capture checks: six size/theme cases and all31 regional settings surfaces passed (`work/v98-native-visual-launch.log`, `work/v98-native-dom-4JGbH1/`). Earlier generic test handlers returning null for a speech-engine status were corrected in the private harness; production speech behavior was unchanged. Screenshot capture works using a hidden non-offscreen BrowserWindow; earlier offscreen UnknownVizError was not treated as pixel acceptance. Focused final settings/gallery screenshots still need inspection.
- Production-service/UI end-to-end text → real image → acceptance → Undo/Redo → live interruption **passed**, `work/v98-ai-e2e-proof.json`: 334452 ms, zero worker fetch calls, explicit acceptance, one Undo/Redo, no live mutation, actual native image process cancelled in 12 ms and owned temporaries cleaned. Real draft and all eight composition gallery PNGs were visually inspected. A first harness attempt omitted the required preload bundling after a standalone TypeScript compile and was corrected using the production bundler; no production preload change was needed.

## Checks and remaining gate

- Current focused draft, model, legacy-revision removal and overview checks: 10 files / 28 tests passed (`work/v98-final-focused.log`). Model integrity/cancellation/readiness regressions were observed failing before their fixes.
- Full extension suite first run: 315 files / 1277 tests passed, one obsolete v96 test still expected the removed upper-right settings popup. Updated that test to retain its real next-slide rendering/live-identity assertions and require absence of the duplicate popup; central settings behavior has separate coverage. A final full-suite rerun remains required.
- Complete31 audit passed: 31 interface and documentation packs, 63 articles and 1670 release fields per region, zero pending source reviews or issues (`work/v98-extension-regional.log`). Re-run after final code changes.
- Production build passed (`work/v98-extension-build.log`), with existing chunk-size advisory. Rebuild after final changes; always bundle the sandboxed preload after compiling native TypeScript.
- Pending: final flow/cancellation and pixel checks; final source review; complete suite/build/gates; package CI for all targets; public latest release/manifests/RSS/assets and downloaded-package inference/runtime verification. **v98 is not published yet.**

## Decisions

Ruling: use the measured CPU Q4 language model rather than the slower Q4-f16 candidate — preserves the requested larger model and produces actual structured output on this 8GB machine; costs roughly 1 GB extra download and several minutes per draft.

Ruling: place model management alongside the related presentation/view controls in Settings → Presentation — consistent with the existing settings navigation and the visible explanatory path; no separate new settings category.

Do not modify or stage the unrelated `tests/smoke/startup-diagnostic.cjs`; expected SHA256 `B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5`.


## Final inline review and fix pass

The user limited delegation to translations, so the final branch review was performed inline rather than delegated. Source reviewed from a0072d4 through the reliability commit and the complete current extension. No outstanding Critical/Important findings remain before the final suite/package gates.

- Fixed live-mode change during asynchronous PNG validation: late image discarded.
- Fixed dialog closure while image acceptance is pending: no late document insertion.
- Fixed title/body binding after AI draft insertion, in the ordinary text editor and direct canvas editing; retained legacy v97 draft editing and the ordinary single-text path. Independent duplicated/pasted layers do not inherit title/body bindings. The first test fixture incorrectly selected pre-insertion IDs; corrected to the actual cloned inserted IDs, observed genuine failures with the legacy store temporarily restored, then verified the fixed source.
- Fixed intentional model-download cancellation appearing as an error.
- Fixed Windows verified-directory commits interrupted by transient scanner EPERM locks using bounded abort-aware retry; old interrupted UUID downloads are cleaned on retry/removal without deleting unrelated directories.
- Native PE imports demonstrated app-local Microsoft CRT **and OpenMP** dependencies. All five unmodified release DLLs now accompany the image runtime, CPU fallback and main Windows executable. Source version and hashes are recorded in verification.json. No runtime installer is launched.
- Linux prebuilt GLIBC2.38 was rejected in favor of a static CPU build. macOS OpenMP is disabled to avoid an external Homebrew runtime; architecture-specific source directories prevent cross-target build races. All target packaging remains a CI gate rather than an unverified success claim.

Every behavioral review fix has a failing/passing regression under work/v98-*-red*.log and matching green logs. No deferred minors were recorded. Final full tests/build/native package/public evidence will be appended only after completion.

## Frozen-source verification — 4 November 2026

- Full unit suite: **319 files / 1291 tests passed**, 194.17 s (`work/v98-frozen-unit.log`).
- Production build including native TypeScript, bundled sandbox preload and all 31 regional assets passed. Rebuilt after setting the publication date to 4 November (`work/v98-release-build.log`). Only the existing chunk-size advisory remains.
- Strict complete31 audit: 31 interface packs, 31 documentation packs, 63 articles and 1670 release fields per region; zero drafts, unreviewed source entries or issues (`work/v98-release-regional.json`).
- Real native text-and-image workflow: 334452 ms, valid editable German draft, eight composition previews visually inspected, real PNG acceptance, one Undo/Redo, unchanged Live and zero worker fetches (`work/v98-ai-e2e-proof.json`). Native image process cancellation completed in 12 ms. These are software tests, not physical display/audio certification.
- Final inline review completed. The unrelated startup diagnostic remains excluded. Cross-platform CI and actual downloaded-package/public-latest proof are the remaining release gates; this record does not claim publication before those gates pass.

First cross-platform CI found an unused documentation symlink in the pinned GGML source ZIP (`.pi/SYSTEM.md`). The speech/runtime ZIP extractor correctly rejected symlinks. Image source extraction now omits symlinks entirely, while retaining traversal validation; no symlink is created or followed and the general runtime extractor remains strict. The source-extraction regression failed before the change, then both extraction/runtime-packaging tests passed. The full suite is repeated by the new source-bound release CI.
