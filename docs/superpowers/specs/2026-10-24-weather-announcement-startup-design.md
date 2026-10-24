# Weather, announcement test and startup correction

Requested directly after normal 0.89.2 release: weather visuals adapt to sun/wind/snow etc.; weather warning slightly shorter but content larger; explicit announcement test; fix narrow/sideways workspace at startup; correct quiet speech. User specifically approved full gong + selected-text test even OFF AIR, with Stop. Existing native implementation / routine-decision authority applies; technical work stays with root, only translations may be delegated.

## Decisions

- Correct weather-code classification and native SVG artwork for sun, partly cloudy, cloud, fog, drizzle/rain, snow and thunder/hail. Wind supplements the observed condition; frozen public weather snapshots remain the sole data source. Subtle CSS motion follows condition/wind and respects reduced motion. No independent network requests in outputs. Retain existing two-hour forecast/tomorrow and attribution.
- Weather warning reserve 24% instead of 26%; title/body/metadata larger. Existing measured bidirectional scrolling and numbered warnings remain. Reserve must match actual overlay height for MAIN and preview, including combined ticker cases.
- Main control window starts at resolved stored/fullscreen/maximized geometry before loading the renderer. The loading panel stays centered inside it. Eliminate the 410px native splash-to-workspace resize dependency, keep display preference and update-check timing after workspace readiness. Outputs are unaffected.
- Quiet speech investigation: actual speech PCM peak -14.51 dBFS, whole-file RMS -37.75 dBFS; gong peak -5.25 dBFS, RMS -21.74 dBFS. Music ducking operates on background engine only, while announcement player uses its own element. Normalize only generated speech PCM to peak -1 dBFS, gain capped at +18 dB, never clip; no change to gong or configured route/master mute/volume.
- Test controls under Settings → Presentation → Announcements: choose a current public Saal text or a fixed general church test phrase, see exact text, start and stop. Test needs no automatic-enable/save and can run OFF AIR. One common run owner with automatic scheduler; no overlap or automatic interruption of a live announcement. ON AIR service/emergency states reject manual tests; going ON AIR during an OFF AIR test cancels it. Route changes, revoked selected messages, modal close and control destruction stop test and release only announcement ducking. Test settings never persist to Firebase or alter AppMode.

## Alternatives considered

- Separate sound player in Settings rejected: risks overlapping announcements and conflicting music ducking.
- Raising the background-output volume rejected: changes music and does not correct the low source WAV.
- Waiting for another resize/auth refresh rejected: retains visible startup corruption. Full-size control geometry before first renderer layout prevents narrow state capture.

## Acceptance

Real weather examples show correct distinct icons/condition styles, wind overlays do not replace snow/rain, forecast stays intact; warning fonts/geometry visually checked at 1920×1080 and in preview. PCM normalization tests cover clipping, silence, negative samples and gain cap; compare real Mary WAV before/after. OFF AIR test exercises actual gong/speech route and cancellation with physical test audio muted. Startup geometry is checked before loading and across saved modes, with no changes to display assignments. Full regression/build and release gates are mandatory before another normal update. Do not claim unrelated PowerPoint/regional UI completion.
