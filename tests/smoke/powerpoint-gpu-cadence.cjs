const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {buildGpuProbe} = require('../../scripts/powerpoint-gpu-probe/build.cjs');
const {runNativeCommand} = require('../../scripts/native-probe-toolchain.cjs');

(async () => {
  const built = await buildGpuProbe({root: path.resolve(__dirname, '../..'), target: 'cadence-tests'});
  const result = await runNativeCommand(built.executable, [], {cwd: built.folder});
  await fs.writeFile(path.join(built.folder, 'cadence-tests.log'), result.stdout + result.stderr);
  process.stdout.write(result.stdout); process.stderr.write(result.stderr);
  assert.equal(result.code, 0, 'Native capture cadence regression failed');
  assert.match(result.stdout, /GPU_CADENCE_PASS/);
  console.log('GPU_CADENCE_ARTIFACTS ' + built.folder);
})().catch(error => {console.error(error); process.exitCode = 1;});
