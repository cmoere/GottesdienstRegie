const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'loopDomain.ts'), 'utf8');
for (const token of ['canPlaceItem', 'WEATHER_SCREEN_DURATION_MS = 20_000', 'class LoopController', 'isLoopSection']) {
  if (!source.includes(token)) throw new Error(`Loop-Domain fehlt: ${token}`);
}
console.log('PASS: Loop-Domain enthält Placement-Schutz, festen Wetterwert und Controller');
