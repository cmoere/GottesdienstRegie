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
