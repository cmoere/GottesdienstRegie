# GPU transfer feasibility: installed Electron37

Scope approved by user “ja” after the explicit offer of a feasibility check
without runtime upgrade or installation. Spike only; no product implementation,
native dependency, PowerPoint launch, desktop capture, MAIN/audio preference
change, publish, or version bump. Implementation/review by primary agent only.

## Question and method

Can the installed runtime import native shared GPU textures and transfer usable
video frames to isolated output renderers, avoiding the previously measured raw
BGRA Main-process transport? Check versioned API definitions/source first, then
run a minimal throwaway browser-process boundary probe. This is not a60-second
performance acceptance test and cannot approve the original player.

Installed package and actual executable both report Electron37.10.3; actual
Chromium138.0.7204.251. Local electron.d.ts has OffscreenSharedTexture export
types, but no sharedTexture import module. Runtime confirms
`typeof require('electron').sharedTexture === 'undefined'` and no such export.
The pinned upstream browser/common module lists also lack that module.

Versioned sources:

- https://raw.githubusercontent.com/electron/electron/v37.10.3/lib/browser/api/module-list.ts
- https://raw.githubusercontent.com/electron/electron/v37.10.3/lib/common/api/module-list.ts
- https://raw.githubusercontent.com/electron/electron/v37.10.3/docs/tutorial/offscreen-rendering.md
- https://raw.githubusercontent.com/electron/electron/v37.10.3/docs/api/structures/offscreen-shared-texture.md

Electron37 documents GPU texture **export** for external native consumers. It
does not supply the modern native-texture-to-VideoFrame import API. Export is
not evidence that this runtime can import our D3D11 capture texture into Canvas.
Current, explicitly experimental import API is documented separately at
https://www.electronjs.org/docs/latest/api/shared-texture . The current page is
not used to attribute an API to37 or to choose an unverified replacement version.

## Throwaway experiment

Files stay ignored under `work/gpu-feasibility-20261022/`, marked THROWAWAY;
none is imported into product or retained as production code. Two hidden own
BrowserWindows, separate renderer OS processes, sandbox/context isolation on,
nodeIntegration off, separate temporary profile. Main sends only dedicated
MessagePort endpoints; no generic IPC/Node API is exposed to the page. A16×16
WebGL red surface produces the trial VideoFrame. Destination would draw and
verify actual red pixels/timestamp; no native handle is sent to renderers.

Observed:

1. Ordinary port ping/pong succeeds between separate renderer processes.
2. VideoFrame transfer produces destination `messageerror`, followed by the
   bounded source timeout. No frame is observed or falsely marked successful.
3. Repeating with a shared partition still uses separate renderer processes
   and produces the same error. Partition difference alone does not explain it.
4. A local DOM MessageChannel control succeeds: actual pixel `[255,0,0,255]`,
   timestamp9, transferred sender frame closed. This does not establish remote
   transfer or zero-copy behavior.

Raw reports: `report-separated.json`, `report-shared.json` and final
`report.json` (includes passing local control) in the throwaway folder. Trials
exit1 for the failed remote transfer, intentionally not a passing acceptance
result. Initial direct PowerShell GUI invocation did not yield an exit code;
later controlled runs use Start-Process -Wait -PassThru with hidden windows.
No exact Chromium/agent-cluster root cause is claimed from the observed
deserialization error. No security flags or isolation settings were weakened.
Own windows are destroyed in finally; final process query finds no remaining
Electron command line for this probe.

## Recommendation and release gate

No supported end-to-end direct native GPU route is demonstrated under the
installed runtime. The minimal DOM transfer alternative also failed across the
tested process boundary. Do not replace the already failing transport with this
unproved path or claim FPS/latency improvements from API presence alone.

Recommended next scope, requiring separate approval: evaluate a separately
downloaded, pinned newer Electron runtime providing the documented import API,
in an isolated throwaway folder. First prove real native texture import,
composed pixels, handle/release lifetime, sandbox boundaries and output fan-out;
only then measure60seconds and command latency. This is not an approval to
upgrade package.json/lockfile, installed GottesdienstRegie or its installer.
An alternative standalone native compositor would restructure all overlay/
website/video output composition and is not a bounded workaround.

No application code or dependencies changed, so no new application regression
claim is made. Existing native transport acceptance remains FAIL, regional
completion remains open, package stays0.85.0 and v86 remains unpublished.

## Follow-up approved: separate Electron45 runtime

The user subsequently approved downloading a newer isolated test runtime. The
official GitHub latest-stable release lookup selected v45.0.0 (published
2026-10-21, draftfalse/prereleasefalse). Download is pinned to that exact tag,
not a floating latest binary. Nothing was installed into node_modules or the
application. Throwaway files remain ignored under `work/gpu-runtime-v45.0.0/`.

Archive `electron-v45.0.0-win32-x64.zip`,158223852bytes, SHA256:
`ae53887a23bb640369c93dbd38c408a2af5c0deb86f2fa76c6c244cb444b7f47`.
Matches both the release asset API digest and the pinned release's SHASUMS256.
Manifest SHA256:
`5882ee4d3f943f567cdb6df9bf86e78de9c369e41d9093daaa2e3acaa630093b`.
These are checksums from the official origin, not an independent signature.
The extracted electron.exe reports NotSigned under Authenticode; no signature
verification is claimed. The checksum parser initially rejected the manifest's
binary-mode `*filename` entry before extraction; accepting the documented star
delimiter preserves the exact expected digest check. No mismatched binary ran.

Pinned API/reference sources reviewed completely:

- https://raw.githubusercontent.com/electron/electron/v45.0.0/docs/api/shared-texture.md
- https://raw.githubusercontent.com/electron/electron/v45.0.0/shell/common/api/shared_texture/README.md
- https://raw.githubusercontent.com/electron/electron/v45.0.0/spec/api-shared-texture.spec.ts
- https://raw.githubusercontent.com/electron/electron/v45.0.0/spec/fixtures/api/shared-texture/managed/preload.js
- https://raw.githubusercontent.com/electron/electron/v45.0.0/spec/fixtures/api/shared-texture/managed/renderer.js

Upstream shared-texture specs explicitly skip outside macOSarm64. Their presence
is not Windows support/performance evidence; actual local Windows checks follow.
Runtime reports Electron45.0.0/Chromium156.0.8078.48 and callable import API.

### Electron-exported texture control: PASS

An own128×128offscreen source exports GPU textures. Main imports each texture
and fans out the same imported resource to two distinct renderer OS processes.
Both use sandboxtrue/contextIsolationtrue/nodeIntegrationfalse and separate
temporary partitions. The narrow preload draws inside the isolated world;
neither raw handles nor Node APIs are exposed to the page.

Red, blue and black match independently captured composed pixel values in both
receivers. Each imported resource's allReferencesReleased callback occurs once,
then its source exported texture is released. `report.json`, exit0. This is a
small static control, not a30fps or native PowerPoint claim.

### External Direct3D1080p source: PASS twice

A throwaway C++fixture compiled with the already installed VS/SDK creates three
immutable1920×1080BGRA D3D11 textures: red, blue and black. No window, screen,
Office document or live media is captured. Texture creation uploads generated
test colors once and waits for its GPU initialization event. The fixture uses
unnamed non-inheritable NT handles, duplicates only into its explicitly spawned
own Electron parent and keeps all source textures alive until owned teardown.
Private pipe carries a decimal handle only to Main, never to output pages.
No full-frame pixel data crosses that pipe. The helper closes its duplicated
parent handles and its own handles on EOF/stop; it is a fixture, not a reviewed
production handle protocol.

Main imports the external handle with `sharedTexture.importSharedTexture`, sends
to both isolated output processes, releases its imported reference after sends,
and observes exactly one allReferencesReleased callback per stage. Renderer
closes VideoFrame and releases its imported resource after drawing. Output
capture verifies full1920×1080geometry and actual BGRA pixels at three separated
coordinates. Small renderer readback is diagnostic only; no zero-copy-everywhere
or persistent resource-leak-free claim. Own black screenshot visually inspected:
test overlay present on the composed frame, not on the raw source texture.

The first external run failed its exact output-size assertion: normal decorated
hidden window content was1904×1041. Recorded bounds/content/innerWidth confirm
the frame/client geometry mismatch. Only the fixture's `frame:false` option was
changed; source texture, pixel assertions and security settings were unchanged.
The resulting window/content/inner size is1920×1080, and the same three-color
two-output test then passed twice. Failed reports are retained as
`native-report-initial.json` and `native-report-geometry.json`; successful reports
are `native-report-first-pass.json` and `native-report.json`, with corresponding
native-final-stdout/stderr logs. Final console assertion:
`NATIVE_GPU_IMPORT_PASS 3 stages 2 isolated outputs 1920x1080`; exit0,
native fixture exit0, no own probe processes remaining. No compiler warnings.

Windows handle/reference requirements checked against:
https://learn.microsoft.com/en-us/windows/win32/api/dxgi1_2/nf-dxgi1_2-idxgiresource1-createsharedhandle
and the pinned Electron shared-texture README. Resources are immutable here;
concurrent writes, slot reuse, GPU synchronization and delayed-recipient failure
are intentionally not represented by this test.

### Revised recommendation, unchanged release gate

The newer isolated runtime demonstrates a real external-native-GPU-import to
two sandboxed outputs on this machine. This is a positive feasibility result,
not production PowerPoint readiness. Next proposed scope is a separately
designed capture-to-GPU probe: existing owned-window capture without CPU image
readback, bounded texture ownership/fan-out, real-motion60-second acceptance,
then actual own PowerPoint command/animation latency and failure scenarios.
No adoption or production runtime upgrade is authorized by this spike.

Product package/lockfile and installed Electron37.10.3 are unchanged. No new
application-code regression claim, no v86 release, no installer/push/tag.
The previously failed raw-BGRA transport gate remains failed; successful static
GPU fixtures do not retroactively pass it. Regional completion remains open.
