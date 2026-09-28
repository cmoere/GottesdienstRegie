# GottesdienstRegie V62 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish GottesdienstRegie 0.62.0 with correct installer text encoding, private and robust AI-response handling, a clean MAIN signal, an animated responsive Bible overlay, and a keyless Spotify link importer.

**Architecture:** Keep each change behind a focused boundary: a terms encoding helper, a pure AI-response normalizer, a presentational Bible overlay, and a main-process Spotify oEmbed service exposed through the existing preload bridge. Existing live state, Bible payloads, and local Spotify reference storage remain authoritative.

**Tech Stack:** TypeScript 5.9, React 19, Electron 37, Zustand, Vitest, Testing Library, CSS, Node.js release scripts, electron-builder/NSIS

**Spec:** `docs/superpowers/specs/2026-09-28-v62-output-ai-bible-spotify-design.md`

## Global Constraints

- Release version is exactly `0.62.0` with release series `0.62`.
- Do not alter the supplied Bible worker.
- Do not introduce Spotify scraping, a bundled credential, playback control, or a claim that Spotify audio streams inside GottesdienstRegie.
- Do not render or persist Spotify oEmbed HTML.
- Do not expose model system prompts, schemas, context, or raw failed responses in the chat.
- Preserve reduced-motion behavior and accessible complete Bible text in the DOM.
- Do not stage or modify the unrelated untracked `.superpowers/` directory.

## Review Focus

- A Spotify URL with query parameters or an unsupported entity must normalize safely or fail without opening an arbitrary URL; Task 5 tests both cases.
- A local model may echo braces inside its prompt before the real JSON; Task 2 tests extraction of the schema-valid object rather than a greedy substring.
- NSIS must consume UTF-16LE while web terms remain UTF-8; Task 1 tests both outputs independently.
- A long Bible passage must not overflow and reduced-motion must expose the final state immediately; Task 4 tests both behaviors.
- Removing the audience-facing LIVE badge must not remove operator live state or controls; Task 3 tests the render boundary.

---

### Task 1: Generate an NSIS-safe license file

**Files:**
- Create: `scripts/terms-encoding.cjs`
- Create: `scripts/terms-encoding.test.ts`
- Modify: `scripts/generate-terms.cjs`
- Modify: `scripts/check-version43.cjs`
- Modify: `scripts/check-version54.cjs`

**Interfaces:**
- Produces: `encodeUtf16LeBom(text: string): Buffer` and `decodeUtf16LeBom(buffer: Buffer): string`
- Consumes: `plainTerms()` from `src/termsContent.ts`

- [ ] **Step 1: Write failing encoding tests**

Add tests named `encodes installer terms as UTF-16LE with BOM`, `round-trips German punctuation without mojibake`, and `keeps generated web terms UTF-8`. Assert leading bytes `FF FE`, exact decoded phrases `für`, `gültig`, and `Nutzungsbedingungen`, and absence of `Ã`, `Â`, and `â€“`.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx vitest run scripts/terms-encoding.test.ts`

Expected: FAIL because `terms-encoding.cjs` and the UTF-16 output do not exist.

- [ ] **Step 3: Implement the encoding boundary**

Create the two helper functions, make `generate-terms.cjs` use UTF-16LE+BOM only for `build/terms.txt`, and update legacy guards to decode the installer file through the helper rather than `utf8`.

- [ ] **Step 4: Generate terms and verify GREEN**

Run: `node scripts/generate-terms.cjs && npx vitest run scripts/terms-encoding.test.ts && node scripts/check-version43.cjs && node scripts/check-version54.cjs`

Expected: all commands PASS and the generated license starts with `FF FE`.

- [ ] **Step 5: Commit**

```bash
git add scripts/terms-encoding.cjs scripts/terms-encoding.test.ts scripts/generate-terms.cjs scripts/check-version43.cjs scripts/check-version54.cjs build/terms.txt public/terms/index.html
git commit -m "fix(installer): preserve terms text encoding"
```

### Task 2: Keep internal AI prompts private and parse local output safely

**Files:**
- Create: `src/ai/generatedResponse.ts`
- Create: `src/ai/generatedResponse.test.ts`
- Modify: `src/ai/assistantController.ts`
- Modify: `src/ai/assistantController.test.ts`
- Modify: `src/ai/AiAssistantPanel.tsx`
- Modify: `src/ai/AiAssistantPanel.test.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `normalizeGeneratedResponse(raw: unknown, validate: (candidate: unknown) => boolean): unknown`
- Consumes: `parseAiAssistantResponse(candidate)` as the final schema authority

- [ ] **Step 1: Write failing normalization tests**

Cover direct objects, single-item `generated_text` wrappers, fenced JSON, a repeated system prompt before JSON, braces inside echoed prose, multiple candidate objects where only one passes validation, and a response without valid JSON. Assert that raw prompt/schema text is never returned as a message.

- [ ] **Step 2: Write failing controller and panel regressions**

Assert that a valid plan following an echoed prompt succeeds, an invalid response only sets the compact retry error, no raw response is added to `messages`, the panel contains neither `LOKAL · OHNE API-SCHLÜSSEL` nor `Lokale KI arbeitet`, and the progress label reads `KI-Helfer arbeitet`.

- [ ] **Step 3: Run targeted tests and verify RED**

Run: `npx vitest run src/ai/generatedResponse.test.ts src/ai/assistantController.test.ts src/ai/AiAssistantPanel.test.tsx`

Expected: FAIL on missing normalizer and current visible copy.

- [ ] **Step 4: Implement minimal safe normalization and neutral copy**

Move response unwrapping out of the controller. Scan balanced JSON object candidates in output order, accept only a candidate that passes the supplied schema validation, and discard all surrounding text. Update the controller to publish only `response.message` after validation. Replace user-facing local/API claims in the panel and the AI-related help/onboarding strings found in `App.tsx` with neutral wording.

- [ ] **Step 5: Verify GREEN and audit copy**

Run: `npx vitest run src/ai/generatedResponse.test.ts src/ai/assistantController.test.ts src/ai/AiAssistantPanel.test.tsx`

Run: `rg -n -i "lokal.*api|ohne api|api.?schlüssel|Lokale KI arbeitet" src public RELEASE_NOTES.md`

Expected: tests PASS; the audit returns no user-facing KI claim covered by the spec.

- [ ] **Step 6: Commit**

```bash
git add src/ai/generatedResponse.ts src/ai/generatedResponse.test.ts src/ai/assistantController.ts src/ai/assistantController.test.ts src/ai/AiAssistantPanel.tsx src/ai/AiAssistantPanel.test.tsx src/App.tsx
git commit -m "fix(ai): hide prompts and normalize generated responses"
```

### Task 3: Remove the audience-facing MAIN live marker

**Files:**
- Create: `src/MainOutputSurface.test.tsx`
- Modify: `src/ProductionWorkspace.tsx`
- Modify: `src/preview-workspace.css`

**Interfaces:**
- Consumes: existing `live` state and output role
- Produces: unchanged operator status, MAIN render without `.preview-live-badge`

- [ ] **Step 1: Write the failing render-boundary test**

Render the audience MAIN surface with live state and assert that it contains neither the text `LIVE` nor `.preview-live-badge`, while an operator-facing live control remains present in its own surface.

- [ ] **Step 2: Run the test and verify RED**

Run: `npx vitest run src/MainOutputSurface.test.tsx`

Expected: FAIL because the MAIN card currently renders the badge.

- [ ] **Step 3: Remove only the audience badge**

Delete the MAIN badge branch and its now-unused CSS. Preserve `live` props, ON AIR controls, preflight, grid/timeline state, and operator-only markers.

- [ ] **Step 4: Verify GREEN**

Run: `npx vitest run src/MainOutputSurface.test.tsx src/live/quickOverlayState.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/MainOutputSurface.test.tsx src/ProductionWorkspace.tsx src/preview-workspace.css
git commit -m "fix(output): remove live badge from main signal"
```

### Task 4: Redesign and animate the Bible quick overlay

**Files:**
- Create: `src/BibleQuickOverlay.tsx`
- Create: `src/BibleQuickOverlay.test.tsx`
- Modify: `src/QuickOverlay.tsx`
- Modify: `src/version57.css`

**Interfaces:**
- Produces: `BibleQuickOverlay({ quick, reducedMotion, staticPreview }: { quick: QuickScreenConfig; reducedMotion: boolean; staticPreview: boolean })`
- Consumes: existing `QuickScreenConfig.pages`, `pageIndex`, `reference`, `translation`, and full verse text

- [ ] **Step 1: Write failing semantic and layout-state tests**

Assert that reference, translation, every verse line, verse numbers, and page indicator render; long pages receive a density class; page changes replace the keyed page; and reduced-motion/static-preview modes add a no-animation class while keeping all text in the DOM.

- [ ] **Step 2: Run the tests and verify RED**

Run: `npx vitest run src/BibleQuickOverlay.test.tsx`

Expected: FAIL because the focused component and state classes do not exist.

- [ ] **Step 3: Extract the component and implement responsive states**

Calculate density from character/line counts, emit deterministic animation-delay CSS variables per line without hiding text from accessibility APIs, and keep pagination sourced from the existing payload. Pass renderer mode/reduced-motion state from `QuickOverlay` without changing the payload contract.

- [ ] **Step 4: Implement the visual system and effects**

Replace the current Bible CSS with a shadow-free, full-frame paper/book composition. Add typewriter/ink reveal, line withdrawal on overlay exit, and page-turn transitions. Gate all animation under `prefers-reduced-motion` and the explicit no-animation class. Use `overflow-wrap`, clamped typography, safe padding, and density variants to prevent clipping.

- [ ] **Step 5: Verify GREEN**

Run: `npx vitest run src/BibleQuickOverlay.test.tsx src/live/quickOverlayState.test.ts`

Expected: PASS with no React accessibility warnings.

- [ ] **Step 6: Commit**

```bash
git add src/BibleQuickOverlay.tsx src/BibleQuickOverlay.test.tsx src/QuickOverlay.tsx src/version57.css
git commit -m "feat(bible): redesign animated quick overlay"
```

### Task 5: Replace default Spotify account search with keyless link import

**Files:**
- Create: `electron/SpotifyOEmbedService.ts`
- Create: `electron/SpotifyOEmbedService.test.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/spotify/types.ts`
- Modify: `src/spotify/SpotifyBrowser.tsx`
- Create: `src/spotify/SpotifyBrowser.test.tsx`
- Modify: `src/SpotifySettings.tsx`
- Modify: `src/vite-env.d.ts`

**Interfaces:**
- Produces: `normalizeSpotifyTrackUrl(input: string): { trackId: string; url: string }`
- Produces: `SpotifyOEmbedService.resolve(input: string): Promise<SpotifyTrackReference>`
- Produces bridge method: `desktop.spotify.resolve(url: string): Promise<SpotifyTrackReference>`
- Consumes: official `GET https://open.spotify.com/oembed?url=<encoded-track-url>`

- [ ] **Step 1: Write failing URL and oEmbed service tests**

Test canonical track URLs, query removal, rejection of HTTP, deceptive hosts, albums/playlists, malformed IDs, timeout/non-OK responses, wrong providers, absent titles, and mapping that excludes the response `html` field.

- [ ] **Step 2: Write failing browser tests**

Assert that the default UI asks for a Spotify track link rather than title search/account connection, resolves on Enter or button click, shows title/image, saves at most one reference per track ID, opens only the normalized URL, and offers retry on service failure.

- [ ] **Step 3: Run targeted tests and verify RED**

Run: `npx vitest run electron/SpotifyOEmbedService.test.ts src/spotify/SpotifyBrowser.test.tsx`

Expected: FAIL because the service, bridge method, and link UI do not exist.

- [ ] **Step 4: Implement the main-process service and bridge**

Validate and normalize before network access, request oEmbed with the existing `fetch` and a 12-second timeout, validate provider/title/thumbnail primitives, discard HTML, and register `spotify:resolve`. Keep `spotify:open` restricted to normalized Spotify track URLs.

- [ ] **Step 5: Implement the keyless renderer flow**

Replace search pagination with URL input, preview, save, retry, and external-open actions. Hide OAuth connection controls when no configured Client ID is available; do not claim account search works. Preserve existing local reference format with optional artist/album fields empty when oEmbed cannot supply them.

- [ ] **Step 6: Verify GREEN**

Run: `npx vitest run electron/SpotifyOEmbedService.test.ts src/spotify/SpotifyBrowser.test.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add electron/SpotifyOEmbedService.ts electron/SpotifyOEmbedService.test.ts electron/main.ts electron/preload.ts src/spotify/types.ts src/spotify/SpotifyBrowser.tsx src/spotify/SpotifyBrowser.test.tsx src/SpotifySettings.tsx src/vite-env.d.ts
git commit -m "feat(spotify): add keyless track link import"
```

### Task 6: Prepare, verify, and publish version 0.62.0

**Files:**
- Create: `scripts/check-version62.cjs`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `public/releases.json`
- Modify: `RELEASE_NOTES.md`
- Modify: `.github/workflows/release.yml`
- Modify: release/version copy files discovered by `rg -n "0\\.61\\.0|releaseSeries" . --glob '!node_modules/**' --glob '!release/**' --glob '!dist/**'`

**Interfaces:**
- Produces: release guard `node scripts/check-version62.cjs`
- Consumes: completed Tasks 1–5 and existing GitHub release workflow

- [ ] **Step 1: Write the failing V62 release guard**

Assert exact version/series, V62 as the current release-catalog entry, V62 release notes, workflow inclusion, UTF-16LE license BOM, absence of the MAIN badge and user-facing API/local claims, presence of safe AI normalization, and presence of the Spotify oEmbed service/link UI.

- [ ] **Step 2: Run the guard and verify RED**

Run: `node scripts/check-version62.cjs`

Expected: FAIL because metadata and workflow still point to V61.

- [ ] **Step 3: Update version and release documentation**

Set `version` to `0.62.0`, `releaseSeries` to `0.62`, prepend complete German V62 notes and release-catalog metadata, add the guard to `verify:release` and the workflow, and regenerate terms.

- [ ] **Step 4: Run focused and complete verification**

Run: `node scripts/check-version62.cjs`

Run: `npm run test:unit`

Run: `npm run typecheck`

Run: `npm run build`

Run: `npm run verify:release`

Expected: every command exits 0 with no omitted failing test.

- [ ] **Step 5: Build and inspect the Windows installer license**

Run: `npm run installer`

Expected: `release/GottesdienstRegie-Setup-0.62.0.exe` is produced. Launch the installer in a controlled check and confirm `für`, `gültig`, and the dash in the license page render correctly.

- [ ] **Step 6: Commit release preparation**

```bash
git add package.json package-lock.json public/releases.json RELEASE_NOTES.md .github/workflows/release.yml scripts/check-version62.cjs build/terms.txt public/terms/index.html
git commit -m "chore(release): prepare version 0.62.0"
```

Stage any additional version-copy file reported by the audit explicitly by its real path before this commit; never use a wildcard that could include `.superpowers/`.

- [ ] **Step 7: Publish and verify artifacts**

Push the release branch/tag through the repository's existing release workflow. Verify the GitHub release is public, all Windows/Linux/macOS assets are present, workflow checks are green, and the downloadable Windows installer matches version `0.62.0`.

- [ ] **Step 8: Record the published URL and final commit**

If publication metadata changes after the workflow, commit only those generated release records. Report the public release URL, installer asset, verification commands, and any platform packaging limitation.
