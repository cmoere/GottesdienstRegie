// Sandboxed isolated world only. The untrusted Page receives no bridge at all.
const {ipcRenderer, sharedTexture} = require('electron');
addEventListener('DOMContentLoaded', async () => {
  function fault() {ipcRenderer.send('gpu-probe:fault', {code: 'GPU_RECEIVER_FAILED'});}
  try {
    const config = await ipcRenderer.invoke('gpu-probe:boot');
    const canvas = document.querySelector('canvas');
    const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true});
    if (!gl || typeof sharedTexture?.setSharedTextureReceiver !== 'function') throw Error('GPU_UNAVAILABLE');
    function shader(type, source) {
      const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {gl.deleteShader(s); throw Error('GPU_SHADER');} return s;
    }
    const vs = shader(gl.VERTEX_SHADER, config.vertexShader), ps = shader(gl.FRAGMENT_SHADER, config.fragmentShader);
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, ps); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(ps);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('GPU_PROGRAM'); gl.useProgram(program);
    const vertices = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vertices); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'position'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
    gl.uniform1i(gl.getUniformLocation(program, 'source'), 0); gl.viewport(0, 0, 1920, 1080);
    const lo = gl.getUniformLocation(program, 'seqLo'), hi = gl.getUniformLocation(program, 'seqHi');
    let busy = false, lastSequence = 0;
    let observationKey, readyObservation, pendingObservation, observationScheduled = false, observationDirty = false;
    function sendObservation() {
      if (pendingObservation || !readyObservation) return;
      pendingObservation = readyObservation; readyObservation = null;
      ipcRenderer.send('gpu-probe:observe', {key: pendingObservation});
    }
    function scheduleObservation() {
      if (observationScheduled || !observationDirty) return;
      observationScheduled = true;
      requestAnimationFrame(() => {
        observationScheduled = false; observationDirty = false; readyObservation = observationKey;
        sendObservation();
      });
    }
    ipcRenderer.on('gpu-probe:observed', (_event, value) => {
      const key = value?.key;
      if (!pendingObservation || key?.sequence !== pendingObservation.sequence || key.sessionId !== config.sessionId || key.generation !== config.generation || key.slotId !== pendingObservation.slotId) return;
      pendingObservation = null; sendObservation(); scheduleObservation();
    });
    const valid = key => key && Object.keys(key).length === 4 && key.sessionId === config.sessionId && key.generation === config.generation
      && Number.isInteger(key.slotId) && key.slotId >= 0 && key.slotId < 3 && Number.isSafeInteger(key.sequence) && key.sequence > lastSequence;
    const waitForGpu = sync => new Promise((resolve, reject) => {
      const end = performance.now() + 400;
      function poll() {
        const state = gl.clientWaitSync(sync, 0, 0);
        if (state === gl.ALREADY_SIGNALED || state === gl.CONDITION_SATISFIED) resolve();
        else if (state === gl.WAIT_FAILED || performance.now() >= end) reject(Error('GPU_FENCE'));
        else setTimeout(poll, 1);
      } poll();
    });
    sharedTexture.setSharedTextureReceiver(async ({importedSharedTexture: imported}, key) => {
      let frame, sync, ownedBusy = false, released = false;
      try {
        if (busy || !valid(key)) throw Error('GPU_KEY'); busy = true; ownedBusy = true;
        if (config.stall) await new Promise(() => {}); // Own fault-fixture only; destroyed by its controller.
        frame = imported.getVideoFrame();
        if (frame.codedWidth !== 1920 || frame.codedHeight !== 1080) throw Error('GPU_SIZE');
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, frame);
        gl.uniform1ui(lo, key.sequence >>> 0); gl.uniform1ui(hi, Math.floor(key.sequence / 4294967296));
        gl.drawArrays(gl.TRIANGLES, 0, 3); sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
        if (!sync || gl.getError() !== gl.NO_ERROR) throw Error('GPU_DRAW');
        await waitForGpu(sync); lastSequence = key.sequence;
        if (config.releaseDelayMs === 150) await new Promise(resolve => setTimeout(resolve, 150)); // Own shutdown fixture only.
        const drawnFrame = frame; frame = null; drawnFrame.close(); released = true; imported.release();
        ipcRenderer.send('gpu-probe:ack', {key});
        observationKey = key; observationDirty = true; scheduleObservation();
      } catch {fault();}
      finally {
        if (sync) gl.deleteSync(sync);
        try {if (frame) frame.close();} catch {fault();}
        try {if (!released) {released = true; imported.release();}} catch {fault();}
        if (ownedBusy) busy = false;
      }
    });
    ipcRenderer.on('gpu-probe:source-lost', () => {document.querySelector('.fault').hidden = false;});
    ipcRenderer.send('gpu-probe:ready', {ready: true});
  } catch {fault();}
});
