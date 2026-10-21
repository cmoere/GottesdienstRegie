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
