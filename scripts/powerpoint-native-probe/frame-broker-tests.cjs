const test = require('node:test');
const assert = require('node:assert/strict');
let createFrameBroker;
try {({createFrameBroker} = require('./frame-broker.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const sessionId = '11'.repeat(16), generation = '22'.repeat(16);
function frame(sequence) {return {descriptor: {sessionId, generation, sequence, capturedQpc: '123456789', qpcFrequency: '10000000', width: 1920, height: 1080, stride: 7680, byteLength: 8294400}, pixels: Buffer.alloc(8294400, sequence)};}
function setup(source) {
  assert.equal(typeof createFrameBroker, 'function', 'Authorized frame broker is missing');
  let sequence = 0, time = 0;
  const reader = {readLatest: source || (async () => frame(++sequence)), close: async () => {}};
  const broker = createFrameBroker({sessionId, generation, reader, now: () => time});
  function client(id, send) {const packets = []; let closed = false; const unregister = broker.register({id, send: send || (value => packets.push(value)), close: () => {closed = true;}}); return {packets, unregister, get closed() {return closed;}};}
  return {broker, client, setTime(value) {time = value;}};
}
test('slow client does not queue or block a healthy client', async () => {
  const {broker, client} = setup(); const slow = client('slow'), fast = client('fast');
  try {
    await broker.pump(); broker.ack('fast', generation, 1);
    await broker.pump(); broker.ack('fast', generation, 2); await broker.pump();
    assert.equal(slow.packets.length, 1); assert.equal(fast.packets.at(-1).descriptor.sequence, 3);
  } finally {await broker.revoke();}
});
test('four clients accepted, fifth and duplicate identity rejected', async () => {
  const {broker, client} = setup();
  try {for (let i = 0; i < 4; ++i) client(String(i)); assert.throws(() => client('extra'), /FRAME_CLIENT_LIMIT/); assert.throws(() => client('0'), /FRAME_CLIENT_EXISTS/);}
  finally {await broker.revoke();}
});
test('wrong generation and sequence ACK do not release an outstanding frame', async () => {
  const {broker, client} = setup(); const a = client('a');
  try {
    await broker.pump(); broker.ack('a', '33'.repeat(16), 1); broker.ack('a', generation, 2); await broker.pump();
    assert.equal(a.packets.length, 1);
    broker.ack('a', generation, 1); await broker.pump(); assert.equal(a.packets.at(-1).descriptor.sequence, 3);
  } finally {await broker.revoke();}
});
test('late ACK from closed output cannot free a reconnected output', async () => {
  const {broker, client} = setup(); const old = client('old-window');
  try {
    await broker.pump(); old.unregister(); const current = client('new-window');
    assert.equal(current.packets.at(-1).descriptor.sequence, 1);
    broker.ack('old-window', generation, 1); await broker.pump(); assert.equal(current.packets.length, 1);
    broker.ack('new-window', generation, 1); await broker.pump(); assert.equal(current.packets.at(-1).descriptor.sequence, 3);
  } finally {await broker.revoke();}
});
test('expired client is disconnected without stalling another output', async () => {
  const {broker, client, setTime} = setup(); const slow = client('slow'), fast = client('fast');
  try {await broker.pump(); broker.ack('fast', generation, 1); setTime(501); await broker.pump(); assert.equal(slow.closed, true); assert.equal(fast.closed, false); assert.equal(fast.packets.at(-1).descriptor.sequence, 2);}
  finally {await broker.revoke();}
});
test('send failure removes only that client', async () => {
  const {broker, client} = setup(); const bad = client('bad', () => {throw Error('window destroyed');}), good = client('good');
  try {await broker.pump(); assert.equal(bad.closed, true); assert.equal(good.packets.length, 1); assert.equal(broker.status().state, 'ready');}
  finally {await broker.revoke();}
});
test('overlapping pumps share one native read and one delivered frame', async () => {
  let resolveRead, active = false;
  const {broker, client} = setup(async () => {if (active) throw Error('reader busy'); active = true; return new Promise(resolve => {resolveRead = resolve;});});
  const a = client('a');
  try {const first = broker.pump(), second = broker.pump(); await Promise.resolve(); resolveRead(frame(1)); await Promise.all([first, second]); assert.equal(a.packets.length, 1); assert.equal(broker.status().state, 'ready');}
  finally {await broker.revoke();}
});
test('revocation during native read prevents late delivery', async () => {
  let resolveRead;
  const {broker, client} = setup(() => new Promise(resolve => {resolveRead = resolve;})); const a = client('a');
  const pending = broker.pump(); await Promise.resolve(); await broker.revoke(); resolveRead(frame(1)); await pending;
  assert.equal(a.packets.length, 0); assert.equal(a.closed, true); assert.equal(broker.status().state, 'revoked');
});
test('native read failure is contained and last frame is not replaced', async () => {
  let index = 0;
  const {broker, client} = setup(async () => {if (++index === 1) return frame(1); throw Error('native private error');}); const a = client('a');
  try {await broker.pump(); broker.ack('a', generation, 1); await broker.pump(); assert.equal(a.packets.length, 1); assert.equal(broker.status().state, 'error'); assert.equal(broker.status().errorCode, 'FRAME_SOURCE_FAILED');}
  finally {await broker.revoke();}
});
for (const fault of ['generation', 'bytes', 'geometry']) test('invalid native packet never reaches output: ' + fault, async () => {
  const bad = frame(1);
  if (fault === 'generation') bad.descriptor.generation = '33'.repeat(16);
  if (fault === 'bytes') bad.pixels = Buffer.alloc(1);
  if (fault === 'geometry') bad.descriptor.width = 4294967295;
  const {broker, client} = setup(async () => bad); const a = client('a');
  try {await broker.pump(); assert.equal(a.packets.length, 0); assert.equal(broker.status().state, 'error');}
  finally {await broker.revoke();}
});
test('empty read preserves last frame, newly opened output receives current image', async () => {
  let first = true;
  const {broker, client} = setup(async () => {if (first) {first = false; return frame(7);} return null;}); client('a');
  try {await broker.pump(); await broker.pump(); const b = client('b'); assert.equal(b.packets[0].descriptor.sequence, 7);}
  finally {await broker.revoke();}
});
