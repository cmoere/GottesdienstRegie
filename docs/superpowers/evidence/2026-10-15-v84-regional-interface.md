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

No regional UI or documentation text packs have yet been authored. Complete
31-variant translations, source integration, native synchronization, selector,
race protection, native/layout tests, final review and release metadata remain.
No version bump, publication, remote push, installer change, speech activation or
Firebase write has occurred. The public version remains v0.83.0.
