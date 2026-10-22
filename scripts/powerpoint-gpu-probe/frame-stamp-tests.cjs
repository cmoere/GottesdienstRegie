const test = require('node:test');
const assert = require('node:assert/strict');
let stamp;
try {stamp = require('./frame-stamp.js');} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
function strip(sequence) {
  const pixels = Buffer.alloc(1920 * 9 * 4, 0); const bits = stamp.bitsFor(sequence);
  for (let y = 0; y < 8; ++y) for (let x = 0; x < 276; ++x) {const at = (y * 1920 + x) * 4; pixels.fill(bits[Math.floor(x / 4)] ? 255 : 0, at, at + 3); pixels[at + 3] = 255;}
  return pixels;
}
for (const sequence of [1, 2 ** 32, Number.MAX_SAFE_INTEGER]) test('53bit stamp round trip ' + sequence, () => {
  assert.ok(stamp, 'GPU stamp missing'); assert.equal(stamp.decode(strip(sequence), 1920), sequence);
});
test('corrupt bit, alpha, unsafe and zero sequence rejected', () => {
  assert.ok(stamp); const pixels = strip(42); const at = (2 * 1920 + 10 * 4 + 2) * 4;
  pixels[at] = pixels[at + 1] = pixels[at + 2] = 255 - pixels[at];
  assert.equal(stamp.decode(pixels, 1920), null);
  const alpha = strip(42); alpha[(2 * 1920 + 2) * 4 + 3] = 0; assert.equal(stamp.decode(alpha, 1920), null);
  assert.throws(() => stamp.bitsFor(0)); assert.throws(() => stamp.bitsFor(2 ** 53));
});
module.exports = {strip};
