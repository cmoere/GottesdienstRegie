# v83 speech readiness evidence — 15 October 2026

Status: **Task 1 partial: verified text normalization implemented and tested; speech-package gate still open. No v83 release.**

## Repository and distribution terms

Existing isolated branch `codex/web-editor-native`, implementation baseline `c066e6f` (approved plan), product baseline 0.82.0. No submodule. No tracked user changes; unrelated untracked smoke diagnostic preserved.

`README.md` reserves the application's rights. `build/terms.txt` version 2.1 includes third-party terms, but this is not a completed Piper distribution assessment. Neither the application nor its license has been changed.

The engine candidate is GPL-3.0-or-later. Do not infer a prohibition merely from the app's own terms, or infer approval merely from using a subprocess. GNU's own FAQ distinguishes separate programs/aggregation from a combined work, considering communication semantics as well as mechanism. Source/notice obligations still need a concrete distribution plan. This evidence does not constitute legal clearance.

Primary references:

- https://github.com/OHF-Voice/piper1-gpl/blob/main/setup.py
- https://www.gnu.org/licenses/gpl-faq.en.html#MereAggregation
- https://www.gnu.org/licenses/gpl-faq.en.html#GPLInProprietarySystem

## Verified engine candidate metadata

PyPI JSON checked at `https://pypi.org/pypi/piper-tts/json`:

- `piper-tts==1.8.0`, Python requirement >=3.9, GPL-3.0-or-later.
- Windows wheel: `piper_tts-1.8.0-cp39-abi3-win_amd64.whl`.
- Bytes: 34,119,688.
- SHA256: `5da9bfdb05dfe15da3536859d422e605483ffa6d2b3ec2c5b9593bae6b5aa6a4`.
- Immutable artifact: https://files.pythonhosted.org/packages/12/9c/c736d1961cf9ce0655278731b9430df41892ca2ded7b09dabcb340612158/piper_tts-1.8.0-cp39-abi3-win_amd64.whl

These are upstream metadata, not a claim that the wheel was downloaded or executed. A supported embedded Python runtime and all transitive dependencies are still required. No Python environment, product dependency or model has been installed.

## Verified German voice candidate

Model repository revision: `c10ece1aade47bb51c153c893d14e5bf8e5b7117`.
Base URL: `https://huggingface.co/rhasspy/piper-voices/resolve/c10ece1aade47bb51c153c893d14e5bf8e5b7117/de/de_DE/thorsten/high/`.

| File | Bytes | SHA256 | Evidence |
| --- | ---: | --- | --- |
| de_DE-thorsten-high.onnx | 113895201 | 9df1c43c61149ef9b39e618e2b861fbe41e1fcea9390b2dac62e8761573ea4f1 | upstream LFS metadata; model not downloaded |
| de_DE-thorsten-high.onnx.json | 4875 | 6de734444e4c3f9e33b7ebe2746dbc19b71e85f613e79c65acf623200b99a76a | retrieved UTF-8 payload hashed locally |
| MODEL_CARD | 279 | a49334fc36286c9d67f007605969a33f416cc4e35eb770c9c7f716d44711fc3a | retrieved UTF-8 payload hashed locally |

Card specifies German, one speaker, 22,050 Hz, and CC0 for the dataset; it states fine-tuning from the English lessac high voice. Individual model and upstream obligations must still be assessed; dataset licensing alone is not a blanket package approval. No audio sample has been generated or auditioned.

## Firebase text selection evidence and stopping point

Read-only searches of the actual regie project found no pre-existing speech selector or writer defining `durchsageTextModeSaalscreen` values. Existing `RawAnnouncement` allows extra fields; new speech handling need not change the Firebase schema.

The user-referenced public screen page was fetched read-only. Its linked public sources were inspected without executing them:

- https://pgbielefeld.neocities.org/screen
- https://pgbielefeld.neocities.org/screen.js
- https://pgbielefeld.neocities.org/screenad.js?v=20261005-1
- https://pgbielefeld.neocities.org/screenmusic.js?v=20261005-1

`screen.js` contains `getDurchsageTargets`, `hasDurchsageFlag`, and `getDurchsageTextForCurrentScreen`. Its selector first returns nonempty `textDurchsageManual` (or a legacy alias), then chooses `textDurchsageSaalscreen` for a Saal screen, followed by broader fallback fields. It **does not read `durchsageTextModeSaalscreen`**. Therefore it verifies the presence of the two text fields, but **not the permitted mode values or their intended selection semantics**. It is not evidence for guessing `manual`, `auto`, or other enum strings.

It also uses broader legacy flags and description/title fallbacks than the approved v83 spec. Those fallbacks will not be copied without user intent; v83 is limited to the explicit speech texts.

Required next input: an anonymized existing message showing `durchsageTextModeSaalscreen`, `textDurchsageSaalscreen`, and `textDurchsageManual`, or the existing editor/writer source defining the modes. No password, Firebase token, service-account file or database-wide export is needed. If multiple modes are used, examples or definitions for those modes are needed. The approved plan requires stopping this selector task rather than implementing guessed values.

## Work not yet performed

- Complete runtime dependency lock, source/license package and redistribution determination.
- Product code, failing selector tests, native speech synthesis and physical audio checks.
- Scheduler, ducking, gong copy, settings UI, installer and publication.

This document records partial research only. It must not be represented as a completed v83 feature.

## Follow-up: supplied authoritative writer resolves mode blocker

The user supplied the editor source and `https://pgbielefeld.neocities.org/admin-meldungen.js`. Inspected as source text, never executed; retrieved UTF-8 payload SHA256 `9cc3863589cfdddddaf41f78b090ca0d45cbefe838f5ff674c0254fcac717c12`.

`getDurchsageSelectedTextMode` and `normalizeDurchsageTextMode` admit exactly:

| Mode | Meaning on the writing side | Persisted speech source |
| --- | --- | --- |
| title_description | title and plain description | textDurchsageSaalscreen |
| description | plain description | textDurchsageSaalscreen |
| title | title only | textDurchsageSaalscreen |

`getDurchsageEffectiveTextForSave` first returns a nonempty `getDurchsageManualTextForSave()`, independently of the selected mode. Thus **manual is not a fourth current mode**. The writer stores `textDurchsageManual`, the effective `textDurchsageSaalscreen`, and both nested `durchsageTextMode.saalscreen` and flat `durchsageTextModeSaalscreen`. Its loader gives the nested mode priority.

Implementation uses those three modes and preserves manual override for current records. It does not reconstruct text from general description/title. Missing-mode records retain the approved hall-first fallback; unknown explicit modes remain excluded. No Firebase schema or data was modified. Public normalization tests verify channel eligibility, texts, revisions and nonmutation.

## Follow-up: complete direct Python dependency set downloaded for audit

Artifacts in ignored `work/v83-speech-artifacts/` were downloaded without installing into system/bundled Python. Files and hashes were inspected; optional training/HTTP dependencies are excluded. CPython official archive hash agrees with its release page.

| Artifact | Bytes | SHA256 | Declared licensing |
| --- | ---: | --- | --- |
| python-3.13.16-embed-amd64.zip | 11439094 | 97dae5274cc54867065e8d5a3226e48c35017ed332a0fdb0e27d5b5821961297 | Python/embedded third-party notices |
| piper_tts-1.8.0-cp39-abi3-win_amd64.whl | 34119688 | 5da9bfdb05dfe15da3536859d422e605483ffa6d2b3ec2c5b9593bae6b5aa6a4 | GPL-3.0-or-later; bundled notices |
| onnxruntime-1.31.0-cp313-cp313-win_amd64.whl | 14888306 | 73e0165d58ece068c2a8a1c477c90b38e5a8adbbd399fdfdfd4bd79cbc28ff8d | MIT; bundled third-party notices |
| pathvalidate-3.3.1-py3-none-any.whl | 24305 | 5263baab691f8e1af96092fa5137ee17df5bdfbd6cff1fcac4d6ef4bc2e1735f | MIT |
| numpy-2.5.4-cp313-cp313-win_amd64.whl | 12566113 | 8b4d2fd2d34e5f8c9235ee787de5631a37a28402b15cb80814df973d2be54129 | BSD-3-Clause and bundled licenses |
| protobuf-7.36.2-cp310-abi3-win_amd64.whl | 456514 | a300819d441e078a5608c0d3c709796bb548136058fda017ae51d425b44fd353 | BSD-3-Clause |
| flatbuffers-25.12.19-py2.py3-none-any.whl | 26661 | 7634f50c427838bb021c2d66a3d1168e9d199b0607e6329399f04846d42e20b4 | Apache-2.0; wheel lacks separate notice file |
| packaging-26.3-py3-none-any.whl | 129956 | d7193f7c8e4e93f444fde0262bf90af30e16fa0ad0ad44cb553c87339b23cd1c | Apache-2.0 OR BSD-2-Clause |

Piper source artifact `piper_tts-1.8.0.tar.gz`: 24,276,117 bytes, SHA256 `830588aded347df579c91a32703e0fc2a3685d84f1e3533b14f2de69135d4904`. Release tag resolves to commit `639388b6317fc4731e91d53da42aea68fd4166ff`. Build configuration pins eSpeak-NG commit `724808c5a83f9ef95fdd0db886ba7ba537ff224a`; its codeload source ZIP is 20,365,406 bytes, SHA256 `3c30f022b3fea48288978dd5074ef19ff0026a1358317bfa11019ce065010f35`, and includes ucd-tools source/notices. These sources were downloaded for inspection, not published. A final runtime package still requires preserved notices, source access, provenance and native validation.

## New voice-license stopping point

Thorsten high's MODEL_CARD identifies fine-tuning from Lessac high. The Lessac high card points to the Blizzard 2013 dataset under a research license, not CC0. That license restricts the dataset to research and specifies named licensees. This does **not** prove the trained Thorsten model is prohibited, but it prevents this audit from claiming a clearly cleared distribution chain solely from Thorsten's CC0 dataset note or the model repository's generic MIT metadata. No restrictive data license was accepted, no Lessac data/model was downloaded, and no assertion of model illegality is made.

Primary references:

- https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/high/MODEL_CARD
- https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html

Alternatives checked: Thorsten medium also references Lessac; Thorsten low and Kerstin low reference Ryan low, whose dataset card is CC BY-NC-SA 4.0. These are not silent substitutes.

Concrete alternative for user direction: German `mls/medium`, trained from scratch per its own MODEL_CARD, dataset CC-BY 4.0, 236 speakers. It needs attribution, its own complete package/model-license review and a real speaker sample before selection. No claim that it sounds better or that its full audit already passed.

- https://huggingface.co/rhasspy/piper-voices/blob/main/de/de_DE/mls/medium/MODEL_CARD

Per the approved spec/plan, runtime integration pauses at this unresolved voice-distribution gate. Pure Firebase text normalization is preserved and tested. Next direction: approve examining/auditioning the German MLS Piper voice instead, or supply a specific voice/model redistribution permission. No need to provide Firebase credentials.

## Verification after writer integration

- RED: new selector absent and `getSpoken` missing; 5 new service cases failed, existing 13 cases passed.
- GREEN: selector plus AnnouncementService: 29/29 tests passed.
- Full suite: 138 test files, 502/502 tests passed, exit 0, 76.58 seconds; `work/v83-text-suite.log`.
- `npm run typecheck`: passed, exit 0; `work/v83-text-typecheck.log`.
- No runtime synthesis, no gong playback, no physical audio test and no v83 installer yet.

## User-approved MLS listening probe

User approved checking German MLS and preparing a listening sample. This approves a local probe, not a silent final voice selection or publication.

Pinned model at the same voices repository revision:

- `de/de_DE/mls/medium/de_DE-mls-medium.onnx`: 76,961,079 bytes, SHA256 `69cd1d2aa5a35839a518966fcc4924b5f93e5f8c948ed0752b1a616ad53f65bf` (downloaded and locally verified against upstream LFS metadata).
- `.onnx.json`: 8,948 bytes, SHA256 `b0af1c89ddfdc72d32e015729b0e89b99eec13c2c8caa1db7488d98e9e570b40`.
- MODEL_CARD: 223 bytes, SHA256 `ca1bf03a3c287fb6968acfa010e1917f85f0aa59db0f371efc3a2857f4035ffd`.
- Config confirms 236 speakers and German eSpeak phonemes, 22,050 Hz. OpenSLR 94 independently confirms dataset CC BY 4.0 and authors Vineel Pratap, Qiantong Xu, Anuroop Sriram, Gabriel Synnaeve and Ronan Collobert. Attribution and transformations recorded next to samples.

Verified CPython archive and seven wheel archives were unpacked into ignored `work/v83-mls-probe/runtime` without modifying system/bundled Python or installed GottesdienstRegie. Portable Python's path file was extended only inside this probe. Three real local WAVs were produced using CPUExecutionProvider, one intra-op and one inter-op thread. Runtime 12.91 seconds for all three after model load; output WAVs include the provided gong, a half-second gap and the same sample welcome text. No live application, device routing or media playback was started.

Native failure discovered and traced: the pinned eSpeak bridge could not open its existing data directory under Unicode Windows user path `Mörchen`, falling back to a nonexistent build-machine path. Original phonemization exited with error; resolving the same existing data directory via `GetShortPathNameW` to an ASCII 8.3 alias made German phonemization pass (16 phonemes) and full synthesis succeed. Only the disposable probe uses this workaround. Product integration must validate availability of a suitable path and fail clearly if no alias exists; do not assume 8.3 aliases exist on every PC and do not alter/move user files or operating-system settings.

Probe scripts are ignored scratch, not production implementations: `work/v83-mls-probe-prepare.cjs`, `work/v83-mls-probe-render.py`. Preserved for reproduction, not installed/shipped. No new product-code change since `eb3f1cc`.

| Preview | Model speaker | Duration | WAV SHA256 |
| --- | ---: | ---: | --- |
| mls-stimme-1-mit-gong.wav | 0 (source speaker 2422) | 27.98 s | 0a357f8254f12400d87973cd0216c91df88c120cd1c73556052904ec154dcaa7 |
| mls-stimme-2-mit-gong.wav | 1 (source speaker 4536) | 23.46 s | f960e37a31672ac06877ccdab7cb4488854f6391f1604d64ed0aaf168befd48e |
| mls-stimme-3-mit-gong.wav | 2 (source speaker 2037) | 21.48 s | 49d8f7a8d1667f4f8e3233913d71c7c78e400a322bdd4922aa1a7a271c70b227 |

Location: `work/v83-mls-probe/audio/`. A separate readback check passed for all three: valid PCM16 mono/22,050 Hz WAVs, identical initial gong segment, nonzero speech RMS and no clipping. Original gong SHA256 remains `5cd14eb1563660fe44a0ea793a38414262cb1ae4a37e1e6bc1cd5dd401231589`. Subjective pronunciation/quality and physical loudspeaker output remain for listening, not claimed from signal measurements.

Task 1 remains partial until the user accepts a voice and package license/source/notice delivery is finalized. No automatic announcements or v83 release is active.

## Listening rejection and operator-choice requirement

User rejected all three previews as buggy and clarified both crackling/choppy audio and pronunciation/unnatural articulation. No sample is accepted. The user explicitly wants the eventual operator to choose later; further development must not require this commissioning user to select one of these three now.

Read-only analysis of original speech WAVs: zero near-clipped samples (>0.99 full scale); no 20 ms windows below RMS 0.001 for first two samples and at most a 0.18-second quiet run in sample 3. These metrics rule out simple file clipping/long digital dropouts, not audible defects. Re-synthesis diagnosis found four sentences and no missing symbols in the configured phoneme map. Piper's WAV helper directly concatenates sentence chunks; observed boundary discontinuities up to 0.0516 full scale in the diagnostic run could contribute to clicks. They do not explain or resolve wrong pronunciation. No quality-fix claim is made and no new preview is offered as fixed.

Prepared a pure validated settings contract and device persistence, not a finished UI/runtime: model family plus configurable speaker ID, no initially selected speaker, explicit acceptance before activation. Neither saved model-family metadata nor schema validation means a candidate is quality-approved. Missing/invalid historical choices remain disabled. Interval and music-remaining percentage retain prior defaults/bounds. No automatic audio, model install, IPC handler or settings screen has been activated by this change.

Verification: targeted settings/text/device/profile 69/69 tests; full suite 140 files, 529/529 tests, 70.60 seconds; app typecheck and Electron no-emit compilation exit 0. Tests observed failing for absent normalizer/repository methods before implementation. Existing device fields and concurrent writes preserved. Speech renderer/playback quality, model packaging, chooser UI and full v83 remain incomplete.

## Bounded quality investigation after rejection

Disposable probes only, no production renderer change: `work/v83_pcm_composition.py` adds 8 ms attack, 12 ms release and 240 ms inter-sentence silence, preserving relative chunk levels with whole-utterance attenuation. Tests covered empty/invalid inputs, boundaries, source immutability and very short chunks; RED observed before implementation and for short release ramps. Fresh combined probe test run: 8/8 passed (including two legacy-token adapter tests). This verifies mechanics, not audible quality.

Controlled same-synthesis A/B files in `work/v83-mls-probe/audio-v2` separate join smoothing from level changes. Raw peaks varied between 0.1587 and 0.2186, so former per-sentence normalization applied differing gains. Both original and smoothed speech remained poorly transcribed by a local Whisper-tiny diagnostic. Tiny ASR is imperfect supporting evidence, not proof of individual spoken errors. No audio was uploaded. An old-Piper tokenization compatibility hypothesis (model config says Piper 1.0.0) did not establish a quality fix and is NOT promoted to product code. Six further speaker IDs (10, 38, 79, 100, 137, 200) also failed the diagnostic screen. No voice is approved; further arbitrary speaker swaps are not a release solution.

Alternative read-only feasibility research: official Qwen3-TTS 0.6B CustomVoice model supports German and nine preset voices under Apache-2.0 metadata (https://huggingface.co/Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice). Repository files total approximately 2.50 GB, excluding runtime/dependencies. Native German voice quality, CPU speed and resource suitability remain untested. Switching engines and downloading this larger runtime requires user direction; nothing installed or downloaded for Qwen. OpenVoiceOS Dii was not integrated: its card specifies CC-BY-NC-ND 4.0, not unrestricted distribution. v83 remains incomplete/unpublished.

## User-approved isolated Qwen feasibility setup

User approved the proposed Qwen local test, including the approximately 2.5 GB model download. This is not approval to replace the production engine without evaluation. Downloaded the model from `Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice`, pinned revision `85e237c12c027371202489a0ec509ded67b5e4b5`. Sequential streaming download checks exact byte counts and upstream LFS SHA256 before promoting partial files; recorded manifest under ignored `work/v83-qwen-probe/model-manifest.json`.

- Main safetensors: 1,811,626,576 bytes, SHA256 `bc3c7e785eb961179c25450d1acff03f839e0002f2f3a5aeb67b5735c0fa2adb`.
- Speech tokenizer safetensors: 682,293,092 bytes, SHA256 `836b7b357f5ea43e889936a3709af68dfe3751881acefe4ecf0dbd30ba571258`.
- Qwen Python wheel 0.1.1 SHA256 `11a290d8dabc7ef91a90c54478c8ab19b3edb1d85c0882313721892bdc4af15d`; inspected Apache-2.0 license and inference entry points. No remote model code/voice cloning used. Package/third-party redistribution BOM is still NOT a completed product packaging audit.

Hardware read-only check: approximately 8 GB physical RAM, NVIDIA GTX 1050 with 2 GB VRAM; only 600–1,365 MiB RAM available during setup. CPU-only Torch/torchaudio 2.8.0 installed in isolated `C:/Users/Mörchen/.codex/tmp/v83-qwen-runtime`, based on bundled Python 3.12; no global Python or Windows setting modified. Original deep-worktree environment failed installing setuptools due Windows path length. The shorter fresh environment succeeded for Torch; the failed environment was retained, not destructively removed. An overlapping initial dependency resolver was stopped before restarting sequentially in the shorter environment.

Disposable renderer `work/v83-qwen-render.py` is prepared for explicit German/Ryan diagnostic speech only, with offline model loading, one CPU thread, process-local idle priority and bounded 256 codec tokens. It never plays through audio devices. The 3.5 GiB free-memory gate is a conservative probe safeguard, NOT an upstream hardware guarantee. Actual invocation refused BEFORE importing Torch/loading weights because free RAM was only 1,365 MiB. Guard tests RED for absent helper then GREEN 3/3, Python compile and Node download-script syntax checks passed. No speech WAV, quality verdict, synthesis-speed measurement, live output or release exists yet. Resume only after sufficient memory is available; operator voice selection remains unimplemented, with no silent accepted default.

Setup completion verification: isolated qwen-tts install exit 0; `pip check` reports `No broken requirements found`. Installed metadata: qwen-tts 0.1.1, Torch/torchaudio 2.8.0+cpu, Transformers 4.57.3, Accelerate 1.12.0, safetensors 0.8.0. Final lightweight preflight: modelReady true, 1,303 MiB available, below 3,584 MiB probe gate. This confirms download/dependency metadata, NOT successful import, model loading or inference. `git diff --check` passed; no app source changes this probe turn. Next requires user to free memory before a bounded inference attempt. Download and installation processes completed.

## Continued preparation with speech explicitly disabled

User chose to skip Qwen testing and continue the independent work. No CPU/memory guard bypass, no known-defective MLS default and no silent Windows/cloud voice fallback. In branch commit 839274e, background audio now has independent relative ducking claims: minimum factor wins, video and announcement cannot release each other, and current user/route volume and mute survive fades. Radio URL/position is not reset by the new claim API. There is no automatic announcement caller. Tests observed RED before implementation, then 19/19 targeted and 547/547 full-suite PASS; app typecheck passed.

The preparatory Ansagen section under Settings → Presentation now exposes explicit Save for device-owned interval (1–120 minutes) and remaining music percentage (0–100), plus selected public hall texts from the existing central community data. It distinguishes unloaded messages from no eligible messages and can re-evaluate expiry on explicit refresh. The section never initializes Firebase or changes its records. The enable checkbox is visibly unavailable; the main-process settings access layer independently refuses activation even if a caller supplies accepted speaker metadata. IPC is restricted to the control window's main frame. No speech package, scheduling, audition or output has been activated by this UI.

UI/access tests: initial absent-module RED, then refresh/unloaded-data RED, final targeted 11/11 PASS. Latest full unit suite 143 files / 558 tests PASS (87.57 seconds, two workers); app and Electron typechecks passed. Hardware routing, actual speech, voice choice/preview, scheduler ownership and native sender integration remain pending; this is a partial v83 implementation, not a release or speech-quality fix.

Production compilation verification for this preparatory UI: `npm run build` and `npm run build:web` both exit 0; Vite emits bundle-size warnings (>500 kB), not build errors. No installer, release-version change, public push or publication. Existing unrelated `tests/smoke/startup-diagnostic.cjs` preserved and excluded from commits.
