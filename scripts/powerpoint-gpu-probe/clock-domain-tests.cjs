const test = require('node:test'), assert = require('node:assert/strict');
let assessClockSamples;
try {({assessClockSamples} = require('./clock-domain.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const samples = base => [0,1,2].map(i => ({beforeMs: base + i * 10, afterMs: base + i * 10 + 2, qpcNow: String((base + i * 10 - 100) * 10000), qpcFrequency: '10000000'}));
test('clock mapping uses minimum roundtrip, preserves future source diagnostic', () => {
  assert.equal(typeof assessClockSamples, 'function', 'GPU clock assessment missing');
  const frameTimes = [{sourceReportedQpc:'110290000',acquiredQpc:'109990000',copyDoneQpc:'110000000',qpcFrequency:'10000000'}];
  const result = assessClockSamples({startSamples: samples(1000), endSamples: samples(61000), frameTimes});
  assert.equal(result.mapping.offsetMs, 101); assert.equal(result.mapping.driftMs, 0);
  assert.equal(result.sourceLatencyAvailable, false); assert.ok(result.diagnostics.includes('SOURCE_REPORTED_IN_FUTURE'));
  assert.equal(frameTimes[0].sourceReportedQpc, '110290000');
});
test('inconsistent frequency and missing samples cannot create mapping', () => {
  assert.equal(typeof assessClockSamples, 'function'); const bad = samples(61000); bad[0].qpcFrequency = '1';
  assert.equal(assessClockSamples({startSamples: samples(1000), endSamples: bad, frameTimes: []}).mapping, null);
  assert.equal(assessClockSamples({startSamples: [], endSamples: [], frameTimes: []}).sourceLatencyAvailable, false);
});
