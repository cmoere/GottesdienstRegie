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
