# Lyric scrolling checks

- `node scripts/check-lyric-scrolling.cjs`: inheritance, song-only scope, arranged order, jumps, previous, immutable runtime snapshot, empty/title slides, bounds.
- `npm run build`: renderer and Electron TypeScript projects plus production bundle.
- Start `npx vite --host 127.0.0.1 --port 5178`, then run `npx electron scripts/check-lyric-renderer.cjs`: isolated offscreen Electron renderer, NEXT, rapid NEXT, previous/jump, 3840×2160 layout, long active lyrics, Undo/Redo and document serialization/reload. The fixture uses synthetic lyrics, not production presentation data.
- Renderer screenshot is written to the OS temporary directory as `gottesdienstregie-lyric-scrolling-test.png`.

The offscreen 4K test verifies layout, not frame-rate guarantees on the operator's GPU. Before live deployment, check physical MAIN output, Quick Screens, font availability and background-video continuity on the actual presentation computer. Settings use the existing local document persistence; these tests do not assert cloud synchronization. Long lyrics keep their configured font size; preflight warns about overflow. Split oversized sections before ON AIR.
