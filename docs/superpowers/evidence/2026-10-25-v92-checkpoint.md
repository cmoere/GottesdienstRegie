# v92 — announcement and PowerPoint diagnostic checkpoint

This is an implementation checkpoint, not a v92 release or a production original-player approval. Package remains 0.91.0. Native root implementation/review; only the two help paragraphs were translated by the three previously authorized translation agents.

## Announcements
Five actual offline models synthesized with the private runtime: Thorsten, Kerstin, Karlsson, Ramona, Eva K. Model/config/card SHA256s are pinned in build/neural-speech/manifest.json. The three added models point to M-AILABS; original author redistribution conditions are pinned and included in source/M-AILABS-README.md. Existing persisted gender-choice IDs are retained.

Speech-only loudness defaults to150% with the same -1dBFS ceiling. No route, mute or gong override. Global speed, sentence/paragraph pauses and calm/clear presets are bounded and loaded from the native device repository before synthesis. Dates/times/weekday abbreviations are prepared as German words without modifying stored or displayed messages. Actual slow/pause configuration changes the sample duration9.204s→13.278s. No physical playback claim.

Focused regression:19files/126tests PASS (work/v92-speech-unit.log). Production build PASS (work/v92-build-checkpoint.log). Actual synthesis artifacts/log:work/v92-speech-actual.log; reproducible script:scripts/test-v92-speech.cjs. Fifteen regional documentation variants PASS with63articles/1568existing release fields (work/v92-documentation-check.log). Full app regression, settings visual/native probe, all-platform packaging and release metadata remain.

Official YouTube embed documentation provides no ad-disable switch. Help now explains that nocookie is not an ad-free guarantee and approved local videos are the controlled alternative. No ad interception or third-party video downloading added.

## Isolated original PowerPoint proof
Private Electron45.0.0 only. Application runtime remains unchanged. Source was an explicitly generated own presentation and own sentinel on Monitor1. All sources/windows closed cooperatively; documents unchanged. No operator presentation, other Office documents, system audio settings or installed application modified.

30Hz transport PASS:work/powerpoint-gpu-probe-VJj99p/benchmark-report.json (29.676535/29.726523fps). Actual Office controls revealed that COM GotoClick(2) could report the expected index without the second rectangle appearing. Actual composed images are retained in the failed diagnostic folders. Adding a fixed wait did not repair GotoClick. Native SlideShowView.Next, with normal test clicks spaced beyond the fixture's declared250ms fade, correctly displayed both click builds and passed pause/automatic timing. Both alternatives and failures remain recorded; no acceptance limit was lowered.

30Hz Office:work/powerpoint-probe-WPNX3f/office-gpu-report.json. Controls/60commands/integrity PASS, but28.659615/28.626290fps FAIL. 1800distinct source sends during the measured minute left no headroom for legitimate source/seek periods and observation sampling.

A separately tested60Hz capture variant uses the same three native buffers and unchanged protocol, never a fourth surface. Default diagnostic behavior remains30Hz. Capture cadence tests retain EMPTY retry, absolute phase, early gating, no catch-up bursts and exception behavior;60Hz/invalid-rate cases added RED→GREEN. Source/benchmark reports identify captureHz.

60Hz transport PASS:work/powerpoint-gpu-probe-jCo4OD/benchmark-report.json,31.693727/31.610410changedfps, p95skew14.733ms,1336paired/1127unmatched observations. No unmatched samples hidden.

60Hz actual Office PASS:work/powerpoint-probe-sXBroy/office-gpu-report.json. Duration60000.6918ms; MAIN2061frames/34.349604fps/maxgap80.1618ms; mirror2028frames/33.799610fps/maxgap99.6317ms. 1519paired/1051unmatched observations, p95skew12.8519ms. 60correctly observed commands, p95command-to-frame128.5631ms. Both click builds, pause and automatic timing independently verified from composed full frames before the cadence run; these extra capture costs are recorded separately. Original and sentinel files unchanged. Source-clock latency remains unverified/future-reported and is not claimed as measured end-to-end source latency.

All112Node tests PASS (work/v92-powerpoint-node-tests.log). Native source inspection through the optional Computer Use helper failed with FrameArrived/window capture timed out; no successful direct-source screenshot claimed. Actual independent GPU output captures remained operational. Temporary hold support is diagnostic-only and disabled in the normal Office phase.

Still required before enabling original playback: hard helper/renderer failure handling and bounded recovery, unobtrusive owned source-window proof, product controller/preview/output integration, source safety and managed file persistence, runtime upgrade/package verification, honest media/audio preflight. The approved hybrid design permits withholding original playback for audio-containing files if isolated audio/routing is unproven; no system loopback or hidden Windows-default fallback is acceptable. A video export must remain an explicitly selected alternative, never a silent replacement for interactive original playback.
