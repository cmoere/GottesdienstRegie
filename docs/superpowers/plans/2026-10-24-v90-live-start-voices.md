# v90 live start and voices implementation plan

Execution: root natively, using executing-plans and test-driven-development. No technical delegation.

Goal: restore guarded ON AIR/test startup and central bundled male/female speech selection.
Spec: ../specs/2026-10-24-v90-live-start-voices-design.md
Architecture: existing liveSession guard and LiveEngine; existing device AnnouncementSettings → native speech boundary → bundled Java worker. No additional player or database.

## Tasks
- [x] Reproduce stale reference false positive and assignment order with tests; extract semantic startup guard and capture fresh store state. Keep genuine changes/permission denial blocked and test/production behavior intact.
- [x] Pin official female voice artifact with size/SHA256/license; extend build preparation/private worker whitelist and finite WAV tests. Actually synthesize both voices muted.
- [x] Extend existing shared settings validation/repository/IPC and settings selector; preserve existing male data, reuse test owner and cancellation. Test both scheduling and shared selection.
- [x] Isolated native output startup, full suite, build, release guard and author review. Record exact outcomes/remaining physical limits; prepare verified normal v90 delivery under established authorization.
- [x] User steering: louder speech with bounded lookahead envelope; condensed multi-message ribbon, matched repeat stride/cycle; native loudness and visual verification; extend release texts and final checks.
