# v95 regional documentation

The user requires all 31 regional variants to be complete before normal publication. No partial v95 release is authorized.

All31 runtime packages are in `src/regional/docs/`. The current German source has63 help articles and1628 release fields, including18 new v95 fields. The interface package has2262 UI and110 native resources per region. Source-copy classification now has no remaining review-required candidates; the full-completion manifest is now enabled after the updated interface guide, release translations and strict final verification passed.

The 16 formerly missing documentation packages were fully integrated. Their original32 draft files have been retired from active authoring and preserved byte-for-byte in `archive/integrated-drafts/`, with a SHA256 manifest and source-history pointer. The strict checker was not weakened; current runtime documentation still requires exact keys, facts, paragraphs, related IDs, links and placeholders for every region.

Useful checks:

```text
node scripts/check-v95-regional-completion.cjs
node scripts/test-operator-design.cjs
node scripts/test-operator-design.cjs --real
node node_modules/vitest/vitest.mjs run --maxWorkers=2
```

All current translations and the strict all31 gate pass. Runtime fallback and key counts alone do not establish completed translation. See ../v95-verification.md for the complete verification and publication ledger.
