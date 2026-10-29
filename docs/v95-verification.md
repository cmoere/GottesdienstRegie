# v95 working verification — unpublished

The user requires all 31 regional variants to be complete before publishing. No partial v95 release is authorized. The application version and historical availability manifest remain 0.94.0; these working results do not constitute a published update.

## Implemented and checked on 28 October 2026

- All 31 interface files contain 1096 UI and 34 native entries. Existing committed translation values were independently compared with HEAD and remain unchanged.
- All 31 documentation files are integrated with 63 help articles, four help controls and 1610 historical release fields. Their production validator checks keys, facts, placeholders and markup. North Hessian register differences were corrected after a sample revealed Central Hessian forms. Counts and validators do not independently certify linguistic fluency.
- Explicit operator bindings were added to the main workspace, media browser, file dialogs, Bible dialog, audio routing, notes, remote settings, test preparation and event designer controls. Translated option labels retain explicit stored values. Supplied visitor content is not passed through the operator resolver.
- Regional/selection/dialog tests: **29 files / 177 tests passed**, `work/v95-regional-complete-current.log`.
- Fresh complete unit suite: **273 files / 1172 tests passed**, `work/v95-unit-latest.log` (two workers, without increasing test timeouts).
- Fresh build after the modal correction: **exit 0**, `work/v95-build-after-modal-fix.log`; all 31 regional assets copied. Vite retains its existing large-chunk advisory.
- Native shell regression: **48 combinations passed**, `work/v95-operator-design-2uJcbI/report.json`.
- Actual App visual regression: **six core cases and 31 regional settings surfaces passed**, `work/v95-operator-surfaces-CLEQoL/report.json` and `regional-surfaces.json`. Light/dark settings, help and media images are saved in that directory.
- Narrow-window modal overlap was reproduced by hit-testing the bottom edge of the settings dialog. Mobile navigation shared the modal's stacking level and painted later. Its layer is now below dialogs. Red/green logs: `work/v95-dialog-layer-red.log`, `work/v95-dialog-layer-green.log`.
- Native PowerPoint original playback passed on the owned Monitor 1 fixture: `work/full-app-powerpoint-SOZ7CD/report.json`. This targeted run used a zero-second extended soak; it is not a long-duration playback test.

## Release blockers

The current source inventory contains **1220 review-required candidates**, including real operator text and possible technical literals. Remaining operator prose must be bound to authored resources; technical or visitor-only literals require evidence-based classification. They must not be bulk-excluded to make publication pass. The full-completion publication guard remains active and the manifest is intentionally not marked complete. No update was published.

The broad test/build logs from earlier working revisions are retained, including failures later corrected. Use fresh logs for any completion claim; the latest complete run is recorded below under the utility/guidance continuation.

The unrelated untracked startup diagnostic was not edited; SHA256 remains `B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5`.

## 29 October continuation

- All 31 interface packs now have **1784 UI / 55 native** entries. The 31 documentation packages still cover 63 help articles, four help controls and 1610 historical release fields. No committed UI/native translation value was replaced.
- Localization covers further settings/dialogs, dynamic statuses, route/design/style/animation names, menus, shortcuts, prompt/confirmation templates and native window/menu/export/import captions. Stable saved values, user text, public output content and announcement speech remain separate.
- The diagnosis menu now reads the installed application version instead of reporting 0.9.0. The real native regression fails before this fix and passes afterward: `work/v95-diagnostic-version-red-final.log`, `work/v95-diagnostic-version-green.log`; six core surfaces and all 31 regional settings surfaces passed in `work/v95-operator-surfaces-jKTNAb/`.
- `work/v95-unit-29-bounded-export.log`: **273 files / 1172 tests passed**. The archive export test now bounds each synchronous child at ten seconds and allows 25 seconds for two complete exports; all source-content/idempotence assertions remain unchanged. This is a developer corpus-export deadline, not an application/live-output timeout.
- The latest complete checkpoint command exited **0**: `work/v95-checkpoint-unit.log` has **273 files / 1172 tests passed**; `work/v95-checkpoint-build.log` completed and copied all 31 assets; `work/v95-checkpoint-native-surfaces.log` passed six core cases and 31 regional surfaces (`work/v95-operator-surfaces-WT6Xw0/`); `work/v95-checkpoint-powerpoint.log` reports `FULL_APP_ORIGINAL_PASS` (`work/full-app-powerpoint-vm4Hxs/report.json`, targeted zero-second extended soak).
- The fresh strict release audit intentionally exits **1**: `work/v95-checkpoint-readiness.json` reports 31 documentation packages, 1618 source candidates still awaiting review, incomplete inventory and the unopened full-catalog manifest. Unit/build success does not waive this blocker. No version bump, publication or public update was performed.

## Utility, guidance and feedback continuation

- All 31 interface packs now contain **1989 UI / 55 native** entries. The additional 205 entries cover language selection, screen-test confirmation/progress/results, profile and reward controls, the interface tour, media/design/transition captions, built-in template descriptions, history filters and feedback/cloud-error captions. The root independently validated all packs and compared every pre-existing committed UI/native value: **zero changed values / zero schema issues**, `work/v95-utility-guidance-packs-verified.json`.
- Raw shape/template names remain unchanged when inserted or saved. Only their operator picker labels are resolved regionally. History filters retain their original category/action values; user-created templates and historical content remain verbatim. The language picker retains whitespace before its unavailable-model indicator.
- The screen-test interaction test now switches to Bielefeld/Ravensberg during a running test and verifies that the run ID/MAIN dispatch are unchanged, cancellation remains available with its translated caption, and the exact previous quick-screen content is restored. The targeted run passes 13 tests: `work/v95-utility-tests.log`.
- The complete verification command exited **0**: **273 files / 1173 tests**, `work/v95-utility-guidance-full-unit.log`; build with all 31 copied assets, `work/v95-utility-guidance-build.log`; six actual native operator cases and 31 regional settings surfaces, `work/v95-utility-guidance-native.log`, artifacts `work/v95-operator-surfaces-TuBQlg/`. The existing Vite chunk-size advisory remains; it is not a runtime performance measurement.
- Exact reviewed source entries distinguish registered display catalogs from their unchanged model/report/protocol values. No blanket operator-source exemption was added. The inventory has **8618 entries / 1310 review-required**. The fresh strict audit exits **1**, with 1312 issues: `work/v95-utility-guidance-readiness.json`. It still rejects incomplete source review/inventory and the unopened full availability manifest. No version bump, push, tag or publication was performed.

## Reactive device/status captions

- All 31 packs now contain **2016 UI / 55 native** entries. Root validation reports zero schema issues and zero changes to previous committed translations: `work/v95-signal-final-packs.json`.
- Camera messages now store stable status identities rather than an already translated sentence. Their captions are resolved during render. The new provider-switch regression first fails on the unchanged German signal caption and then passes while preserving the same MediaStream, single getUserMedia call, unstopped track and saved source configuration: `work/v95-camera-caption-red.log`, `work/v95-camera-caption-green.log`. This test uses a controlled copy provider; the separate pack validation covers authored resources.
- Equalizer group labels and full accessible range descriptions use regional resources without altering physical frequency/gain values. Login consent/photo captions and the no-configured-camera alert use registered resources. Remaining fragments cover audio-output/removal captions, QR accessibility, download statuses and clock color labels. Protocol keys, source names, CSS filter expressions, output names, official competition names and physical units have explicit reviewed classifications.
- Fresh complete verification exits **0**: **274 files / 1174 tests**, `work/v95-signal-final-unit.log`; build and 31 copied assets, `work/v95-signal-final-build.log`; six native cases plus all 31 regional settings surfaces, `work/v95-signal-final-native.log`, artifacts `work/v95-operator-surfaces-sVGD0c/`. Existing bundle-size advisory remains.
- Strict completion still exits **1**: **8647 inventory entries / 1220 review-required / 1222 issues**, `work/v95-signal-final-readiness.json`. All 31 documentation packages are present, but remaining source work and final current-help/release updates must finish before enabling the full manifest or publishing v95. Local work is saved separately from publication; package version remains 0.94.0.
