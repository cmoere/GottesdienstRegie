const test = require('node:test'), assert = require('node:assert/strict'), vm = require('node:vm'), fs = require('node:fs'), path = require('node:path');
async function receiverFixture() {
  let init, receiver; const sent=[], raf=[], listeners=new Map();
  const gl = {COMPILE_STATUS:1, LINK_STATUS:2, NO_ERROR:0, ALREADY_SIGNALED:3, CONDITION_SATISFIED:4,
    createShader:()=>({}), getShaderParameter:()=>true, createProgram:()=>({}), getProgramParameter:()=>true,
    createBuffer:()=>({}), getAttribLocation:()=>0, createTexture:()=>({}),getUniformLocation:()=>({}),
    fenceSync:()=>({}),getError:()=>0,clientWaitSync:()=>3};
  for(const name of ['shaderSource','compileShader','deleteShader','attachShader','linkProgram','useProgram','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','bindTexture','texParameteri','uniform1i','viewport','texImage2D','uniform1ui','drawArrays','flush','deleteSync'])gl[name]=()=>{};
  const config={sessionId:'a'.repeat(32),generation:'b'.repeat(32),vertexShader:'vertex',fragmentShader:'fragment',stall:false};
  const electron={ipcRenderer:{invoke:async()=>config,on(name,cb){listeners.set(name,cb);},send(channel,value){sent.push({channel,value});}},sharedTexture:{setSharedTextureReceiver(callback){receiver=callback;}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'output-preload.cjs'),'utf8'),{require:name=>{assert.equal(name,'electron');return electron;},addEventListener:(_name,cb)=>{init=cb;},document:{querySelector:()=>({getContext:()=>gl})},performance,setTimeout,Float32Array,requestAnimationFrame:cb=>raf.push(cb)});
  await init(); assert.equal(typeof receiver,'function');
  return {receiver,sent,raf,listeners,key:{sessionId:config.sessionId,generation:config.generation,slotId:0,sequence:1}};
}
test('a frame-close failure still releases the imported GPU reference once',async()=>{
  const f=await receiverFixture();let released=0;
  await f.receiver({importedSharedTexture:{getVideoFrame:()=>({codedWidth:1920,codedHeight:1080,close(){throw Error('external close failure');}}),release(){released++;}}},f.key);
  assert.equal(released,1);assert.ok(f.sent.some(v=>v.channel==='gpu-probe:fault'));
});
test('invalid key and getVideoFrame failure close the received import without ACK',async()=>{
  for(const invalid of [true,false]) {const f=await receiverFixture();let released=0;
    await f.receiver({importedSharedTexture:{getVideoFrame(){throw Error('external frame failure');},release(){released++;}}},invalid?{...f.key,sequence:0}:f.key);
    assert.equal(released,1);assert.equal(f.sent.filter(v=>v.channel==='gpu-probe:ack').length,0);
  }
});

test('observation hints are RAF-scheduled, one outstanding, and never block render credit',async()=>{
  const f=await receiverFixture(); const draw=async sequence=>f.receiver({importedSharedTexture:{getVideoFrame:()=>({codedWidth:1920,codedHeight:1080,close(){}}),release(){}}},{...f.key,sequence});
  await draw(1);assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:ack').length,1);
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').length,0);
  assert.equal(f.raf.length,1);f.raf.shift()();assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').length,1);
  for(let i=2;i<=100;++i)await draw(i);
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:ack').length,100);
  assert.equal(f.raf.length,1);assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').length,1);
  f.listeners.get('gpu-probe:observed')(null,{key:f.key});assert.equal(f.raf.length,1);f.raf.shift()();
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').length,2);
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').at(-1).value.key.sequence,100);
});

test('visual hint preparation overlaps capture without a second outstanding IPC',async()=>{
  const f=await receiverFixture();const draw=async sequence=>f.receiver({importedSharedTexture:{getVideoFrame:()=>({codedWidth:1920,codedHeight:1080,close(){}}),release(){}}},{...f.key,sequence});
  await draw(1);f.raf.shift()();await draw(2);
  assert.equal(f.raf.length,1,'RAF preparation serialized behind capture');f.raf.shift()();
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').length,1);
  f.listeners.get('gpu-probe:observed')(null,{key:f.key});
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').length,2);
  assert.equal(f.sent.filter(x=>x.channel==='gpu-probe:observe').at(-1).value.key.sequence,2);
  assert.equal(f.raf.length,0);
});
