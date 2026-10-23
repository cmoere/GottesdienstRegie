# Presentation-event observation spike — FAIL, no product integration

User-authorized disposable experiment only. Existing three-texture producer,
broker, managed imports and receiver remained unchanged. Only observation was
replaced with `beginFrameSubscription(false)` presentation images in the existing
isolated Electron45.0.0 runtime. Installed product remains0.85.0 / Electron37.10.3.
No Office instance, runtime upgrade, installer, publication or product adoption.

## Reproduction and artifacts

`node work/frame-subscription-spike-PWA2Gw/run.cjs --monitor=1`

All spike code is explicitly THROWAWAY in ignored `work/`. Native source is the
owned Monitor1 fixture; both outputs stayed hidden, non-offscreen1920×1080, in
distinct renderer processes. Unchanged factory sets sandbox/contextIsolationtrue
and nodeIntegrationfalse. Page-world require/electron absence checked directly.
No security preference getter is claimed to have verified these factory values.

First setup attempt failed before measurement because an unsupported
`webContents.getWebPreferences()` query was used. Preserved as
`setup-failure-{report.json,process.log,run.log}` in the same folder. Replaced only
that query with the above honest configuration basis/page-world checks.

Completed corrected run preserved before the later cadence fix:
`baseline-report.json`, `baseline-run.log`, `baseline-process.log`,
`baseline-main.png`, `baseline-mirror.png`. One completed60s run for this
unchanged producer; no retries to seek a passing sample. Later timing-fix
measurements are separate evidence, not replacements for this failed baseline.

## Unchanged acceptance criteria and result

Duration60008.7482ms; actual monotone known image stamps plus changed motion-row
SHA256 from the same captured image. Neither send counts nor ACKs count as frames.
Unknown, stale and unchanged images are excluded. Existing evaluator unchanged.

| Output | Changed frames | Changed fps | Largest gap ms |
|---|---:|---:|---:|
| MAIN |1496|24.929699|435.2805|
| Mirror |1456|24.263129|438.1653|

Required each: at least29.5fps, at most150ms gap, at least60s. Both fail cadence
and gap.1348paired frames,256unmatched; p95paired skew16.8769ms passes150ms.
`transportPass:false`, `spikePass:false`, `productionReady:false`.

Whole-run observer counters including warmup/post-measurement:1511/1471events;
1511/1470known images;0/1unknown;0/0stale;11/9unchanged-source. During measurement
1557/1515send and matching ACK counts do not override composed-frame failures.
Record maps stayed bounded at16. No old screenshot observer used; RAF hint IPC
remained unchanged but its observation request became a no-op before claims began.

Static checks passed1920×1080geometry, distributed red/blueBGRA pixels and
watermark presence. MAIN PNG visually inspected: complete red/blue fixture,
motion/stamp rows and TESTBETRIEB bottom-right; this is not an Office visual test.

## Cost, clocks and cleanup

Main RSS131719168bytes at start,541536256last sample,714903552peak. These are
Main-only samples, not aggregate GPU/renderer memory or proof of a lasting leak.
JS callback totals418.5042/481.5935ms, maxima38.9182/70.8940ms, include warmup PNG
encoding. GPU-to-CPU transfer before callback is NOT included in these timings.
Full image extents12.533/12.201GB across callbacks are geometric payload sums,
not measured bus bandwidth. Cropped strip totals104440320/101675520bytes.

Clocks: drift0.03145ms, uncertainty0.1234ms; sourceReported remains unverified
and sometimes future. `sourceLatencyAvailable:false`. Presentation callback time
is Main arrival of a captured composed image, NOT physical scanout/source latency.

No recorded runtime/image/cleanup error. Output drained, native stop drainedtrue,
exit0. Launcher exit1 is the expected failed acceptance verdict. Own spike
Electron processes no longer present after cleanup. Product manifest, lockfile
and tracked probe code unchanged; foreign startup-diagnostic SHA256 remains
B7E42819F91D0D2D1BF1BBB5DE782A26749BD1A26E2D802BBC8F5327BB570AB5.

## Decision

Reject this observer for adoption on the available evidence. No offscreen,
visible-window or alternative transport fallback was attempted. Current evidence
does not distinguish all Chromium readback/composition/scheduling costs; do not
claim a proven root cause from callback timing alone. A materially different
approach needs renewed design/scope approval. Existing Task6/7, Office commands,
helper-death supervisor, original audio, product integration and full regional
texts remain open. The user's complete-PowerPoint/regional-text release gate is
not satisfied. No release performed.
