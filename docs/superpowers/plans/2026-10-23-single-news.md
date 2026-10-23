# Single News Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show exactly one complete RSS story at a time, with optional feed image, description and source logo, for at least 20 seconds.

**Architecture:** Extend the existing main-process adapters and immutable external-loop snapshots. A pure shared news timeline determines the current story, text scrolling and minimum total duration; every renderer consumes the same prepared content and epoch.

**Tech Stack:** TypeScript, React, Electron 37, existing saxes/sharp, Vitest, existing hidden Electron output probe.

**Spec:** `docs/superpowers/specs/2026-10-23-single-news-design.md`

## Global Constraints

- Minimum 20 seconds per story; configured duration is a per-story lower bound.
- Keep the frozen take, common epoch, source logos, 24-hour news retention and bounded cache.
- No network requests in outputs; only feed-provided descriptions/images; no HTML execution or article scraping.
- Preserve football results/ranking behavior while adding logos; preserve unrelated `tests/smoke/startup-diagnostic.cjs`.
- No dependency additions, monitor/audio changes, incomplete-localization claims or overwrite of published 0.86.0.

## Review Focus

- Missing, broken or disallowed image must preserve readable story and correct branding.
- Malicious HTML/URL/MIME/redirect or image decompression bomb must not reach a renderer.
- Old caches without new optional fields remain usable; bad new fields fail validation.
- Late mirrors and boundary timestamps must show the same single story, never multiple cards.
- Long text and reduced-motion settings must preserve every character and sufficient duration.

### Task 1: Normalized feed content and bounded prepared images

**Files:** modify `shared/externalLoop.ts`, `shared/externalLoopValidation.ts`, `electron/externalLoop/news.ts`, `electron/externalLoop/service.ts`; create `electron/externalLoop/newsImages.ts` and tests; extend `electron/externalLoop/news.test.ts`, shared validation tests and fixture XML.

**Interfaces:** add optional `description:string`, `imageDataUrl:string`, `imageCredit:string` to NewsEntry, retaining legacy objects. `parseNews` supplies plain description and an allowlisted feed-image candidate for main-process preparation only; candidate URLs are removed before public transport. The image loader consumes `(source, url, signal)` and returns a bounded JPEG data URL or null. `NewsAdapter` receives it by dependency injection, hydrates at most the source's ten newest eligible stories, and persists only normalized public content.

- [ ] Write tests for RSS description/enclosure, Atom summary/content/media image, source-correct logo attribution, missing-image fallback and HTML removal. Assert cache/IPC rejection of unsafe extra fields and oversized image data; old entries remain accepted.
- [ ] Run targeted Vitest and observe feature-missing failures before implementation.
- [ ] Implement source-specific HTTPS allowlist, bounded redirects/time/body, MIME checks and sharp pixel/decode/output limits. Limit normalized images to 96 KiB JPEG so ten images plus normal text fit existing cache limits; do not start image I/O after disposal. Raw candidate URLs never enter public snapshots. No image failure may drop a valid story.
- [ ] Test stream timeout/abort, wrong MIME, private URL, oversized body/pixels/output, cache/offline reuse and maximum hydration count. Use injected in-memory fetch responses; no live external requests in tests.
- [ ] Run all affected parser/cache/IPC tests and TypeScript; commit only own files.

### Task 2: Synchronized single-story layout and readable timing

**Files:** create `src/externalLoop/newsPresentation.ts`, `src/externalLoop/NewsStoryView.tsx` and their tests; modify `src/externalLoop/model.ts`, `View.tsx`, `styles.css`, `Designer.tsx` and related tests.

**Interfaces:** `prepareNewsPresentation(entries, durationSeconds)` returns immutable story segments with start/end offsets and minDurationMs. `newsFrameAt(plan, elapsed)` returns exactly one story and text-motion offset. Existing `externalLoopMinimumDuration(snapshot, settings)` returns total news timeline duration, while football calculations are unchanged. `NewsStoryView` uses no network API and consumes current story, elapsed and reduced-motion state.

- [ ] Write failing tests asserting at least 20,000 ms per story, larger configured lower bound, longer description duration, exact boundary switch, empty handling, no mutation and identical late-mirror selection. Cover every character in reduced-motion continuations.
- [ ] Run tests and observe expected failures, then implement pure timing functions and connect existing minimum-duration/controller paths.
- [ ] Write failing DOM tests asserting exactly one article/image/correct source logo, absence of later story titles, timed next story, image failure layout, plain HTML-safe description, complete long text and static preview.
- [ ] Implement image-left/text-right layout, full-width fallback, Cera Pro and source branding. Scope news CSS so football is unchanged. Update designer labels to explain duration per story and total calculated duration.
- [ ] Run parser, model, view, designer, controller and frozen-take regression tests; commit.

### Task 3: Real renderer verification and handoff

**Files:** extend `tests/smoke/external-loop-output.tsx` and `.cjs`; record evidence under `docs/superpowers/evidence/2026-10-23-single-news.md`.

- [ ] Add hidden native fixtures with a local prepared JPEG, description, second story, no-image source, overflowing text and reduced-motion continuation. Replace obsolete list-specific logo-position assertions with current-story logo contrast/bounds tests; retain football/clock/technical and frozen-take checks.
- [ ] Run `node node_modules/vitest/vitest.mjs run --maxWorkers=4 --minWorkers=1`, `npx tsc --noEmit`, `npm run build`, `node scripts/test-external-loop-native.cjs` and `git diff --check`.
- [ ] Inspect captured first/second/no-image/long-text frames; verify no overlap/cropping, logo readability, watermark above content and mirror consistency. Keep original installed app and physical outputs untouched.
- [ ] Record exact outcomes and any limitations, review all changes natively, commit own changes and report what is implemented versus published. No automatic re-publication of the existing version.

### Approved expansion (execute before Task 3)

- [ ] Task 4: Reuse bounded raster-image preparation for optional FootballTeam.logoDataUrl; hydrate provider teamIconUrl centrally, join by stable team ID for table/matches. RED→GREEN tests for association, unsafe/missing images and unchanged scores/ranks; render beside club names.
- [ ] Task 5: Extend strict request/snapshot/settings unions with weather, using fixed Open-Meteo forecast/geocoding endpoints, Bielefeld defaults (52.0302, 8.5325), Europe/Berlin, current conditions and three daily forecasts. Add bounded adapter/cache tests (invalid dates/units/null data, stale expiry, request validation), operator-only explicit location search, native shared WeatherView and designer. Route weather through the frozen ExternalLoop path; remove active external iframe/preload branches. Test view/designer/frozen-output behavior and legacy migration.
- [ ] Task 6: Reserve a header region in all prepared announcement designs. Add info icon and green #699f3e „Aktuelle Infos“ badge with white text and bottom-right rounding; preserve per-message title, QR and rich-text scrolling. RED→GREEN geometry and rendered-slide tests; verify no clipping in all eight designs.

Execution is native by the root author as previously requested. The user approved the plan and these additions; no further duplicate approval gate is needed. Author review is not an independent review. No publication is implied by local implementation.
