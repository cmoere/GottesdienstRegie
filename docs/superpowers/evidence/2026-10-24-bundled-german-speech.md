# Bundled German announcements — verification

User approval: include the complete voice in the normal update; “ja umsetzten und veröffentlichen!”, reiterated “weiter und veröffentlichen!”. Existing native-programming preference retained; only the six new release text fields in each of 15 regional documentation packs were delegated.

## Verified implementation

- Private MaryTTS 5.2.1 runtime with unchanged dfki-pavoque-neutral 5.2 unit-selection data and private Temurin 17 JRE, no end-user Java/eSpeak installation, account or voice download.
- SHA-256/size-pinned voice, 30 runtime jars and four platform/architecture runtimes. Installer builds fail if actual private-runtime synthesis fails.
- Native bounded plain-text/stdout-WAV interface; no HTTP listener, shell, system voice, arbitrary executable path or native sound-device playback.
- Explicit enable/save in settings. Old external/neural voice metadata cannot activate the new voice; interval/music level remain intact. Existing gong, output route, ducking, speaker overlay and live cancellation remain authoritative.
- LGPL texts/source jars and full modified Mary POS tagger source included. Java corresponding-source URLs and runtime notices included. Dependency assessment documents the single remaining Commons Lang advisory as unreachable through supported input, rather than claiming it fixed. See build/speech/SECURITY.md.

## Evidence

- Asset traversal/corruption/Unicode extraction: 3 tests PASS, recorded RED→GREEN in work/bundled-speech-assets-{red,green}.log. Native service/settings/lifecycle targeted suite: 100/100 PASS in work/bundled-speech-targeted.log.
- Full suite: **232 files, 961 tests PASS**, 630.24 s, `node node_modules/vitest/vitest.mjs run --maxWorkers=2 --no-file-parallelism`, work/bundled-speech-full-bounded.log. Earlier parallel attempts exposed release fixtures requiring updates plus an inventory timeout under concurrent builds; no timeout threshold was relaxed. The cache cleanup error on a timed-out first attempt did not recur.
- Build PASS, existing bundle-size/dynamic-import warnings remain, work/bundled-speech-build-final.log.
- Historical release gates V39–V75, V83/V84/V85/V86 and patch gates PASS, work/bundled-speech-historical-gates.log.
- Real private Java synthesis: 301860-byte finite non-silent 16 kHz mono WAV. New OpenNLP initially reproduced NoSuchMethodError; one LGPL compatibility class corrected the actual API boundary, followed by successful real synthesis.
- Real Chromium gong → speech, retained content, top-left icon geometry, OFF AIR cancellation PASS; physical audio muted. work/local-speech-native-Vp1JSr/report.json and speaker.png.
- Windows unpacked package built through electron-builder afterPack hook with private runtime/data. Actual module extracted from app.asar produced a 127352-byte speech WAV using only the packaged private runtime: work/bundled-speech-packaged-report.json. No installed application was modified or started ON AIR.
- 15 regional documentation packs validate with 63 help topics and 1520 release fields. Partial UI translation disclosure remains explicit, approved normal 0.89.2 scope; no claim of complete UI translations or completed PowerPoint original mode.

## Review and decisions

Separate author review performed against approved design and whole diff; no technical subagent was used. This is weaker than independent review. Material boundaries checked: Unicode install paths, process/output/text limits, cancellation/late responses, legacy settings activation, target-platform runtime, all voice resources, source/license delivery and private audio routing.

- Private Java 17 instead of 8 permits current OpenNLP and native macOS arm64; costs a larger runtime.
- One worker per synthesis avoids idle JVM memory; measured preparation is about four seconds and happens before ducking music, at the cost of repeated cold starts.
- One maintained MaryTTS POS adapter permits patched OpenNLP without bundling an old compatibility binary; full modified LGPL source ships.
- Runtime copies dereference symlinks, avoiding installed links back to CI build paths.
- Optional cleanup of obsolete extra license metadata was automatically blocked; no alternative deletion was attempted. These additional notices remain harmless metadata, not old runtime jars.
- Foreign untracked tests/smoke/startup-diagnostic.cjs remains untouched, SHA-256 B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5.

Physical hall pronunciation/audibility is not certified by muted software checks. Publication and downloadable artifact verification are recorded after the CI release completes.

## Published normal update

- Release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.89.2 — public, draft=false, prerelease=false, normal latest, 11 assets.
- Tested source/tag: `1e16634d9b6838aff82650e530de278167c8b68d`.
- Cross-platform workflow `40096525191`: prepare, Windows, Linux, macOS (Intel/Apple Silicon) and publish all SUCCESS. Each platform's package hook successfully synthesized using its bundled JRE before releasing the package.
- Pages workflow `40096525251`: SUCCESS. Public RSS contains 0.89.2.
- All three public update manifests checked against uploaded asset names/sizes. Downloaded Windows installer is **709052929 bytes**, SHA-256 **c83363053e1af7794e087dd8cef8f80b3cd2de67e4a53266be04463483158117**; SHA-512 matches latest.yml and SHA-256 matches GitHub's asset digest.
- Public downloaded installer was not installed or executed. Its selected payload resources were extracted under `work/release-verify-sKUYWk/`. Verified 30 runtime jar hashes, LGPL/voice licenses, full modified worker sources, private Java and original gong, normal updater provider, source tag and compiled native module.
- The actual native module from the publicly downloaded ASAR generated **246436 bytes** of valid speech through the downloaded private runtime/data. No system Java, Windows voice or physical audio output was used. Report: `work/release-verify-sKUYWk/speech-package-report.json`.
- Public release checks: `work/bundled-speech-public-verification.log`; package checks: `work/bundled-speech-public-package.log`.

No remaining required publication work. Real hall listening and unfinished historical PowerPoint/regional UI work remain outside this release's verification claims.
