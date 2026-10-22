const path = require('node:path');
const {runGpuProbe} = require('../../scripts/powerpoint-gpu-probe/run.cjs');
(async()=>{
  if(!process.argv.includes('--monitor=1'))throw Error('Monitor1 authorization required');
  const arg=process.argv.find(v=>v.startsWith('--electron=')); if(!arg)throw Error('Separate pinned runtime required');
  const report=await runGpuProbe({root:path.resolve(__dirname,'../..'),electronPath:arg.slice(11),monitor:1});
  console.log(JSON.stringify({artifacts:report.artifacts,transport:report.transport,clocks:report.clocks,officeReason:report.officeReason,technicalPass:report.technicalPass,productionReady:report.productionReady},null,2));
  if(!report.technicalPass)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1;});
