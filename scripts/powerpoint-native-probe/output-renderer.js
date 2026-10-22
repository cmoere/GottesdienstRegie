(() => {
  const canvas = document.getElementById('frame');
  const marker = new URLSearchParams(location.search).get('diagnostic') === '1' ? document.getElementById('probe-marker') : null;
  if (marker) marker.hidden = false;
  const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true});
  if (!gl) throw Error('FRAME_WEBGL_UNAVAILABLE');
  function shader(type, source) {
    const value = gl.createShader(type); gl.shaderSource(value, source); gl.compileShader(value);
    if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw Error('FRAME_SHADER_FAILED');
    return value;
  }
  const vertex = shader(gl.VERTEX_SHADER, `#version 300 es
out vec2 uv;void main(){vec2 p[3]=vec2[3](vec2(-1.,-1.),vec2(3.,-1.),vec2(-1.,3.));vec2 v=p[gl_VertexID];gl_Position=vec4(v,0.,1.);uv=vec2((v.x+1.)*.5,(1.-v.y)*.5);}`);
  const fragment = shader(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;in vec2 uv;uniform sampler2D frameTexture;out vec4 color;void main(){color=texture(frameTexture,uv).bgra;}`);
  const program = gl.createProgram(); gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error('FRAME_PROGRAM_FAILED');
  gl.deleteShader(vertex); gl.deleteShader(fragment); gl.useProgram(program);
  const texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, 'frameTexture'), 0); gl.viewport(0, 0, 1920, 1080);
  let busy = false, disposed = false;
  const unsubscribe = window.outputFrames.onFrame(packet => {
    if (disposed || busy) throw Error('FRAME_RENDER_BACKLOG');
    busy = true;
    const started = performance.now();
    const {descriptor, pixels} = packet;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1920, 1080, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    gl.drawArrays(gl.TRIANGLES, 0, 3); gl.flush();
    if (marker) FrameStamp.draw(marker, descriptor.sequence);
    if (marker && (descriptor.sequence < 10 || descriptor.sequence % 30 === 0)) console.log('RENDER_SYNC '+descriptor.sequence+' '+(performance.now()-started));
    requestAnimationFrame(() => {
      if (disposed) return;
      // Actual GPU readback, not just acknowledging receipt of metadata.
      const observed = new Uint8Array(4); gl.readPixels(600, 879, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, observed);
      const offset = (200 * 1920 + 600) * 4;
      const expected = [pixels[offset + 2], pixels[offset + 1], pixels[offset], 255];
      if (gl.getError() !== gl.NO_ERROR || observed.some((value, index) => Math.abs(value - expected[index]) > 1)) throw Error('FRAME_GPU_PIXELS_MISMATCH');
      busy = false;
      window.outputFrames.ackFrame({generation: descriptor.generation, sequence: descriptor.sequence});
    });
  });
  addEventListener('pagehide', () => {disposed = true; unsubscribe(); gl.deleteTexture(texture); gl.deleteProgram(program);}, {once: true});
})();
