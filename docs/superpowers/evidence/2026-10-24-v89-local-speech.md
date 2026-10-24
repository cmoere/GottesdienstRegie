# v89 local non-neural announcements — verification record

The user approved separate eSpeak NG installation and publication of the verified normal update. This increment also includes the independently verified [radio/weather changes](2026-10-24-v89-radio-warning.md). PowerPoint original-fidelity mode and complete regional UI translation are not claimed finished. The mandatory partial-translation notice remains visible; no v0.90 approval is inherited.

## Implementation

- A separately selected standalone eSpeak NG process receives plain UTF-8 stdin and fixed German voice/speed options, without shell, SAPI, Windows voice, cloud service or neural model. No engine binary, model or GPL library is redistributed by GottesdienstRegie. Paths belong to the device settings and cannot be supplied as arbitrary renderer command arguments. Existing neural voice metadata cannot enable this engine.
- Settings, engine selection, synthesis, cancellation and indicator writes authorize the control window's main frame. Outputs can only read the retained boolean/revision indicator. Text/output limits, timeout and one-process ownership apply. Closing/crashing the control renderer clears the retained indicator; an expiring heartbeat also prevents a stale speaker icon.
- One control-shell owner uses the existing AnnouncementService public/current Saal texts. No new Firebase connection/schema/write. First playback follows the saved interval in ON AIR pre/post only, including test-mode ON AIR. Preparation precedes attenuation. The supplied gong then speech use Background Audio routing without silent default-device fallback. OFF AIR, emergency quick screens, source revocation, route/device changes and engine selection cancel playback. Only the announcement ducking claim is released.
- The speaker is an independent overlay at top left, outside content/transition layers. Real previews mirror it without an operator-wide overlay. New output windows retrieve current state and reject stale state replies. The test watermark remains independent.

## Native failure investigation and resolution

The official Windows MSI from `https://github.com/espeak-ng/espeak-ng/releases/download/1.52.0/espeak-ng.msi` was downloaded for a scoped file-only probe. SHA256 `7f673c709ea5dd579d3b5ebb98688cc575328a6ab7438d2bc405b88cedaeafb9`. Administrative extraction copied files to the owned work directory; no installed GottesdienstRegie executable or physical output was changed. A later older-MSI extraction attempt was blocked by tool policy and was not retried or bypassed.

The extracted CLI initially crashed in libespeak-ng.dll during its implicit data lookup (`0xc0000005`). Upstream CLI source shows that the version-report function initializes with a null data path. Actual synthesis with an explicit path reported illegal byte sequence for the Unicode data directory. A file-system short-path alias and explicit data path produced valid PCM. The app now supplies the sibling dictionary path on Windows; Unix installations retain their system dictionary lookup. WAV stdout avoids the Unicode temporary-output filename problem. Only the exact known eSpeak streaming header sentinel is finalized into a bounded finite WAV; other malformed/truncated/empty formats remain rejected. Setup verifies actual synthesis, not merely the existence of an executable. The Windows standard installation directory without accented characters is recommended in UI/help/release notes.

`work/v89-file-synthesis.log`: a genuine German phrase produced 263410 bytes at 22050 Hz with 94017 nonzero samples. No sound was played. The engine is not silently selected in the installed product.

## Tests and review

Observed RED then GREEN: native boundary/settings activation, PCM validation and streaming header, Unix dictionary lookup, run order and cancellation, actual UI engine selection, unavailable-engine disabling, speaker visibility without content remount, interval/rotation and rapid OFF AIR → ON AIR session reset, and interruption before the engine picker opens. Relevant logs are `work/v89-*-red.log` / matching green/verified logs.

The first full new-feature run passed 230 files / 943 tests (`work/v89-speech-full.log`). A later release run exposed an intentionally version-pinned source-count expectation (1504 → 1514 new release fields) and a concurrently edited test/module snapshot; neither was ignored. The obsolete concurrent run was stopped before the final frozen-tree run. Final shipping suite/build results are recorded below after completion.

Native isolated Chromium probe: `work/local-speech-native-mLICjx`, `work/v89-chromium-speech.log`. Genuine gong and the generated WAV reached actual playing/ended events. OFF AIR cancelled the second run. Speaker geometry at 1920×1080: x23.03, y15.11, 43.17px square; underlying content retained its DOM identity. Painted image visually inspected. Physical audio was explicitly muted; this is not a hearing test or a certification of the hall route, pronunciation, recording or streaming equipment.

The native fixture itself initially resolved the gong relative to its nested test page and retained an obsolete interval after a deliberately reset clock. The page now uses the product's root base; its rapid restart exposed the real scheduler reset bug, pinned by a failing integration test before correction. Production paths were not changed to hide a fixture error.

Only translation work was delegated, per the user's authorization: three disjoint groups of five regional documentation files. Reviewed diffs add 10 new release fields per file without changing historical fields. Validator confirms all 15 documentation packs cover 63 help topics and 1514 release fields. UI inventory remains incomplete (6412 entries, 3784 review-required) and is disclosed with version-specific fingerprint `37307ce65a676ffe47c42cf37cfaa24e6c7d6d0b637169a6aac1b394d5dd84e3`.

Technical review is an author self-review, not independent technical review, respecting the native-only instruction. Important findings addressed with failing regression tests: reset state while cancellation cleanup is pending; ability to disable an unavailable engine; abort before opening the engine picker; Unix dictionary path selection. No deferred product defects identified in this scoped increment. Existing large-bundle warning remains and is not presented as fixed.

Foreign `tests/smoke/startup-diagnostic.cjs` remains untracked and unchanged: SHA256 `b7e42819f91d0d2d1bf1bbb5de782a26749bd1a26e2d802bbc8f5327bb570ab5`.

## Shipping verification

- Frozen shipping tree: **230 files / 950 tests PASS**, 206.92s (`work/v89-shipping-full.log`, three workers).
- Native boundary final gate: **4 files / 41 tests PASS** (`work/v89-native-final.log`). Electron typecheck passed.
- Production build PASS (`work/v89-shipping-build.log`, Vite 13.87s, Electron compilation and 31 regional asset copies). Existing large-chunk warning remains.
- V83 metadata and V84 disclosed partial-resource gates PASS. V85 overlay/navigation/RSS gate and V86 external-loop/clock/output guards PASS (`work/v89-v85-gate.log`, `work/v89-v86-gate.log`). Documentation validator: 15 packs, 63 help topics, 1514 release fields, no issues.
- Source and foreign-file diff checks passed. Public publication/asset verification pending; no claim of public availability until verified below.

## Publication correction: 0.89.1

Source 3dda4c3 started workflow 40077796827. Windows stopped in the historical V62 guard because the newly authored release text contained the prohibited API-key marketing phrase. The guard was not weakened. The same failure was reproduced locally (`work/v89-historical-gates.log`), then corrected in German/English and all 15 regional release texts. No speech/audio behavior changed. Connected GitHub log access required reauthentication, so no access bypass was attempted; public job metadata and the exact local workflow command established the failure.

The failed 0.89.0 remains an unpublished draft, not a normal update. The next publication uses **0.89.1** so artifacts from the failed attempt cannot be mistaken for the corrected source. Release/catalog/region keys and the RSS feed agree on 0.89.1, while the release series stays 0.89. Its exact disclosed partial-UI fingerprint is `16ff88cdc103d53b7d7c547c314c33da1a3bea699e1124c5755672242ca0213d`; 0.89.2 and 0.90.0 remain unapproved.

The complete historical command chain V39–V75 (including patch-version guards), V83 and V84 now passes locally (`work/v891-historical-gates.log`). Production build passed (`work/v891-shipping-build.log`, Vite 14.61s). Final 0.89.1 suite: **230 files / 950 tests PASS**, 209.47s (`work/v891-shipping-full.log`). Publication verification pending below.
