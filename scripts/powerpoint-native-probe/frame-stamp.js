// Diagnostic compositor marker; never mounted in the product output.
(() => {
  const prefix = [1,0,1,0,0,1,0,1], suffix = [0,1,0,1,1,0,1,0];
  function bitsFor(sequence) {
    if (!Number.isSafeInteger(sequence) || sequence <= 0) throw Error('FRAME_STAMP_SEQUENCE');
    const value = BigInt(sequence);
    return Uint8Array.from([...prefix, ...Array.from({length: 53}, (_, i) => Number((value >> BigInt(i)) & 1n)), ...suffix]);
  }
  function decode(bitmap, width) {
    if (!Number.isInteger(width) || width < 276 || bitmap.length < width * 3 * 4) return null;
    const bits = [];
    for (let i = 0; i < 69; ++i) {
      const at = (2 * width + i * 4 + 2) * 4;
      const channels = [bitmap[at], bitmap[at+1], bitmap[at+2]];
      if (bitmap[at+3] < 250) return null;
      if (channels.every(value => value > 240)) bits.push(1);
      else if (channels.every(value => value < 15)) bits.push(0);
      else return null;
    }
    if (!prefix.every((bit, i) => bit === bits[i]) || !suffix.every((bit, i) => bit === bits[i + 61])) return null;
    let value = 0n;
    for (let i = 0; i < 53; ++i) if (bits[i+8]) value |= 1n << BigInt(i);
    return value > 0 ? Number(value) : null;
  }
  function draw(canvas, sequence) {
    const context = canvas.getContext('2d');
    bitsFor(sequence).forEach((bit, i) => {context.fillStyle = bit ? '#fff' : '#000'; context.fillRect(i*4, 0, 4, 8);});
  }
  const api = Object.freeze({bitsFor, decode, draw});
  if (typeof module !== 'undefined') module.exports = api; else globalThis.FrameStamp = api;
})();
