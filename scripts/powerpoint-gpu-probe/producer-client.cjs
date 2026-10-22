// Trusted Main only. Never expose this process launcher or NT handles to a page.
const {spawn} = require('node:child_process');
const path = require('node:path');
const exact = (v, keys) => v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const uint64 = v => typeof v === 'string' && /^[1-9][0-9]{0,19}$/.test(v) && BigInt(v) <= 18446744073709551615n;
const token = v => typeof v === 'string' && /^[a-f0-9]{32}$/.test(v);
const serial = v => Number.isSafeInteger(v) && v > 0;
const sameKey = (a, b) => a.sessionId === b.sessionId && a.generation === b.generation && a.slotId === b.slotId && a.sequence === b.sequence;
const problem = code => Object.assign(Error('GPU_PRODUCER_' + code), {terminal: true});

async function startGpuProducer({executable, args = [], cwd, owner, sessionId, generation}) {
  if (!path.isAbsolute(executable) || !Array.isArray(args) || args.length > 8 || args.some(a => typeof a !== 'string' || a.length > 2048 || a.includes('\0'))
      || !token(sessionId) || !token(generation) || !owner || !uint64(owner.hwnd) || !uint64(owner.createdAt)
      || !serial(owner.pid) || owner.pid > 0xffffffff) throw problem('CONFIG');
  const crop = owner.crop;
  if (!exact(crop, ['x', 'y', 'width', 'height', 'outerWidth', 'outerHeight']) || Object.values(crop).some(n => !Number.isSafeInteger(n) || n < 0)
      || !crop.width || !crop.height || crop.outerWidth > 4096 || crop.outerHeight > 2160
      || crop.x + crop.width > crop.outerWidth || crop.y + crop.height > crop.outerHeight) throw problem('CONFIG');
  const child = spawn(executable, args, {cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
  const requests = new Map(), leases = new Map(), latestSubscribers = new Set(), faultSubscribers = new Set();
  let stage = 'hello', tail = Buffer.alloc(0), handles, counter = 0, lastSequence = 0, frequency, lastNotice = 0;
  let fault, lost, pendingNotice, stopping = false, closed, stopPromise, exitCode;
  let resolveStarted, rejectStarted;
  const started = new Promise((resolve, reject) => {resolveStarted = resolve; rejectStarted = reject;});
  const exited = new Promise(resolve => child.once('close', code => {exitCode = code; resolve(code); if (!stopping && !fault) fail('EOF');}));
  const startupTimer = setTimeout(() => fail('START_TIMEOUT'), 10000);
  function notify(callbacks, value) {for (const cb of callbacks) {try {cb(value);} catch { /* Subscribers cannot corrupt ownership. */ }}}
  function fail(code) {
    if (fault) return;
    fault = problem(code); clearTimeout(startupTimer);
    notify(faultSubscribers, fault); rejectStarted(fault);
    for (const request of requests.values()) {clearTimeout(request.timer); request.reject(fault);}
    requests.clear(); child.kill();
  }
  function write(line) {
    if (Buffer.byteLength(line) > 1024 || /[\r\n\0]/.test(line)) {fail('COMMAND'); return;}
    child.stdin.write(line + '\n');
  }
  function validKey(key) {
    return exact(key, ['sessionId', 'generation', 'slotId', 'sequence']) && key.sessionId === sessionId && key.generation === generation
      && Number.isInteger(key.slotId) && key.slotId >= 0 && key.slotId < 3 && serial(key.sequence);
  }
  function checkFrequency(value) {if (!uint64(value) || (frequency && frequency !== value)) throw problem('CLOCK'); frequency = value;}
  function record(value) {
    if (!exact(value, ['key', 'times', 'width', 'height', 'pixelFormat']) || !validKey(value.key) || value.key.sequence <= lastSequence
        || value.width !== 1920 || value.height !== 1080 || value.pixelFormat !== 'bgra' || leases.has(value.key.slotId)) throw problem('FRAME');
    const t = value.times;
    if (!exact(t, ['sourceReportedQpc', 'acquiredQpc', 'copyDoneQpc', 'qpcFrequency']) || (t.sourceReportedQpc !== null && !uint64(t.sourceReportedQpc))
        || !uint64(t.acquiredQpc) || !uint64(t.copyDoneQpc) || BigInt(t.copyDoneQpc) < BigInt(t.acquiredQpc)) throw problem('FRAME');
    checkFrequency(t.qpcFrequency); lastSequence = value.key.sequence;
    Object.freeze(value.key); Object.freeze(t); Object.freeze(value);
    leases.set(value.key.slotId, {key: value.key, releasing: false});
    const ntHandle = Buffer.alloc(8); ntHandle.writeBigUInt64LE(handles[value.key.slotId]);
    return {record: value, ntHandle};
  }
  function message(v) {
    if (fault) return;
    if (!v || typeof v !== 'object' || Array.isArray(v)) throw problem('PROTOCOL');
    if (v.status === 'error') throw problem('REMOTE_ERROR');
    if (stage === 'hello') {
      if (!exact(v, ['status', 'protocol', 'parentPid', 'parentCreated', 'nonce']) || v.status !== 'hello' || v.protocol !== 1
          || v.parentPid !== process.pid || !uint64(v.parentCreated) || !token(v.nonce)) throw problem('BOOTSTRAP');
      stage = 'ready';
      write(['start', 1, v.nonce, sessionId, generation, owner.hwnd, owner.pid, owner.createdAt, crop.x, crop.y, crop.width, crop.height,
        crop.outerWidth, crop.outerHeight, process.pid, v.parentCreated].join(' ')); return;
    }
    if (stage === 'ready') {
      if (!exact(v, ['status', 'sessionId', 'generation', 'width', 'height', 'handles']) || v.status !== 'ready' || v.sessionId !== sessionId
          || v.generation !== generation || v.width !== 1920 || v.height !== 1080 || !Array.isArray(v.handles) || v.handles.length !== 3
          || !v.handles.every(uint64) || new Set(v.handles).size !== 3) throw problem('BOOTSTRAP');
      handles = v.handles.map(BigInt); stage = 'active'; clearTimeout(startupTimer); resolveStarted(client); return;
    }
    if (v.status === 'closed') {
      if (!stopping || closed || !exact(v, ['status', 'drained']) || typeof v.drained !== 'boolean') throw problem('PROTOCOL');
      closed = v; stage = 'closed'; return;
    }
    if (stage !== 'active') throw problem('PROTOCOL');
    if (v.status === 'source-lost') {
      if (lost || !exact(v, ['status', 'code']) || !/^SOURCE_[A-Z0-9_]{1,56}$/.test(v.code)) throw problem('PROTOCOL');
      lost = Object.assign(problem('SOURCE_LOST'), {terminal: false, reason: v.code}); notify(faultSubscribers, lost); return;
    }
    if (v.status === 'notice') {
      if (!exact(v, ['status', 'sessionId', 'generation', 'noticeId']) || v.sessionId !== sessionId || v.generation !== generation
          || !serial(v.noticeId) || v.noticeId <= lastNotice) throw problem('PROTOCOL');
      lastNotice = v.noticeId;
      const notice = Object.freeze({sessionId, generation, noticeId: v.noticeId});
      write(`notice ${sessionId} ${generation} ${v.noticeId}`);
      if (!stopping) {if (latestSubscribers.size) notify(latestSubscribers, notice); else pendingNotice = notice;}
      return;
    }
    if (!serial(v.requestId) || !requests.has(v.requestId)) throw problem('REPLY');
    const request = requests.get(v.requestId);
    let result;
    if (request.mode === 'clock') {
      if (!exact(v, ['status', 'requestId', 'qpcNow', 'qpcFrequency']) || v.status !== 'clock' || !uint64(v.qpcNow)) throw problem('CLOCK');
      checkFrequency(v.qpcFrequency); result = {qpcNow: v.qpcNow, qpcFrequency: v.qpcFrequency};
    } else if (request.mode === 'claim') {
      if (v.status === 'empty' && exact(v, ['status', 'requestId'])) result = null;
      else {
        if (v.status !== 'claimed' || !exact(v, ['status', 'requestId', 'record'])) throw problem('FRAME');
        result = record(v.record);
      }
    } else {
      if (!exact(v, ['status', 'requestId', 'key']) || v.status !== 'released' || !validKey(v.key) || !sameKey(v.key, request.key)) throw problem('RELEASE');
      leases.delete(v.key.slotId);
    }
    clearTimeout(request.timer); requests.delete(v.requestId);
    if (!request.cancelled) request.resolve(result);
  }
  child.stdout.on('data', chunk => {
    if (fault) return;
    try {
      let at = 0;
      while (at < chunk.length) {
        const end = chunk.indexOf(10, at);
        const until = end < 0 ? chunk.length : end;
        if (tail.length + until - at > 2048) throw problem('LENGTH');
        const line = tail.length ? Buffer.concat([tail, chunk.subarray(at, until)]) : chunk.subarray(at, until);
        if (end < 0) {tail = Buffer.from(line); break;}
        tail = Buffer.alloc(0); at = end + 1;
        if (!line.length || line.includes(0)) throw problem('PROTOCOL');
        const text = new TextDecoder('utf-8', {fatal: true}).decode(line);
        message(JSON.parse(text)); if (fault) break;
      }
    } catch (error) {fail(error.message?.startsWith('GPU_PRODUCER_') ? error.message.slice(13) : 'PROTOCOL');}
  });
  child.stderr.on('data', () => {});
  child.once('error', () => fail('START_FAILED'));
  child.stdin.on('error', () => {if (!stopping) fail('PIPE');});
  function request(mode, key) {
    if (fault || stopping) return Promise.reject(fault || problem('CLOSED'));
    if (requests.size >= 16) return Promise.reject(problem('BUSY'));
    if (counter >= Number.MAX_SAFE_INTEGER) return Promise.reject(problem('SEQUENCE'));
    const id = ++counter;
    return new Promise((resolve, reject) => {
      const value = {mode, key, resolve, reject, timer: setTimeout(() => fail('TIMEOUT'), 2000)};
      requests.set(id, value);
      if (mode === 'clock') write('clock ' + id);
      else if (mode === 'claim') write(`claim ${id} ${sessionId} ${generation}`);
      else write(`release ${id} ${sessionId} ${generation} ${key.slotId} ${key.sequence}`);
    });
  }
  const client = {
    async claimLatest() {if (fault || stopping) throw fault || problem('CLOSED'); if (lost) return null; return request('claim');},
    async release(key) {
      if (fault || stopping) throw fault || problem('CLOSED');
      const lease = validKey(key) && leases.get(key.slotId);
      if (!lease || lease.releasing || !sameKey(lease.key, key)) throw problem('RELEASE');
      if (requests.size >= 16) throw problem('BUSY');
      if (counter >= Number.MAX_SAFE_INTEGER) throw problem('SEQUENCE');
      lease.releasing = true; return request('release', lease.key);
    },
    clock() {return request('clock');},
    subscribeLatest(callback) {
      if (typeof callback !== 'function' || stopping) throw problem('CLOSED');
      latestSubscribers.add(callback);
      if (pendingNotice) {const value = pendingNotice; pendingNotice = undefined; queueMicrotask(() => {if (latestSubscribers.has(callback)) notify([callback], value);});}
      return () => latestSubscribers.delete(callback);
    },
    onFault(callback) {
      if (typeof callback !== 'function') throw problem('CONFIG');
      let sourceDelivered = false, terminalDelivered = false;
      const deliver = error => {
        if (terminalDelivered || (!error.terminal && sourceDelivered)) return;
        if (error.terminal) terminalDelivered = true; else sourceDelivered = true;
        callback(error);
      };
      faultSubscribers.add(deliver);
      if (fault || lost) {const cached = fault || lost; queueMicrotask(() => {if (faultSubscribers.has(deliver)) notify([deliver], cached);});}
      return () => faultSubscribers.delete(deliver);
    },
    stop() {
      if (stopPromise) return stopPromise;
      stopping = true; clearTimeout(startupTimer); latestSubscribers.clear(); pendingNotice = undefined;
      for (const value of requests.values()) {clearTimeout(value.timer); value.cancelled = true; value.reject(problem('CLOSED'));}
      if (!fault && exitCode === undefined) write('stop');
      stopPromise = (async () => {
        const kill = setTimeout(() => child.kill(), 2500); let timeout;
        try {
          await Promise.race([exited, new Promise((_, reject) => {timeout = setTimeout(() => reject(problem('CLOSE_TIMEOUT')), 4000);})]);
          return {exitCode, drained: !fault && closed?.drained === true && leases.size === 0};
        } finally {clearTimeout(kill); clearTimeout(timeout); requests.clear();}
      })();
      return stopPromise;
    },
  };
  try {return await started;} catch (error) {await client.stop(); throw error;}
}
module.exports = {startGpuProducer};
