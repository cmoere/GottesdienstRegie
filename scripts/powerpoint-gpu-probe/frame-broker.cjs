// Trusted Main only. ACK credit and GPU lifetime are deliberately independent.
function createGpuFrameBroker({producer, textureApi, now = () => performance.now()}) {
  const clients = new Map(), imports = new Map();
  let run, scheduled = false, dirty = false, revoked = false, fault = null, identity, lastSequence = 0;
  const keyId = k => `${k.sessionId}/${k.generation}/${k.slotId}/${k.sequence}`;
  const same = (a, b) => a && b && a.sessionId === b.sessionId && a.generation === b.generation && a.slotId === b.slotId && a.sequence === b.sequence;
  const validKey = k => k && typeof k.sessionId === 'string' && /^[a-f0-9]{32}$/.test(k.sessionId)
    && typeof k.generation === 'string' && /^[a-f0-9]{32}$/.test(k.generation)
    && Number.isInteger(k.slotId) && k.slotId >= 0 && k.slotId < 3 && Number.isSafeInteger(k.sequence) && k.sequence > 0;
  function drop(client) {
    if (clients.get(client.id) !== client) return;
    clients.delete(client.id); clearTimeout(client.timer); client.pending = null;
    try {client.close();} catch { /* Own window controller handles its diagnostics. */ }
  }
  function fail(code) {if (!fault) fault = code; dirty = false; for (const client of clients.values()) drop(client);}
  function expire() {for (const c of clients.values()) if (c.pending && now() - c.sentAt >= 500) drop(c);}
  function kick() {
    if (revoked || fault) return;
    dirty = true;
    if (!scheduled) {scheduled = true; queueMicrotask(() => {scheduled = false; void pump();});}
  }
  function finish(entry) {
    if (imports.get(entry.id) !== entry || entry.releasing || entry.uncertain || !entry.callbackSeen || !entry.mainReleased) return;
    entry.releasing = true;
    Promise.resolve().then(() => producer.release(entry.key)).then(() => {
      if (imports.get(entry.id) === entry) imports.delete(entry.id);
      kick();
    }, () => fail('GPU_BROKER_RELEASE'));
  }
  function releaseMain(entry) {
    if (entry.releaseStarted) return;
    entry.releaseStarted = true;
    try {entry.ref.releaseMain(); entry.mainReleased = true; finish(entry);}
    catch {entry.uncertain = true; fail('GPU_BROKER_MAIN_RELEASE');}
  }
  function deliver(claim, recipients) {
    const k = Object.freeze({...claim.record.key}), id = keyId(k);
    const entry = {id, key: k, callbackSeen: false, releaseStarted: false, mainReleased: false, releasing: false, uncertain: false, ref: null};
    imports.set(id, entry);
    try {
      entry.ref = textureApi.import(claim, () => {
        if (imports.get(id) !== entry) return;
        if (!entry.releaseStarted) {entry.uncertain = true; fail('GPU_BROKER_RELEASE_ORDER'); return;}
        entry.callbackSeen = true; finish(entry);
      });
    } catch {entry.uncertain = true; fail('GPU_BROKER_IMPORT'); return;}
    if (entry.uncertain) {releaseMain(entry); return;}
    const sends = [];
    for (const client of recipients) {
      if (clients.get(client.id) !== client || client.pending || revoked || fault) continue;
      client.pending = k; client.sentAt = now();
      client.timer = setTimeout(() => {if (same(client.pending, k)) drop(client);}, 500);
      client.timer.unref?.();
      try {sends.push(Promise.resolve(entry.ref.send(client.frame, k)).catch(() => drop(client)));}
      catch {drop(client);}
    }
    // Never await the slow sender in the claim loop. The entry keeps its Main
    // reference until every send settles; actual ref completion is a second gate.
    Promise.allSettled(sends).then(() => releaseMain(entry));
  }
  async function releaseUnimported(claim) {
    try {await producer.release(claim.record.key);} catch {fail('GPU_BROKER_RELEASE');}
  }
  function pump() {
    expire();
    if (run) return run;
    if (revoked || fault) return Promise.resolve();
    run = (async () => {
      while (dirty && !revoked && !fault) {
        dirty = false; expire();
        if (imports.size >= 3) break;
        const recipients = [...clients.values()].filter(c => !c.pending);
        if (!recipients.length) break;
        let claim;
        try {claim = await producer.claimLatest();} catch {fail('GPU_BROKER_PRODUCER'); break;}
        if (!claim) continue;
        const k = claim.record?.key;
        if (!validKey(k)) {fail('GPU_BROKER_FRAME'); break;}
        if (revoked || fault) {await releaseUnimported(claim); break;}
        if (claim.record.width !== 1920 || claim.record.height !== 1080 || claim.record.pixelFormat !== 'bgra'
            || !Buffer.isBuffer(claim.ntHandle) || claim.ntHandle.length !== 8 || claim.ntHandle.readBigUInt64LE() === 0n
            || k.sequence <= lastSequence || (identity && identity !== k.sessionId + '/' + k.generation)
            || [...imports.values()].some(e => e.key.slotId === k.slotId)) {fail('GPU_BROKER_FRAME'); break;}
        identity = k.sessionId + '/' + k.generation; lastSequence = k.sequence;
        const stillFree = recipients.filter(c => clients.get(c.id) === c && !c.pending);
        if (!stillFree.length) {await releaseUnimported(claim); continue;}
        deliver(claim, stillFree);
      }
    })().finally(() => {run = null; if (dirty && !revoked && !fault) kick();});
    return run;
  }
  const unsubLatest = producer.subscribeLatest(kick);
  const unsubFault = producer.onFault?.(error => {if (error.terminal !== false) fail('GPU_BROKER_PRODUCER');});
  return {
    register({id, frame, close}) {
      if (revoked || fault || clients.size >= 4 || clients.has(id) || (typeof id !== 'string' && typeof id !== 'number') || frame == null || typeof close !== 'function') throw Error('GPU_BROKER_CLIENT');
      const client = {id, frame, close, pending: null, timer: null, sentAt: 0};
      clients.set(id, client); kick(); return () => {drop(client);};
    },
    ack(id, key) {
      const client = clients.get(id);
      if (!client || !same(client.pending, key)) return false;
      clearTimeout(client.timer); client.pending = null; kick(); return true;
    },
    pumpLatest() {dirty = true; return pump();},
    async revoke() {
      if (!revoked) {revoked = true; dirty = false; unsubLatest?.(); unsubFault?.(); for (const c of clients.values()) drop(c);}
      if (run) await run;
      // Returning is not a claim that imports drained. Check status().drained;
      // the isolated supervisor must exit Main if real callbacks never arrive.
    },
    status() {return {clients: clients.size, imports: imports.size, pendingClaim: !!run, revoked, fault, drained: imports.size === 0 && !run};},
  };
}
module.exports = {createGpuFrameBroker};
