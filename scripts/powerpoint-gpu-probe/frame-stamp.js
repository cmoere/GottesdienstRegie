// Probe-only marker, encoded in the SAME WebGL pass as the source texture.
const validSequence = n => Number.isSafeInteger(n) && n > 0;
function checksum(value) {let result = 0x5a; for (let i = 0; i < 7; ++i) result ^= Number((value >> BigInt(i * 8)) & 255n); return result;}
function bitsFor(sequence) {
  if (!validSequence(sequence)) throw Error('GPU_STAMP_SEQUENCE');
  const value = BigInt(sequence), check = BigInt(checksum(value));
  return Uint8Array.from([...Array.from({length: 8}, (_, i) => (0xa5 >> i) & 1),
    ...Array.from({length: 53}, (_, i) => Number((value >> BigInt(i)) & 1n)), ...Array.from({length: 8}, (_, i) => Number((check >> BigInt(i)) & 1n))]);
}
function decode(pixels, width) {
  if (!Number.isInteger(width) || width < 276 || !pixels || pixels.length < width * 8 * 4) return null;
  const bits = [];
  for (let i = 0; i < 69; ++i) {
    const at = (2 * width + i * 4 + 2) * 4, c = [pixels[at], pixels[at + 1], pixels[at + 2]];
    if (pixels[at + 3] < 250) return null;
    if (c.every(v => v > 240)) bits.push(1); else if (c.every(v => v < 15)) bits.push(0); else return null;
  }
  if (bits.slice(0, 8).some((b, i) => b !== ((0xa5 >> i) & 1))) return null;
  let value = 0n, check = 0; for (let i = 0; i < 53; ++i) if (bits[i + 8]) value |= 1n << BigInt(i);
  for (let i = 0; i < 8; ++i) check |= bits[i + 61] << i;
  return value > 0n && check === checksum(value) ? Number(value) : null;
}
const vertexShader = `#version 300 es
in vec2 position;
out vec2 uv;
void main() {gl_Position=vec4(position,0.0,1.0); uv=vec2((position.x+1.0)*0.5,(1.0-position.y)*0.5);}`;
const fragmentShader = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D source;
uniform uint seqLo;
uniform uint seqHi;
in vec2 uv;
out vec4 color;
void main() {
  ivec2 pixel=ivec2(int(gl_FragCoord.x),1079-int(gl_FragCoord.y));
  if(pixel.x<276 && pixel.y>=953 && pixel.y<961) {
    uint bit=uint(pixel.x/4), value;
    uint check=90u^(seqLo&255u)^((seqLo>>8u)&255u)^((seqLo>>16u)&255u)^((seqLo>>24u)&255u)^(seqHi&255u)^((seqHi>>8u)&255u)^((seqHi>>16u)&255u);
    if(bit<8u) value=(165u>>bit)&1u;
    else if(bit<40u) value=(seqLo>>(bit-8u))&1u;
    else if(bit<61u) value=(seqHi>>(bit-40u))&1u;
    else value=(check>>(bit-61u))&1u;
    color=vec4(vec3(float(value)),1.0);
  } else color=texture(source,uv);
}`;
module.exports = {bitsFor, decode, vertexShader, fragmentShader};
