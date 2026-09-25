const assert=require('node:assert/strict'),fs=require('node:fs');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8')),releases=JSON.parse(fs.readFileSync('public/releases.json','utf8'));
const browser=fs.readFileSync('src/MediaBrowser.tsx','utf8'),css=fs.readFileSync('src/media-browser-fixes.css','utf8'),repository=fs.readFileSync('electron/MediaRepository.ts','utf8');
assert.equal(pkg.version,'0.51.0');
assert.deepEqual(releases.versions.flatMap(x=>x.builds).filter(x=>x.current).map(x=>x.version),['0.51.0']);
for(const phrase of ['NEU GENERIEREN','IN MEDIENBIBLIOTHEK SPEICHERN','generator-mini-spinner','saveGenerated'])assert.match(browser,new RegExp(phrase));
assert.match(css,/aspect-ratio:16\/9/);
assert.match(repository,/importGenerated/);
console.log('Version 0.51 confirmed AI motif workflow checks passed.');
