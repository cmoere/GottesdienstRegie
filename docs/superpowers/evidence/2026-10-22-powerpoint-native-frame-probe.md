# Native PowerPoint frame probe: implementation evidence

Status: Tasks1–3 implemented and tested against own generated sources; full
PowerPoint performance acceptance remains unproved. No product player or
release enabled. Implementation and review by the author only, in accordance
with the user's native/translation-only restriction; this is weaker than an
independent review.

## Task1: fixed shared-memory ring

The native code builds with the existing VS2022 BuildTools/Windows SDK. No
runtime package, header download, installation or execution-policy change.
The builder writes only into unique marked `work/powerpoint-native-probe-*`
directories. Compiler environment values are kept in memory, not logged.

The ring has three fixed slots, each bounded to8,294,400BGRA bytes. x64-aligned
version publication and bounded snapshot retries reject concurrent/partial
writes. Reader mappings are read-only; native pointers stay process-local.
Windows DACL is explicitly restricted to current user SID and SYSTEM, verified
by reading the actual mapping security descriptor. Random128-bit mapping,
session and generation tokens prevent accidental reuse. Existing names are
rejected, not overwritten.

RED `work/v86-frame-ring-red.log`: missing native implementation/build, observed
before implementation. A first build attempt failed because Node's normal
Windows argument escaping corrupted the nested `cmd /s /c` compiler-environment
command. A controlled comparison with `windowsVerbatimArguments` established
the exact cause; the corrected builder calls the selected absolute compiler.
No environment output is exposed.

First stress attempt under the concurrently running baseline suite failed the
cross-process check (`work/v86-frame-ring-green.log`, artifactnB1Xrx), without
capturing a child error. It is retained as a failed run; its cause is not
claimed as proven. A test-only child failure log was added, not a product
fallback or relaxed timeout. The unchanged stress test then passed twice:

- `work/v86-frame-ring-diagnostic.log`, artifacteVZOUY:10,000full-size
  publications with independently validated concurrent reader snapshots.
- Final `work/v86-frame-ring-final.log`, artifact2xLgom: same10,000publications,
  plus malformed mapping/metadata cases; exit0, `FRAME_RING_PASS`.

Final compiler log has no warnings. Explicit reserved bytes account for the
intended128-byte slot-header alignment instead of suppressing a padding warning.
An additional test initially used Windows' macro name `small` for a HANDLE;
the test variable was renamed, with no product condition or assertion changed.

Behavioral coverage: empty/uncommitted slots; fixed maximum-size frame; zero/
overflow dimensions, stride and byte count; zero clock values; safe-integer
sequence limit and duplicate sequence; wrong generation; bad protocol version;
damaged read-side width; undersized mapping; restricted mapping names; token
roundtrip; read-only publication rejection; mapping-name collision; exact DACL;
strictly increasing complete snapshots under concurrent cross-process writing;
and mapping handle release after close. No frame source, Office document,
audience output or audio device was opened by these tests.

Full application baseline: `work/v86-native-frame-baseline.log`,183files and
756tests passed,309.33seconds. That is a regression baseline, not a native
capture/performance result. Shared-memory stress is not a30-fps/latency claim.

## Task2: native reader and owned-window capture

The Main-only Node client decodes a bounded binary pipe without repeated
whole-frame concatenation. Header/length checks precede allocation; exact public
descriptor keys reject native identifiers. One request at a time, two-second
deadline, revocation on close, private child cleanup, no raw errors sent to MAIN.
Native reader uses a read-only ring view and a bounded line-command parser.

- RED `work/v86-native-reader-red.log`:17tests fail for missing client.
- Final `work/v86-native-reader-reviewed.log`:17/17pass, including fragmented
  real pipe output, oversized header/pixels, bad protocol/UTF-8/identity,
  damaged descriptors, stale/unsafe sequence, unexpected fields, EOF, timeout,
  remote error, extra startup bytes and close during request.
- Initial test fixture path was one directory too high, causing EOF rather
  than protocol observations; its path was corrected without changing cases.
- Real C++ reader plus separate native publisher:
  `work/v86-native-reader-command-green.log`, artifactKAHIzZ. Reads two full
  frames with exact bytes and null for an unchanged sequence, rejects wrong
  generation, malformed lengths/extra fields/unsafe sequence, and exits cleanly.
- An embedded-NUL command initially returned a frame rather than rejecting
  (`work/v86-native-reader-command-red.log`). Native parser had constructed a
  string only up to NUL. It now preserves the bounded extracted length and
  rejects embedded NUL; the same test passes. No timeout/size limit relaxed.

Capture uses Windows Graphics Capture CreateForWindow/CreateFreeThreaded and
existing D3D11. It validates PID, HWND-root ownership, process creation time and
geometry, crops on GPU, proportionally letterboxes into1920×1080BGRA8, then
performs bounded readback/publication. Private control input is bounded and
status output contains fixed diagnostic codes only. No renderer/Node capability
or public native identifier is introduced. Input source bound4096×2160 is an
explicit safety limit, not a promise to capture arbitrary large windows.

RED `work/v86-native-capture-red.log`: missing owned-window capture. Actual
native tests use only generated Win32 source windows on explicitly authorized
Monitor1. An initial corner-pixel assertion accidentally sampled the fixture's
yellow source-frame counter; it was moved to a known red area outside the
counter. Red/blue, toolbar exclusion, letterboxing and motion checks remain.

A real source-loss failure was reproduced in the4:3case:
`work/v86-native-capture-diagnostic.log` reports timeout waiting for source-lost,
with statuses ready,capturing. WGC stopped frames without reliably raising Closed.
The helper now validates owner lifetime independently every100ms, serialized
against publication; source-loss notification fences later frames. It does not
depend on another frame arriving or restart the source. A geometry change or
minimization is treated as explicit source loss, not an unapproved recrop.

Final `work/v86-native-capture-reviewed.log`, artifactR9TVVk: both16:9and4:3
cases pass. Independent output pixels prove BGRA order, excluded magenta toolbar,
black sidebars for4:3and distinct actual source-motion hashes. Both cases reject
wrong process creation time/PID, invalid frontend and native crop bounds, and
mapping collision; closing the source reports loss and publishes no more frames.
Final build has no warnings; no own capture/reader/fixture process remains.

The original COM probe adds only private process-created timestamp and QPC
observations; C# compilation passes. This addition has not yet been exercised
against PowerPoint at runtime. Click and timing commands were not changed.
No PowerPoint document, product output, audio route or display preference was
opened/changed by Task2. Probe Node tests use `*-tests.cjs` rather than
`*.test.cjs` to keep Node's built-in runner separate from Vitest discovery.

## Task3: bounded broker and actual sandboxed outputs

RED `work/v86-native-broker-red.log`:13cases fail for missing broker. Final
`work/v86-native-transport-unit-final.log`:30/30pass across broker and reader.
Broker scenarios cover a stalled recipient without queued old frames, four-client
limit, duplicate identities, wrong ACK generation/sequence, reconnect with a new
trusted window identity, ACK expiry, send failure, overlapping reads, revocation
during read, native reader failure, invalid frame identity/size/geometry and a new
window receiving the current frame. Data packets contain only selected public
descriptor fields, never native window/mapping identifiers.

RED `work/v86-native-output-red.log`: missing sandboxed output implementation.
Final `work/v86-native-output-final.log`, artifact49UcLn: actual Electron outputs
pass with sandboxtrue, contextIsolationtrue, nodeIntegrationfalse, CSP and a
narrow preload API. Main binds ACKs to the actual registered WebContents/main
frame, not a client ID supplied by the renderer. Popups/navigation are blocked.
Renderer uploads BGRA through WebGL with explicit channel swizzle, then verifies
actual GPU pixels after two animation-frame callbacks before acknowledging.

The harness deliberately ignores ACKs from one output. That output is
disconnected by the unchanged500msdeadline while retaining its last red image;
the healthy output advances to green. A newly opened mirror receives current
green, not the first frame. Both then render black with the test overlay. Final
1920×1080composed pixels and overlay ink are independently checked through
capturePage; representative black PNG visually inspected. Separate captures
are retained for healthy/stalled/current/black states. The watermark is part of
this isolated test composition, not a newly integrated product watermark fix.

One controller-owned30Hzpump drives the broker; it does not create a competing
timer. Each recipient holds at most one unacknowledged delivery. The source
snapshot and controls remain separate from generic live/document state. Reader
failure freezes the last valid snapshot and exposes a fixed status; revoke
closes the owned reader and recipients. Own windows/profile only, no audience
MAIN assignment or actual radio/playback route changed.

## Open acceptance

Tasks4–5 from the written plan remain open.60-second actual source-motion
cadence,150/250-ms latency, unobtrusive source behavior, failure cleanup and
audio isolation are not established by Task1. The existing product and package
version0.85.0 remain unchanged; regional completion is separately unfinished.
