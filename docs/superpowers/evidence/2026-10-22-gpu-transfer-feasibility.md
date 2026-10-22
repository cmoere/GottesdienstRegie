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
