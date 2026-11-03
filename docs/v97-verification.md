# v97 implementation ledger

Base normal release: v0.96.0, source 6f8db818ef8f9e0cf87b986aa49ce1a1f1608352; documentation HEAD ab7cbcef2be464fbe4f2e428353637e9c54d8141. User approved local on-demand model download, offline drafting and initial OFF AIR restriction. Existing native worktree reused. Only translation delegation is authorized; root codes/reviews.

## Baseline and first tasks

- Baseline four focused files / ten tests passed: work/v97-baseline-focused.log.
- Reproduced startup coupling through optional unresolved promises. Added missing helper regression (two red tests), then decoupled optional display/version/network queries from required authentication. Removed the artificial ten-second minimum splash hold; document and recovery readiness remain required. Three tests pass, native startup verification pending.
- Timing boundary red/green: shared strict receipt parser and owned-output revision/duplicate/future-date checks. Receipt is emitted only after the scheduled slide commits plus two animation frames. Thirty bounded samples per role; operator poll once per second. Existing take schedule unchanged. Software render/ack measurements do not establish physical display latency. Native check and local-preview comparison still pending.
- Audio probe red/green: isolated oscillator routed through existing applyAudioRoute; context resume, signal measurement, explicit abort and cleanup. Added eight-second maximum/manual stop UI and live signal meter. Cancellation and double-stop tests pass. Native signal/UI checks pending.
- Draft contracts red/green: bounded topic/notes/count and exact complete plain-text title/body schema. No executable model output or automatic fallback templates. Draft dialog and pack service not yet implemented.
- First component run: six files / twenty tests pass, work/v97-first-components-green.log. Typecheck passed before the draft contract was added, work/v97-typecheck-progress2.log; repeat after integration.

## Local model feasibility

Candidate onnx-community/Qwen3-0.6B-ONNX, revision 58ca03a5e7b354b480b1a82b34bde8dc7b854cc0; existing Transformers.js 3.8.1 and onnxruntime-node 1.21.0. Downloaded five owned probe files into work/v97-model with size and model/tokenizer LFS SHA256 verification; computed SHA256 for all files in work/v97-model-files.json. Main q8 model size 617687575 bytes. This is a feasibility probe, not a shipped model service.

Probe work/v97-generation-probe.mjs uses remote models disabled, two CPU threads and 520 maximum new tokens for three short German gratitude slides. Log work/v97-generation-probe.log: model loaded in 12003 ms, RSS 912531456 bytes; generation still running at 23:24 local. Native process session81837 / PID25676. Do not start duplicate full model probes or claim usable output until it finishes. License and German output assessment, offline rerun, cancellation and packaging still pending.

## Remaining

Ruling: accept either a complete JSON slides object or a complete JSON array, optionally fenced as json. Both pass the same exact-count/plain-string/length/unknown-field checks. The tested model emits a valid array; rejecting that envelope would not improve content safety. No partial extraction or trailing explanation is accepted. Real Q4f16 native worker produced three complete German draft slides in 136550 ms, work/v97-utility-model-q4-result.json. Wording is imperfect and requires the visible edit/review step; this is not a claim of editorial or theological correctness. Earlier q8 probes failed quality/format; q4f16 has materially better output and is the adopted candidate, not q8.

The current model candidate is Qwen2.5-1.5B-Instruct ONNX, revision d54957e3af1be04546436e874a60fe386041b244, q4f16 model size1221878940 bytes, SHA25619dec9f63488016185ba997d5e4492b5ac5b4f7ef1abb45243a91de958838dcd. Existing runtime3.8.1/ORT1.21 supports this CPU path in the native probe. Source license Apache2.0 verified at https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct. All25 new UI strings authored for all31 regions and integrated preserving previous keys; root audits and documentation translations pending. Typecheck exposed DOM ReadableStream lacking async iteration in the cross-imported pack service; downloader now uses getReader for both native/browser type contexts.

Follow docs/superpowers/plans/2026-11-02-v97.md. Candidate version0.97.0 and consistent release metadata are prepared; normal publication remains pending. Foreign untracked tests/smoke/startup-diagnostic.cjs must not be edited/staged; baseline SHA256 B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5.

## Final candidate — 3 November 2026

- Full fresh suite: **300 files / 1237 tests passed**, exit0, work/v97-unit-release.log. The first broad run exposed two new tests assuming German while the real preference selected English; those tests now explicitly select their required locale and dispose mounted dialogs. Additional regression covers a late model result after ON AIR. The completed suite includes strict malformed timing-summary tests.
- Full release build: **exit0**, work/v97-build-release.log, all31 assets copied. The existing Vite large-chunk advisory remains. A final-test mock required an explicit Promise<SlideDraft[]> annotation; the final typecheck/build includes that correction.
- Strict complete31 gate passes, work/v97-regional-ready.log. Every pack has **28 new UI values** and unchanged native entries. Each has **63 help articles**, three authored appendices and **1660 release fields**. Root independently compared every prior UI/native/help/release value against HEAD; only the intended three help bodies were appended. Historical release strings are unchanged. Proof: work/v97-root-resource-audit.json. Inventory9226 entries, zero unreviewed, marked complete after root review.
- Native shell: **48 cases passed**, work/v97-native-shell.log. Actual App: **six cases and all31 regional settings surfaces passed**, work/v97-native-surfaces.log.
- Actual native draft workflow: work/v97-native-release.log and work/v97-native-GrXZVX/report.json. Three real model-output slide previews, explicit insertion, one-step Undo, independent optional startup queries, actual isolated audio signal and stop, correct receipt ownership and actual worker cancellation passed. Software preview/MAIN differences were30,1,0ms in this visible-window fixture, not a universal hardware latency guarantee. Audio was intentionally muted at the test window; no physical speaker claim is made. Light/dark contrast assertions pass and both screenshots were inspected after paint.
- Hidden test windows initially produced approximately two-second RAF differences. The final native fixture uses visible windows and the same scheduled presentation deadline for preview and MAIN. The product's actual delivery schedule was not lengthened or guessed from that artifact. A same-content-redelivery regression prevents an old preview measurement being reused for a new delivery.
- Actual App PowerPoint regression initially caught a null diagnostic reply from its incomplete bridge causing OutputTimingPanel to crash. The panel now validates absent/malformed summaries and safely omits unavailable diagnostics. Red/green: work/v97-diagnostics-protocol-red.log and -green.log. Full **60-second original playback soak passed after the fix**, work/v97-native-powerpoint-fixed.log, work/full-app-powerpoint-6CW6Gk/report.json: native builds/source timing, selection-versus-live, pause/resume, quick pause intent, black test watermark, protected postprogram handoff, unchanged source and OFF AIR drain alltrue.
- Required release gates84/85/86 pass; gate86 **35 files /144 tests**, work/v97-gate86.log. These checks preserve all-platform eleven-asset publication requirements.
- Local model inference was repeated with global fetch disabled before loading the production worker. A fresh single-slide draft completed with zero attempted fetches. The production worker also booted from an ASAR entry; work/v97-offline-proof.json, work/v97-offline-asar-proof.log, exit0. This ASAR-entry probe used workspace dependencies, so it is not a substitute for inspecting the actual installer. Earlier private probe exit handling was corrected to ignore child exit after a recorded successful result.
- Runtime/model license: Apache2.0 text from pinned upstream Qwen source989aa7980e4cf806f80c7fef2b1adb7bc71aa306 is included in the descriptor and written into the verified model pack. Model files remain an optional in-app download; inference does not load at startup or run ON AIR. Starting output or setting ON AIR cancels pending inference/download. Closed/crashed operator contents cancel owned generation. Internal model output is bounded plain text, never executable actions.

Ruling: prepare the consistent candidate version before final build/gates, rather than publishing inconsistent metadata. This does not authorize bypassing any verification or mark the release public. Coding, source review and verification stayed with root; only translations were delegated. Existing user worktree is retained. Public release, manifests, actual installer checksum/resources and packaged-worker verification are the remaining publication steps.


## Public release complete

Verified 2026-11-03T08:15:42.491Z.

- Version: **0.97.0**, normal/latest, neither draft nor prerelease.
- Release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.97.0
- Source tag SHA: 35987b59d5bea197fba701f19ed64485548eca95
- Successful all-platform workflow: https://github.com/cmoere/GottesdienstRegie/actions/runs/41597130914
- All eleven Windows, macOS Intel/Apple Silicon and Linux assets are present. All three update manifests name 0.97.0 and their listed assets have matching sizes.
- Windows installer: 762687360 bytes; SHA256 **31dc5eff153ab871fdca0e0bc1b86a3354d7c0ffd97a893c744b9b6ac42b5f12**. SHA512 matches latest.yml and SHA256 matches GitHub's asset digest.
- Public version history, RSS and release-note body match the candidate. All nine public help PNG hashes match the verified sources.
- Actual public installer was downloaded and extracted read-only; the installer was **not executed or installed**. Its normal GitHub update provider, 23 native modules/resources, renderer entry, 31 regional packs, 62 regional renderer chunks and nine help images match the candidate. ONNX Runtime 1.21.0, Transformers.js 3.8.1 and unpacked native bindings are present.
- Actual extracted production worker booted from app.asar; a fresh German slide draft completed in 67914 ms using exclusively packaged runtime dependencies and the previously verified optional local model. Fetch was disabled before runtime loading; zero fetch calls occurred. This is a real inference/package proof, not a physical output-device test.
- The approximately 1.23 GB pinned model remains an explicit optional in-app download and is absent from the installer. Creation is initially OFF AIR only and requires human content review.
- Full candidate validation: 300 unit-test files / 1237 tests; full build; native startup/audio/drafting/output flow; 48 shell cases, six actual-App cases and all 31 regional surfaces; 60-second installed-PowerPoint original-playback regression. Software timing does not establish physical HDMI latency; the isolated native audio test does not assert speaker audibility.
- Root implemented and verified software. Only translation work was delegated. The unrelated untracked startup diagnostic remains unchanged and excluded.
