const {MessageChannelMain} = require('electron');
function attachOutputPort({win, onAck, onDisconnect}) {
  const {port1, port2} = new MessageChannelMain();
  let closed = false, initialized = false, resolveReady, rejectReady;
  const ready = new Promise((resolve, reject) => {resolveReady = resolve; rejectReady = reject;});
  const timeout = setTimeout(() => {rejectReady(Error('FRAME_PORT_READY_TIMEOUT')); close();}, 5000);
  function close() {
    if (closed) return; closed = true; clearTimeout(timeout);
    if (!initialized) rejectReady(Error('FRAME_PORT_CLOSED'));
    port1.close(); onDisconnect?.();
  }
  port1.on('message', ({data}) => {
    if (closed) return;
    if (!initialized && data?.type === 'ready' && Object.keys(data).length === 1) {initialized = true; clearTimeout(timeout); resolveReady(); return;}
    if (!initialized || data?.type !== 'ack' || Object.keys(data).length !== 3 || !/^[0-9a-f]{32}$/.test(data.generation) || !Number.isSafeInteger(data.sequence) || data.sequence <= 0) {close(); return;}
    onAck({generation: data.generation, sequence: data.sequence});
  });
  port1.on('close', close); port1.start();
  win.webContents.postMessage('native-probe:port', null, [port2]);
  return {ready, close, send(packet) {
    if (closed || !initialized || win.isDestroyed()) throw Error('FRAME_PORT_CLOSED');
    const pixels = packet.pixels;
    const buffer = pixels.byteOffset === 0 && pixels.byteLength === pixels.buffer.byteLength ? pixels.buffer : new Uint8Array(pixels).buffer;
    port1.postMessage({type: 'frame', descriptor: packet.descriptor, pixels: buffer});
  }};
}
module.exports = {attachOutputPort};
