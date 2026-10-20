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

## Guarded selector and fourth complete document pack

Berlin now independently passes the same complete offline help/history integration
as Upper Bavarian, Ruhr and Bielefeld/Ravensberg:63 articles,4 help labels and1446
historical release fields. Four complete documentation packs are not31. Cologne,
Hamburg and Lower Bavarian remain drafts; missing corpus blocks publication.

The German-only regional selector is implemented at Settings → General → Language,
with all31 registered choices plus Hochdeutsch. A separate checked-in availability
manifest remains disabled, so incomplete choices are not exposed. Its tests cover
all31 selections, persistence, unchanged presentation/audio state, stable video DOM,
unchanged public fixtures and TESTBETRIEB. Partial/inherited manifests are rejected.
The new selector label is explicitly authored in every short pack (196 UI keys plus
33 native keys). German/English scope and reset guidance is documented separately.

Nine additional source files were read completely and excluded only by exact,
LF-normalized content hashes: output-only watermark/title/lyrics code, technical
font/canvas configuration, machine codes and cache transport. No blanket module
exclusion was added; changed source revokes each review. The inventory remains
incomplete:5998 candidates,3915 pending classifications. These are candidates, not
a claim that3915 new prose translations are required.

Verification this continuation:

- `work/v84-selector-verification.log`: full release verification exits0,
  167 files/651 tests plus9 output guards and historical guards pass. The package
  remains0.83.0; that success does not certify v84 completeness.
- `work/v84-selector-final-focused.log`:4 files/18 tests pass, including the
  complete four-document offline integration, selector and inventory checks.
- `work/v84-selector-build.log`: desktop build exits0,31 raw native packs copied;
  existing large-chunk warnings remain.
- `work/v84-selector-web.log`: desktop/tablet/phone3/3 pass.
- `work/v84-selector-native.log`: actual compiled main/preload/renderer smoke
  passes in an isolated profile; expected unauthorized IPC denial is logged.
- `git diff --check`: exits0, with line-ending normalization warnings only.

Full source migration,27 complete documentation packs, final layout/review and
release metadata remain outstanding. No version bump, push or publication.

## Six complete documentation packs

Hamburg and Cologne now each independently validate without issues against all
63 help articles,4 help labels and1446 history fields. The actual offline
integration test includes both and passes6/6 in `work/v84-six-doc-offline.log`.
The earlier five-pack checkpoint also passed5/5. These are structural/content-fact
checks and authored-prose review, not native-speaker certification.

A fresh full verification before these two data-only integrations also exits0:
`work/v84-selector-committed-verification.log`,167 files/651 tests,9 output guards
and historical guards. Lower Bavarian and Upper Palatinate are still drafts;
25 complete documentation packs plus the remaining app-literal migration,
layout/review and release metadata remain outstanding. No v84 publication.

## Entry-level review and Windows lock regression

Mixed files now support individually reviewed exact source entries. The source
key, file, context and full text must all match; only pending `source.*` entries
may be excluded. Canonical owned resources cannot be hidden this way. Changed
source or an empty review reason revokes the exclusion, and review hashes are
part of source freshness. Two new tests failed before implementation and passed
after it; the focused inventory/coverage run passes21/21
(`work/v84-entry-review-{red,green,final}.log`). Ten manually checked abbreviated
SI frequency labels are excluded; group names and screenreader prose remain
pending. Inventory remains incomplete at3905 pending candidates of5998.

`work/v84-entry-review-verification.log` is a FAILED run:654/655 tests passed;
the existing crash-recovery test hit EPERM replacing presentation-state.json.
It is not reported as a green suite. Investigation found PresentationRepository
used direct fs.rename, unlike the existing bounded atomicRename helper used
elsewhere. Two deterministic regression tests first failed: transient EPERM was
not retried, and permanent EBUSY had no bounded retry sequence. The repository
now reuses that helper without unlinking the old destination. Targeted12/12 pass
in `work/v84-recovery-lock-green.log`; the old state remains intact on permanent
failure and temporary files are cleaned. This does not claim every possible
filesystem error is solved. Fresh full verification/build are pending below.

The next full run (`work/v84-storage-and-corpus-verification.log`) is also not
green:656/657 passed. Recovery tests passed, but the whole-repository inventory
scan exceeded the default5-second test timeout (5.588 seconds) while the desktop
build ran concurrently. No assertions or timeout limits were weakened. The same
inventory/recovery pair passes25/25 in isolation, with the scan taking1.688 seconds
(`work/v84-storage-and-inventory-isolated.log`). The full suite is being repeated
without a parallel build. `work/v84-storage-and-corpus-build.log` exits0, including
TypeScript and native compilation, with the pre-existing large-chunk warnings.

The non-concurrent full rerun exits0 in
`work/v84-storage-and-corpus-verification-rerun.log`:167 files/657 tests,9 output
guards and historical guards pass. The rebuilt native smoke also exits0 in
`work/v84-storage-native-smoke.log`, including the expected unauthorized IPC
rejection and no download/install. `git diff --check` exits0. These results verify
the changes made here, not complete v84 coverage. The package remains0.83.0 and
the selector manifest disabled; no push, version bump or publication occurred.

## Operator controls, font status and seventh full documentation pack

Niederbayerisch now independently validates all63 help articles,4 help labels and
1446 historical release fields with no issues. The actual offline integration
table passes7/7 (`work/v84-operator-seven-doc-green.log`). Oberpfälzisch, Schwäbisch
and Ostfränkisch remain partial. Seven complete documentation packs are not31.

Six more operator templates are now explicitly authored in all31 regional packs:
minimize, exit fullscreen, close application, missing fonts, unavailable font
checking and the MAIN-preview heading. These six templates also have explicit
resources in all17 existing base languages. Short regional packs now contain202
UI keys plus33 native keys; this is still not complete app-literal coverage.

Window controls first failed2/2 against the untranslated source and then passed;
the final six-case control test checks regional/English/German/French/Arabic/
Ukrainian labels, unchanged native command IDs and audio routing. Three status
tests also failed before implementation and pass afterwards: font names remain
opaque (including placeholder-like text), switching language does not rescan
fonts, unchecked fonts stay distinct from missing fonts, the preview retains its
mounted video/public title/Bible text and TESTBETRIEB stays literal. New data
coverage rejects fallback-only status/control resources in any existing language.

The first whole run after localizing the preview heading failed665/666 because
MainOutputSurface.test.tsx assumed fixed German while the default locale was
English. Its original badge/output assertions are retained; the German fixture
now explicitly selects German. The subsequent whole run passes169 files/667 tests
plus9 output tests and historical guards (`work/v84-seven-doc-operator-verification.log`).
The later explicit17-language resource test passes in the focused11-test run
(`work/v84-all-base-operator-coverage.log`). Earlier focused runs pass14 and24
tests, including all seven full offline document packs.

Four more modules were read in full and excluded by exact source hash: Bible
provider/reference identities, bundled Bible quotations, public announcement
rich-text parsing and supplied lyric layout. There are no authored operator
sentences in these exact versions. Human-facing errors in consuming UI and other
mixed modules remain pending. The refreshed inventory is incomplete at5998
candidates/3724 pending reviews; it is not a count of3724 necessary translations.

The seven-document desktop build exits0, with existing large-chunk warnings and31
raw native packs copied. Browser checks pass3/3 and the actual compiled isolated
native smoke passes (expected unauthorized IPC denial, no download/install).
Logs: `work/v84-seven-doc-operator-{build,web,native}.log`. A fresh continuation
verification is running in `work/v84-operator-resume-verification.log`.
No v84 readiness claim or publication.

## 2026-10-19: Help navigation and nine complete documentation packs

The earlier continuation verification completed successfully:169 files/668 tests,
historical guards and9 output guards PASS (`work/v84-operator-resume-verification.log`).
Desktop build, actual compiled isolated native smoke and browser3/3 also passed
(`work/v84-operator-resume-{build,native,web}.log`). These precede the help changes
below and are not presented as verification of later compiled code.

Help navigation labels and related-topic titles now respect the explicit regional
selection while stable article IDs, callback values and section anchors remain
unchanged. An actual offline Ruhr rendering test failed before the change and
passes afterwards. The source inventory no longer skips the entire help folder:
only named assembled article-data modules are omitted. Injected renderer and
helper-module regressions both failed before this correction and pass afterwards.
Logs: `work/v84-help-region-{red,green}.log` and
`work/v84-help-helper-scan-{red,green}.log` (17 focused tests PASS).

All31 short packs now contain204 UI/33 native templates, including help chrome.
All17 existing base languages have explicit equivalents for the8 new operator
keys; fallback is not counted as authorship. Inventory remains incomplete:
6000 candidates/3724 pending source reviews. This is not a count of necessary
translations and is not release readiness.

Lower Bavarian, Upper Palatinate and Swabian are independently validated complete
at63 help articles/4 help labels/1446 release fields each. The actual offline
loader integration passes9/9 completed packs (`work/v84-nine-doc-offline.log`).
Swabian's independent corpus validator reports complete:true/issues:[].
Badisch/alemannisch, Ostfränkisch and Pfälzisch translation work continues.
No version bump, selector exposure, push or publication;22 complete documentation
packs and full source migration/review remain outstanding.

The new help-scanner regression exceeded the unchanged5-second limit in both
whole-suite runs (670/671 and671/672 passed); these are failed runs, not green
verification. Investigation identified redundant whole-repository scanning in
the injected directory-policy test. It now walks only the two actual help modules
under test, retaining the independent full-repository inventory test and every
assertion. Focused14/14 PASS: injected policy337ms, full scan1228ms
(`work/v84-help-scan-fixture-green.log`). No production behavior, timeout or
release criterion was weakened. Fresh unmodified verify:release rerun pending.

That rerun failed671/672 on the separately retained full-inventory test's same
5-second timeout. Windows npm.ps1 also dropped the requested concurrency options;
the subsequent log named `v84-help-serial-verification.log` is therefore NOT
evidence of serial execution. It does contain a fresh successful complete suite:
169 files/672 tests PASS, followed by every unchanged verify:release guard,
including9 output tests. No timeout was raised and no failing run is relabeled.
Desktop rebuild currently running in `work/v84-help-final-build.log`.

Desktop build exits0 (existing large-chunk warnings); compiled isolated native
smoke PASS, expected secondary-window IPC denial only, no download/install.
Browser checks3/3 PASS. Logs `work/v84-help-final-{build,native,web}.log`.
Diff-check PASS. No actual operator profile, output assignment or Firebase changed.

Six additional modules were read in full: EventOverviewTable,
EventScrollViewport, PostProgramRoomNotice, CountdownView, AnnouncementBanner and
BibleQuickOverlay. Exact LF-hash-bound exclusions preserve their public-output
labels/copy, supplied Bible/event/announcement content and technical animation
tokens rather than applying operator dialect. No broad directory exclusion added.
Inventory now6000 candidates/3708 pending; focused inventory/coverage22/22 PASS
after this data-only review (`work/v84-output-source-review.log`). The previous
full672-test pass and build precede this classification-only update. Completeness
remains false and public v84 release remains blocked by unfinished scope.

## Further continuation: ten full packs and connection-status localization

All three translation-only workers stopped at their usage limit. Saved drafts
remain intact: Badisch63 help/4 labels/360 history, Pfälzisch45 help/4 labels/0
history; Ostfränkisch was63/4/1310. No replacement worker/account/model was used.
Root authored its136 missing historical entries directly, retaining all previous
translations. Independent strict validation reports complete:true/issues:[];
the actual offline loader test was RED on the partial pack and GREEN10/10 after
completion (`work/v84-ten-doc-{red,green}.log`). Ten full packs, not31.

CommunityDataStatus now localizes only its operator copy, with five separate
states (online timestamp/loading, offline known/unknown timestamp, unavailable).
All31 short packs and all17 existing base languages have explicit authored
templates. Timestamp formatting remains de-DE/Europe/Berlin; connection data is
not mutated and no Firebase/audio/output logic was changed. Two real-component
tests failed before implementation and pass after it; the previous German test
explicitly sets its German fixture rather than relying on browser defaults.
Focused19/19 PASS, including ten full offline packs and all-language coverage:
`work/v84-community-status-{red,green}.log`,
`work/v84-community-and-ten-doc-focused.log`.

Short packs now209 UI/33 native keys. Current inventory6002 candidates/3705
pending, complete:false. Full direct-Vitest two-worker verification is running in
`work/v84-community-full-verification.log`; no overall success claim yet.
Package remains0.83.0, readiness manifest disabled;21 documentation packs,
remaining literal migration and final review still block publication.

The standalone strict resource check was also executed rather than treating the
0.83 preparation guard as v84 approval. It correctly exits1: inventory incomplete
and6293 coverage/classification issues (`work/v84-current-readiness.log`). These
are unresolved readiness records, not6293 newly diagnosed runtime bugs. The
readiness manifest stays disabled; no gate was bypassed to publish this increment.

Fresh whole verification completed successfully:169 files/675 tests PASS,
followed by all unchanged historical guards and9 output tests
(`work/v84-community-full-verification.log`). Vitest was invoked directly with
maxWorkers=2 this time; no timeout or assertion changes,249.75s full suite.
Desktop rebuild pending in `work/v84-community-build.log`.

Desktop rebuild exits0; existing large-chunk warnings remain. Actual compiled
isolated native smoke PASS, expected denied secondary-frame locale change and
no download/install. Browser desktop/tablet/phone checks3/3 PASS.
Logs: `work/v84-community-{build,native,web}.log`. Independent final Ostfränkisch
validation remains complete:true/issues:[], and all saved documentation fields
have no nonmissing validation errors. Diff-check PASS. This verified increment
is committed locally; incomplete drafts will be preserved separately, not counted
as completed packs. No version bump, readiness enablement, push or publication.

Draft preservation only: Badisch/alemannisch63/4/360 and Pfälzisch45/4/0 are
saved in Git separately after the workers' usage-limit stop. They remain
incomplete and are rejected by the complete-document runtime/gate; neither is
advertised as ready. No translation was fabricated for the missing entries.

## Additional regional texts: Pfälzisch and Südbadisch

The next request was to continue the languages. Translation workers still report
usage-limit errors; no worker was resumed or replaced. Root authored the texts
directly, without an online translator, model/account switch or word-replacement
translation. Only regional JSON documentation changes; runtime code, preferences,
public outputs, audio and Firebase are untouched.

Pfälzisch received its18 missing help articles (now63/63), including system,
offline/sync, updates, keyboard/UI, remote, support, rights and storage guidance.
The first60 historical fields were added, covering the supplied v0.83–v0.80
source prefix. Release limitations, numeric parameters, paragraph boundaries and
technical identifiers are retained; the v0.83 speech preparation is explicitly
not described as functioning automated speech.

Südbadisch–hochalemannisch has a new draft with6 full help articles and4 help
labels: quick start, song translations, screensaver protection, installation,
development/feedback and first steps. Related-topic IDs are copied unchanged
from the canonical source rather than translated as keys.

Independent corpus check reports no nonmissing validation errors for any saved
pack; focused documentation/runtime/help tests39/39 PASS
(`work/v84-more-help-focused.log`). Pfälzisch63/4/60 and Südbadisch6/4/0 remain
incomplete against63/4/1446. Ten full packs remain ten; no partial pack is counted
complete. Full verification pending in `work/v84-more-languages-verification.log`.
No linguistic native-speaker certification or v84 release claim.

Fresh whole suite169 files/675 tests PASS, unchanged historical guards and9
output tests PASS (`work/v84-more-languages-verification.log`). Direct two-worker
run took209.05s; no timeout or assertions changed. Actual documentation-store
boundary checks for both saved partial packs return loaded:false/exposed:false
(`work/v84-partial-language-boundary.log`), retaining the strict completeness
rule even though Pfälzisch help is complete. Desktop rebuild pending in
`work/v84-more-languages-build.log`; no compiled result claimed yet.

Desktop build exits0, including the new lazy Südbadisch document chunk and31
native JSON assets; existing large-chunk warnings remain. Diff-check PASS.
This continuation changes documentation data only; no new native/browser-smoke
result is claimed beyond the previous verified unchanged runtime. The draft
checkpoint is committed locally, not enabled as a complete language package.
Package0.83.0 and disabled readiness manifest remain unchanged; no publication.

### 2026-10-20 — Badisch and Pfälzisch full documentation

Two more regional documentation packs now independently validate against the
canonical63help/4helpUI/1446historical-field source: Badisch and Pfälzisch,
both issues:[]. Root wrote500Badisch and430Pfälzisch historical fields directly;
translation-only workers supplied the preceding disjoint prefixes. Exact source
keys, URLs, numeric facts, paragraph blocks and related-topic identities remain
validated. No automated dialect substitutions or source-fallback completion.

Actual offline loader regressions were observed failing on partial data, then
passing on complete data:11/11 and12/12, respectively. Logs:
`work/v84-eleven-doc-{red,green}.log`, `work/v84-twelve-doc-{red,green}.log`.
Twelve documentation packs are complete;19remain partial or missing. This count
does not certify full UI migration or linguistic native-speaker review.

Südbadisch now has63complete help articles,4helpUI fields and280historical
fields. It remains an incomplete draft, not a selectable complete language.
The existing workers reached a fresh usage limit after saving their checkpoints;
none were replaced or resumed following that limit. Program implementation,
integration, testing and release authority remain with root. Full-suite/build
verification for this data increment is pending. Package0.83.0/readinessfalse
remain unchanged; no publication is claimed.

Fresh verification for this increment:169files/677tests PASS, additional9output
tests and unchanged historical guards PASS (`work/v84-twelve-doc-verification.log`).
After a final Südbadisch recording-word transcription correction, focused help/
documentation tests41/41 PASS (`work/v84-twelve-doc-final-focused.log`). Independent
validation against the live canonical source reports no nonmissing errors in
any changed pack; actual store still refuses the incomplete Südbadisch draft
(`work/v84-twelve-doc-corpus.log`). Desktop build exits0,31native assets copied,
with existing large-chunk warnings (`work/v84-twelve-doc-build.log`). Diff-check
PASS. No new native/browser smoke result is claimed for documentation-only data;
runtime code is unchanged from the earlier compiled smoke. This is a locally
verified increment, not a complete v84 release or native-speaker certification.

### 2026-10-20 — Südbadisch complete; two Hessian drafts

Südbadisch has63help articles,4helpUI fields and all1446historical release
fields. Independent validation against the current canonical source reports
issues:[]. Root authored600fields; a translation-only worker authored the other
566missing fields. Existing63/4/280content was preserved. Disjoint ranges were
checked before integration, after the worker explicitly stopped writing.

The actual offline loader regression failed on the incomplete package and passed
13/13 after integration (`work/v84-thirteen-doc-red.log`,
`work/v84-thirteen-doc-green.log`). Thirteen regional documentation packs are
complete;18remain incomplete or absent. Full UI migration is still unfinished,
and no native-speaker certification is implied. Rheinhessisch and Südhessisch
are being authored as separate partial drafts. No runtime translation service,
fallback-based completion, account/model switch or publication bypass was used.
The official account check allowed ordinary usage before resuming existing
translation-only workers. Package0.83.0/readinessfalse remain unchanged.
Full-suite/build verification and final draft checkpoint validation are pending.

A separate read-only translation proofread identified a misleading repeated
overview heading in38root-authored fields. Root checked each exact key against
the canonical meaning and changed the heading to `Iiordnig vo dere Version`.
No other concrete material fact omission was reported. Independent validation
still reports issues:[]; the real offline suite remains13/13 PASS after the edit
(`work/v84-thirteen-doc-reviewed-green.log`). This is not native-speaker approval.

Rheinhessisch and Südhessisch now each contain63help articles,4helpUI fields and
the first100historical fields. Both translation workers explicitly stopped
writing. Root independently confirmed all present fields valid,1346history
fields missing in each draft, and actual documentation stores rejecting both
with loaded:false/exposed:false (`work/v84-thirteen-doc-corpus.log`). Thirteen
complete packs, two partial packs and sixteen missing packs remain. No incomplete
pack is counted as complete. Fresh full-suite verification is running in
`work/v84-thirteen-doc-verification.log`; desktop build remains pending.

Fresh verification passes169files/678tests plus9additional output tests and the
unchanged historical guards (`work/v84-thirteen-doc-verification.log`). Direct
two-worker suite took220.98s; no assertions or timeouts changed. Desktop build is
running in `work/v84-thirteen-doc-build.log`. New Hessian drafts remain63/4/100
each, not full language packages. No runtime or public-content behavior changed.

Desktop build exits0 and copies31native assets; the complete Südbadisch package
and two new lazy Hessian draft chunks are included. Existing large-chunk warnings
remain (`work/v84-thirteen-doc-build.log`). Diff-check PASS. No new native/browser
smoke is claimed for this documentation-only increment; the unchanged runtime
was previously smoked. This checkpoint is saved locally, not published or enabled
as a complete31-variant feature. Remaining Hessian history starts at source index
100;16other regional documentation packs are absent. UI-source migration and
final release-readiness checks remain incomplete.

### 2026-10-20 — Approved15-variant scope and complete documentation

The user approved the first15variants (the13completed editions plus Rhine and
South Hessian), with the other16development IDs hidden. The31-ID registry is
preserved. Renderer selection, preference migration, trusted native writes,
documentation/resource collection and the release manifest now share the same
ordered15-ID allowlist. Completeness, source-freshness and placeholder validation
remain mandatory. Readiness is still false and package version remains0.83.0.
Selection regressions were observed RED→GREEN; the focused scope suite passes
16/16 (`work/v84-release15-scope-green.log`).

Both Hessian packages now have63help articles,4helpUI fields and1446historical
release fields. The actual offline integration suite was observed failing on the
two partials and now passes15/15 (`work/v84-fifteen-doc-red.log`,
`work/v84-fifteen-doc-green.log`). The production documentation collector reports
complete:true/issues:[]. Independently checked prior saved help/UI/history
fields remain unchanged (`work/v84-fifteen-doc-corpus.log`). Root merged the
Rheinhessisch1046-field prefix and disjoint400-field tail only after both
translation workers explicitly stopped writing. This is not native-speaker
certification or proof of full UI completion.

Event-link controls and existing media-generation statuses now consume explicit
templates across17base languages and15released regional packs. Given event
titles, technical error data, IDs, dates and output copy are not rewritten.
Reactive-language and timing/data-preservation component tests were observed
RED→GREEN. The focused group passes22/22
(`work/v84-release15-operator-final-focused.log`). The first desktop build exposed
an incomplete newly added event test fixture; filling its required date/time
fields, without casting around the type checker, restored a successful build
(`work/v84-release15-build-rerun.log`). Existing large-chunk warnings remain.

Actual isolated compiled main/preload smoke passes all15locale writes, rejects
a deferred locale without modifying the saved locale, rejects a secondary-window
write and checks the localized four-action updater dialog without download or
installation (`work/v84-release15-native-allowlist.log`). Browser smoke passes
3/3desktop/tablet/phone (`work/v84-release15-web.log`). These runs precede the next
Quick Screen copy migration; fresh final verification is required afterward.

Quick Screen settings are being fully localized beyond the earlier six reused
labels. Two actual component tests currently fail on untranslated add/countdown/
logo controls, and the explicit base/regional resource tests fail on the14missing
keys (`work/v84-quick-complete-red.log`, `work/v84-quick-packs-red.log`). This is
an in-progress checkpoint, not a passing final build or permission to publish.

The Quick Screen component/resource group now passes5/5 after those RED runs
(`work/v84-quick-complete-green.log`):14new operator templates explicitly authored
in17base languages and15regional variants. Two exact reviewed non-prose sites
are excluded: the aria-hidden drag glyph and the registered organization name
used as an example output-text placeholder. No file-wide exclusion was added.

The first full run reports172files,686passing tests and3failing tests in the
two older pack tests, all retaining the former209-key expectation
(`work/v84-release15-full-verification.log`). Their expected corpus size was
updated, not their completeness/placeholder assertions. A further30existing
settings templates have now been integrated, bringing each released short pack
to269UI/33native fields. Existing360values across12base-language maps were
independently compared to HEAD and preserved exactly; five missing base maps
and15regional maps were explicitly authored, not filled from fallback
(`work/v84-settings-extra-preservation.log`). No audio implementation or device
selection code was changed.

Actual browser regression setup was corrected to mark the unrelated introductory
tour complete; the first attempt had been intercepted by that tour. A subsequent
test-only typing failure from future expected keys was corrected before the
real pre-implementation RED: the opened French settings page did not contain
the expected French high-contrast control
(`work/v84-settings-extra-browser-red-fixture.log`). The settings now resolve
those labels through the same reactive translator as other controls, including
the rollback confirmation. Focused component/resource/inventory tests pass23/23
(`work/v84-settings-extra-focused-green.log`). Full-suite rerun, fresh browser
results and a fresh compiled desktop smoke remain pending at this checkpoint.

Strict regional coverage was run separately and correctly exits1, with3637issues
(inventory incomplete plus3636unreviewed source sites)
(`work/v84-release15-readiness.log`). These are remaining localization/review
work, not3637new runtime defects. Inventory remains complete:false and the
selector remains disabled; completed documentation does not certify complete UI
localization. No package bump, publication or installer claim is made.

Final verification of this increment passes172files/689tests, followed by the
unchanged historical release guards and9additional output tests
(`work/v84-release15-final-verification.log`). No timeout or completeness
assertion was relaxed. The final browser run passes4/4, including actual French
settings → German settings, the requested high-contrast edit and unchanged
saved speaker/microphone IDs (`work/v84-settings-extra-browser-final.log`).
An intermediate browser run had passed the French controls but failed to locate
the language select by exact label text; the test now uses its observed accessible
combobox role/name, without changing application behavior or forcing a click.

Fresh desktop build exits0 and copies31native assets; existing chunk warnings
remain (`work/v84-release15-compiled-final.log`). Actual isolated compiled
main/preload smoke passes all15allowed writes, deferred-selection rejection with
no saved-state mutation, secondary-window denial and the localized updater
dialog, without download/install (`work/v84-release15-native-final.log`).
Independent comparison preserves all6479prior UI values across31packs, every
native namespace and all16deferred packs byte-for-value
(`work/v84-release15-resource-preservation.log`). Diff-check passes.

This verified increment is saved locally. Overall UI source migration,
classification, whole-feature review and publication remain incomplete. The
strict3637-issue readiness result is not bypassed: no version bump, readiness
enable, push, tag, GitHub release or installer publication occurred.

### 2026-10-20 — User-approved normal0.84 update with disclosed partial UI

After being told the UI remained incomplete, the user first agreed to a
disclosed prerelease, then expressly requested `als normales update`. This
changes the release scope for0.84.0, not the truth of its completeness claim.
`docs/releases/v84-partial-ui-scope.md` records the amended requirements. The
manifest remains complete:false and binds the partial UI disclosure to0.84.0
and inventory fingerprint
`b2f04ec1d4943b6982dc3d2feb33b29dc14e985974501a104d60c3021d2615af`.

The selector offers only15variants plus Hochdeutsch and exposes a visible,
accessible notice that UI translation remains incomplete. The publication policy
accepts only the explicitly recorded pending UI classifications for this version
and source fingerprint. Missing resources/documents, malformed placeholders,
stale inventory, absent disclosure or another release version still block it.
Three real regressions were observed RED→GREEN,7/7tests
(`work/v84-normal-partial-red.log`, `work/v84-normal-partial-green.log`). The
ordinary strict coverage checker remains unchanged and does not claim complete
UI coverage.

Current0.84release notes were added in German/English and10fields explicitly
translated for each of the15regional editions by a translation-only worker.
Root merged only after write-stop and independent canonical validation. The
actual publication gate correctly failed300missing-document checks before
integration, then passed after it (`work/v84-normal-update-gate-red.log`,
`work/v84-normal-update-gate-green.log`). The15actual offline loaders now validate
63help articles,4helpUI fields and1456release fields per edition. All21690prior
history values and existing help/helpUI remain unchanged
(`work/v84-normal-update-preservation.log`).

Focused checks pass22/22. The first full run reports691/692passing, with one
obsolete1446-field count after adding10new release fields. The count was updated
to1456 while retaining old-version identity assertions and adding current
disclosure coverage; the focused source suite passes3/3
(`work/v84-normal-update-source-green.log`). Final full-suite rerun is pending
in `work/v84-normal-update-final-verification.log`.

Actual browser tests pass5/5, including visible partial-scope disclosure,
15selectable variants, retained audio preferences and desktop/tablet layout
(`work/v84-normal-update-browser.log`). Both generated settings captures were
visually inspected: the notice is readable and not clipped. Desktop build exits0
and copies31native assets, with existing chunk warnings
(`work/v84-normal-update-build.log`). Isolated compiled main/preload smoke passes
all15locale writes, deferred-write rejection without saved-state mutation,
secondary-window denial and the localized four-action updater dialog; no install
or real update download was started (`work/v84-normal-update-native.log`).

Final review is self-review by root because the user's delegation authorization
permits translation work only. The reviewed production paths include resource
and documentation loading/races, literal interpolation, preference preservation,
control-frame IPC authorization, stable version/section identities, partial
manifest validation, source freshness and the normal-update release metadata.
No further critical/important blocker was found. This is weaker assurance than
an independent fresh reviewer and is not native-speaker certification. Remaining
UI wording/classification is intentionally disclosed, not silently marked done.
Existing large-chunk warnings are retained. The unrelated untracked startup
diagnostic is untouched. No push/publication has occurred at this checkpoint.

Final normal-update verification: all172test files /692tests pass in
`work/v84-normal-update-final-verification.log`. The following historical guard
chain exposed a test-loader incompatibility: v43/v44/v45 used CommonJS
transpilation without Vite JSON-glob support. The original v43 invocation failed
with `exports is not defined` at the real regional-resource import. A shared
test-only adapter now enumerates the actual local JSON packages, preserving
lazy loading and the original assertions; no production renderer was changed.
All44historical guards then exit0 in
`work/v84-normal-update-legacy-green.log`, including9output-composition tests
and the explicitly disclosed partial-v84 gate. This supplements the successful
build,5browser cases and actual isolated native smoke described above.
