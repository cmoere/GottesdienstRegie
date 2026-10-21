# PowerPoint original playback: native capture not released

Date: 21 October 2026. Scope: Task 1 of the approved hybrid-import plan.
This is a diagnostic result, not a production player or a completed import.

## Reproduction

Run `node tests/smoke/powerpoint-probe.cjs` on this Windows host with its
installed PowerPoint 16.0. The probe creates its own source and sentinel
documents in a new, marked `work/powerpoint-probe-*` directory. It does not
open user files, capture the desktop, change execution policy, or start ON AIR.

Latest evidence: `work/v86-powerpoint-command-evidence.log` and
`work/powerpoint-probe-mbm18y/` (`report.json`, `transport-diagnostics.json`,
`initial-frames.json`, `failed-command-observation.json`, `capture.log`).

## Observed results

- COM control succeeds: click index 0 → 1 → 2 on source slide 256, followed by
  source slide 257. Pausing holds that slide; resuming permits its automatic
  advance to source slide 258.
- Capture is restricted to the root window belonging to the owned source
  presentation. The window is positioned off the visible desktop. Its initial
  thumbnail and both local WebRTC consumers show the initial red marker.
- On the subsequent explicit request for slide 3, COM reports source slide
  258, index 3, running. However, the source capture video remains red:
  pixel `[64,1,0,255]` at the marker position, at 1920×1080. Both consumers
  also remain red. Their clocks advance; this is not merely a missing callback
  or a stopped HTML video element.
- Chromium's Windows Graphics Capture path reports
  `ProcessFrame failed, using existing frame: -2147467259` during that run.
  This locates the observed stale image before the consumer distribution;
  it does not prove that every possible owned-window capture arrangement fails.
- At failure the consumers are only 960×540 and 640×360, respectively. A
  successful 1080p/30 fps, 60-second latency measurement therefore does not
  exist. No passing p95 timing values are reported.
- The owned sentinel file remains byte-identical and its saved state is
  unchanged. The helper closes only its own documents and quits PowerPoint
  only if no other presentation remains. No probe processes remained after
  cleanup.
- Embedded audio isolation/routing has not been demonstrated. Capability
  remains `audio: unsupported`.

## Decision

The probe deliberately exits 1 (`visual: false`), rather than claiming that
successful COM commands imply working visitor output. Production original
playback remains disabled. Task 1 is incomplete, including the moving-marker
and audio fixtures. Tasks 5–9 are not treated as functional or released.

A different capture arrangement or fallback requires an explicit, reviewed
decision. We do not replace this with desktop capture, expose a PowerPoint
window over MAIN, relax latency limits, or silently substitute a video export.
The existing native import remains unchanged.

## Follow-up: explicitly authorized visible probe on Monitor 1

The user authorized Monitor 1 for the isolated diagnostic. `--monitor=1` now
selects Windows `DISPLAY1` explicitly and fails if it is unavailable; it does
not silently use another monitor. Before placing the owned PowerPoint app,
the helper refuses to move an application containing existing presentations.
Only its generated source and sentinel are used. No MAIN/display preference
or user document is modified. The default probe remains offscreen.

- `work/v86-powerpoint-monitor1.log`, `work/powerpoint-probe-T1xw2o/`:
  60,902 ms, 59 samples; mirror skew p95 102 ms, command-to-frame p95 660 ms.
- `work/v86-powerpoint-stage-timing.log`, `work/powerpoint-probe-IUZI7j/`:
  60,466 ms, 60 samples; skew p95 92 ms, command-to-frame p95 471 ms.
  Added host pixel observations separate command-to-source p95 (187 ms) from
  source-to-consumer p95 (301 ms). Stage percentiles are diagnostic summaries,
  not quantities to add together. The unchanged 250 ms overall gate fails.
- Controlled hypothesis: set supported receivers' `jitterBufferTarget` to 0.
  Both receivers confirmed target 0 without setter errors. This did not
  produce a passing run: a later command did not reach both consumers within
  the existing observation deadline. Raw failure and receiver observations:
  `work/v86-powerpoint-lowbuffer.log`, `work/powerpoint-probe-p8SWGf/`.
  The experimental setter was removed rather than retained as a claimed fix.

All three reports keep `visual:false`, audio remains unsupported, and their
sentinel checks pass. No own PowerPoint/probe process remained after cleanup.
The visible arrangement proves that this source can update; it does not prove
stable 1080p/30 fps delivery or acceptable production latency. Moving-marker,
resolution/fps and isolated-audio criteria remain open. Task 1 remains incomplete;
the original player is not enabled or released.

## Follow-up: source motion and transport counters

The capture diagnostic now records initial/final WebRTC counters and codec
information. On a failed command it preserves the same counters and actual
decoded pixel observations. This is instrumentation, not a production fix.
No transport buffer, codec, bitrate, latency limit or release gate was changed.

Quiet static baseline `work/powerpoint-probe-H9bZJj/`, log
`work/v86-powerpoint-final-transport.log`: 60,092 ms, 60 samples. Mirror skew
p95 is 50 ms, command-to-frame p95 is 401 ms, command-to-source p95 is 188 ms,
and source-to-frame p95 is 217 ms. The unchanged 250 ms overall gate fails.
The separate percentiles are not additive. Both consumers eventually report
1920×1080, but this does not establish 30 fps. VP8/libvpx counters show roughly
18 encoded/decoded frames per second on average. Mean receive jitter-buffer
delay is about 13–16 ms, so it cannot by itself explain the measured delay.

The owned source fixture now contains a repeating yellow moving marker on
slides 1 and 3. Slide 2's automatic timing and slide 1's two explicit click
steps remain independently checked and still pass. Samples record the yellow
pixel centroid, rather than interpreting an advancing video clock as motion.

An earlier marker run was interrupted by user input before completion:
`work/powerpoint-probe-1y1HH7/`. It has no completed report and is not a pass.
After identifying both exact generated paths through the Office presentation
collection, only its `owned-source.pptx` and `owned-sentinel.pptx` were closed.
No user presentation or directory was deleted.

Completed resumed run: `work/powerpoint-probe-wqSotB/`, log
`work/v86-powerpoint-moving-marker-resumed.log`. The test exits 1: after about
46 seconds a requested slide did not reach both consumers within the existing
two-second deadline. No sixty-second motion PASS or p95 is invented from this
partial run. The source and both consumers show hundreds of distinct yellow
marker positions, confirming actual captured motion. Counter deltas locate a
substantial cadence reduction between the source video and the encoded streams:

| Observation | Source | MAIN | Mirror |
| --- | ---: | ---: | ---: |
| Observation interval | 46.289 s | 46.403 s | 46.539 s |
| New decoded source/consumer frames | 1,163 | 509 | 507 |
| Approximate frames per second | 25.1 | 11.0 | 10.9 |
| Distinct observed yellow positions | 366 | 286 | 281 |

Host outbound counters independently show about 11 fps to each peer. Mean
encode time is 28–29 ms per frame, mean decode time is 4.5–5.0 ms, and mean
jitter-buffer delay is 16–17 ms. WebRTC reports bandwidth-limited durations of
34–36 seconds and no CPU-limited duration; these are diagnostic classifications,
not proof that the physical network or encoder alone is the root cause.
Raw counter snapshots and motion arrays remain in the owned artifact folder.

The resumed run preserves the sentinel hash/saved state and closes its own
documents. Audio remains unsupported. The native capture/distribution design
requires review before more speculative performance changes: original-player
tasks 5–9 remain blocked, Task 1 remains incomplete, and no v86 release is made.
