const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'loopData.ts'), 'utf8');
for (const token of ['normalizeAnnouncement', 'validateAnnouncement', 'filterAnnouncements', "item.audience !== 'public'", 'validUntil']) {
  if (!source.includes(token)) throw new Error(`Announcement-Service fehlt: ${token}`);
}
for (const file of ['screenmeldung.html', 'screenmeldung.css', 'screenmeldung.js']) {
  if (!fs.existsSync(path.join(root, 'public', 'screenmeldung', file))) throw new Error(`Screenmeldung-Datei fehlt: ${file}`);
}
console.log('PASS: Announcement-Service und Screenmeldung-Basis vorhanden');
