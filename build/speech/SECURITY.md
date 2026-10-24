# Offline speech dependency assessment

Runtime jars are pinned by SHA-256 and byte length in manifest.json. Dependency resolution uses MaryTTS 5.2.1 with updated JTok 1.9.4, OpenNLP 2.5.9, Log4j 2.25.5, Commons IO 2.20.0, Guava 33.5.0-jre and HTTP Core 4.4.16. Sources and attribution for LGPL components are included. MaryTTS's POS tagger has one documented LGPL compatibility modification to call OpenNLP's supported array API; the full modified source ships with the worker. No old OpenNLP binary is shipped as a compatibility fallback.

An OSV Maven query on 24 October 2026 reports one remaining advisory: GHSA-j288-q9x7-2f5v for Commons Lang 2.6 (uncontrolled recursion in ClassUtils.getClass with a crafted reflective class name). MaryTTS requires the legacy package namespace, so Commons Lang 3 is not a binary replacement. This application does not expose reflective class-name lookup to messages: IPC accepts only bounded plain text, MaryTTS's TEXT input escapes it, and model/configuration class names come from checksum-pinned bundled resources. No user model, XML dictionary, Java argument, classpath or executable is accepted. Worker heap, output size and execution time are bounded; cancellation terminates the process. The advisory is recorded as not reachable through the supported announcement input, not omitted from the audit or claimed patched.

Reference: https://osv.dev/vulnerability/GHSA-j288-q9x7-2f5v

The private worker has no HTTP server, runs headless, never opens a sound device, does not inherit Java injection environment variables and is instantiated only by the authorized control renderer. Audio is validated as finite non-silent 16 kHz mono PCM before the existing player receives it. The app does not load arbitrary Java serialization or untrusted models from Firebase.

Do not infer physical hall audibility or pronunciation quality from automated waveform/player checks. These are separately rehearsed by the operator.
