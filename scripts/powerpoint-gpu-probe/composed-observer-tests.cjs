const test = require('node:test');
const assert = require('node:assert/strict');
const {strip} = require('./frame-stamp-tests.cjs');
let createComposedObserver;
try {({createComposedObserver} = require('./composed-observer.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const flush = () => new Promise(resolve => setImmediate(resolve));
const record = (sequence, generation = 'b'.repeat(32)) => ({key: {sessionId: 'a'.repeat(32), generation, slotId: sequence % 3, sequence}});
function fixture() {
  assert.equal(typeof createComposedObserver, 'function', 'composed observer missing');
  let sequence = 1, motion = 1, clock = 0; const observations = [], captures = [];
  const observer = createComposedObserver({captureStrip: async rect => {captures.push(rect); const pixels = strip(sequence); pixels.fill(motion, 1920 * 8 * 4); return {pixels, width: 1920, height: 9};}, now: () => ++clock, onObservation: value => observations.push(value)});
  observer.reset('b'.repeat(32)); return {observer, observations, captures, set(seq, m) {sequence = seq; motion = m;}};
}
test('stamp change alone is not source motion; source and stamp come from one capture', async () => {
  const f = fixture(); f.observer.remember(record(1)); await f.observer.request();
  f.set(2, 1); f.observer.remember(record(2)); await f.observer.request();
  f.set(3, 2); f.observer.remember(record(3)); await f.observer.request();
  assert.equal(f.observations.length, 2); assert.deepEqual(f.observations.map(x => x.sequence), [1, 3]);
  assert.deepEqual(f.captures, Array(3).fill({x: 0, y: 953, width: 1920, height: 9})); f.observer.close();
});
test('unknown, evicted record and old generation cannot prove a frame', async () => {
  const f = fixture(); await f.observer.request(); assert.equal(f.observations.length, 0);
  for (let i = 1; i <= 17; ++i) f.observer.remember(record(i));
  await f.observer.request(); assert.equal(f.observations.length, 0);
  f.observer.reset('c'.repeat(32)); f.observer.remember(record(1)); await f.observer.request();
  assert.equal(f.observations.length, 0); assert.equal(f.observer.status().records, 0); f.observer.close();
});
test('one capture plus dirty bit, reset ignores old result, close ignores late result', async () => {
  assert.equal(typeof createComposedObserver, 'function'); let done, calls = 0; const seen = [];
  const observer = createComposedObserver({captureStrip: () => {calls++; return new Promise(resolve => {done = resolve;});}, now: () => 1, onObservation: x => seen.push(x)});
  observer.reset('b'.repeat(32)); observer.remember(record(1));
  const first = observer.request(); for (let i = 0; i < 100; ++i) observer.request(); assert.equal(calls, 1);
  observer.reset('c'.repeat(32)); done({pixels: strip(1), width: 1920, height: 9}); await first; await flush();
  assert.equal(calls, 1); assert.equal(seen.length, 0);
  observer.remember(record(1, 'c'.repeat(32))); const last = observer.request(); observer.close();
  done({pixels: strip(1), width: 1920, height: 9}); await last; assert.equal(seen.length, 0);
});

test('100 requests during capture coalesce to exactly one follow-up', async () => {
  let done, calls = 0;
  const observer = createComposedObserver({captureStrip: () => {calls++; return new Promise(resolve => {done = resolve;});}, onObservation() {}});
  observer.reset('b'.repeat(32)); observer.remember(record(1)); const first = observer.request();
  for (let i = 0; i < 100; ++i) observer.request();
  assert.equal(calls, 1); done({pixels: strip(1), width: 1920, height: 9}); await flush();
  assert.equal(calls, 2); done({pixels: strip(1), width: 1920, height: 9}); await first; assert.equal(calls, 2); observer.close();
});
