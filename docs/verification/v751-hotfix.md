# 0.75.1 — Live flow hotfix

## Scope

- Test start directly uses the live engine after explicit output confirmation.
- Production ON AIR requires an event; leaving an active test requires confirmation.
- Old test audio/windows stop before the normal-mode broadcast.
- Live start and navigation use section/item/slide order rather than storage order.
- Advancing past the final service slide creates a post entry when an event is linked and no active post target exists. Manual slides remain manual.
- The generated post entry is inert: it cannot replay final-service video, audio, live inputs or websites. Room notices still use the existing service and safe output transitions.
- Invalid splash-sized stored bounds are discarded when restoring the desktop workspace.

## Verification

- Regression tests were observed failing before their fixes: order/start, post loop wrap, stored splash bounds, and playable media inherited by the generated post entry.
- `src/liveFlowRegression.test.ts`: six tests cover live order, missing post entry, inert media fallback, test/production intent, first target, and loop wrap.
- `electron/windowStartup.test.ts`: seven tests, including splash-bound rejection.
- Independent read-only review found media-replay and watermark handover risks; both were corrected and re-reviewed without remaining blockers in the reviewed changes.
- Full `npm run verify:release`: 88 test files / 275 tests passed; guards 55–75 passed. Earlier guards 39–54 were also checked separately.
- One repeat run encountered transient Windows `EPERM` during the existing cache test's atomic rename. The isolated cache test and the subsequent complete suite passed without changing cache implementation.
- Local Windows NSIS installer build and packaged-entry check passed. Native packaged output smoke passed for initial-state replay, complete event titles, post-event/leave-room rendering and test-watermark states. A final menu-label adjustment is covered by the final source build; the published CI package is built from the final commit.
- Final `npm run build` and native output smoke against that final build both passed.

## Explicit limitations

- The screenshot showing 410×700 operator content inside a full-screen window was not reproduced. An isolated native Electron probe reached matching 1920×1080 window/content/renderer bounds. The stored-bounds guard is not evidence that every possible cause of that screenshot is fixed.
- Room notices require a resolvable linked event and effective internal room, also in test mode. Missing links now produce a preflight warning, not a fabricated visitor-facing notice.
- Existing automatic timers for multi-slide loop items were not redesigned by this hotfix.
- Physical display placement and audible output on the user's hardware still require an on-device check.
