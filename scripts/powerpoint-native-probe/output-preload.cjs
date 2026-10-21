const {contextBridge, ipcRenderer} = require('electron');
let subscribed = false;
contextBridge.exposeInMainWorld('outputFrames', {
  onFrame(listener) {
    if (subscribed || typeof listener !== 'function') throw Error('FRAME_SUBSCRIPTION_INVALID');
    subscribed = true;
    const receive = (_event, packet) => {
      const d = packet?.descriptor;
      if (!d || !Number.isSafeInteger(d.sequence) || d.sequence <= 0 || !/^[0-9a-f]{32}$/.test(d.generation) ||
          d.width !== 1920 || d.height !== 1080 || d.byteLength !== 8294400 || !(packet.pixels instanceof Uint8Array) || packet.pixels.byteLength !== 8294400) return;
      listener(packet);
    };
    ipcRenderer.on('native-probe:frame', receive);
    return () => {ipcRenderer.removeListener('native-probe:frame', receive); subscribed = false;};
  },
  ackFrame(value) {
    if (!value || Object.keys(value).length !== 2 || !Object.hasOwn(value, 'generation') || !Object.hasOwn(value, 'sequence') ||
        !/^[0-9a-f]{32}$/.test(value.generation) || !Number.isSafeInteger(value.sequence) || value.sequence <= 0) return;
    ipcRenderer.send('native-probe:ack', {generation: value.generation, sequence: value.sequence});
  }
});
