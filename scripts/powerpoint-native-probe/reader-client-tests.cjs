const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
let createNativeReader;
try {({createNativeReader} = require('./reader-client.cjs'));} catch (error) {if (error.code !== 'MODULE_NOT_FOUND') throw error;}
const fixture = path.resolve(__dirname, '../..', 'tests/smoke/powerpoint-native-reader-fixture.cjs');
const options = mode => ({executable: process.execPath, args: [fixture, mode], mapping: 'Local\\GottesdienstRegie.Probe.' + 'ab'.repeat(16), sessionId: '11'.repeat(16), generation: '22'.repeat(16)});

test('native reader accepts fragmented real pipe frame and rejects overlapping reads', async () => {
  assert.equal(typeof createNativeReader, 'function', 'Bounded native reader client is missing');
  const reader = await createNativeReader(options('fragmented'));
  try {
    const pending = reader.readLatest(0);
    await assert.rejects(reader.readLatest(0), /NATIVE_READER_BUSY/);
    const packet = await pending;
    assert.equal(packet.descriptor.sequence, 1);
    assert.equal(packet.descriptor.capturedQpc, '12345678901234567');
    assert.equal(packet.pixels.byteLength, 8294400);
    assert.equal(packet.pixels[0], 17);
    assert.equal(packet.pixels.at(-1), 29);
    assert.equal(await reader.readLatest(1), null);
  } finally {await reader.close();}
  await assert.rejects(reader.readLatest(1), /NATIVE_READER_CLOSED/);
});
for (const [mode, message] of [
  ['oversized-header', 'NATIVE_READER_LENGTH'], ['oversized-pixels', 'NATIVE_READER_LENGTH'],
  ['wrong-magic', 'NATIVE_READER_PROTOCOL'], ['wrong-version', 'NATIVE_READER_PROTOCOL'],
  ['invalid-utf8', 'NATIVE_READER_HEADER'], ['wrong-generation', 'NATIVE_READER_IDENTITY'],
  ['wrong-dimensions', 'NATIVE_READER_FRAME'], ['wrong-length', 'NATIVE_READER_FRAME'],
  ['stale-sequence', 'NATIVE_READER_FRAME'], ['unsafe-sequence', 'NATIVE_READER_FRAME'],
  ['unexpected-field', 'NATIVE_READER_HEADER'], ['eof', 'NATIVE_READER_EOF'],
  ['hang', 'NATIVE_READER_TIMEOUT'], ['remote-error', 'NATIVE_READER_REMOTE_ERROR']
]) test('native reader rejects ' + mode, async () => {
  assert.equal(typeof createNativeReader, 'function', 'Bounded native reader client is missing');
  const reader = await createNativeReader(options(mode));
  try {await assert.rejects(reader.readLatest(0), new RegExp(message));}
  finally {await reader.close();}
});
test('native reader rejects unsolicited startup bytes', async () => {
  assert.equal(typeof createNativeReader, 'function', 'Bounded native reader client is missing');
  await assert.rejects(createNativeReader(options('extra-startup')), /NATIVE_READER_EXTRA_DATA/);
});
test('native reader revokes an in-flight read on close', async () => {
  assert.equal(typeof createNativeReader, 'function', 'Bounded native reader client is missing');
  const reader = await createNativeReader(options('hang'));
  const pending = reader.readLatest(0);
  const rejected = assert.rejects(pending, /NATIVE_READER_CLOSED/);
  await reader.close(); await rejected;
});
