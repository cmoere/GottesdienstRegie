const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {randomBytes} = require('node:crypto');
const {buildGpuProbe} = require('../../scripts/powerpoint-gpu-probe/build.cjs');
const {buildProbe} = require('../../scripts/powerpoint-native-probe/build.cjs');
const {startOwnedWindow} = require('../../scripts/powerpoint-native-probe/capture-client.cjs');
const {startGpuProducer} = require('../../scripts/powerpoint-gpu-probe/producer-client.cjs');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  assert.ok(process.argv.includes('--monitor=1'), 'Only explicitly authorized Monitor1');
  const root = path.resolve(__dirname, '../..');
  const built = await buildGpuProbe({root, target: 'producer'});
  const fixture = await buildProbe({root, target: 'owned-window'});
  const source = await startOwnedWindow({executable: fixture.executable, cwd: fixture.folder, monitor: 1, aspect: 'wide'});
  let client;
  try {
    client = await startGpuProducer({executable: built.executable, cwd: built.folder, owner: source.owner,
      sessionId: randomBytes(16).toString('hex'), generation: randomBytes(16).toString('hex')});
    const clock = await client.clock(); assert.ok(BigInt(clock.qpcNow) > 0n && BigInt(clock.qpcFrequency) > 0n);
    const notices = [], faults = [];
    client.subscribeLatest(value => notices.push(value.noticeId)); client.onFault(error => faults.push({terminal: error.terminal, reason: error.reason}));
    const claims = [];
    for (let i = 0; i < 3; ++i) {
      const end = Date.now() + 5000; let claim;
      while (!claim && Date.now() < end) {claim = await client.claimLatest(); if (!claim) await wait(10);}
      assert.ok(claim, 'Actual native producer has no claimable GPU frame');
      assert.ok(!claims.some(old => old.record.key.slotId === claim.record.key.slotId));
      assert.equal(claim.ntHandle.length, 8); assert.ok(claim.ntHandle.readBigUInt64LE() > 0n);
      claims.push(claim);
    }
    assert.equal(await client.claimLatest(), null, 'Fourth lease permitted');
    await source.close();
    const end = Date.now() + 5000;
    while (!faults.length && Date.now() < end) await wait(10);
    assert.equal(faults.length, 1); assert.equal(faults[0].terminal, false);
    for (const claim of claims) await client.release(claim.record.key);
    assert.equal(await client.claimLatest(), null);
    const stopped = await client.stop(); assert.deepEqual(stopped, {exitCode: 0, drained: true});
    await fs.writeFile(path.join(built.folder, 'client-observations.json'), JSON.stringify({clock, sequences: claims.map(c => c.record.key.sequence), notices, faults, stopped}, null, 2));
    console.log('GPU_CLIENT_NATIVE_PASS ' + built.folder);
  } finally {if (client) await client.stop(); await source.close();}
})().catch(error => {console.error(error); process.exitCode = 1;});
