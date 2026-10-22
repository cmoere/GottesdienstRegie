const {attachOutputPort} = require('./output-port-main.cjs');
const stamp = require('./frame-stamp.js');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
function createComposedFrameSink({win, onAck, onDisconnect, diagnostic}) {
  let closed = false, pending;
  function complete(expected) {
    if (!closed && pending === expected && expected.rendered && expected.proof && !expected.notified) {
      expected.notified = true; onAck({generation: expected.generation, sequence: expected.sequence}, expected.proof);
    }
  }
  const connection = attachOutputPort({win, onAck(value) {
    if (pending?.sequence !== value.sequence || pending.generation !== value.generation) return;
    pending.rendered = true; complete(pending);
  }, onDisconnect() {closed = true; onDisconnect?.();}});
  async function verify(expected) {
    const deadline = performance.now() + 400;
    while (!closed && pending === expected && performance.now() < deadline) {
      // Verify actual compositor pixels without copying two complete 8MB
      // offscreen bitmaps on every frame. GPU paint textures are released by
      // the owning harness; receipt or a renderer ACK alone is not proof.
      const images = await Promise.all([
        win.webContents.capturePage({x: 0, y: 0, width: 276, height: 8}),
        win.webContents.capturePage({x: 0, y: 961, width: 1920, height: 1})
      ]);
      if (closed || pending !== expected) return;
      const first = images[0], second = images[1];
      let matches = true;
      if (diagnostic) matches = first.getSize().width === 276 && stamp.decode(first.toBitmap(), 276) === expected.sequence;
      const row = second.toBitmap();
      if (second.getSize().width !== 1920 || row.length !== 7680) matches = false;
      if (matches) for (let i = 0; i < row.length; ++i) if (Math.abs(row[i] - expected.row[i]) > 1) {matches = false; break;}
      if (matches) {expected.proof = {presentedMs: performance.now()}; complete(expected); return;}
      await wait(2);
    }
  }
  return {ready: connection.ready, close() {closed = true; pending = null; connection.close();}, send(packet) {
    if (closed) throw Error('FRAME_SINK_CLOSED');
    const expected = {sequence: packet.descriptor.sequence, generation: packet.descriptor.generation, row: Buffer.from(packet.pixels.subarray(961*7680,962*7680)), rendered: false, proof: null, notified: false};
    pending = expected; connection.send(packet);
    void verify(expected).catch(() => {if (!closed) {closed = true;connection.close();}});
  }};
}
module.exports = {createComposedFrameSink};
