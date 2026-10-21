const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {spawn, spawnSync} = require('node:child_process');
const readline = require('node:readline');
const {randomBytes} = require('node:crypto');
const {buildProbe} = require('../../scripts/powerpoint-native-probe/build.cjs');
const {createNativeReader} = require('../../scripts/powerpoint-native-probe/reader-client.cjs');
(async () => {
  const root = path.resolve(__dirname, '../..');
  const source = path.join(root, 'scripts/powerpoint-native-probe/reader.cpp');
  assert.ok(await fs.stat(source).catch(() => null), 'Native frame reader is not implemented');
  const built = await buildProbe({root, target: 'native-reader'});
  const hostBuild = await buildProbe({root, target: 'frame-ring-writer'});
  const mapping = 'Local\\GottesdienstRegie.Probe.' + randomBytes(16).toString('hex');
  const sessionId = randomBytes(16).toString('hex'), generation = randomBytes(16).toString('hex');
  const host = spawn(hostBuild.executable, [], {cwd: hostBuild.folder, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
  const lines = readline.createInterface({input: host.stdout});
  let awaiting;
  const exited = new Promise(resolve => host.once('close', resolve));
  lines.on('line', value => {if (awaiting) {const wait = awaiting; awaiting = null; clearTimeout(wait.timer); wait.resolve(value);}});
  function hostCommand(line) {return new Promise((resolve, reject) => {awaiting = {resolve, reject, timer: setTimeout(() => reject(Error('HOST_FIXTURE_TIMEOUT')), 5000)}; host.stdin.write(line + '\n');});}
  let reader;
  try {
    assert.equal(await hostCommand(`host ${mapping} ${sessionId} ${generation}`), 'READY');
    reader = await createNativeReader({executable: built.executable, cwd: built.folder, mapping, sessionId, generation});
    const one = await reader.readLatest(0);
    assert.equal(one.descriptor.sequence, 1); assert.equal(one.pixels.length, 8294400);
    assert.equal(one.pixels[0], 1); assert.equal(one.pixels.at(-1), 1);
    assert.equal(await reader.readLatest(1), null);
    assert.equal(await hostCommand('publish 2'), 'PUBLISHED');
    const two = await reader.readLatest(1);
    assert.equal(two.descriptor.sequence, 2); assert.equal(two.pixels[0], 2); assert.equal(two.pixels.at(-1), 2);
    await assert.rejects(createNativeReader({executable: built.executable, cwd: built.folder, mapping, sessionId, generation: '00'.repeat(15) + '01'}), /NATIVE_READER_REMOTE_ERROR/);
    for (const command of [`read ${generation} 0\0ignored`, 'X'.repeat(1025), `read ${generation} 9007199254740992`, `read ${generation} 0 extra`]) {
      const raw = spawnSync(built.executable, [], {cwd: built.folder, windowsHide: true, input: Buffer.from(`reader ${mapping} ${sessionId} ${generation}\n${command}\n`), maxBuffer: 16777216, timeout: 5000});
      assert.ifError(raw.error);
      assert.equal(raw.status, 1, 'Malformed native command must fail, not yield a frame');
      let at = 0, last;
      while (at < raw.stdout.length) {
        assert.equal(raw.stdout.toString('ascii', at, at + 4), 'GRFP');
        const length = raw.stdout.readUInt32LE(at + 8), pixels = raw.stdout.readUInt32LE(at + 12);
        last = JSON.parse(raw.stdout.toString('utf8', at + 16, at + 16 + length)); at += 16 + length + pixels;
      }
      assert.equal(last.status, 'error');
    }
    console.log('NATIVE_READER_PASS ' + built.folder);
  } finally {
    if (reader) await reader.close();
    if (awaiting) clearTimeout(awaiting.timer);
    host.stdin.end(); lines.close();
    const timeout = setTimeout(() => host.kill(), 2000);
    await exited; clearTimeout(timeout);
  }
})().catch(error => {console.error(error); process.exitCode = 1;});
