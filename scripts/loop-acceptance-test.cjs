const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const domain = fs.readFileSync(path.join(root, 'src', 'loopDomain.ts'), 'utf8');
const store = fs.readFileSync(path.join(root, 'src', 'store.ts'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');
const checks = [
  ['fester Wetter-Screen', domain.includes("https://weather.crbnm06.workers.dev") && domain.includes('20_000')],
  ['Wetter-Dauer editierbar mit Empfehlung', app.includes('Empfehlung: 20 Sekunden') && app.includes('weatherDurationMs') && app.includes('disabled={!canEdit}')],
  ['Placement-Schutz im Store', store.includes('canPlaceItem(item,target)') || store.includes('canPlaceItem(item, target)')],
  ['Loop-Elemente nur im Loop-Menü', app.includes('LOOP-ELEMENTE') && app.includes('loopAvailable')],
  ['Screenmeldung-Dateien ausgeliefert', ['screenmeldung.html', 'screenmeldung.css', 'screenmeldung.js'].every((file) => fs.existsSync(path.join(root, 'public', 'screenmeldung', file)))],
];
for (const [label, ok] of checks) if (!ok) throw new Error(`Abnahmetest fehlgeschlagen: ${label}`);
console.log('PASS: Loop-Elemente, Wetterregeln, Placement und Screenmeldung-Grundlage');
