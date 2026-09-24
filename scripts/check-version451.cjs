const assert=require('node:assert/strict'),fs=require('node:fs');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const releases=JSON.parse(fs.readFileSync('public/releases.json','utf8'));
const builds=releases.versions.flatMap(line=>line.builds);
assert.match(pkg.version,/^0\.(?:4[5-9]|[5-9]\d)\./);
assert.equal(builds.some(build=>build.version==='0.45.1'),true);
assert.match(fs.readFileSync('RELEASE_NOTES.md','utf8'),/0\.45\.1/);
assert.match(fs.readFileSync('src/noteStatus.ts','utf8'),/PERSONAL_NOTE_SAVED_MS=5000/);
console.log('Version 0.45.1 note status and release metadata checks passed.');
