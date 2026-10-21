const assert=require('node:assert/strict');
const path=require('node:path');
(async()=>{
  let probe;
  try{probe=require('../../scripts/probe-powerpoint.cjs');}
  catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}
  assert.equal(typeof probe?.runProbe,'function','Original PowerPoint playback/capture probe is not implemented');
  const result=await probe.runProbe({root:path.resolve(__dirname,'../..'),monitor:process.argv.includes('--monitor=1')?1:undefined});
  assert.equal(result.visual,true,`Original show is not capture-ready: ${JSON.stringify(result.results)}`);
  const metrics=result.results.metrics;
  assert.ok(metrics&&metrics.durationMs>=60000,'requires an actual sixty-second capture observation');
  assert.ok(metrics.mirrorSkewP95Ms<=150,'MAIN/mirror p95 exceeds150ms');
  assert.ok(metrics.commandToFrameP95Ms<=250,'command/frame p95 exceeds250ms');
  assert.equal(result.results.foreignDocumentUnchanged,true,'unrelated test presentation was changed');
  console.log('POWERPOINT_PROBE_PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
