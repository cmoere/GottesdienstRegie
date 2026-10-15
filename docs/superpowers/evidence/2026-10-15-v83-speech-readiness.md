# v83 speech readiness evidence — 15 October 2026

Status: **Task 1 incomplete; no product implementation or v83 release.**

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
