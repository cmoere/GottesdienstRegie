# v94: operator design and original PowerPoint playback

The user explicitly requested implementation and publication. Reuse the approved
hybrid/native playback design; retain the current Electron/React application.

## Design basis

- Apple HIG: grouped toolbars, sidebar navigation, contextual inspector, clear
  primary actions, keyboard focus and adaptable widths.
- WWDC25 sessions 323 and 306: consistent control hierarchy and narrow update
  boundaries. Do not animate or rebuild the operator workspace for each GPU frame.
- AvdLee SwiftUI Expert (`skills/swiftui-expert-skill/SKILL.md`): composition,
  state ownership, stable identity and accessibility transfer to React. SwiftUI
  APIs themselves are not applicable to this Windows/Electron product.
- Preserve Cera Pro and the congregation's green/teal/gray palette. Keep visitor
  slide designs independent of operator chrome. No speculative Liquid Glass.

## Implementation and release gates

1. Bundle the actual isolated GPU receiver in the production preload; package
   the private Main GPU modules without diagnostic entry points.
2. Connect the owned native resource opener and receiver authorization to Main,
   output window lifetime and OFF AIR cleanup.
3. Connect original-mode selection, immutable source/slide identity, native
   navigation, safe transition composition and end-of-item handoff to the real
   LiveEngine. Retain editable-copy mode separately and reject unsupported media.
4. Apply the operator design hierarchy to the real import/playback controls and
   workspace. Check narrow windows, focus, contrast and existing shortcuts.
5. Run unit/build checks and an actual composed-output test, including original
   builds/timing, preview equality, quick screens/test watermark, natural end,
   postprogram handoff, cancellation and native reference drain.
6. Repair parallel-release asset assembly; publish only after product gates pass,
   then verify the public installer, manifests, notes and updater discovery.

Do not describe infrastructure-only tests as complete product integration. Do
not enable original playback in a release before its real live-path tests pass.
