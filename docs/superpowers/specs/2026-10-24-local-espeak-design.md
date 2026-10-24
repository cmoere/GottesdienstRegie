# Local non-neural automatic announcements

Approved in conversation: separate eSpeak NG installation, German formant voice, no Windows voice, cloud speech or AI model. During actual automatic gong/speech playback show a small system speaker overlay at top left; hide it on completion, cancellation or error. Release the verified increment as a normal update, without claiming unfinished PowerPoint/regional work complete.

## Approaches
Direct GPL-library bundling was not selected. The user selected a separately installed, user-selected eSpeak NG command-line program communicating with the app through standard text/WAV files. No engine or model is redistributed or silently installed. Missing engine is explicit in settings. App licensing is unchanged.

## Behavior and boundaries
Use the existing AnnouncementService public/current Saal texts and existing settings interval/remaining-music percentage. One owner in the control renderer runs only while ON AIR in pre/post sections (including test-mode ON AIR). First automatic run is after the configured interval. One current announcement per interval, in priority order with rotation; no overlapping queue. Re-evaluate eligibility after synthesis, before gong, and before speech. Leaving the section, OFF AIR, disabled settings, revoked data, changed audio route or owner unmount cancels playback and releases only the announcement ducking claim.

Synthesize before attenuating music. Play the user-provided three-tone gong then speech through the configured Background Audio device, respecting its mute/level; unavailable/muted routes fail visibly in operator settings, never silently fall back. Existing radio and video ducking remain intact. No TTS/audio from MAIN or extra output windows. The small speaker indicator is a boolean-only global output overlay independent of content and transitions. It survives new output windows through retained main-process state and is cleared on control renderer destruction. Do not claim recording support beyond the existing output capture path.

Native commands: control main-frame only, selected absolute eSpeak NG executable path, shell disabled, fixed options, plain UTF-8 stdin, bounded text/output/time, one synthesis at a time, cancellation and owned-temp cleanup. Settings never accept arbitrary executable arguments. UI offers engine selection, enable and explicit save, status and the existing public text list. Existing neural voice metadata cannot activate eSpeak by migration.

## Non-goals
No automatic changes to Firebase, neural/Windows fallback, voice cloning, dialect speech, physical device changes, or claim of audited pronunciation on the real hall system.
