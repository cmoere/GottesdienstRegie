# v94 verification

## Product scope

The existing Electron/React application uses HIG-inspired grouping, contextual
PowerPoint controls, focus treatment and the established congregation palette.
It has not been rewritten in SwiftUI. The design references were Apple's
[toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars),
[sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars),
[inspectors](https://developer.apple.com/design/human-interface-guidelines/inspectors),
WWDC25 [new SwiftUI design](https://developer.apple.com/videos/play/wwdc2025/323/),
[performance](https://developer.apple.com/videos/play/wwdc2025/306/) and the original
[SwiftUI Expert skill](https://github.com/AvdLee/SwiftUI-Agent-Skill/blob/main/skills/swiftui-expert-skill/SKILL.md).
The transferable composition and state-ownership guidance is applied to React;
no SwiftUI-specific API or speculative transparency effect is introduced.

Original PowerPoint playback is integrated into the real LiveEngine and output
composition on Windows x64 with installed Microsoft PowerPoint. It uses one
owned native source, GPU receivers and stable source/slide identities. Editable
copy remains a distinct mode. Unsupported embedded media, external or active
content and interactive triggers are rejected rather than approximated.

The current bounded transport supports the operator plus at most three assigned
visual output windows. Larger configurations are rejected before a native take.
Missing originals require reimport; font availability on the control PC remains
a requirement. Neither full cross-platform original playback nor unrestricted
PowerPoint media compatibility is claimed.

## Evidence recorded locally

- `work/v94-full-unit.log`: 266 files, 1,083 tests passed before the final pause
  extension. `work/v94-pause-regressions2.log`: all 30 focused tests passed,
  including the three added pause tests and existing navigation/preview guards.
- `work/v94-build-release.log`: production build, Electron typecheck, bundled
  sandbox preload and regional assets succeeded.
- `work/v94-regional-gate.log`: explicitly disclosed partial UI scope passed.
- `work/v94-documentation-gate.log`: all 15 enabled documentation packs cover
  63 help articles and 1,610 release fields. Existing translations were preserved.
- `work/v94-original-soak.log` and `work/full-app-powerpoint-RG2v75/report.json`:
  60 seconds of real composed output on physical Monitor 1, original builds and
  source timing, identical paused MAIN/preview pixels, editor selection separate
  from LIVE, black plus test watermark, postprogram handoff and resource drain.
- `work/v94-original-final.log` and
  `work/full-app-powerpoint-P4ijk3/report.json`: the final pause implementation
  also passed in the full App. Operator pause/resume works, dismissing a quick
  screen preserves an operator pause, and the original digest is unchanged.
  This targeted final rerun used zero soak seconds; it is separate from the
  preceding 60-second run, not a second 60-second claim.

The tests use an owned fixture deck and profile. They do not close foreign Office
documents, install the generated update or claim audible embedded-media playback.
Native programming and review were performed by the primary agent; only the
12 new release fields in each enabled regional pack were delegated for translation.

## Publication

Publication is authorized by the user. The release workflow now uploads platform
builds as Actions artifacts; a single final job assembles one draft, checks all
11 required assets and publishes only after the full test job and platform jobs
succeed. Public updater/installer verification is recorded after publication.

The foreign untracked `tests/smoke/startup-diagnostic.cjs` is excluded from this
change. Its SHA-256 remains
`b7e42819f91d0d2d1bf1bbb5de782a26749bd1a26e2d802bbc8f5327bb570ab5`.
