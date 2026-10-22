const test = require('node:test'), assert = require('node:assert/strict');
let stamp;
try {stamp = require('./frame-stamp.js');} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const prefix = [1,0,1,0,0,1,0,1], suffix = [0,1,0,1,1,0,1,0];
test('diagnostic bits preserve full safe-integer precision', () => {
  assert.equal(typeof stamp?.bitsFor, 'function', 'Compositor frame stamp is missing');
  assert.deepEqual([...stamp.bitsFor(1)], [...prefix, 1, ...Array(52).fill(0), ...suffix]);
  assert.deepEqual([...stamp.bitsFor(9007199254740991)], [...prefix, ...Array(53).fill(1), ...suffix]);
  assert.throws(() => stamp.bitsFor(9007199254740992)); assert.throws(() => stamp.bitsFor(0));
});
test('decodes independently drawn compositor pixels, rejects incomplete and corrupted markers', () => {
  assert.equal(typeof stamp?.decode, 'function', 'Compositor frame stamp is missing');
  const width = 300, bitmap = Buffer.alloc(width * 8 * 4);
  const bits = [...prefix, 1, ...Array(52).fill(0), ...suffix];
  for (let i = 0; i < bits.length; ++i) for (let y = 0; y < 8; ++y) for (let x = i * 4; x < i * 4 + 4; ++x) {
    const at = (y * width + x) * 4; bitmap[at] = bitmap[at + 1] = bitmap[at + 2] = bits[i] ? 255 : 0; bitmap[at + 3] = 255;
  }
  assert.equal(stamp.decode(bitmap, width), 1);
  bitmap[(2 * width + 2) * 4] = 128; assert.equal(stamp.decode(bitmap, width), null);
  assert.equal(stamp.decode(Buffer.alloc(4), width), null);
});
