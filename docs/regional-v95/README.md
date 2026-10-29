# v95 regional documentation work in progress

The user requires all 31 variants to be complete before publication. No partial v95 release is authorized.

`help-drafts/` and `release-drafts/` preserve authored translations from the translation-only workers outside the runtime import glob. All 16 originally missing documentation packages have now been completed, validated and integrated into `src/regional/docs/`; all 31 runtime packages cover the current German documentation source. Existing committed runtime documentation was preserved.

Every saved article is checked with `validateRegionalDocumentation` against its exact assembled German source, including placeholders, paragraph count, numbers, links and related article identities. Validation of a subset does **not** establish coverage of missing articles. The complete source has 63 help articles and 1,610 historical release fields (before v95 notes).

To resume: finish the remaining source-copy inventory and operator interface review before marking availability complete. All 31 interface files currently contain 1989 UI and 55 native entries. This namespace coverage does not establish that every remaining source literal is bound. Preserve existing translations. When the German help or release source changes for v95, update runtime translations and validate retained drafts against that source, or retire the integrated drafts deliberately rather than leaving stale fact checks.

Useful checks:

```text
node scripts/check-v95-regional-completion.cjs
node scripts/test-operator-design.cjs
node scripts/test-operator-design.cjs --real
node node_modules/vitest/vitest.mjs run --maxWorkers=2
```

The completion check must fail while any requested resource surface is incomplete. Do not weaken the check or copy fallback text to turn the indicator green.
