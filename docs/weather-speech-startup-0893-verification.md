# Weather, speech test and startup — 0.89.3

Requested corrections: condition-dependent native weather, a slightly shorter warning with larger text, complete OFF AIR announcement test, narrow startup workspace and quiet speech. The user explicitly approved gong + selected text and Stop while OFF AIR. Technical implementation and review remained native; only the 15 regional release-text translations were delegated under the existing authorization.

## Findings and changes

- Real generated speech measured -14.51 dBFS peak / -37.75 dBFS whole-file RMS; the unchanged gong measured -5.25 / -21.74 dBFS. Music attenuation is restricted to BackgroundAudioEngine; speech has its own player. Normalize generated PCM only to -1 dBFS, with at most +18 dB gain, bounded samples, cooperative cancellation, unchanged source bytes and route/master mute.
- The native operator window was initially 410×700 and resized after readiness. It now receives resolved workspace bounds and start mode before renderer loading. Both responsive width listeners also re-read the viewport immediately after subscription, closing a reproduced first-render resize race. Stored output assignments and the post-readiness two-second update delay are preserved.
- Explicit WMO classification and local SVG weather icons distinguish sun, snow, rain, freezing rain, fog, thunder and hail. Wind >=30 km/h adds decorative wind lines; this threshold is not an official warning. App/system reduced motion disables the subtle animations. Existing forecast/source/snapshot ownership is retained.
- Warning reserve is 24% instead of 26%, with matching content offset and larger type; combined ticker reserve remains consistent. Existing multi-warning numbering and measured long-text scrolling remain.
- Settings → Presentation → Announcements uses the existing single announcement owner for a general or currently permitted public-text probe. OFF AIR is supported. Stop, modal close, revocation, route/device change and OFF AIR→ON AIR cancel it. Automatic settings are unchanged; shared ownership prevents overlap. Public IDs cannot collide with the general preset.

## Evidence

RED→GREEN logs under ignored `work/`: voice-level-cancellation, startup-geometry, startup-resize-race, announcement-probe and announcement-probe-id. New responsive race tests failed before the immediate viewport re-read and pass after it.

Production build succeeded. Historical guards v39–v75 and v83–v86 passed. The v49 guard retains historical release-note assertions but replaces the obsolete narrow-splash import assertion with executable current startup geometry tests. This intentionally supersedes the behavior that caused the reported defect.

Native fixture: `scripts/test-weather-speech-fixes-native.cjs`, report `work/weather-speech-fixes-F6N3fw/report.json`. Real Electron initial viewport 1920×1080; warning height/content offset 259.1875px; body 27.84px and title 31.68px. Actual private bundled Java synthesis peaked at 29205 (-0.99985 dBFS), with gong → speech observed, then a second gong stopped by closing Settings. Physical audio was muted. Snow+wind, sun, rain and thunder screenshots were inspected; TESTBETRIEB remains visible. No installed application, user account, Firebase data or physical output was changed by the fixture.

Regional documentation gate: 15 variants, 63 help articles, 1530 release fields, no issues. This does not declare the partially translated regional interface complete; the existing disclosure and PowerPoint limitation remain.

Full regression and public release artifact results are recorded below after completion. Physical Saal listening and the installed user machine's startup remain user-side validation limits.

## Final local regression

Full suite: 233 files / 996 tests, initially995 passing plus one duplicate-title query failure caused by the newly added test-text option. The query now explicitly checks the source list and option; its entire18-test file passes in work/weather-speech-localization-green.log. All other232 files passed unchanged. Production build, historical guards and native fixture passed as recorded above. Root review found no further material issue. Public package verification remains pending until publication.
