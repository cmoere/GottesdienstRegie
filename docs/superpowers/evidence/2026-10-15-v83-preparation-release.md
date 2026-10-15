# v83 preparation-only release verification

## Authorized scope

After explicitly skipping the Qwen audition and being told that speech remains disabled, the user requested publication of the current preparation-only work. This supersedes the original all-in-one release milestone, not the unresolved speech-quality or distribution gates. No inference runtime, model, gong playback, scheduler, voice chooser or automatic speech is shipped or advertised. Package version is 0.83.0; original Firebase paths and project licensing are unchanged.

## Review and corrections

An independent read-only review of 7deede8..3b746d9 found one Important regression: all preference notifications invalidated background fades. A five-second stop could complete immediately after an unrelated theme change. Two regression cases (theme and unchanged-routing copy) failed before the fix; comparing effective route settings before touching gain/fade state made them pass. Targeted audio tests: 21/21. No Critical or concrete Minor findings were reported.

The review set aside physical audio, speech quality, inference, gong scheduling and model redistribution because no such runtime ships. That exclusion is accepted only for this preparation-only release; none is certified or silently approved. Native sender and persistence proof was requested as valuable follow-up and added before publication.

Native visual inspection also found inline settings labels running together. A native bounding-box assertion failed, then passed after scoped CSS separated the rows. Native capture was inspected after the correction. No unrelated layout/theme is restyled.

## Verified locally

- `npm run verify:release`: exit 0, 143 unit-test files / 560 tests, existing release guards and the new v83 metadata guard; additional watermark/composition guard tests also pass.
- `npm run build`: exit 0, including TypeScript and Electron compilation. Vite bundle-size warnings remain visible.
- `npm run test:web`: 3/3 browser-shell/phone/tablet tests pass; includes a production web build.
- `node node_modules/electron/cli.js tests/smoke/v83-announcements.cjs`: exit 0 and NATIVE_V83_PREPARATION_PASS with actual compiled preload/access/repository. Confirms UI Save, reload restoration, public-text filtering, disabled activation, other-window read/write rejection, one central data start, no audio/video element and no external HTTP downloads. Uses fictional data and isolated retained profiles, not user settings or real Firebase.
- `node scripts/check-version83.cjs`, package-entry check and `git diff --check`: pass.

This isolated native test is not a complete real-account login/startup test and does not certify physical speakers. New guide is German/English; other help translations are unchanged. The new preparation UI is German, as explicitly stated in release notes.

## Packaging and publication boundary

The first local package attempt failed with EPERM renaming a temporary extraction directory in the deep worktree. A fresh shorter output directory passed extraction; its lengthy dependency scan was stopped as an owned helper to release local resources. Partial outputs were retained, not deleted. No local installer is claimed complete. Final installers and update feeds must pass the existing GitHub cross-platform release workflow and be checked after publication. Developer-only `work/` probes, Python environments and models are outside the package file allowlist.

The user explicitly authorized publication; the established pipeline is triggered by a fast-forward push to origin/main, whose last checked base was 7deede8. No force push, old release replacement, local primary-checkout reset or worktree cleanup is authorized/needed. The incomplete broader speech plan and its ledger are retained for future work.
