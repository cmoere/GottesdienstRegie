// Main-only broker. Caller owns the single 30Hz pump clock and trusted WebContents registry.
function createFrameBroker({sessionId, generation, reader, now = () => performance.now()}) {
  if (!/^[0-9a-f]{32}$/.test(sessionId) || !/^[0-9a-f]{32}$/.test(generation) || typeof reader?.readLatest !== 'function' || typeof reader?.close !== 'function') throw Error('FRAME_BROKER_CONFIG');
  const clients = new Map();
  let state = 'ready', errorCode, latest = null, pending = null, closing;
  function remove(entry) {
    if (clients.get(entry.id) !== entry) return;
    clients.delete(entry.id); entry.outstanding = null;
    try {entry.close();} catch {}
  }
  function deliver(entry) {
    if (!latest || entry.outstanding || latest.descriptor.sequence <= entry.lastSequence || clients.get(entry.id) !== entry) return;
    entry.outstanding = {sequence: latest.descriptor.sequence, at: now()};
    entry.lastSequence = latest.descriptor.sequence;
    try {entry.send(latest);} catch {remove(entry);}
  }
  function publicPacket(packet) {
    const d = packet?.descriptor;
    if (!d || d.sessionId !== sessionId || d.generation !== generation || !Number.isSafeInteger(d.sequence) || d.sequence <= (latest?.descriptor.sequence ?? 0) ||
        d.width !== 1920 || d.height !== 1080 || d.stride !== 7680 || d.byteLength !== 8294400 || !(packet.pixels instanceof Uint8Array) || packet.pixels.byteLength !== 8294400 ||
        !/^[1-9][0-9]{0,19}$/.test(d.capturedQpc) || !/^[1-9][0-9]{0,19}$/.test(d.qpcFrequency)) throw Error('FRAME_SOURCE_INVALID');
    const descriptor = Object.freeze({sessionId, generation, sequence: d.sequence, capturedQpc: d.capturedQpc, qpcFrequency: d.qpcFrequency,
      width: 1920, height: 1080, stride: 7680, byteLength: 8294400});
    return Object.freeze({descriptor, pixels: packet.pixels});
  }
  return {
    register(client) {
      if (state === 'revoked') throw Error('FRAME_REVOKED');
      if (!client || typeof client.id !== 'string' || !client.id || client.id.length > 128 || typeof client.send !== 'function' || typeof client.close !== 'function') throw Error('FRAME_CLIENT_INVALID');
      if (clients.has(client.id)) throw Error('FRAME_CLIENT_EXISTS');
      if (clients.size >= 4) throw Error('FRAME_CLIENT_LIMIT');
      const entry = {...client, outstanding: null, lastSequence: 0};
      clients.set(entry.id, entry); deliver(entry);
      return () => remove(entry);
    },
    ack(clientId, incomingGeneration, sequence) {
      const entry = clients.get(clientId);
      if (state !== 'ready' || incomingGeneration !== generation || !Number.isSafeInteger(sequence) || entry?.outstanding?.sequence !== sequence) return false;
      entry.outstanding = null; return true;
    },
    pump() {
      if (state !== 'ready') return Promise.resolve(false);
      for (const entry of clients.values()) if (entry.outstanding && now() - entry.outstanding.at >= 500) remove(entry);
      if (pending) return pending;
      if (!clients.size) return Promise.resolve(false);
      pending = Promise.resolve().then(async () => {
        const packet = await reader.readLatest(latest?.descriptor.sequence ?? 0);
        if (state !== 'ready') return false;
        if (packet !== null) latest = publicPacket(packet);
        for (const entry of clients.values()) deliver(entry);
        return packet !== null;
      }).catch(() => {
        if (state === 'ready') {state = 'error'; errorCode = 'FRAME_SOURCE_FAILED';}
        return false;
      }).finally(() => {pending = null;});
      return pending;
    },
    status() {return {state, ...(errorCode ? {errorCode} : {}), clients: clients.size, latestSequence: latest?.descriptor.sequence ?? 0};},
    revoke() {
      if (closing) return closing;
      state = 'revoked';
      for (const entry of clients.values()) remove(entry);
      latest = null;
      closing = Promise.resolve().then(() => reader.close());
      return closing;
    }
  };
}
module.exports = {createFrameBroker};
