# v96 public release verification

Verified 2 November 2026 at 21:03 UTC. Version **0.96.0** is the normal/latest release, neither draft nor prerelease.

- Release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.96.0
- Source tag and target: `6f8db818ef8f9e0cf87b986aa49ce1a1f1608352`.
- All-platform workflow: https://github.com/cmoere/GottesdienstRegie/actions/runs/41518882009 — prepare, verify, Windows, macOS, Linux and publication all concluded **success**.
- Full CI unit suite: **290 files / 1206 tests passed**. Native output/sharing/overview and original PowerPoint regression evidence is recorded in `docs/v96-verification.md`.
- All **11 public assets** exist. Windows, macOS and Linux update manifests identify 0.96.0 and their listed file sizes match the release assets. Release body matches the current authored release notes. Public release history, RSS and all nine current help images were verified.

## Public Windows installer

The verifier downloaded the public asset, without executing or installing it:

- Name: `GottesdienstRegie-Setup-0.96.0.exe`
- Size: **762492506 bytes**
- SHA256: `830ef625ec82dc05288365cfa27a4bed91ba312f4a63511c6157d40196db3462`
- SHA512 (base64): `z94EF8qVP5Oq0xuZr93QtZLUwmmgE9YbDZPks3VdPC/3q93ZvTwaP3kgTXHMaHQC+Dx1KJIflxzfRlBay252gA==`

SHA512 matches the public Windows updater manifest; SHA256 matches the GitHub asset digest. Read-only extraction of the downloaded installer confirmed application version 0.96.0, the 15 checked native modules/resources, all 31 interface/native regional packs, all 62 regional renderer/documentation chunks, pinned selfsigned 5.5.0, nine help PNGs and the normal GitHub update provider. Compiled text comparisons normalize line endings; resource hashes remain exact.

Machine-readable local evidence: `work/v96-ci-final.json`, `work/v96-ci-final-unit.log`, `work/v96-public-verification.log`, `work/v96-package-inspection.json`, `work/v96-final-public-check.log`, `work/v96-public-pages-verification.json`.

## Execution limits

The Windows installer was inspected rather than installed over the user's application. macOS ARM64 target integrity was verified on the Intel runner; five real speech synthesis tests used the matching host runtime with identical pinned models. This is not a claim of executing the ARM64 runtime on Apple Silicon. Screen sharing requires a supported desktop browser, trusted local HTTPS and reachable LAN peers; it carries video only. Original PowerPoint playback requires installed Microsoft PowerPoint on Windows.

The unrelated untracked startup diagnostic was excluded from every commit and retains SHA256 `B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5`.
