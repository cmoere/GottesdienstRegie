# Native PowerPoint frame probe: implementation evidence

Status: Task1 implemented and tested; native capture, output distribution and
full PowerPoint performance acceptance remain unproved. No product player or
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

## Open acceptance

Tasks2–5 from the written plan remain open. WGC source ownership/crop, binary
reader transport, sandboxed output delivery,60-second actual source-motion
cadence,150/250-ms latency, unobtrusive source behavior, failure cleanup and
audio isolation are not established by Task1. The existing product and package
version0.85.0 remain unchanged; regional completion is separately unfinished.
