const test = require('node:test'), assert = require('node:assert/strict');
const {evaluateRun} = require('../powerpoint-native-probe/metrics.cjs');
let validateGpuRuntime, assessGpuResult;
try {({validateGpuRuntime, assessGpuResult} = require('./run.cjs'));} catch (e) {if (e.code !== 'MODULE_NOT_FOUND') throw e;}
const digest = 'ae53887a23bb640369c93dbd38c408a2af5c0deb86f2fa76c6c244cb444b7f47';
test('runtime, archive and own marker are mandatory, not upgrade instructions', () => {
  assert.equal(typeof validateGpuRuntime, 'function', 'GPU runner missing');
  const config = {version:'45.0.0', digest, marked:true, monitor:1}; assert.equal(validateGpuRuntime(config), true);
  for (const bad of [{version:'37.10.3'}, {digest:'unknown'}, {marked:false}, {monitor:2}]) assert.throws(() => validateGpuRuntime({...config,...bad}));
});
test('transport alone and missing Office proof can never imply product readiness', () => {
  assert.equal(typeof assessGpuResult, 'function');
  assert.equal(assessGpuResult({transport:{transportPass:true},office:null}).technicalPass,false);
  assert.deepEqual(assessGpuResult({transport:{transportPass:true},office:{visual:true}}), {technicalPass:true,productionReady:false,audio:'unsupported'});
});
function run() {return {kind:'transport',startMs:0,endMs:60000,commands:[],errors:[],frames:['main','mirror'].flatMap(role=>Array.from({length:1770},(_,i)=>({role,sequence:i+1,presentedMs:i*60000/1770,sourceFingerprint:String(i)})))};}
test('unchanged acceptance limits reject short, slow, frozen or absent composition', () => {
  assert.equal(evaluateRun(run()).transportPass,true);
  for(const kind of ['short','slow','freeze','no-observation']) {
    const r=run(); if(kind==='short')r.endMs=59000;
    if(kind==='slow')r.frames=r.frames.filter(f=>f.sequence!==10);
    if(kind==='freeze')r.frames=r.frames.filter(f=>f.presentedMs<59000);
    if(kind==='no-observation')r.frames=[];
    assert.equal(evaluateRun(r).transportPass,false,kind);
  }
});
