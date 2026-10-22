// Private Main binding for the separately pinned Electron45 probe only.
// No fallback and no native handle, import object or generic API crosses IPC.
function createManagedTextureApi({sharedTexture}) {
  if (typeof sharedTexture?.importSharedTexture !== 'function' || typeof sharedTexture?.sendSharedTexture !== 'function') throw Error('GPU_TEXTURE_API');
  const validKey = k => k && typeof k.sessionId === 'string' && /^[a-f0-9]{32}$/.test(k.sessionId)
    && typeof k.generation === 'string' && /^[a-f0-9]{32}$/.test(k.generation)
    && Number.isInteger(k.slotId) && k.slotId >= 0 && k.slotId < 3 && Number.isSafeInteger(k.sequence) && k.sequence > 0;
  return {import(claim, onAllReferencesReleased) {
    const record = claim?.record, key = record?.key;
    if (!validKey(key) || record.width !== 1920 || record.height !== 1080 || record.pixelFormat !== 'bgra'
        || !Buffer.isBuffer(claim.ntHandle) || claim.ntHandle.length !== 8 || claim.ntHandle.readBigUInt64LE() === 0n
        || typeof onAllReferencesReleased !== 'function') throw Error('GPU_TEXTURE_CLAIM');
    const k = Object.freeze({sessionId: key.sessionId, generation: key.generation, slotId: key.slotId, sequence: key.sequence});
    const importedSharedTexture = sharedTexture.importSharedTexture({
      textureInfo: {pixelFormat: 'bgra', codedSize: {width: 1920, height: 1080}, visibleRect: {x: 0, y: 0, width: 1920, height: 1080},
        handle: {ntHandle: Buffer.from(claim.ntHandle)}},
      allReferencesReleased: onAllReferencesReleased,
    });
    let released = false;
    return {
      async send(frame, providedKey) {
        if (released) throw Error('GPU_TEXTURE_RELEASED');
        if (!validKey(providedKey) || Object.keys(providedKey).length !== 4 || Object.keys(k).some(field => k[field] !== providedKey[field])) throw Error('GPU_TEXTURE_KEY');
        await sharedTexture.sendSharedTexture({frame, importedSharedTexture}, k);
      },
      releaseMain() {if (released) throw Error('GPU_TEXTURE_RELEASED'); released = true; importedSharedTexture.release();},
    };
  }};
}
module.exports = {createManagedTextureApi};
