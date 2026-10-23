# Capture deadline correction — specific defect fixed, cadence gate still FAIL

## Approved bounded change

An empty `TryGetNextFrame()` consumed the next absolute30Hz deadline before any
GPU submission. A frame arriving1ms later was therefore rejected until the next
period. The same happened when all target slots were occupied. Only advance the
deadline after a successful capture/submission; keep the existing absolute phase,
latest-only policy, three textures, ownership checks and release rules unchanged.

The capture-at-deadline operation was extracted into a small native template used
by the real producer and native behavioral test, not reimplemented in JavaScript.
Its attempted operation returns false for no source frame/no free slot, true only
after GPU submission. Exceptions propagate without advancing the deadline.

## RED / GREEN

Test authored first; initial extraction retained the old advance-before-attempt
ordering. `work/cadence-red.log`: native executable exit1,
`EMPTY consumed deadline: arriving frame deferred`.
Move advancement after successful attempt: `work/cadence-green.log`, exit0.
Dedicated runnable regression: `node tests/smoke/powerpoint-gpu-cadence.cjs`;
`work/cadence-smoke.log`, `GPU_CADENCE_PASS`, artifact folder `Hryhnf`.
Cases cover empty arrival retry, early gating, occupied-slot retry, absolute
phase after recovery, no missed-period replay, and exception preservation.

## Real measurement, unchanged limits

No heavy tests ran alongside either measurement. Both use owned source on
Monitor1 and two hidden independent1920×1080renderers in isolated Electron45.0.0.
Only known monotone stamps and changed source hashes count; send/ACK totals do not.
No source/display latency or physical scanout claim. No Office phase started.

### Same presentation-event observation as failed baseline

`work/cadence-fixed-benchmark.log`; full raw report in
`work/frame-subscription-spike-PWA2Gw/report.json`. Prior baseline preserved under
`baseline-*` before this run.60000.2499ms:

| Output | Changed frames | Changed fps | Largest gap ms |
|---|---:|---:|---:|
| MAIN |1436|23.933234|209.4627|
| Mirror |1438|23.966567|235.2552|

1293paired,288unmatched; p95skew16.1236ms. FAIL both cadence and gap.
No runtime/cleanup errors, native stop drainedtrue/exit0. Main-only RSS peak
1435045888bytes is a sampled peak, not proof of a persistent leak. Full-image
observation remains disposable and is not adopted into the tracked harness.

### Existing tracked strip observer

`node tests/smoke/powerpoint-gpu-probe.cjs --monitor=1 --electron=work/gpu-runtime-v45.0.0/runtime/electron.exe`

`work/cadence-fixed-standard-benchmark.log`, raw artifact
`work/powerpoint-gpu-probe-cVlszJ/benchmark-report.json`;60006.8889ms:

| Output | Changed frames | Changed fps | Largest gap ms |
|---|---:|---:|---:|
| MAIN |1619|26.980236|78.8097|
| Mirror |1631|27.180213|90.8987|

1598paired,54unmatched; p95skew16.3045ms. Gap/skew pass; cadence FAIL both.
During measurement1797/1800sends and matching ACKs are nearly30Hz, but not proof
of composed30Hz. Whole-run1739captures per output include108/101stale stamps,
4/3unchanged-source,0unknown. No runtime errors; native drainedtrue/exit0.
This isolates a remaining observation/composition boundary but does not prove its
internal cause. Source clock remains unverified; no fabricated latency values.

## Scope and result

The deterministic empty-attempt defect is corrected. It did NOT establish the
required end-to-end cadence; neither measured run is relabeled PASS. No further
transport, observer fallback, security relaxation, runtime upgrade or release.
Product0.85.0 / installed Electron37.10.3 unchanged. Full regional prose, Office
commands/audio, helper-death supervision and product integration remain open.
Do not interpret this narrow fix as completing Task6/7 or the release gate.

## Final verification and author review

- Native cadence regression PASS (`work/cadence-smoke.log`).
- 110/110Node probe cases PASS (`work/cadence-node-tests.log`).
- Native producer/GPU-pattern/owner/replay/resize/minimize checks PASS, including
 1000full-HD GPU patterns (`work/cadence-producer-smoke.log`, `IaH4s5`).
- Actual two-output GPU smoke PASS (`work/cadence-output-smoke-corrected.log`,
 `wKqEyk`). First invocation omitted the required `--monitor=1` argument and
 was rejected before running; that invocation is preserved in
 `work/cadence-output-smoke.log`, not passed off as a product regression.
- Full application suite183files/756tests PASS259.99s
 (`work/cadence-unit-tests.log`), run after the performance measurements.
- Manifest/lockfile unchanged; foreign startup-diagnostic hash unchanged.
 Own benchmark/output Electron processes absent after cleanup.

Root author review only, as requested; no independent review delegation. Reviewed
capture returns, exception propagation, actual submission before advancement,
unchanged immutable leases/ACK separation, bounded latest-only records, and honest
FAIL reporting. Release readiness, Office/audio and supervisor are not judged
complete because they were not implemented or verified by this bounded change.
This is a tested partial fix, not a successful full performance repair.
