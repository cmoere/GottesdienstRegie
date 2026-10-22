const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
const {buildProbe}=require('./build.cjs');
const {evaluateRun}=require('./metrics.cjs');
async function runPhase({folder,config,command}){
  await fs.writeFile(path.join(folder,'native-phase-config.json'),JSON.stringify(config));
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(require('electron'),[path.join(__dirname,'benchmark.cjs'),folder],{env,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});
  let log='';child.stdout.on('data',chunk=>{log+=chunk;process.stdout.write(chunk)});child.stderr.on('data',chunk=>log+=chunk);
  child.on('message',async value=>{
    if(value?.type!=='office-command')return;
    try{
      if(!command||!['play','pause','status','next','goto'].includes(value.command)||(value.command==='goto'&&![1,2,3].includes(value.index)))throw Error('OFFICE_PROBE_COMMAND_REJECTED');
      const response=await command(value.command,value.command==='goto'?{index:value.index}:{});
      if(child.connected)child.send({type:'office-reply',id:value.id,response});
    }catch{if(child.connected)child.send({type:'office-reply',id:value.id,error:'OFFICE_PROBE_FAILED'});}
  });
  const timeout=setTimeout(()=>child.kill(),95000);
  const code=await new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',resolve)});
  clearTimeout(timeout);await fs.writeFile(path.join(folder,'native-phase.log'),log);
  if(code!==0)throw Error('NATIVE_PHASE_FAILED '+log.slice(-2000));
  return JSON.parse(await fs.readFile(path.join(folder,'native-phase-result.json'),'utf8'));
}
async function runNativeProbe({root,monitor}){
  if(process.platform!=='win32'||process.arch!=='x64'||monitor!==1)throw Error('NATIVE_PROBE_WINDOWS_MONITOR1_REQUIRED');
  root=path.resolve(root);
  const folder=await fs.mkdtemp(path.join(root,'work/powerpoint-native-run-'));
  await fs.writeFile(path.join(folder,'.probe-owned'),'Own native frame performance probe\n');
  const capture=await buildProbe({root,target:'native-capture'}),reader=await buildProbe({root,target:'native-reader'}),source=await buildProbe({root,target:'owned-window'});
  const config={monitor:1,captureExe:capture.executable,readerExe:reader.executable,sourceExe:source.executable};
  const transport=await runPhase({folder,config:{...config,kind:'transport'}});
  const report={visual:false,audio:'unsupported',results:{folder,transport}};
  if(transport.transportPass){
    let officeFolder;
    const office=await require('../probe-powerpoint.cjs').runProbe({root,monitor:1,captureAdapter:async({folder,state,command})=>{
      officeFolder=folder;
      const result=await runPhase({folder,config:{...config,kind:'powerpoint',owner:{hwnd:state.rootWindowHandle,pid:state.processId,createdAt:state.createdAt,crop:state.crop}},command});
      return {captureReady:result.captureReady===true,metrics:result.metrics};
    }});
    if(officeFolder){
      const measured=JSON.parse(await fs.readFile(path.join(officeFolder,'native-phase-observations.json'),'utf8'));
      measured.originalUnchanged=office.results.originalUnchanged===true;measured.foreignDocumentUnchanged=office.results.foreignDocumentUnchanged===true;
      report.results.powerpoint=evaluateRun(measured);report.results.officeFolder=officeFolder;
      report.visual=office.visual&&report.results.powerpoint.visual;
    }else report.results.powerpoint={visual:false,reason:office.results.reason};
  }
  await fs.writeFile(path.join(folder,'native-probe-report.json'),JSON.stringify(report,null,2));
  console.log('NATIVE_PROBE_REPORT '+path.join(folder,'native-probe-report.json'));return report;
}
module.exports={runNativeProbe};
