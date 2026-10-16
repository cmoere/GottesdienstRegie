# v84 regional interface: implementation evidence

Date: 2026-10-15. Status: partial implementation, NOT a published release.

## Delivered foundation

- Data-only registry contains the approved 31 regional variant IDs and labels,
  including `bielefeld-ravensberg`. These are internal IDs, not invented BCP-47 tags.
- The separate regional preference defaults to null/Hochdeutsch. Migration from
  schema 63 retains unrelated settings; current-schema rehydration also rejects
  malformed regional IDs. No selector is exposed yet and no text pack is claimed
  to exist merely because a registry entry exists.
- AST-based inventory tooling collects app-owned base strings and candidates for
  classification, along with German help/release resources. It never rewrites
  user content. Release lines/builds have stable identity in resource paths.
- Shared resource validation detects missing/extra/empty strings, wrong region
  IDs and placeholder differences. Single-pass interpolation cannot re-expand
  replacement values containing other placeholder names.
- A standalone release coverage checker rejects an unfinished inventory, missing
  packs, missing documentation, empty source categories and missing historical
  release fields. It is not yet wired into the publishing workflow.

## Verification observed

- Baseline `npm run test:unit`: 143 files, 560 tests passed.
- Catalog: missing module RED, then 16 tests GREEN.
- Inventory scanner: missing module RED, then initial four tests GREEN.
  Real-source investigation found a const-asserted `de` initializer; a regression
  test reproduced the lost base keys. A second test reproduced unstable release
  group indices. Both fixes were verified GREEN in six scanner tests.
- Preferences: five tests RED on absent migration/setter and unchecked saved IDs;
  all five GREEN after implementation. Tests use isolated jsdom storage, not the
  user's installed app settings.
- Shared validation: absent module RED; eight tests GREEN after implementation.
- Coverage gate: absent module RED; five tests GREEN, then empty-corpus test RED
  (incorrect acceptance), fixed to six GREEN.
- Combined focused run before the last coverage test: 35 tests passed; coverage
  tests ran separately. Full final verification is recorded below when finished.
- `npm run typecheck`: passed after registry/preferences/shared-validation changes.

The first expanded suite run overlapped the intentionally RED empty-corpus test
and caught that same test (600 passing, one failing). A clean rerun was started
after the fix; the earlier run is not being represented as a passing suite.

Final foundation verification: `npm run verify:release` exited 0 with 148 test
files / 601 tests passing, existing V55–V83 release guards passing, and the V74
composition/watermark subrun 9/9 passing. `npm run build` also exited 0; Vite's
existing large-chunk warnings remain (main JavaScript approximately 3.78 MB).
Logs: ignored `work/v84-verification.log` and `work/v84-build.log`.

Committed foundation: `fab33b4` registry/inventory, `60c985f` preference,
`b8c2950` resource validation/coverage. Task 2 is complete; Tasks 1 and 3 are
partial, Tasks 4–8 remain pending. This is not full feature acceptance.

## Remaining release blockers

The generated inventory is explicitly incomplete: 6,581 entries, including 4,814
unclassified source candidates, 195 stable base UI keys and 1,446 German release
text fields. Candidate count is not a count of verified user-facing strings.
All candidates must be classified and all assembled help additions/native surfaces
covered before claiming complete localization.

At the foundation checkpoint no regional UI or documentation text packs had been authored. Complete
31-variant translations, source integration, native synchronization, selector,
race protection, native/layout tests, final review and release metadata remain.
No version bump, publication, remote push, installer change, speech activation or
Firebase write has occurred. The public version remains v0.83.0.

## Text integration continuation

The first actual authored interface pack, `shared/regional/packs/ruhr.json`, now
explicitly covers all 195 current base-dictionary keys. It includes login,
security, updates and older short release-summary text. This is a colloquial
regional UI draft, not a claim of native-speaker validation. It has no native
dialog resources or full help/release-history pack and is not a complete edition.

`src/i18nBase.ts` retains the previous dictionaries and public base translator.
`src/i18n.ts` now provides the React hook, which loads the requested local pack
and resolves templates through `src/regional/resources.ts`. Language remains
separate from regional selection. Packs are validated, cached by ID and loaded
on demand; an older pending load cannot replace a different selected region.
The package is emitted in a separate approximately 10.4 kB JavaScript chunk.
No incomplete selector is advertised in settings.

Observed RED→GREEN: two authored-pack tests, five loader/resolver tests and the
operator-hook update test. The V73 source-based guard first failed after the
dictionary moved; its source path now follows the data module. The public
translation API also retains the original administrator-access guidance.

Continuation verification: `npm run verify:release` exited 0 with 151 files /
610 tests passing plus nine composition/watermark guard tests. `npm run build`
exited 0; existing large-bundle warnings remain. Logs are ignored
`work/v84-text-integration-verification.log` and `work/v84-text-integration-build.log`.
The standalone complete-corpus check still exits 1 as expected: the source
classification and full 31-variant corpus remain incomplete. This is not a
published v84 and no version bump or remote push has been performed.

## Additional authored base packs

Berlinerisch and upper-Bavarian regional draft packs now also contain all 195
base-interface entries each. Their coverage/security-placeholder tests first
failed on the absent files, then passed after authorship. They are explicit
template resources, not runtime whole-string word replacements. No claim of
external linguistic review is made. Together with Ruhrdeutsch this is three
base-interface packs, not three complete editions: native dialogs and full
documentation/history remain missing for all three.

Final three-pack check: `npm run verify:release` exited 0, 152 files / 612 tests
passed, all historical release guards passed, and the composition/watermark guard
subrun passed 9/9. `npm run build` exited 0 and emitted separate regional chunks;
existing large-chunk warnings remain. The previous source-integration web run
passed desktop/tablet/phone 3/3 (`work/v84-text-integration-web.log`); the later two
changes add only validated package data and their coverage tests.

Current logs: `work/v84-three-packs-verification.log` and
`work/v84-three-packs-build.log`. The other 28 base packs and all complete
documentation/native packs remain outstanding. No v84 release is authorized as
complete by these results; package version stays 0.83.0.

## Full short-text packs and native synchronization

With explicit permission to delegate translation work only, the remaining28
base-interface packages were authored. All31 packages now have195 UI and33
native-dialog templates. Independent checks cover exact keys, IDs, placeholders
and invisible characters. These are source-informed drafts, not native-speaker
certified translations. Root implemented the code and retained all audio/output
state boundaries.

Native settings IPC accepts only validated language/region metadata from the
control window's main frame. Writes preserve the existing device settings;
queued selection changes are coalesced without sending display/audio state.
Dialogs use separate validated per-ID snapshots. Raw JSON assets are copied into
the desktop build, independently of Vite's31 lazy interface chunks.

The full German documentation source is now exported from all63 assembled help
articles,4 help labels and1446 stable historical release fields. The new
documentation store rejects partial packs and validates links, placeholders,
paragraph counts and related-topic identities. It is not yet wired into help.
Regional documentation is still partial and blocks publication.

Focused tests:16 files /70 tests PASS. Typecheck PASS. Build PASS with the known
large-chunk warnings, copying31 native assets. Full verification log:
`work/v84-native-verification-final.log` (exit0, all historical guards PASS).
The V72 source guard now follows the localized four-action prompt and verifies
the German canonical labels; it first failed on the old literal assertion.
No v84 version bump, push or publication occurred.

## Lazy documentation integration and publication safety

The help data module is now separate from its regional wrapper. Existing article
IDs, screenshots and related-topic identities stay intact. Help and release-note
views subscribe to validated documentation packs. Release objects are indexed by
version/section identity; unknown future release content remains its source text.
Large documentation resources remain separate lazy chunks.

The authoring inventory now covers current assembled help and native canonical
templates. Existing non-German dictionary siblings are not counted as new German
source text. A regression test first failed with those false candidates and then
passed. The candidate inventory still has3,874 review-required entries and is
explicitly incomplete; no blanket classification was applied.

Installer and CI packaging now enforce the full v84 resource gate for v84 and
later versions. Current package0.83.0 is explicitly not a v84 certification.
Both missing interface classifications and incomplete documentation block v84.

Verification: `npm run verify:release` exit0 in
`work/v84-docintegration-final-verification.log`; desktop build exit0 in
`work/v84-docintegration-build.log` (known large-chunk warnings remain).
`npm run test:web` passed desktop/tablet/phone3/3 in
`work/v84-docintegration-web.log`. One earlier full run encountered an EPERM
rename on the recovery test's own temporary state file, followed by failed temp
cleanup. The isolated recovery tests10/10 and the complete rerun passed without
code changes. This is recorded as an intermittent Windows file-lock observation,
not claimed as fixed.

Complete documentation remains outstanding. Bavarian, Ruhr and Bielefeld have63
help articles each but partial release histories; the other28 complete document
packs are absent. The strict source/documentation gates remain nonzero. No v84
version bump, push, installer publication or native-smoke completion is claimed.

Further safety verification adds a numeric-fact mismatch test (RED→GREEN) for
technical timings/build versions inside translated prose. All currently authored
documentation passes non-missing structure/link/placeholder/number checks.
The reviewed font-family catalog is classified as technical metadata through an
LF-normalized content hash; changes invalidate that review. Missing-font warning
UI is not excluded. The candidate inventory remains incomplete at3,606 pending
review entries. `work/v84-facts-review-verification.log` exits0 with640 tests and
all historical guards passing. None of these checks certifies the missing corpus.

## First complete authored documentation and native smoke

Upper Bavarian now has63/63 help articles,4 help labels and1446/1446 historical
release fields. Independent validation against assembled current source returns
no issues. A real offline integration test was RED while its history was partial,
then GREEN after complete authorship. It verifies translated help/history loading,
stable article IDs and unchanged German/English source catalogs. Ruhr documentation
has subsequently also reached full source coverage; independent final review is
still pending. No native-speaker certification is claimed.

The canonical update-download cancellation template is now wired at both desktop
status sites. A wiring guard was RED on the missed key and GREEN afterward;
all33 canonical native keys are connected.

`work/v84-first-documentation-verification.log` exits0 with642 unit tests,
historical guards and9 composition/watermark tests passing. Desktop build exits0
in `work/v84-first-documentation-build.log`; large-chunk warnings remain.

`node tests/smoke/native-v84-regional.cjs` passes against the actual built desktop
main, preload and renderer in an isolated temporary profile. It checks saved
control-window selection, rejects a secondary-window IPC write and captures the
localized four-action native update dialog with download/install disabled.
Windows are hidden, login/protocol registration is intercepted, and the parent
cleans only the validated owned profile after Electron exits. The expected denied
IPC request is logged. Its first harness attempt used the smoke directory as
appPath and hit the fallback renderer; a new built-renderer URL assertion failed,
then passed after explicitly setting appPath and waiting for React. Only the latter
run (`work/v84-native-smoke-green.log`) is counted as native smoke success.

This remains an incomplete v84 implementation: the full31-document corpus,
remaining app-literal review/migration, selector and final release review are
outstanding. No publication has occurred.

## Three complete document packs and source freshness

Ruhr and Bielefeld/Ravensberg now each contain63 complete help articles,4 help
labels and1446 release fields. Independent full validation returns no issues for
both. The offline help/history integration test passes for all three completed
packs; Bielefeld first failed while incomplete and passed after full authorship.
The other28 full documentation packs are still outstanding; Berlin, Cologne and
Hamburg have translation drafts in progress.

The v84 publication gate now rejects a stale source inventory even if its old
review flag is true. The source fingerprint ignores line movement/manual review
status but detects changed source text/identity and revoked hash-bound technical
exclusions. Uppercase-only German dictionary labels are also retained for review.
The candidate inventory is explicitly incomplete at3924 pending classifications.
These are not claimed to be3924 necessary translations: technical/public-content
exclusions must still be reviewed individually.

`work/v84-three-doc-verification.log` exits0, all historical guards and9 output
composition/watermark tests pass. No0.84 metadata bump or publication occurred.
