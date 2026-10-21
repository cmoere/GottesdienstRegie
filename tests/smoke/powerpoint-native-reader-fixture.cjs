// Deliberately malformed external-protocol fixtures; never loaded by the app.
const readline = require('node:readline');
const {once} = require('node:events');
const mode = process.argv[2];
const lines = readline.createInterface({input: process.stdin});
let sessionId, generation;
function packet(header, pixels = Buffer.alloc(0)) {
  const json = Buffer.isBuffer(header) ? header : Buffer.from(JSON.stringify(header));
  const prefix = Buffer.alloc(16); prefix.write('GRFP'); prefix.writeUInt32LE(1, 4);
  prefix.writeUInt32LE(json.length, 8); prefix.writeUInt32LE(pixels.length, 12);
  return Buffer.concat([prefix, json, pixels]);
}
async function write(data, fragmented = false) {
  if (!fragmented) {process.stdout.write(data); return;}
  for (let at = 0; at < data.length;) {
    const bytes = at < 40 ? 1 : Math.min(32749, data.length - at);
    if (!process.stdout.write(data.subarray(at, at + bytes))) await once(process.stdout, 'drain');
    at += bytes;
  }
}
lines.on('line', async line => {
  const parts = line.split(' ');
  if (parts[0] === 'reader') {
    [, , sessionId, generation] = parts;
    const ready = packet({status: 'ready', sessionId, generation});
    await write(mode === 'extra-startup' ? Buffer.concat([ready, Buffer.from('X')]) : ready);
    return;
  }
  if (parts[0] !== 'read') process.exit(8);
  if (mode === 'hang') return;
  if (mode === 'eof') process.exit(0);
  if (mode === 'remote-error') {await write(packet({status: 'error', code: 'RING_SOURCE_LOST'})); return;}
  if (Number(parts[2]) === 1) {await write(packet({status: 'empty', sessionId, generation})); return;}
  const descriptor = {sessionId, generation, sequence: 1, capturedQpc: '12345678901234567', qpcFrequency: '10000000', width: 1920, height: 1080, stride: 7680, byteLength: 8294400};
  if (mode === 'wrong-generation') descriptor.generation = '33'.repeat(16);
  if (mode === 'wrong-dimensions') descriptor.width = 4294967295;
  if (mode === 'wrong-length') descriptor.byteLength = 1;
  if (mode === 'unsafe-sequence') descriptor.sequence = 9007199254740992;
  if (mode === 'stale-sequence') descriptor.sequence = 0;
  if (mode === 'unexpected-field') descriptor.nativeWindow = '12345';
  const pixels = Buffer.alloc(8294400); pixels[0] = 17; pixels[pixels.length - 1] = 29;
  let data = packet({status: 'frame', descriptor}, pixels);
  if (mode === 'oversized-header') data.writeUInt32LE(1025, 8);
  if (mode === 'oversized-pixels') data.writeUInt32LE(8294401, 12);
  if (mode === 'wrong-magic') data.write('FAIL');
  if (mode === 'wrong-version') data.writeUInt32LE(2, 4);
  if (mode === 'invalid-utf8') data = packet(Buffer.from([0xff]));
  await write(data, mode === 'fragmented');
});
