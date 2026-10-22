(() => {
  let port, listener, disposed = false;
  addEventListener('message', event => {
    if (event.source !== window || event.data !== 'native-probe:frame-port' || event.ports.length !== 1) return;
    if (port || disposed) {event.ports[0].close(); return;}
    port = event.ports[0];
    port.onmessage = ({data}) => {
      const d = data?.descriptor;
      if (data?.type !== 'frame' || !d || !Number.isSafeInteger(d.sequence) || d.sequence <= 0 || !/^[0-9a-f]{32}$/.test(d.generation) ||
          d.width !== 1920 || d.height !== 1080 || d.byteLength !== 8294400 || !(data.pixels instanceof ArrayBuffer) || data.pixels.byteLength !== 8294400 || !listener) {port.close(); return;}
      const started = performance.now(); listener({descriptor: d, pixels: new Uint8Array(data.pixels)});
      if (location.search.includes('diagnostic=1') && (d.sequence < 10 || d.sequence % 30 === 0)) console.log('PORT_CALLBACK '+d.sequence+' '+(performance.now()-started));
    };
    port.start(); port.postMessage({type: 'ready'});
  });
  Object.defineProperty(window, 'outputFrames', {value: Object.freeze({
    onFrame(callback) {
      if (listener || typeof callback !== 'function' || disposed) throw Error('FRAME_SUBSCRIPTION_INVALID');
      listener = callback; return () => {listener = null;};
    },
    ackFrame(value) {
      if (!port || disposed || !value || Object.keys(value).length !== 2 || !Object.hasOwn(value, 'generation') || !Object.hasOwn(value, 'sequence') ||
          !/^[0-9a-f]{32}$/.test(value.generation) || !Number.isSafeInteger(value.sequence) || value.sequence <= 0) return;
      port.postMessage({type: 'ack', generation: value.generation, sequence: value.sequence});
    }
  })});
  addEventListener('pagehide', () => {disposed = true; if (port) port.close();}, {once: true});
})();
