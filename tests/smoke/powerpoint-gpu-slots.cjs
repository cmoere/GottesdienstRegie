const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');

(async () => {
  assert.equal(process.platform, 'win32', 'GPU slot probe requires Windows');
  const root = path.resolve(__dirname, '../..');
  const entry = path.join(root, 'scripts/powerpoint-gpu-probe/build.cjs');
  assert.ok(fs.existsSync(entry), 'GPU slot implementation/build is missing');
  const {buildGpuProbe} = require(entry);
  await assert.rejects(buildGpuProbe({root, target: '../unapproved'}), /NATIVE_BUILD_UNKNOWN_TARGET/);
  const built = await buildGpuProbe({root, target: 'slot-tests'});
  const result = spawnSync(built.executable, [], {cwd: built.folder, encoding: 'utf8', timeout: 120000, windowsHide: true});
  fs.writeFileSync(path.join(built.folder, 'slot-tests.log'), (result.stdout || '') + (result.stderr || ''));
  process.stdout.write(result.stdout || '');
  process.stderr.write(result.stderr || '');
  assert.ifError(result.error);
  assert.equal(result.status, 0, 'Native GPU ownership behavioral tests failed');
  assert.match(result.stdout, /GPU_SLOT_PASS/);
  console.log('GPU_SLOT_ARTIFACTS ' + built.folder);
})().catch(error => {console.error(error); process.exitCode = 1;});
