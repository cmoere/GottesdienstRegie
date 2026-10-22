const test = require('node:test'), assert = require('node:assert/strict');
let evaluateRun;
try {({evaluateRun} = require('./metrics.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
function observation({count = 1800, skew = 0, latency = 250} = {}) {
  const frames = [];
  for (const role of ['main', 'mirror']) for (let i = 0; i < count; ++i) frames.push({role, sequence: i + 1, presentedMs: i * 60000/count + (role === 'mirror' ? skew : 0), sourceFingerprint: String(i)});
  const commands = Array.from({length: 60}, (_, i) => ({id: String(i), startedMs: i * 900, observed: {main: i * 900 + latency, mirror: i * 900 + latency}}));
  return {kind: 'powerpoint', startMs: 0, endMs: 60000, frames, commands, errors: [], originalUnchanged: true, foreignDocumentUnchanged: true};
}
test('accepts exact declared cadence and command latency boundaries', () => {
  assert.equal(typeof evaluateRun, 'function', 'Native frame acceptance evaluator is missing');
  const result = evaluateRun(observation({count: 1770}));
  assert.equal(result.visual, true); assert.equal(result.metrics.roles.main.actualFrameRate, 29.5);
  assert.equal(result.metrics.commandToFrameP95Ms, 250);
});
test('accepts exact 150ms skew boundary without hiding unmatched edge frames', () => {
  assert.equal(typeof evaluateRun, 'function', 'Native frame acceptance evaluator is missing');
  const result = evaluateRun(observation({skew: 150}));
  assert.equal(result.visual, true); assert.equal(result.metrics.mirrorSkewP95Ms, 150);
  assert.ok(result.metrics.unmatchedFrames > 0);
});
for (const condition of ['short', 'slow', 'skew', 'latency', 'freeze', 'missing', 'duplicates', 'commands', 'clock', 'error', 'changed-original']) test('rejects actual run violation: ' + condition, () => {
  assert.equal(typeof evaluateRun, 'function', 'Native frame acceptance evaluator is missing');
  let run = observation();
  if (condition === 'short') run.endMs = 59000;
  if (condition === 'slow') run = observation({count: 1769});
  if (condition === 'skew') run = observation({skew: 151});
  if (condition === 'latency') run = observation({latency: 251});
  if (condition === 'freeze') run.frames = run.frames.filter(frame => frame.presentedMs < 59000);
  if (condition === 'missing') run.frames = run.frames.filter(frame => frame.role !== 'mirror');
  if (condition === 'duplicates') for (const frame of run.frames) frame.sourceFingerprint = 'same-unchanged-image';
  if (condition === 'commands') delete run.commands[30].observed.mirror;
  if (condition === 'clock') run.frames[1].presentedMs = NaN;
  if (condition === 'error') run.errors.push('lost-source');
  if (condition === 'changed-original') run.originalUnchanged = false;
  assert.equal(evaluateRun(run).visual, false);
});
test('transport-only synthetic source can never enable original PowerPoint mode', () => {
  assert.equal(typeof evaluateRun, 'function', 'Native frame acceptance evaluator is missing');
  const run = observation(); run.kind = 'transport'; run.commands = [];
  const result = evaluateRun(run);
  assert.equal(result.transportPass, true); assert.equal(result.visual, false);
});
test('151ms frame gap fails even when total average rate is sufficient', () => {
  assert.equal(typeof evaluateRun, 'function', 'Native frame acceptance evaluator is missing');
  const run = observation({count: 1900});
  run.frames = run.frames.filter(frame => !(frame.presentedMs > 30000 && frame.presentedMs < 30151));
  const result = evaluateRun(run);
  assert.ok(result.metrics.roles.main.actualFrameRate > 29.5); assert.equal(result.visual, false);
});
test('capture readiness cannot hide a missing command response behind a good p95', () => {
  assert.equal(typeof evaluateRun, 'function');
  const run = observation(); delete run.commands[30].observed.mirror;
  assert.equal(evaluateRun(run).captureReady, false);
});
test('pixel readiness is separate from actual original and sentinel verification', () => {
  assert.equal(typeof evaluateRun, 'function');
  const run = observation(); delete run.originalUnchanged; delete run.foreignDocumentUnchanged;
  const result = evaluateRun(run);
  assert.equal(result.captureReady, true); assert.equal(result.visual, false);
});
