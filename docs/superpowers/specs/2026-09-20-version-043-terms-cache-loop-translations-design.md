# GottesdienstRegie 0.43.0 – Terms, Cache, Loop and Translation Reliability

## Goal

Version 0.43.0 makes the legal text durable and publicly accessible, repairs loop-item insertion and translation-pack downloads, adds safe storage cleanup, replaces emoji flags with local SVG artwork, and refreshes the event-link entry without changing live outputs.

## User outcome

- The complete terms are readable in the app, installer and on a dedicated public page at `/terms/`, separate from release notes.
- Pre- and post-program loop items can be added exactly once and appear in the selected section.
- The event-link control clearly communicates current state and opens a focused selection dialog.
- Settings show removable application storage by category and clear it only after explicit confirmation.
- Translation models download with byte-based progress, survive errors safely and become ready only after validation.
- Language rows use bundled SVG flags or a neutral language-code badge; no emoji flags are rendered.

## Shared terms source

Create one structured German terms source with a stable version and effective date. It covers scope, eligibility and accounts, operator responsibility, presentation and live-output risks, media and copyright responsibility, third-party services, cloud synchronization, local data, translation models, updates, availability, prohibited use, warranties, liability limits subject to mandatory German law, indemnity for unlawful content, changes, termination, severability, governing law and contact.

The in-app dialog and the static `/terms/` page render that source. `build/terms.txt` is generated from the same content for the NSIS license screen. The online page has its own navigation, print stylesheet, anchor links, last-updated information and no release-note content. App links use the canonical GitHub Pages URL. The repository workflow publishes both `/release-notes/` and `/terms/` without placing either inside the other.

## Loop insertion repair

The add popover derives its visible items from `menuItemTypesForSection`. For pre/post sections it renders a single responsive grid of loop-only items. Clicking one option calls a pure item factory with the actual target section id, closes the popover only after insertion, selects the new item and never routes through the standard-item branch. The popover remains inside the viewport and uses consistent spacing, icon size and focus order.

Regression coverage asserts every loop option, the selected section id, one inserted item per click and absence of standard items in loop sections.

## Event-link refresh

Replace the compressed text link under the presentation title with a full-width status row using the existing event icon. Unlinked state reads “Veranstaltung verknüpfen”; linked state shows title, date and planned time plus a change affordance. The selection dialog keeps chronological groups, search, cancellation state and explicit save. Narrow layouts wrap details without overlapping the help icon or sidebar.

## Storage management

Add an Electron `StorageMaintenanceService` restricted to known application-owned locations: translation packs, Transformers cache, media cache, thumbnails, temporary downloads and web cache. It returns category sizes and a total using filesystem traversal that ignores missing files and rejects paths outside the approved roots.

Settings → Allgemein → Speicher shows the current total and each category. “Speicher leeren” opens a confirmation dialog listing selected categories and size. Confirming clears only removable caches, not presentations, accounts, preferences, media-library originals, terms acceptance or saved translations. The UI refreshes sizes after completion and reports partial failures by category. Cache clearing is disabled while a translation download is active or the application is ON AIR.

## Translation downloads

The Electron service downloads declared model files as streams rather than buffering entire ONNX models in memory. It reports downloaded and total bytes, writes into a unique temporary directory, checks required files and non-zero sizes, writes the manifest last, then atomically renames into the final revision directory. Cancellation, network failure or application restart removes stale temporary directories and never reports ready.

The catalog distinguishes direct supported model pairs from unsupported pairs. Unsupported directions remain visible but explain that no local package is available instead of starting a guaranteed 404. Settings allow search, download, cancel, retry and remove. Startup refreshes status but does not automatically download large models.

## SVG flags

Add a `FlagIcon` component backed by local SVG assets for catalog languages. Flags are decorative beside an explicit language name and code. Languages without a suitable national flag use a neutral globe SVG because languages and countries are not one-to-one. No network requests or emoji glyphs are used.

## Error handling and safety

- Legal-page publication failure blocks the release workflow.
- Cache size and cleanup errors are presented without deleting unapproved data.
- Loop insertion validation remains enforced in the store for non-menu paths.
- Translation errors include actionable German messages and preserve existing translated text.
- None of these settings or visual changes affect MAIN, STAGE, livestream or recorded output.

## Verification and release

Add version 0.43 domain checks for terms parity, loop factories, approved cache roots, byte progress, atomic cancellation, supported model pairs and SVG coverage. Run existing version checks, typecheck, production build and platform packaging. Publish `v0.43.0`, verify the dedicated terms URL, release assets and updater metadata before declaring completion.
