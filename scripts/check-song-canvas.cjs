const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [
  ['song split action', read('src/ProductionWorkspace.tsx'), 'autoSplitSongSection'],
  ['song overflow warning', read('src/ProductionWorkspace.tsx'), 'lyric-overflow-warning'],
  ['stage structured rows', read('src/App.tsx'), 'stage-song-rows'],
  ['canvas pointer capture', read('src/ProductionWorkspace.tsx'), 'setPointerCapture'],
  ['canvas grid setting', read('src/ProductionWorkspace.tsx'), 'canvasGridSize'],
  ['canvas alignment action', read('src/store.ts'), 'alignSelectedElements'],
  ['canvas nudge action', read('src/store.ts'), 'nudgeSelectedElements'],
  ['canvas layers panel', read('src/ProductionWorkspace.tsx'), 'layer-list'],
];
for (const [label, source, needle] of checks) {
  if (!source.includes(needle)) throw new Error(`missing ${label}: ${needle}`);
}
console.log(`song-canvas-static: PASS (${checks.length} checks)`);
