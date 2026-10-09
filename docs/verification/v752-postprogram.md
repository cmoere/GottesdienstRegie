# 0.75.2 — Post-program navigation and preview

## Scope

- Next-button eligibility uses the same live target resolver as navigation. A linked final service slide can reach the generated post-program target, and repeat takes remain available in the post loop.
- Both live previews render the committed room-notice snapshot sent by LiveEngine, not a new independent event calculation. Failed or out-of-order acknowledgements cannot replace that snapshot. Stopping clears it.
- Room notices are runtime-only and do not become editable slide content. Edit mode and offline preview do not inherit the live overlay.
- The sidebar's caption CSS no longer clips or recolors the room-leave paragraph.
- Existing effective-room, inclusive 61-minute window, stable session color, safe-transition and manual-slide behavior remains in place.

## Evidence

- Before implementation, both UI regression tests failed: Next disabled at the final linked service slide; room notice absent from both previews.
- Four UI regressions pass, including normal/test mode, repeat takes, unlinked end, and edit/off-air isolation.
- Three delivery regressions cover late acknowledgements, stop during an in-flight send, and rejected delivery.
- Final full verification: 90 files / 282 tests passed, release guards 55–75 passed. Older guards 39–54 passed separately. Build and typecheck passed.
- One full run encountered the existing Windows `EPERM` in `CommunitySnapshotCache > serializes concurrent child-event snapshots and retains the latest`. The isolated cache suite and complete rerun passed unchanged.
- Independent read-only review identified the sidebar paragraph CSS collision. A native computed-style assertion reproduced `nowrap`; it passes after the scoped reset.
- Native Electron fixture exercises the real workspace Next button, store, room/event services, controller, LiveEngine/preload IPC and built MAIN renderer. It covers all matching events through exactly 61 minutes, no raw room ID, deferred cancellation update, leave-room fallback, stable color and test watermark. MAIN and operator captures were inspected using offscreen rendering (hidden-window captures otherwise retained stale compositor frames).
- Native fixture uses only isolated in-memory event data and an isolated Electron profile. It does not modify the user's presentation or Firebase.

## Reproduce native check

1. `npm run build`
2. Start Vite: `npx vite --host 127.0.0.1 --port 5173 --strictPort`
3. `npx electron tests/smoke/native-postprogram.cjs`
4. Optional packaged MAIN: append `--packaged=work/postpackage/win-unpacked/resources/app.asar`.

## Limits

- A resolvable linked event and effective internal room remain required; missing data does not fabricate a visitor-facing leave-room notice.
- The harness connects the existing components with deterministic test data; actual monitor placement and the user's live Firebase records were not altered or validated.
- Existing timer behavior for authored multi-slide loop items and sidebar quick-screen mirroring were not redesigned.
- Initial local packaging hit a Windows file lock at `release/win-unpacked.tmp`; packaging is retried in a fresh output directory without deleting user data.

## Package and publication

- Fresh local Windows packaging completed successfully under `work/postpackage`. The native smoke also passed against its packaged MAIN renderer and preload.
- Source commit: `660a1b4d13d9b2d7b550e76ca0b57016bb6aa645`.
- Release workflow: `37999472148`.
- Public Windows installer was fully downloaded: 287770310 bytes. Its SHA512 matches public `latest.yml`:
  `Y0hixMzuxlJ2Fk9Y2xuNsRgHNW5Oqjnj2TLMPfHPLEQOKgGIxMA10mVLv2CpS80B1uOan6/PjwlYRgLn+RYYfg==`.
- Public `latest.yml` identifies `0.75.2`, and GitHub `/releases/latest` with the updater's JSON accept header returns `v0.75.2`.
- Release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.75.2
- Installer: https://github.com/cmoere/GottesdienstRegie/releases/download/v0.75.2/GottesdienstRegie-Setup-0.75.2.exe
