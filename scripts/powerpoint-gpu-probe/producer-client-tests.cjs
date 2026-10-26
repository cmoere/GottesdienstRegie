const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
let startGpuProducer;
try {({startGpuProducer} = require('./producer-client.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const options = mode => ({executable: process.execPath, args: [path.resolve(__dirname, '../../tests/smoke/powerpoint-gpu-protocol-fixture.cjs'), mode], cwd: process.cwd(),
  sessionId: 'aa'.repeat(16), generation: 'bb'.repeat(16), owner: {hwnd: '123', pid: 45, createdAt: '132000000000000000', crop: {x: 0, y: 64, width: 1600, height: 900, outerWidth: 1600, outerHeight: 964}}});
async function start(mode) {assert.equal(typeof startGpuProducer, 'function', 'Main GPU client is missing'); return startGpuProducer(options(mode));}
test('marked original sources require the complete root/child lifetime binding',async()=>{
 const config=options('guarded');config.owner={...config.owner,childWindowHandle:'456',lifetimeProperty:'GDR.PowerPoint.'+config.generation,lifetimeValue:'789'};
 const client=await startGpuProducer(config);try{const claim=await client.claimLatest();await client.release(claim.record.key);}finally{assert.equal((await client.stop()).drained,true)}
 for(const patch of [{childWindowHandle:'0'},{childWindowHandle:'123'},{lifetimeProperty:'other'},{lifetimeValue:'0'},{lifetimeValue:'2147483648'},{childWindowHandle:undefined}])await assert.rejects(startGpuProducer({...config,owner:{...config.owner,...patch}}),/GPU_PRODUCER_CONFIG/);
});
test('fragmented real pipe preserves uint64 handles and separate source/copy times', async () => {
  const client = await start('fragmented');
  try {
    const claim = await client.claimLatest();
    assert.equal(claim.ntHandle.length, 8); assert.equal(claim.ntHandle.readBigUInt64LE(), 9007199254740993n);
    assert.equal(claim.record.times.sourceReportedQpc, '12345678901234999');
    assert.equal(claim.record.times.copyDoneQpc, '12345678901234568');
    await assert.rejects(client.release({...claim.record.key, sequence: 2}), /GPU_PRODUCER_RELEASE/);
    await client.release(claim.record.key);
    await assert.rejects(client.release(claim.record.key), /GPU_PRODUCER_RELEASE/);
  } finally { assert.deepEqual(await client.stop(), {exitCode: 0, drained: true}); }
});
test('16 valid maximal lines in one chunk are accepted; seventeenth request cannot queue', async () => {
  const client = await start('batch16');
  try {
    const requests = Array.from({length: 16}, () => client.clock());
    await assert.rejects(client.clock(), /GPU_PRODUCER_BUSY/);
    const clocks = await Promise.all(requests);
    assert.equal(clocks.length, 16); assert.ok(clocks.every(value => value.qpcNow === '12345678901234567'));
  } finally {await client.stop();}
});
test('busy rejection does not permanently mark a known lease as releasing', async () => {
  const client = await start('batch16');
  try {
    const claim = await client.claimLatest();
    const clocks = Array.from({length: 16}, () => client.clock());
    await assert.rejects(client.release(claim.record.key), /GPU_PRODUCER_BUSY/);
    await Promise.all(clocks); await client.release(claim.record.key);
  } finally {await client.stop();}
});
test('latest notice survives late subscription, unsubscribes and has no native handle', async () => {
  const client = await start('notice'); const notices = [];
  try {
    const unsubscribe = client.subscribeLatest(value => notices.push(value));
    await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(notices.at(-1).noticeId, 1);
    await client.clock(); await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(notices.at(-1).noticeId, 2);
    assert.deepEqual(Object.keys(notices.at(-1)).sort(), ['generation', 'noticeId', 'sessionId']);
    unsubscribe(); await client.clock(); await new Promise(resolve => setTimeout(resolve, 10));
    assert.equal(notices.length, 2);
  } finally {await client.stop();}
});
test('registering during fault dispatch cannot duplicate the terminal fault', async () => {
  const client = await start('oversized'); let secondary = 0;
  client.onFault(() => client.onFault(() => secondary++));
  try {await assert.rejects(client.clock()); await new Promise(resolve => setImmediate(resolve)); assert.equal(secondary, 1);}
  finally {await client.stop();}
});
for (const mode of ['bad-handle', 'same-handles', 'ready-session', 'wrong-parent']) test('rejects invalid bootstrap: ' + mode, async () => {
  assert.equal(typeof startGpuProducer, 'function'); await assert.rejects(startGpuProducer(options(mode)), /GPU_PRODUCER_/);
});
for (const mode of ['oversized', 'utf8', 'nul', 'generation', 'dimensions', 'unsafe-sequence', 'extra-field', 'backwards-copy', 'eof', 'hang']) test('rejects malformed/absent claimed data: ' + mode, async () => {
  const client = await start(mode); let count = 0;
  client.onFault(error => {assert.equal(error.terminal, true); count++;});
  try {await assert.rejects(client.claimLatest(), /GPU_PRODUCER_/); assert.equal(count, 1);}
  finally {assert.equal((await client.stop()).drained, false);}
});
test('repeated claimed key cannot create another borrow of the same slot', async () => {
  const client = await start('duplicate-key');
  try {assert.ok(await client.claimLatest()); await assert.rejects(client.claimLatest(), /GPU_PRODUCER_FRAME/);}
  finally {assert.equal((await client.stop()).drained, false);}
});
test('duplicate response triggers one terminal fault even if its first response was valid', async () => {
  const client = await start('duplicate-reply');
  const fault = new Promise(resolve => client.onFault(resolve));
  try {await client.clock(); assert.equal((await fault).terminal, true);}
  finally {await client.stop();}
});
test('empty stays empty without fabricating a frame', async () => {
  const client = await start('empty'); try {assert.equal(await client.claimLatest(), null);} finally {assert.equal((await client.stop()).drained, true);}
});
test('source loss stops new claims but retains control for exact old releases', async () => {
  const client = await start('source-lost'); const faults = [];
  client.onFault(error => faults.push(error));
  try {
    const claim = await client.claimLatest(); await client.clock();
    await new Promise(resolve => setTimeout(resolve, 15));
    assert.equal(faults.length, 1); assert.equal(faults[0].terminal, false);
    assert.equal(await client.claimLatest(), null); await client.release(claim.record.key);
  } finally {assert.equal((await client.stop()).drained, true);}
});
for (const mode of ['hang-claim', 'hang-release']) test('stop rejects pending work and reports actual drain: ' + mode, async () => {
  const client = await start(mode);
  const claim = mode === 'hang-release' ? await client.claimLatest() : null;
  const pending = claim ? client.release(claim.record.key) : client.claimLatest();
  const rejected = assert.rejects(pending, /GPU_PRODUCER_CLOSED/);
  const result = await client.stop(); await rejected;
  assert.equal(result.exitCode, 0); assert.equal(result.drained, mode === 'hang-claim');
  await assert.rejects(client.claimLatest(), /GPU_PRODUCER_CLOSED/);
});

test('retains bounded native diagnostic codes without exposing arbitrary error text',async()=>{
 await assert.rejects(start('native-error'),/GPU_PRODUCER_REMOTE_ERROR_SOURCE_GEOMETRY_CHANGED$/);
 await assert.rejects(start('unsafe-native-error'),/GPU_PRODUCER_REMOTE_ERROR$/);
});
