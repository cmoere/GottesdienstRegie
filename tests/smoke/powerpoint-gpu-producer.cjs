const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync, spawn} = require('node:child_process');
const {randomBytes} = require('node:crypto');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function channel(built) {
  const child = spawn(built.executable, [], {cwd: built.folder, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true});
  let buffer = '', pending, fault;
  const values = [];
  const exited = new Promise(resolve => child.once('close', resolve));
  child.stderr.on('data', () => {});
  child.stdin.on('error', () => {});
  child.on('error', error => { fault = error; if (pending) pending.reject(error); });
  child.stdout.on('data', chunk => {
    buffer += chunk.toString('utf8');
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const value = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1);
      assert.ok(values.length < 16, 'Native producer flooded its test receiver');
      if (pending && pending.match(value)) { const current = pending; pending = undefined; current.resolve(value); }
      else values.push(value);
    }
    assert.ok(buffer.length <= 2048, 'Native producer metadata bound');
  });
  async function next(match) {
    if (fault) throw fault;
    const index = values.findIndex(match);
    if (index >= 0) return values.splice(index, 1)[0];
    assert.ok(!pending, 'One pending test reader');
    let timer;
    try { return await new Promise((resolve, reject) => {
      pending = {match, resolve, reject}; timer = setTimeout(() => { pending = undefined; reject(Error('GPU_TEST_REPLY_TIMEOUT')); }, 5000);
    }); } finally { clearTimeout(timer); }
  }
  return {next, send(line) { child.stdin.write(line + '\n'); }, async close() {
    child.stdin.end('stop\n');
    const kill = setTimeout(() => child.kill(), 2000);
    let timer;
    try { return await Promise.race([exited, new Promise((_, reject) => { timer = setTimeout(() => reject(Error('GPU_TEST_CLOSE_TIMEOUT')), 4000); })]); }
    finally {clearTimeout(timer); clearTimeout(kill);}
  }};
}
function configuration(hello, owner, sessionId, generation) {
  const c = owner.crop;
  return ['start', 1, hello.nonce, sessionId, generation, owner.hwnd, owner.pid, owner.createdAt, c.x, c.y, c.width, c.height, c.outerWidth, c.outerHeight, process.pid, hello.parentCreated].join(' ');
}

(async () => {
  assert.ok(process.argv.includes('--monitor=1'), 'Own source requires explicitly authorized Monitor1');
  const root = path.resolve(__dirname, '../..');
  assert.ok(fs.existsSync(path.join(root, 'scripts/powerpoint-gpu-probe/producer.cpp')), 'Native GPU producer is missing');
  const {buildGpuProbe} = require('../../scripts/powerpoint-gpu-probe/build.cjs');
  const built = await buildGpuProbe({root, target: 'gpu-pattern-tests'});
  const result = spawnSync(built.executable, [], {cwd: built.folder, encoding: 'utf8', timeout: 120000, windowsHide: true});
  fs.writeFileSync(path.join(built.folder, 'gpu-pattern-tests.log'), (result.stdout || '') + (result.stderr || ''));
  process.stdout.write(result.stdout || '');
  assert.ifError(result.error);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /GPU_PATTERN_PASS/, 'IO-only checks do not establish actual GPU ownership');
  const producerBuild = await buildGpuProbe({root, target: 'producer'});
  const {buildProbe} = require('../../scripts/powerpoint-native-probe/build.cjs');
  const {startOwnedWindow} = require('../../scripts/powerpoint-native-probe/capture-client.cjs');
  const sourceBuild = await buildProbe({root, target: 'owned-window'});
  const source = await startOwnedWindow({executable: sourceBuild.executable, cwd: sourceBuild.folder, monitor: 1, aspect: 'wide'});
  try {
    assert.equal(typeof source.change, 'function', 'Own fixture resize/minimize controls missing');
    for (const invalid of ['nonce', 'parent', 'parent-start', 'source-pid', 'source-start', 'crop']) {
      const pipe = channel(producerBuild);
      try {
        const hello = await pipe.next(value => value.status === 'hello');
        assert.equal(hello.parentPid, process.pid);
        assert.match(hello.nonce, /^[a-f0-9]{32}$/);
        assert.ok(!('handles' in hello), 'Bootstrap alone exposes no shared handles');
        const owner = {...source.owner, crop: {...source.owner.crop}};
        const localHello = {...hello};
        if (invalid === 'nonce') localHello.nonce = '0'.repeat(32);
        if (invalid === 'parent-start') localHello.parentCreated = '1';
        if (invalid === 'source-pid') owner.pid += 1;
        if (invalid === 'source-start') owner.createdAt = '1';
        if (invalid === 'crop') owner.crop.width = 4097;
        let line = configuration(localHello, owner, randomBytes(16).toString('hex'), randomBytes(16).toString('hex'));
        if (invalid === 'parent') line = line.split(' ').map((word, index) => index === 14 ? String(process.pid + 1) : word).join(' ');
        pipe.send(line);
        const error = await pipe.next(value => value.status === 'error');
        assert.ok(!('handles' in error));
        assert.equal(error.code, invalid === 'crop' ? 'GPU_PROTOCOL_INVALID'
          : invalid.startsWith('source-') ? 'SOURCE_OWNER_MISMATCH' : 'GPU_BOOTSTRAP_INVALID');
        console.log('GPU_OWNER_REJECT ' + invalid);
      } finally { await pipe.close(); }
    }
    const pipe = channel(producerBuild);
    try {
      const sessionId = randomBytes(16).toString('hex'), generation = randomBytes(16).toString('hex');
      const hello = await pipe.next(value => value.status === 'hello');
      pipe.send(configuration(hello, source.owner, sessionId, generation));
      const ready = await pipe.next(value => value.status === 'ready');
      assert.equal(ready.handles.length, 3);
      assert.equal(new Set(ready.handles).size, 3);
      for (const handle of ready.handles) {
        assert.equal(typeof handle, 'string');
        assert.ok(BigInt(handle) > 0n && BigInt(handle) <= 0xffffffffffffffffn);
      }
      let requestId = 0;
      const leases = [];
      for (let count = 0; count < 3; ++count) {
        let claimed;
        const deadline = Date.now() + 5000;
        while (!claimed && Date.now() < deadline) {
          const id = ++requestId; pipe.send(`claim ${id} ${sessionId} ${generation}`);
          const reply = await pipe.next(value => value.requestId === id);
          if (reply.status === 'claimed') claimed = reply.record;
          else { assert.equal(reply.status, 'empty'); await wait(10); }
        }
        assert.ok(claimed, 'Actual capture did not publish a claimable frame');
        assert.equal(claimed.key.sessionId, sessionId); assert.equal(claimed.key.generation, generation);
        assert.equal(claimed.width, 1920); assert.equal(claimed.height, 1080); assert.equal(claimed.pixelFormat, 'bgra');
        assert.ok(!leases.some(record => record.key.slotId === claimed.key.slotId), 'Leased texture overwritten');
        leases.push(claimed);
      }
      const id = ++requestId; pipe.send(`claim ${id} ${sessionId} ${generation}`);
      assert.equal((await pipe.next(value => value.requestId === id)).status, 'empty', 'Fourth in-flight texture allowed');
      await source.close();
      await pipe.next(value => value.status === 'source-lost');
      for (const {key} of leases) {
        const serial = ++requestId; pipe.send(`release ${serial} ${sessionId} ${generation} ${key.slotId} ${key.sequence}`);
        assert.equal((await pipe.next(value => value.requestId === serial)).status, 'released');
      }
      await wait(150);
      const afterLoss = ++requestId; pipe.send(`claim ${afterLoss} ${sessionId} ${generation}`);
      assert.equal((await pipe.next(value => value.requestId === afterLoss)).status, 'empty', 'Lost source published again after its leases drained');
      const serial = ++requestId; pipe.send(`clock ${serial}`);
      const clock = await pipe.next(value => value.requestId === serial);
      assert.equal(clock.status, 'clock');
      assert.match(clock.qpcNow, /^[1-9][0-9]*$/); assert.match(clock.qpcFrequency, /^[1-9][0-9]*$/);
      pipe.send(`clock ${serial}`);
      assert.equal((await pipe.next(value => value.status === 'error')).code, 'GPU_REQUEST_REPLAY');
      const closed = await pipe.next(value => value.status === 'closed');
      assert.equal(closed.drained, true);
      assert.equal(await pipe.close(), 1, 'Replayed request did not revoke the protocol');
    } finally { await pipe.close(); }
    for (const mode of ['resize', 'minimize']) {
      const other = await startOwnedWindow({executable: sourceBuild.executable, cwd: sourceBuild.folder, monitor: 1, aspect: 'wide'});
      const control = channel(producerBuild);
      try {
        const hello = await control.next(value => value.status === 'hello');
        control.send(configuration(hello, other.owner, randomBytes(16).toString('hex'), randomBytes(16).toString('hex')));
        await control.next(value => value.status === 'ready');
        await other.change(mode);
        const lost = await control.next(value => value.status === 'source-lost');
        assert.equal(lost.code, mode === 'resize' ? 'SOURCE_GEOMETRY_CHANGED' : 'SOURCE_MINIMIZED');
        control.send('stop');
        assert.equal((await control.next(value => value.status === 'closed')).drained, true);
        assert.equal(await control.close(), 0);
        console.log('GPU_SOURCE_LOSS_PASS ' + mode);
      } finally { await control.close(); await other.close(); }
    }
  } finally { await source.close(); }
  console.log('GPU_PRODUCER_PASS ' + producerBuild.folder);
})().catch(error => {console.error(error); process.exitCode = 1;});
