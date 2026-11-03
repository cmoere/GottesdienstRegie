# v97 public release verification

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
