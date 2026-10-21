const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

(async () => {
  assert.equal(process.platform, 'win32', 'Native frame-ring probe requires Windows');
  const root = path.resolve(__dirname, '../..');
  const entry = path.join(root, 'scripts/powerpoint-native-probe/build.cjs');
  assert.ok(fs.existsSync(entry), 'Native frame-ring implementation/build is missing');
  const {buildProbe} = require(entry);
  const built = await buildProbe({root, target: 'frame-ring-tests'});
  const result = spawnSync(built.executable, [], {cwd: built.folder, encoding: 'utf8', timeout: 120000, windowsHide: true});
  fs.writeFileSync(path.join(built.folder, 'frame-ring-tests.log'), (result.stdout || '') + (result.stderr || ''));
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  assert.ifError(result.error);
  assert.equal(result.status, 0, 'Native ring behavioral tests failed');
  assert.match(result.stdout, /FRAME_RING_PASS/);
  console.log('FRAME_RING_ARTIFACTS ' + built.folder);
})().catch(error => {console.error(error); process.exitCode = 1;});
