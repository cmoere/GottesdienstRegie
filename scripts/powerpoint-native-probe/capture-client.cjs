const {spawn} = require('node:child_process');
function lineProcess(executable, args, cwd) {
  const child = spawn(executable, args, {cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
  let buffer = '', closed = false, failure;
  const values = [], waiters = new Set();
  const exited = new Promise(resolve => child.once('close', resolve));
  function fail(error) {if (failure || closed) return; failure = error; for (const waiter of waiters) {clearTimeout(waiter.timer); waiter.reject(error);} waiters.clear(); child.kill();}
  child.on('error', () => fail(Error('NATIVE_SOURCE_START_FAILED')));
  child.stdin.on('error', () => fail(Error('NATIVE_SOURCE_PIPE_FAILED')));
  child.stderr.on('data', () => {});
  child.once('close', () => {if (!closed) fail(Error('NATIVE_SOURCE_EOF'));});
  child.stdout.on('data', bytes => {
    if (closed || failure) return;
    buffer += bytes.toString('utf8');
    if (buffer.length > 4096) {fail(Error('NATIVE_SOURCE_PROTOCOL')); return;}
    let end;
    while ((end = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      let value; try {value = JSON.parse(line);} catch {fail(Error('NATIVE_SOURCE_PROTOCOL')); return;}
      if (value.status === 'error') {fail(Error(/^[A-Z0-9_]{1,80}$/.test(value.code) ? value.code : 'NATIVE_SOURCE_FAILED')); return;}
      if (values.length >= 16) {fail(Error('NATIVE_SOURCE_PROTOCOL')); return;}
      values.push(value);
      for (const waiter of waiters) if (waiter.match(value)) {clearTimeout(waiter.timer); waiter.resolve(value); waiters.delete(waiter);}
    }
  });
  function waitFor(match, label) {
    if (failure) return Promise.reject(failure);
    const known = values.find(match); if (known) return Promise.resolve(known);
    return new Promise((resolve, reject) => {const waiter = {match, resolve, reject, timer: setTimeout(() => {waiters.delete(waiter); reject(Error('NATIVE_SOURCE_TIMEOUT ' + label + ' seen=' + values.map(value => value.status || 'owner').join(',')));}, 10000)}; waiters.add(waiter);});
  }
  async function close() {
    if (closed) return; closed = true;
    for (const waiter of waiters) {clearTimeout(waiter.timer); waiter.reject(Error('NATIVE_SOURCE_CLOSED'));} waiters.clear();
    child.stdin.end(); const kill = setTimeout(() => child.kill(), 2000);
    let timer;
    try {await Promise.race([exited, new Promise((_, reject) => {timer = setTimeout(() => reject(Error('NATIVE_SOURCE_CLOSE_TIMEOUT')), 4000);})]);}
    finally {clearTimeout(kill); clearTimeout(timer);}
  }
  return {waitFor, write: value => child.stdin.write(value + '\n'), close};
}
async function startOwnedWindow({executable, cwd, monitor, aspect}) {
  if (monitor !== 1 || !['wide', 'standard'].includes(aspect)) throw Error('NATIVE_SOURCE_MONITOR_NOT_AUTHORIZED');
  const process = lineProcess(executable, ['--monitor=1', aspect], cwd);
  try {const owner = await process.waitFor(value => typeof value.hwnd === 'string', 'owner'); return {owner, close: process.close};}
  catch (error) {await process.close(); throw error;}
}
async function startNativeCapture({executable, cwd, owner, mapping, sessionId, generation}) {
  const crop = owner.crop;
  if (!crop || ['x', 'y', 'width', 'height', 'outerWidth', 'outerHeight'].some(key => !Number.isSafeInteger(crop[key]) || crop[key] < 0)) throw Error('SOURCE_CROP_INVALID');
  if (!/^[1-9][0-9]{0,19}$/.test(owner.hwnd) || !Number.isSafeInteger(owner.pid) || owner.pid <= 0 || !/^[1-9][0-9]{0,19}$/.test(owner.createdAt) ||
      !/^Local\\GottesdienstRegie\.Probe\.[0-9a-f]{32}$/.test(mapping) || !/^[0-9a-f]{32}$/.test(sessionId) || !/^[0-9a-f]{32}$/.test(generation)) throw Error('SOURCE_CONFIG_INVALID');
  const process = lineProcess(executable, [], cwd);
  const line = ['capture', owner.hwnd, owner.pid, owner.createdAt, crop.x, crop.y, crop.width, crop.height, crop.outerWidth, crop.outerHeight, mapping, sessionId, generation].join(' ');
  process.write(line);
  try {await process.waitFor(value => value.status === 'ready', 'ready'); return {waitForStatus: status => process.waitFor(value => value.status === status, status), close: process.close};}
  catch (error) {await process.close(); throw error;}
}
module.exports = {startOwnedWindow, startNativeCapture};
