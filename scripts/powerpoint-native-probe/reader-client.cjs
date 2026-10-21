// Main/broker-only boundary. Never expose executable paths or this module to a renderer.
const {spawn} = require('node:child_process');
const path = require('node:path');
const MAX_PIXELS = 8294400;
const identityKeys = ['status', 'sessionId', 'generation'];
const descriptorKeys = ['sessionId', 'generation', 'sequence', 'capturedQpc', 'qpcFrequency', 'width', 'height', 'stride', 'byteLength'];
function error(code) {return Error('NATIVE_READER_' + code);}
function exactKeys(value, keys) {
  return value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
}
function uint64(value) {return typeof value === 'string' && /^[1-9][0-9]{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;}
function decoder({sessionId, generation, mode, afterSequence}) {
  const prefix = Buffer.alloc(16);
  let prefixAt = 0, header, headerAt = 0, pixels, pixelAt = 0, pixelLength, result;
  function parseHeader() {
    let json;
    try {json = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(header));}
    catch {throw error('HEADER');}
    if (json?.status === 'error') throw error('REMOTE_ERROR');
    if (json?.status === 'ready' || json?.status === 'empty') {
      if (!exactKeys(json, identityKeys) || pixelLength !== 0 || (mode === 'ready') !== (json.status === 'ready')) throw error('HEADER');
      if (json.sessionId !== sessionId || json.generation !== generation) throw error('IDENTITY');
      result = mode === 'ready' ? true : null;
      pixels = Buffer.alloc(0); return;
    }
    if (mode !== 'frame' || !exactKeys(json, ['status', 'descriptor']) || json.status !== 'frame' || !exactKeys(json.descriptor, descriptorKeys)) throw error('HEADER');
    const d = json.descriptor;
    if (d.sessionId !== sessionId || d.generation !== generation) throw error('IDENTITY');
    if (d.width !== 1920 || d.height !== 1080 || d.stride !== 7680 || d.byteLength !== MAX_PIXELS || pixelLength !== MAX_PIXELS ||
        !Number.isSafeInteger(d.sequence) || d.sequence <= afterSequence || !uint64(d.capturedQpc) || !uint64(d.qpcFrequency)) throw error('FRAME');
    pixels = Buffer.allocUnsafe(MAX_PIXELS); result = {descriptor: d, pixels};
  }
  return chunk => {
    let at = 0;
    while (at < chunk.length) {
      if (prefixAt < 16) {
        const count = Math.min(16 - prefixAt, chunk.length - at);
        chunk.copy(prefix, prefixAt, at, at + count); prefixAt += count; at += count;
        if (prefixAt < 16) break;
        if (prefix.toString('ascii', 0, 4) !== 'GRFP' || prefix.readUInt32LE(4) !== 1) throw error('PROTOCOL');
        const length = prefix.readUInt32LE(8); pixelLength = prefix.readUInt32LE(12);
        if (length < 1 || length > 1024 || (pixelLength !== 0 && pixelLength !== MAX_PIXELS)) throw error('LENGTH');
        header = Buffer.allocUnsafe(length);
      }
      if (headerAt < header.length) {
        const count = Math.min(header.length - headerAt, chunk.length - at);
        chunk.copy(header, headerAt, at, at + count); headerAt += count; at += count;
        if (headerAt < header.length) break;
        parseHeader();
      }
      if (pixelAt < pixels.length) {
        const count = Math.min(pixels.length - pixelAt, chunk.length - at);
        chunk.copy(pixels, pixelAt, at, at + count); pixelAt += count; at += count;
      }
      if (pixelAt === pixels.length) {
        if (at !== chunk.length) throw error('EXTRA_DATA');
        return {done: true, value: result};
      }
    }
    return {done: false};
  };
}
async function createNativeReader({executable, args = [], mapping, sessionId, generation, cwd}) {
  if (!path.isAbsolute(executable) || !Array.isArray(args) || args.some(arg => typeof arg !== 'string') ||
      !/^Local\\GottesdienstRegie\.Probe\.[0-9a-f]{32}$/.test(mapping) ||
      !/^[0-9a-f]{32}$/.test(sessionId) || !/^[0-9a-f]{32}$/.test(generation) || /^0+$/.test(sessionId) || /^0+$/.test(generation)) throw error('CONFIG');
  const child = spawn(executable, args, {cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
  let failure, pending, closed = false;
  const exited = new Promise(resolve => child.once('close', resolve));
  function fail(reason) {
    if (failure || closed) return;
    failure = reason;
    if (pending) {clearTimeout(pending.timer); const current = pending; pending = null; current.reject(reason);}
    child.stdin.destroy(); child.kill();
  }
  child.on('error', () => fail(error('START_FAILED')));
  child.stdin.on('error', () => fail(error('EOF')));
  child.stderr.on('data', () => {}); // Drain only. Raw native messages never become MAIN/UI text.
  child.once('close', () => {if (!closed) fail(error('EOF'));});
  child.stdout.on('data', chunk => {
    if (closed || failure) return;
    if (!pending) {fail(error('EXTRA_DATA')); return;}
    try {
      const decoded = pending.decode(chunk);
      if (decoded.done) {const current = pending; pending = null; clearTimeout(current.timer); current.resolve(decoded.value);}
    } catch (reason) {fail(reason);}
  });
  function request(mode, line, afterSequence) {
    if (closed) return Promise.reject(error('CLOSED'));
    if (failure) return Promise.reject(failure);
    if (pending) return Promise.reject(error('BUSY'));
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => fail(error('TIMEOUT')), 2000);
      pending = {resolve, reject, timer, decode: decoder({sessionId, generation, mode, afterSequence})};
      child.stdin.write(line + '\n');
    });
  }
  async function close() {
    if (closed) return;
    closed = true;
    if (pending) {const current = pending; pending = null; clearTimeout(current.timer); current.reject(error('CLOSED'));}
    child.stdin.end();
    const killTimer = setTimeout(() => child.kill(), 300);
    let deadline;
    try {await Promise.race([exited, new Promise((_, reject) => {deadline = setTimeout(() => reject(error('CLOSE_TIMEOUT')), 2000);})]);}
    finally {clearTimeout(killTimer); clearTimeout(deadline);}
  }
  try {await request('ready', `reader ${mapping} ${sessionId} ${generation}`, 0);}
  catch (reason) {await close(); throw reason;}
  return {
    readLatest(afterSequence) {
      if (!Number.isSafeInteger(afterSequence) || afterSequence < 0) return Promise.reject(error('SEQUENCE'));
      return request('frame', `read ${generation} ${afterSequence}`, afterSequence);
    }, close
  };
}
module.exports = {createNativeReader};
