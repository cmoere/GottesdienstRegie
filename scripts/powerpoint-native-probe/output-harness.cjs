const {app, BrowserWindow, ipcMain} = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const {createFrameBroker} = require('./frame-broker.cjs');
const root = path.resolve(__dirname, '../..'), folder = path.resolve(process.argv[2]);
if (!folder.startsWith(path.join(root, 'work') + path.sep)) throw Error('OUTPUT_PROBE_FOLDER_INVALID');
app.setPath('userData', path.join(folder, 'profile'));
app.commandLine.appendSwitch('force-device-scale-factor', '1');
const windows = new Map(), acknowledgements = [];
let timer, broker;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function frame(sequence) {
  const pixels = Buffer.alloc(8294400), channel = [0, 2, 0, 1, -1][sequence];
  for (let offset = 0; offset < pixels.length; offset += 4) {if (channel >= 0) pixels[offset + channel] = 255; pixels[offset + 3] = 255;}
  return {descriptor: {sessionId: '11'.repeat(16), generation: '22'.repeat(16), sequence, capturedQpc: '123456789', qpcFrequency: '10000000', width: 1920, height: 1080, stride: 7680, byteLength: 8294400}, pixels};
}
async function until(predicate, name) {
  const end = Date.now() + 5000;
  while (Date.now() < end) {if (predicate()) return; await wait(10);}
  throw Error('OUTPUT_PROBE_TIMEOUT ' + name + ' ' + JSON.stringify({broker: broker.status(), acknowledgements}));
}
async function createOutput(role) {
  const win = new BrowserWindow({show: false, width: 1920, height: 1080, useContentSize: true, webPreferences: {preload: path.join(__dirname, 'output-preload.cjs'), offscreen: true, backgroundThrottling: false, sandbox: true, contextIsolation: true, nodeIntegration: false}});
  win.webContents.setFrameRate(60); win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
  win.webContents.on('will-navigate', event => event.preventDefault());
  win.webContents.on('console-message', event => console.log('OUTPUT_RENDERER ' + event.message));
  const entry = {win, role, active: true}; windows.set(win.webContents.id, entry);
  await win.loadFile(path.join(__dirname, 'output.html'));
  assert.equal(await win.webContents.executeJavaScript('typeof require'), 'undefined');
  entry.unregister = broker.register({id: String(win.webContents.id), send: packet => win.webContents.send('native-probe:frame', packet), close: () => {entry.active = false;}});
  return entry;
}
async function verifyImage(entry, wanted, name) {
  const image = await entry.win.webContents.capturePage();
  assert.deepEqual(image.getSize(), {width: 1920, height: 1080});
  const bitmap = image.toBitmap();
  const at = (200 * 1920 + 600) * 4;
  assert.deepEqual([...bitmap.subarray(at, at + 4)], wanted, 'actual composed source pixels');
  let ink = 0;
  for (let y = 1015; y < 1060; ++y) for (let x = 1650; x < 1900; ++x) {const at = (y * 1920 + x) * 4; if (bitmap[at] > 40 && bitmap[at + 1] > 40 && bitmap[at + 2] > 40) ++ink;}
  assert.ok(ink > 50, 'test overlay is present in final output frame');
  await fs.writeFile(path.join(folder, name + '.png'), image.toPNG());
}
ipcMain.on('native-probe:ack', (event, value) => {
  const entry = windows.get(event.sender.id);
  if (!entry?.active || entry.win.webContents !== event.sender || event.senderFrame !== event.sender.mainFrame || entry.role === 'slow') return;
  if (broker.ack(String(event.sender.id), value?.generation, value?.sequence)) acknowledgements.push({role: entry.role, sequence: value.sequence, at: Date.now()});
});
app.whenReady().then(async () => {
  try {
    await fs.access(path.join(folder, '.probe-owned'));
    let current = frame(1);
    broker = createFrameBroker({sessionId: current.descriptor.sessionId, generation: current.descriptor.generation, reader: {readLatest: async after => current.descriptor.sequence > after ? current : null, close: async () => {}}});
    const main = await createOutput('main'), slow = await createOutput('slow');
    timer = setInterval(() => {void broker.pump();}, 1000/30);
    const has = (role, sequence) => acknowledgements.some(item => item.role === role && item.sequence === sequence);
    await until(() => has('main', 1), 'main first composed frame');
    current = frame(2); await until(() => has('main', 2), 'healthy output while second is stalled');
    await until(() => !slow.active, 'stalled output disconnected');
    current = frame(3); await until(() => has('main', 3), 'latest image');
    await verifyImage(main, [0, 255, 0, 255], 'main-current');
    await verifyImage(slow, [0, 0, 255, 255], 'slow-held');
    const mirror = await createOutput('mirror'); await until(() => has('mirror', 3), 'new output receives current image');
    await verifyImage(mirror, [0, 255, 0, 255], 'mirror-current');
    current = frame(4); await until(() => has('main', 4) && has('mirror', 4), 'black with overlay');
    await verifyImage(main, [0, 0, 0, 255], 'main-black');
    await verifyImage(mirror, [0, 0, 0, 255], 'mirror-black');
    await fs.writeFile(path.join(folder, 'output-observations.json'), JSON.stringify({acknowledgements, broker: broker.status(), sandboxed: true}, null, 2));
    console.log('NATIVE_OUTPUT_PASS');
  } finally {
    clearInterval(timer); if (broker) await broker.revoke();
    for (const {win} of windows.values()) if (!win.isDestroyed()) win.destroy();
  }
  app.exit(0);
}).catch(error => {console.error(error); clearInterval(timer); for (const {win} of windows.values()) if (!win.isDestroyed()) win.destroy(); app.exit(1);});
