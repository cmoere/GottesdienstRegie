# 0.75.3 — Post-program test selection and startup data

## Scope and causes

- The renderer preflight previously started its community subscription and immediately inspected an empty snapshot. It now waits for initial IPC data and synchronization, bounded to four seconds so an offline rehearsal remains possible.
- FirebaseGemeindeService did not replay connection state to late subscribers or synchronized empty collections. Both are replayed, with collection synchronization flags. Stable Firebase child event keys take precedence over legacy IDs in preflight.
- The legacy presentation information dialog wrote only eventId. Store updates now synchronize it with eventLink; unlinking clears both. Canonical-only documents also initialize the legacy field, and malformed canonical values safely fall back.
- Test start offers Automatic / Leave room / Test event. The latter two use explicitly chosen, runtime-only scenarios and can reach post-program without a linked event. Sample events are labeled and never written to Firebase or saved as presentation data. Stop/document load clears the choice; normal ON AIR clears it too.
- Leave-room text is regular weight 400 and 3cqw rather than bold 800 and 2.8cqw.

## Verification

- Red/green regression tests reproduced missing late connection replay, missing immediate event linkage, canonical-only document mismatch, malformed import crash, and unavailable test scenarios before their fixes.
- Final full suite: 93 files / 292 tests passed. Release guards 55–75 passed; build succeeded (existing large-bundle advisory remains).
- One intermediate full run failed the existing Windows `CommunitySnapshotCache > serializes concurrent child-event snapshots and retains the latest` test with a temporary-file rename EPERM. The unchanged isolated cache suite and subsequent complete suite passed. No cache test was disabled or weakened.
- Independent read-only review checked state persistence, normal/test separation, stable transitions, linking and IPC replay. Follow-up identified an unguarded malformed canonical-key import; a red/green regression and type guard were added.
- `tests/smoke/native-full-app-postprogram.cjs` drives the actual App start dialog, preflight, subscriptions, store navigation and output effects. It uses the production preload and built MAIN renderer, not a duplicated start/controller flow. An isolated demo session and fake peripheral/Firebase adapter prevent changes to real records or physical outputs.
- Native checks passed for linked automatic output with no false missing-data/link warning, unlinked leave-room, unlinked labeled test event, last-service Next, MAIN watermark, normal ON AIR without test data/watermark, and transient selection reset. Computed MAIN text weight is 400 and size exceeds the former 54px at 1920px width. Screenshots inspected under `work/full-app-postprogram`.
- Early harness attempts needed extra cold Vite load time and a whitespace-tolerant check for a naturally wrapped test title. No product behavior was changed to satisfy those harness issues.

## Reproduce

1. `npm run build`
2. Start `npx vite --host 127.0.0.1 --port 5173 --strictPort`
3. `npx electron tests/smoke/native-full-app-postprogram.cjs`
4. To exercise packaged MAIN/preload/service, append `--packaged=work/postpackage753/win-unpacked/resources/app.asar` after packaging there.

## Limits

Real account authentication, Firebase permissions/reconnects, physical monitor placement and audio devices are not asserted by the isolated harness. Automatic mode still requires a real linked event and resolvable effective room; unknown room data must not fabricate a visitor-facing leave-room instruction. Publication evidence is recorded after the public installer and update feed are verified.
