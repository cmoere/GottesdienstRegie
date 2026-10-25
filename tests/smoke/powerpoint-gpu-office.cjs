// Isolated Office diagnostic. Never opens an operator's presentation.
const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
const {evaluateRun}=require('../../scripts/powerpoint-native-probe/metrics.cjs');
const {validateGpuRuntime}=require('../../scripts/powerpoint-gpu-probe/run.cjs');
const {runOfficeGpuPhase}=require('../../scripts/powerpoint-gpu-probe/office-phase.cjs');
(async()=>{
 const root=path.resolve(__dirname,'../..'),args=process.argv.slice(2);if(!args.includes('--monitor=1'))throw Error('MONITOR1_REQUIRED');
 const input=args.find(a=>a.startsWith('--transport=')),runtime=args.find(a=>a.startsWith('--electron='));if(!input||!runtime)throw Error('GPU_OFFICE_ARGUMENTS');
 const reportPath=await fs.realpath(path.resolve(root,input.slice(12))),electronPath=await fs.realpath(path.resolve(root,runtime.slice(11))),folder=path.dirname(reportPath);
 if(!folder.startsWith(path.join(root,'work/powerpoint-gpu-probe-'))||electronPath!==path.join(root,'work/gpu-runtime-v45.0.0/runtime/electron.exe'))throw Error('GPU_OFFICE_PATH');
 const marker=await fs.stat(path.join(folder,'.probe-owned')),transport=JSON.parse(await fs.readFile(reportPath,'utf8'));
 const digest=createHash('sha256').update(await fs.readFile(path.resolve(electronPath,'../../electron-v45.0.0-win32-x64.zip'))).digest('hex');
 validateGpuRuntime({version:transport.electron,digest,marked:marker.isFile(),monitor:1});
 if(!transport.stop?.drained||!evaluateRun(transport.raw).transportPass)throw Error('TRANSPORT_NOT_PROVEN');
 const result=await runOfficeGpuPhase({root,electronPath,producer:path.join(folder,'producer.exe'),digest,captureHz:transport.captureHz??30,navigation:args.includes('--native-next')?'nativeNext':'gotoClick'});
 console.log(JSON.stringify(result,null,2));if(!result.visual)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
