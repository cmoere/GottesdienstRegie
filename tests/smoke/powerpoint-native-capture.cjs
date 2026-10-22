const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const {randomBytes} = require('node:crypto');
const {buildProbe} = require('../../scripts/powerpoint-native-probe/build.cjs');
const {createNativeReader} = require('../../scripts/powerpoint-native-probe/reader-client.cjs');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const root = path.resolve(__dirname, '../..');
  assert.ok(await fs.stat(path.join(root, 'scripts/powerpoint-native-probe/capture.cpp')).catch(() => null), 'Owned native window capture is missing');
  const {startOwnedWindow, startNativeCapture} = require('../../scripts/powerpoint-native-probe/capture-client.cjs');
  assert.ok(process.argv.includes('--monitor=1'), 'Visible fixture requires explicit authorized Monitor1');
  const captureBuild = await buildProbe({root, target: 'native-capture'});
  const sourceBuild = await buildProbe({root, target: 'owned-window'});
  const readerBuild = await buildProbe({root, target: 'native-reader'});
  const observations = [];
  for (const aspect of ['wide', 'standard']) {
    console.log('CAPTURE_CASE ' + aspect);
    const source = await startOwnedWindow({executable: sourceBuild.executable, cwd: sourceBuild.folder, monitor: 1, aspect});
    let capture, reader;
    const config = {mapping: 'Local\\GottesdienstRegie.Probe.' + randomBytes(16).toString('hex'), sessionId: randomBytes(16).toString('hex'), generation: randomBytes(16).toString('hex')};
    try {
      await assert.rejects(startNativeCapture({executable: captureBuild.executable, cwd: captureBuild.folder, owner: {...source.owner, createdAt: '1'}, ...config}), /SOURCE_OWNER_MISMATCH/);
      await assert.rejects(startNativeCapture({executable: captureBuild.executable, cwd: captureBuild.folder, owner: {...source.owner, pid: source.owner.pid + 1}, ...config}), /SOURCE_OWNER_MISMATCH/);
      await assert.rejects(startNativeCapture({executable: captureBuild.executable, cwd: captureBuild.folder, owner: {...source.owner, crop: {...source.owner.crop, x: -1}}, ...config}), /SOURCE_CROP_INVALID/);
      await assert.rejects(startNativeCapture({executable: captureBuild.executable, cwd: captureBuild.folder, owner: {...source.owner, crop: {...source.owner.crop, width: source.owner.crop.outerWidth + 1}}, ...config}), /SOURCE_CROP_INVALID/);
      capture = await startNativeCapture({executable: captureBuild.executable, cwd: captureBuild.folder, owner: source.owner, ...config});
      assert.equal(typeof capture.clock, 'function', 'Native QPC calibration is missing');
      const beforeClock = await capture.clock(); await wait(10); const afterClock = await capture.clock();
      assert.ok(BigInt(afterClock.qpcNow) > BigInt(beforeClock.qpcNow));
      assert.equal(afterClock.qpcFrequency, beforeClock.qpcFrequency);
      await assert.rejects(startNativeCapture({executable: captureBuild.executable, cwd: captureBuild.folder, owner: source.owner, ...config}), /RING_ALREADY_EXISTS/);
      reader = await createNativeReader({executable: readerBuild.executable, cwd: readerBuild.folder, ...config});
      async function next(after = 0) {
        const until = Date.now() + 5000;
        while (Date.now() < until) {const frame = await reader.readLatest(after); if (frame) return frame; await wait(10);}
        throw Error('NATIVE_CAPTURE_FRAME_TIMEOUT');
      }
      const first = await next();
      const pixel = (x, y) => [...first.pixels.subarray((y * 1920 + x) * 4, (y * 1920 + x) * 4 + 4)];
      assert.deepEqual(pixel(600, 200), [0, 0, 255, 255]);
      assert.deepEqual(pixel(1400, 200), [255, 0, 0, 255]);
      assert.deepEqual(pixel(aspect === 'wide' ? 500 : 10, 10), aspect === 'wide' ? [0, 0, 255, 255] : [0, 0, 0, 255], 'no toolbar; correct letterbox');
      const frames = [first];
      while (frames.length < 5) frames.push(await next(frames.at(-1).descriptor.sequence));
      const {createHash} = require('node:crypto');
      const hashes = frames.map(frame => createHash('sha256').update(frame.pixels).digest('hex'));
      assert.ok(new Set(hashes).size >= 3, 'actual source movement, not repeated capture IDs');
      for (const frame of frames) assert.ok(!Object.keys(frame.descriptor).some(key => /hwnd|path|mapping/i.test(key)));
      await source.close();
      await capture.waitForStatus('source-lost');
      let remaining = await reader.readLatest(frames.at(-1).descriptor.sequence);
      const last = remaining?.descriptor.sequence ?? frames.at(-1).descriptor.sequence;
      await wait(100); assert.equal(await reader.readLatest(last), null, 'lost source publishes no fresh frames');
      observations.push({aspect, owner: source.owner, sequences: frames.map(frame => frame.descriptor.sequence), hashes, sourceLost: true});
    } finally {if (reader) await reader.close(); if (capture) await capture.close(); await source.close();}
  }
  await fs.writeFile(path.join(captureBuild.folder, 'owned-capture-observations.json'), JSON.stringify(observations, null, 2));
  console.log('NATIVE_CAPTURE_PASS ' + captureBuild.folder);
})().catch(error => {console.error(error); process.exitCode = 1;});
