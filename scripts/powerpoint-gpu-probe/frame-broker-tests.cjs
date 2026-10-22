const test = require('node:test');
const assert = require('node:assert/strict');
let createGpuFrameBroker;
try {({createGpuFrameBroker} = require('./frame-broker.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const flush = () => new Promise(resolve => setImmediate(resolve));
const deferred = () => {let resolve, reject; const promise = new Promise((a, b) => {resolve = a; reject = b;}); return {promise, resolve, reject};};
const key = (seq, slot = (seq - 1) % 3) => ({sessionId: 'aa'.repeat(16), generation: 'bb'.repeat(16), slotId: slot, sequence: seq});
function fixture({slow = false, syncRelease = false, earlyRelease = false} = {}) {
  assert.equal(typeof createGpuFrameBroker, 'function', 'GPU broker is missing');
  let sequence = 0, available = false, notify, clock = 0, claims = 0;
  const releases = [], transfers = [], imports = [], closes = [], slowSend = deferred();
  const producer = {subscribeLatest(cb) {notify = cb; return () => {};}, onFault() {return () => {};},
    async claimLatest() {claims++; if (!available) return null; available = false; const k = key(++sequence); return {record: {key: k, width: 1920, height: 1080, pixelFormat: 'bgra', times: {sourceReportedQpc: null, acquiredQpc: '10', copyDoneQpc: '11', qpcFrequency: '10000000'}}, ntHandle: Buffer.alloc(8, 1)};},
    async release(k) {releases.push(k);}};
  const textureApi = {import(claim, callback) {
    const item = {key: claim.record.key, callback, mainReleased: 0}; imports.push(item);
    if (earlyRelease) callback();
    return {send(frame, k) {transfers.push({frame, key: k}); return slow && frame === 'slow' ? slowSend.promise : Promise.resolve();},
      releaseMain() {item.mainReleased++; if (syncRelease) callback();}};
  }};
  const broker = createGpuFrameBroker({producer, textureApi, now: () => clock});
  return {broker, producer, releases, transfers, imports, closes, slowSend,
    register(id) {return broker.register({id, frame: id, close: () => closes.push(id)});},
    async publish() {available = true; notify(); await broker.pumpLatest(); await flush();},
    advance(ms) {clock += ms;}, claims: () => claims};
}
test('ack never releases a slot; real ref callback releases the exact key once', async () => {
  const f = fixture(); f.register('main'); await f.publish();
  assert.equal(f.broker.ack('main', key(1)), true); assert.equal(f.releases.length, 0);
  assert.equal(f.imports[0].mainReleased, 1);
  f.imports[0].callback(); await flush(); assert.deepEqual(f.releases, [key(1)]);
  f.imports[0].callback(); await flush(); assert.equal(f.releases.length, 1);
  await f.broker.revoke();
});
test('late callback and stale ACK cannot release a newer slot version', async () => {
  const f = fixture(); f.register('main'); await f.publish();
  f.broker.ack('main', key(1)); f.imports[0].callback(); await flush();
  for (let seq = 2; seq <= 4; ++seq) {
    await f.publish(); f.broker.ack('main', key(seq));
    if (seq < 4) {f.imports.at(-1).callback(); await flush();}
  }
  assert.equal(f.broker.ack('main', key(1)), false);
  f.imports[0].callback(); await flush(); assert.equal(f.releases.length, 3);
  f.imports.at(-1).callback(); await flush(); assert.equal(f.releases.at(-1).sequence, 4);
  await f.broker.revoke();
});
test('slow send does not block healthy output; timeout never invents GPU release', async () => {
  const f = fixture({slow: true}); f.register('slow'); f.register('main'); await f.publish();
  assert.equal(f.transfers.length, 2); f.broker.ack('main', key(1));
  await f.publish(); assert.equal(f.transfers.filter(v => v.frame === 'main').length, 2);
  assert.equal(f.transfers.filter(v => v.frame === 'slow').length, 1);
  f.broker.ack('main', key(2));
  f.advance(501); await f.broker.pumpLatest();
  assert.ok(f.closes.includes('slow')); assert.equal(f.releases.length, 0);
  f.slowSend.resolve(); await flush();
  for (const item of f.imports) item.callback(); await flush(); await f.broker.revoke();
});
test('four clients only, duplicate IDs rejected, newly registered client gets newest', async () => {
  const f = fixture();
  for (const id of ['a', 'b', 'c', 'd']) f.register(id);
  assert.throws(() => f.register('e')); assert.throws(() => f.register('a'));
  await f.publish();
  for (const id of ['a', 'b', 'c', 'd']) f.broker.ack(id, key(1));
  f.imports[0].callback(); await flush(); await f.broker.revoke();
  const g = fixture(); const unregister = g.register('old'); await g.publish();
  unregister(); g.register('new'); await g.publish();
  assert.equal(g.transfers.at(-1).frame, 'new'); assert.equal(g.transfers.at(-1).key.sequence, 2);
  for (const item of g.imports) item.callback(); await flush(); await g.broker.revoke();
});
test('all clients busy does not spin claims or grow imports above three', async () => {
  const f = fixture(); f.register('main'); await f.publish();
  const before = f.claims(); for (let i = 0; i < 100; ++i) await f.broker.pumpLatest();
  assert.equal(f.claims(), before); assert.equal(f.imports.length, 1);
  for (let seq = 2; seq <= 3; ++seq) {f.broker.ack('main', key(seq - 1)); await f.publish();}
  f.broker.ack('main', key(3)); const full = f.claims(); await f.publish();
  assert.equal(f.claims(), full); assert.equal(f.imports.length, 3);
  await f.broker.revoke();
});
test('revoke while claim pending returns the never-imported exact claim', async () => {
  const f = fixture(); f.register('main'); const pending = deferred(); f.producer.claimLatest = () => pending.promise;
  const pump = f.broker.pumpLatest(); await flush(); const revoked = f.broker.revoke();
  pending.resolve({record: {key: key(1), width: 1920, height: 1080, pixelFormat: 'bgra'}, ntHandle: Buffer.alloc(8, 1)});
  await pump; await revoked;
  assert.equal(f.imports.length, 0); assert.deepEqual(f.releases, [key(1)]);
});
test('revoke during send preserves the native lease until actual ref callback', async () => {
  const f = fixture({slow: true}); f.register('slow'); await f.publish();
  await f.broker.revoke(); assert.equal(f.releases.length, 0);
  f.slowSend.resolve(); await flush(); f.imports[0].callback(); await flush();
  assert.deepEqual(f.releases, [key(1)]);
});
test('synchronous callback inside releaseMain is handled once', async () => {
  const f = fixture({syncRelease: true}); f.register('main'); await f.publish(); await flush();
  assert.deepEqual(f.releases, [key(1)]); await f.broker.revoke();
});
test('callback before releaseMain is a lifetime fault, not permission to overwrite', async () => {
  const f = fixture({earlyRelease: true}); f.register('main'); await f.publish();
  assert.equal(f.transfers.length, 0); assert.equal(f.releases.length, 0);
  assert.equal(f.broker.status().fault, 'GPU_BROKER_RELEASE_ORDER');
  await f.broker.revoke();
});

test('send failure disconnects only affected output and still awaits real callback', async () => {
  const g = fixture({slow: true}); g.register('slow'); g.register('main'); await g.publish();
  g.slowSend.reject(Error('closed own window')); await flush();
  assert.deepEqual(g.closes, ['slow']); assert.equal(g.broker.status().clients, 1);
  assert.equal(g.releases.length, 0); assert.equal(g.imports[0].mainReleased, 1);
  g.imports[0].callback(); await flush(); assert.equal(g.releases.length, 1);
  await g.broker.revoke();
});

test('overlapping pumps have one native claim and real timer removes only unresponsive client', async () => {
  const f = fixture(); const pending = deferred(); let claims = 0;
  f.producer.claimLatest = () => {claims++; return pending.promise;}; f.register('main');
  const all = Array.from({length: 100}, () => f.broker.pumpLatest()); await flush(); assert.equal(claims, 1);
  pending.resolve(null); await Promise.all(all); await f.broker.revoke();
  const g = fixture(); g.register('stalled'); g.register('healthy'); await g.publish();
  g.broker.ack('healthy', key(1));
  await new Promise(resolve => setTimeout(resolve, 550));
  assert.deepEqual(g.closes, ['stalled']); assert.equal(g.releases.length, 0);
  await g.broker.revoke(); g.imports[0].callback(); await flush(); assert.equal(g.releases.length, 1);
});
