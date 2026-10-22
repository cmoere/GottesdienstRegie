const {createHash} = require('node:crypto');
const {decode} = require('./frame-stamp.js');
// Read-only observer. No broker ACK or native release capability.
function createComposedObserver({captureStrip, now = () => performance.now(), onObservation}) {
  const records = new Map(); let generation, epoch = 0, closed = false, pending, dirty = false, lastHash, lastSequence = 0;
  let captures = 0, totalCaptureMs = 0, maxCaptureMs = 0;
  let unmatchedStamp = 0, staleStamp = 0, unchangedSource = 0;
  const rect = Object.freeze({x: 0, y: 953, width: 1920, height: 9});
  function request() {
    if (closed) return Promise.resolve();
    if (pending) {dirty = true; return pending;}
    const ownEpoch = epoch; dirty = false;
    pending = (async () => {
      do {
        dirty = false;
        const captureStartMs = now(), image = await captureStrip(rect), observedMs = now(), captureMs = observedMs - captureStartMs;
        if (closed || epoch !== ownEpoch) return;
        captures++; totalCaptureMs += captureMs; maxCaptureMs = Math.max(maxCaptureMs, captureMs);
        if (image.width !== 1920 || image.height !== 9 || !Buffer.isBuffer(image.pixels) || image.pixels.length !== 1920 * 9 * 4) throw Error('GPU_OBSERVER_GEOMETRY');
        const sequence = decode(image.pixels, 1920), entry = records.get(sequence);
        if (entry && sequence > lastSequence) {
          const hash = createHash('sha256').update(image.pixels.subarray(1920 * 8 * 4)).digest('hex');
          if (entry.expectedMotionHash && entry.expectedMotionHash !== hash) throw Error('GPU_OBSERVER_SOURCE');
          lastSequence = sequence;
          if (hash !== lastHash) {lastHash = hash; onObservation({key: entry.record.key, sequence, sourceFingerprint: hash, presentedMs: observedMs, captureMs});}
          else unchangedSource++;
        } else if (!entry) unmatchedStamp++; else staleStamp++;
      } while (dirty && !closed && epoch === ownEpoch);
    })().finally(() => {pending = null;});
    return pending;
  }
  return {
    remember(record, expectedMotionHash) {
      if (closed || record?.key?.generation !== generation || !Number.isSafeInteger(record.key.sequence) || record.key.sequence <= 0) return;
      records.set(record.key.sequence, {record, expectedMotionHash});
      while (records.size > 16) records.delete(records.keys().next().value);
    },
    request,
    reset(nextGeneration) {epoch++; generation = nextGeneration; records.clear(); dirty = false; lastHash = undefined; lastSequence = 0; captures = totalCaptureMs = maxCaptureMs = 0; unmatchedStamp = staleStamp = unchangedSource = 0;},
    close() {closed = true; epoch++; records.clear(); dirty = false;},
    status() {return {records: records.size, pending: !!pending, dirty, closed, captures, totalCaptureMs, maxCaptureMs, unmatchedStamp, staleStamp, unchangedSource};},
  };
}
module.exports = {createComposedObserver};
