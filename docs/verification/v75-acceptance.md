# v75 verification — 2026-10-04

## Published release

- Public stable release: https://github.com/cmoere/GottesdienstRegie/releases/tag/v0.75.0
- Release workflow 37180135136: Windows, macOS and Linux all successful at commit 2b7c121.
- Windows installer and blockmap published; stable latest.yml reports 0.75.0.
- Public installer downloaded in full (287770369 bytes). SHA512 matches the public stable feed:
  `wTcYKHA+57dFABE06bm5fJ9T/KEnzYaWPxsRJGY9UZ7snia7KTsjXyQY6e5Wjd4HIgeMK98oBSOmCfYvYULYQg==`
- Exact electron-updater provider endpoint also returns v0.75.0. Local NSIS packaging and packaged-entry verification passed.

## Scope and evidence

- Independent branch review completed; its six important findings were verified against the code.
- Regression tests first failed, then passed for repeated same-slide takes, preserving an active notice on metadata/content resends, conflicting legacy room IDs, long postprogram rows, and reduced-motion title pagination.
- Full suite: 87 files, 268 tests passed before packaging. All release guards 55–75 passed.
- Built Electron smoke passed: delayed initial snapshot, eight full titles, measured overflow-only title movement, black quick-screen watermark, postprogram reference, leave-room reference, normal/test ON AIR combinations. Long postprogram rows and reduced-motion overview were additionally checked by DOM bounds and inspected screenshots at 1920×1080.
- Actual physical USB-interface audibility, monitor placement on the user's selected device, and recording software capture remain hardware acceptance checks. No claim of an acoustic measurement is made.

## Decisions and limitations

- Existing PowerShell workflow replaces unavailable bash ledger scripts; this affects bookkeeping, not application behavior.
- BackgroundAudioRoute is a focused serialized sink adapter, preserving unrelated media routing. Cost: one additional adapter to maintain.
- AppClock uses local application time; this application has no external trusted-clock provider. Incorrect system time can affect booking windows.
- Output websites no longer receive fullscreen/Picture-in-Picture permission, preventing content from bypassing the system watermark. Cost: embedded fullscreen controls are unavailable.
- Path identity wins over conflicting legacy room identifiers; ambiguous aliases remain unresolved rather than selecting the wrong room.
- Variable-height postprogram rows are prepared into complete continuation pages. Reduced motion uses static additional pages instead of title animation. Cost: very long titles need additional reading time.
- OFF AIR does not itself terminate a postprogram color session; an actual transition into another section does.
- The earlier missing-update report was not reproduced: the configured provider and V74 metadata were correct. No speculative updater rewrite was introduced.
- Build retains the existing large-bundle warning; bundle splitting is outside this release's behavior fixes.

No deferred minor from the independent review: the OFF AIR session finding was treated as important because it directly affected the promised stable color.
