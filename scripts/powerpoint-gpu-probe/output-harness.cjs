const path = require('node:path');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const {randomBytes} = require('node:crypto');
const {pathToFileURL} = require('node:url');
const {createGpuFrameBroker} = require('./frame-broker.cjs');
const {createManagedTextureApi} = require('./managed-texture.cjs');
const {createComposedObserver} = require('./composed-observer.cjs');
const stamp = require('./frame-stamp.js');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, label, ms = 5000) {const end = performance.now() + ms; while (!predicate()) {if (performance.now() >= end) throw Error('GPU_OUTPUT_TIMEOUT_' + label); await wait(10);}}

function createGpuOutputs({producer, sessionId, generation, onObservation, onFault, onSend = () => {}, onAck = () => {}}) {
  const {BrowserWindow, ipcMain, sharedTexture} = require('electron');
  const entries = new Map(), api = createManagedTextureApi({sharedTexture});
  let gracefulClosing = false;
  const broker = createGpuFrameBroker({producer, textureApi: {import(claim, callback) {
    for (const entry of entries.values()) entry.observer.remember(claim.record);
    const ref = api.import(claim, callback);
    return {send(frame, key) {
      const entry = [...entries.values()].find(e => !e.win.isDestroyed() && e.win.webContents.mainFrame === frame);
      if (entry) onSend({role: entry.role, sequence: key.sequence, at: performance.now()});
      return ref.send(frame, key);
    }, releaseMain: () => ref.releaseMain()};
  }}});
  const ownEntry = event => {const e = entries.get(event.sender.id); return e && !e.win.isDestroyed() && event.senderFrame === e.win.webContents.mainFrame ? e : null;};
  const ready = event => {const e = ownEntry(event); if (e) e.ready = true;};
  const ack = (event, value) => {const e = ownEntry(event); if (!e || !value || Object.keys(value).length !== 1 || !broker.ack(event.sender.id, value.key)) return;
    e.lastAck = value.key; onAck({role: e.role, sequence: value.key.sequence, at: performance.now()});};
  const observe = (event, value) => {
    const e = ownEntry(event), key = value?.key;
    if (!e || !value || Object.keys(value).length !== 1 || !key || Object.keys(key).length !== 4 || key.sessionId !== sessionId || key.generation !== generation
        || !Number.isInteger(key.slotId) || key.slotId < 0 || key.slotId > 2 || !Number.isSafeInteger(key.sequence) || key.sequence <= (e.lastHintSeq || 0) || key.sequence > (e.lastAck?.sequence || 0)) return;
    e.lastHintSeq = key.sequence;
    const done = () => {if (!e.closed && !e.win.isDestroyed()) e.win.webContents.send('gpu-probe:observed', {key});};
    e.observer.request().then(done, () => {if (!e.closed) onFault('GPU_OBSERVATION_FAILED'); done();});
  };
  const fault = event => {if (ownEntry(event)) onFault('GPU_RECEIVER_FAILED');};
  ipcMain.handle('gpu-probe:boot', event => {
    const e = ownEntry(event); if (!e || event.senderFrame.url !== pathToFileURL(path.join(__dirname, 'output.html')).href) throw Error('GPU_OUTPUT_SENDER');
    return {sessionId, generation, stall: e.stall, releaseDelayMs: e.releaseDelayMs, vertexShader: stamp.vertexShader, fragmentShader: stamp.fragmentShader};
  });
  ipcMain.on('gpu-probe:ready', ready); ipcMain.on('gpu-probe:ack', ack); ipcMain.on('gpu-probe:observe', observe); ipcMain.on('gpu-probe:fault', fault);
  const unsubscribe = producer.onFault(error => {if (error.terminal === false) {for (const e of entries.values()) if (!e.win.isDestroyed()) e.win.webContents.send('gpu-probe:source-lost');} else onFault('GPU_PRODUCER_FAILED');});
  return {
    broker,
    async add(role, {stall = false, releaseDelayMs = 0} = {}) {
      if (![0, 150].includes(releaseDelayMs)) throw Error('GPU_OUTPUT_FIXTURE_DELAY');
      const win = new BrowserWindow({show: false, frame: false, width: 1920, height: 1080, useContentSize: true,
        webPreferences: {preload: path.join(__dirname, 'output-preload.cjs'), partition: 'gpu-probe-' + randomBytes(8).toString('hex'), sandbox: true, contextIsolation: true, nodeIntegration: false, backgroundThrottling: false}});
      const entry = {win, role, stall, releaseDelayMs, ready: false, lastAck: null, closed: false};
      entry.observer = createComposedObserver({captureStrip: async rect => {
        const image = await win.webContents.capturePage(rect); return {...image.getSize(), pixels: image.toBitmap()};
      }, onObservation: observation => onObservation({...observation, role})}); entry.observer.reset(generation);
      entries.set(win.webContents.id, entry);
      win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
      win.webContents.on('will-navigate', event => event.preventDefault());
      win.webContents.on('will-attach-webview', event => event.preventDefault());
      win.webContents.on('render-process-gone', () => {if (!entry.closed) onFault('GPU_RENDERER_GONE');});
      win.once('closed', () => {entry.closed = true; entry.observer.close(); entry.unregister?.(); entries.delete(entry.id);});
      entry.id = win.webContents.id;
      await win.loadFile(path.join(__dirname, 'output.html')); await until(() => entry.ready, 'READY');
      entry.unregister = broker.register({id: entry.id, frame: win.webContents.mainFrame, close: () => {entry.closed = true; entry.observer.close(); if (!gracefulClosing && !win.isDestroyed()) win.destroy();}});
      return entry;
    },
    async close() {
      gracefulClosing = true; unsubscribe(); for (const e of entries.values()) {e.closed = true; e.observer.close();}
      try {
        await broker.revoke();
        // Healthy receivers must finish their real import cleanup BEFORE their
        // webContents are destroyed. This is not an ACK-based native release.
        await until(() => broker.status().drained, 'DRAIN', 4000);
      } finally {
        for (const e of entries.values()) if (!e.win.isDestroyed()) e.win.destroy();
        ipcMain.removeHandler('gpu-probe:boot'); ipcMain.removeListener('gpu-probe:ready', ready); ipcMain.removeListener('gpu-probe:ack', ack); ipcMain.removeListener('gpu-probe:observe', observe); ipcMain.removeListener('gpu-probe:fault', fault);
      }
    },
  };
}

async function smoke(config) {
  const {startGpuProducer} = require('./producer-client.cjs');
  const {startOwnedWindow} = require('../powerpoint-native-probe/capture-client.cjs');
  const report = {electron: process.versions.electron, passed: false, productionReady: false, cases: []};
  assert.equal(process.versions.electron, '45.0.0'); assert.equal(config.monitor, 1);
  if (config.drainOnly) {
    const source = await startOwnedWindow({executable: config.source, cwd: config.sourceFolder, monitor: 1, aspect: 'wide'});
    let producer, outputs; const faults = []; let sent = false;
    try {
      const sessionId = randomBytes(16).toString('hex'), generation = randomBytes(16).toString('hex');
      producer = await startGpuProducer({executable: config.producer, cwd: config.folder, owner: source.owner, sessionId, generation});
      outputs = createGpuOutputs({producer, sessionId, generation, onObservation() {}, onFault: code => faults.push(code), onSend() {sent = true;}});
      await outputs.add('own-delayed-close', {releaseDelayMs: 150}); await until(() => sent, 'PENDING_SEND');
      // Ensure the own preload has imported the frame and is inside its deliberate
      // release delay, not merely waiting for the first transfer to arrive.
      await wait(50); await outputs.close(); outputs = null;
      assert.deepEqual(faults, []); assert.equal((await producer.stop()).drained, true);
      report.passed = true; report.cases.push({normalDrainWhileSourceRunning: true});
      await fs.writeFile(path.join(config.folder, 'output-report.json'), JSON.stringify(report)); return;
    } finally {if (outputs) await outputs.close().catch(() => {}); if (producer) await producer.stop(); await source.close();}
  }
  for (const aspect of ['wide', 'standard']) {
    let source, producer, outputs; const observations = [], faults = [];
    try {
      source = await startOwnedWindow({executable: config.source, cwd: config.sourceFolder, monitor: 1, aspect});
      const sessionId = randomBytes(16).toString('hex'), generation = randomBytes(16).toString('hex');
      producer = await startGpuProducer({executable: config.producer, cwd: config.folder, owner: source.owner, sessionId, generation});
      outputs = createGpuOutputs({producer, sessionId, generation, onObservation: v => observations.push(v), onFault: code => faults.push(code)});
      const main = await outputs.add('main'), mirror = await outputs.add('mirror');
      assert.notEqual(main.win.webContents.getOSProcessId(), mirror.win.webContents.getOSProcessId());
      await until(() => ['main', 'mirror'].every(role => observations.filter(v => v.role === role).length >= 8) || faults.length, 'COMPOSED');
      assert.deepEqual(faults, []);
      for (const entry of [main, mirror]) {
        const image = await entry.win.webContents.capturePage(), pixels = image.toBitmap();
        assert.deepEqual(image.getSize(), {width: 1920, height: 1080});
        const pixel = (x, y) => [...pixels.subarray((y * 1920 + x) * 4, (y * 1920 + x) * 4 + 4)];
        await fs.writeFile(path.join(config.folder, `${aspect}-${entry.role}.png`), image.toPNG());
        for (const [x, y, expected] of [[300, 300, [0,0,255,255]], [800,700,[0,0,255,255]], [1200,300,[255,0,0,255]], [1600,700,[255,0,0,255]]]) assert.deepEqual(pixel(x, y), expected);
        if (aspect === 'standard') {assert.deepEqual(pixel(50, 500), [0,0,0,255]); assert.deepEqual(pixel(1700,700), [0,0,0,255]);}
        assert.equal(await entry.win.webContents.executeJavaScript('typeof require'), 'undefined');
        assert.equal(await entry.win.webContents.executeJavaScript('typeof window.electron'), 'undefined');
        const overlayHasPixels = pixels.subarray((1030 * 1920 + 1690) * 4, (1060 * 1920) * 4).some(v => v > 40 && v < 240);
        assert.ok(overlayHasPixels, 'No overlay pixels over blue/black');
      }
      if (aspect === 'wide') {
        const stalled = await outputs.add('stalled', {stall: true}); await until(() => stalled.closed, 'STALL_CLOSE');
        const before = observations.filter(v => v.role === 'main').length;
        await until(() => observations.filter(v => v.role === 'main').length >= before + 4, 'HEALTHY');
        const reconnect = await outputs.add('reconnect'); await until(() => reconnect.lastAck, 'RECONNECT');
        assert.ok(reconnect.lastAck.sequence > main.lastAck.sequence - 6); reconnect.unregister();
      }
      let sourceLost = false; const unwatchSource = producer.onFault(error => {if (error.terminal === false) sourceLost = true;});
      await source.close(); await until(() => sourceLost && outputs.broker.status().drained, 'SOURCE_DRAIN'); unwatchSource();
      const retainedRect = {x: 0, y: 953, width: 1920, height: 9};
      // Source-close and an instantaneously empty import map are not a composition
      // barrier. First prove the FINAL acknowledged image actually reached output.
      const finalSequence = main.lastAck.sequence, deadline = performance.now() + 5000; let before;
      do {before = await main.win.webContents.capturePage(retainedRect);
        if (stamp.decode(before.toBitmap(), 1920) === finalSequence) break;
        if (performance.now() >= deadline) throw Error('GPU_FINAL_FRAME_NOT_COMPOSED'); await wait(10);
      } while (true);
      await wait(150);
      const after = await main.win.webContents.capturePage(retainedRect); assert.deepEqual(after.toBitmap(), before.toBitmap());
      assert.equal(await main.win.webContents.executeJavaScript('document.querySelector(".fault").hidden'), false);
      await outputs.close(); outputs = null; const stopped = await producer.stop(); assert.equal(stopped.drained, true);
      report.cases.push({aspect, observations, faults, stopped});
    } finally {if (outputs) await outputs.close().catch(() => {}); if (producer) await producer.stop(); if (source) await source.close();}
  }
  report.passed = true; await fs.writeFile(path.join(config.folder, 'output-report.json'), JSON.stringify(report, null, 2));
}
if (process.versions.electron && path.resolve(process.argv[1] || '') === __filename) {
  const {app} = require('electron'); const arg = process.argv.find(v => v.startsWith('--config='));
  const configPath = arg?.slice(9); let config;
  app.commandLine.appendSwitch('force-device-scale-factor', '1'); app.on('window-all-closed', () => {});
  const deadline = setTimeout(() => app.exit(2), 80000);
  (async () => {
    console.log('GPU_OUTPUT_BOOT');
    assert.ok(configPath && path.isAbsolute(configPath)); config = JSON.parse(await fs.readFile(configPath, 'utf8'));
    assert.ok(await fs.stat(path.join(config.folder, '.probe-owned'))); app.setPath('userData', path.join(config.folder, 'output-profile'));
    await app.whenReady(); await smoke(config); clearTimeout(deadline); app.exit(0);
  })().catch(async error => {console.error(error); if (config) await fs.writeFile(path.join(config.folder, 'output-failure.txt'), error.stack); clearTimeout(deadline); app.exit(1);});
}
module.exports = {createGpuOutputs};
