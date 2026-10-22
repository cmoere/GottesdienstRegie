const assert = require('node:assert/strict');
const path = require('node:path');
(async () => {
  let runNativeProbe;
  try {({runNativeProbe} = require('../../scripts/powerpoint-native-probe/run.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
  assert.equal(typeof runNativeProbe, 'function', 'Native full frame-distribution probe is missing');
  assert.ok(process.argv.includes('--monitor=1'), 'Native visible probe requires authorized Monitor1');
  const result = await runNativeProbe({root: path.resolve(__dirname, '../..'), monitor: 1});
  assert.equal(result.visual, true, 'Native original PowerPoint still fails acceptance: ' + JSON.stringify(result));
  assert.equal(result.audio, 'unsupported');
  console.log('NATIVE_POWERPOINT_PROBE_PASS');
})().catch(error => {console.error(error); process.exitCode = 1;});
