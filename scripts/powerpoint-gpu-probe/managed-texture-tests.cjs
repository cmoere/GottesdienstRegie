const test = require('node:test');
const assert = require('node:assert/strict');
let createManagedTextureApi;
try {({createManagedTextureApi} = require('./managed-texture.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
function fixture() {
  assert.equal(typeof createManagedTextureApi, 'function', 'managed texture binding missing');
  const calls = [], sends = []; let releases = 0;
  const imported = {release() {releases++;}};
  const sharedTexture = {importSharedTexture(options) {calls.push(options); return imported;},
    async sendSharedTexture(options, key) {sends.push({options, key});}};
  const api = createManagedTextureApi({sharedTexture});
  const claim = {record: {key: {sessionId: 'a'.repeat(32), generation: 'b'.repeat(32), slotId: 1, sequence: 42}, width: 1920, height: 1080, pixelFormat: 'bgra'}, ntHandle: Buffer.alloc(8, 1)};
  return {api, claim, calls, sends, imported, sharedTexture, releases: () => releases};
}
test('uses pinned API shape and passes only key to receiver', async () => {
  const f = fixture(); let callbacks = 0; const ref = f.api.import(f.claim, () => callbacks++);
  const frame = {name: 'own-frame'}; await ref.send(frame, f.claim.record.key);
  assert.deepEqual(f.calls[0].textureInfo, {pixelFormat: 'bgra', codedSize: {width: 1920, height: 1080}, visibleRect: {x: 0, y: 0, width: 1920, height: 1080}, handle: {ntHandle: f.claim.ntHandle}});
  assert.equal(f.sends[0].options.frame, frame); assert.equal(f.sends[0].options.importedSharedTexture, f.imported);
  assert.deepEqual(f.sends[0].key, f.claim.record.key); assert.equal(Object.keys(f.sends[0].key).length, 4);
  f.calls[0].allReferencesReleased(); assert.equal(callbacks, 1);
  ref.releaseMain(); assert.equal(f.releases(), 1); assert.throws(() => ref.releaseMain(), /GPU_TEXTURE_RELEASED/);
  await assert.rejects(ref.send(frame, f.claim.record.key), /GPU_TEXTURE_RELEASED/);
});
test('bad handle, dimensions and substituted key cannot reach API', async () => {
  const f = fixture();
  assert.throws(() => f.api.import({...f.claim, ntHandle: 12}, () => {}), /GPU_TEXTURE_CLAIM/);
  assert.throws(() => f.api.import({...f.claim, record: {...f.claim.record, width: 4097}}, () => {}), /GPU_TEXTURE_CLAIM/);
  assert.equal(f.calls.length, 0); const ref = f.api.import(f.claim, () => {});
  await assert.rejects(ref.send({}, {...f.claim.record.key, sequence: 43}), /GPU_TEXTURE_KEY/);
  assert.equal(f.sends.length, 0); ref.releaseMain();
});
test('requires real managed API without falling back to a different transport', () => {
  assert.equal(typeof createManagedTextureApi, 'function');
  assert.throws(() => createManagedTextureApi({sharedTexture: {}}), /GPU_TEXTURE_API/);
});
