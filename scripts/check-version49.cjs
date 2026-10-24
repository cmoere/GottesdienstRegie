const assert=require('node:assert/strict'),fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const releases=JSON.parse(fs.readFileSync('public/releases.json','utf8'));
const notes=fs.readFileSync('RELEASE_NOTES.md','utf8');
assert.ok(Number(pkg.version.split('.')[1])>=49);
assert.ok(releases.versions.flatMap(x=>x.builds).some(x=>x.version==='0.49.0'));
assert.match(notes,/410 × 700/);
assert.match(notes,/30.Sekunden/);
// v89.3 supersedes the narrow splash with correctly sized startup geometry.
// Preserve historical notes and verify current behavior instead of an obsolete import.
execFileSync(process.execPath,['node_modules/vitest/vitest.mjs','run','electron/windowStartup.test.ts','--maxWorkers=1','--no-file-parallelism'],{stdio:'inherit',timeout:60000});
console.log('Version 0.49 history and current startup geometry checks passed.');
