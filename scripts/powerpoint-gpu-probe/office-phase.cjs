const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process');
const {evaluateRun}=require('../powerpoint-native-probe/metrics.cjs');
function validateOfficeCommand(v){
 const allowed=v?.command==='goto'?['type','id','command','index']:['type','id','command'];
 if(!v||v.type!=='office-command'||!Number.isSafeInteger(v.id)||v.id<=0||!['play','pause','status','next','goto'].includes(v.command)||Object.keys(v).some(k=>!allowed.includes(k))||(v.command==='goto'&&![1,2,3].includes(v.index)))throw Error('OFFICE_GPU_COMMAND_REJECTED');return true;
}
async function runOfficeGpuPhase({root,electronPath,producer,digest,navigation='gotoClick',captureHz=30}){
 let folder;
 const office=await require('../probe-powerpoint.cjs').runProbe({root,monitor:1,navigation,captureAdapter:async({folder:ownFolder,state,command})=>{
  folder=ownFolder;const config={folder,producer,monitor:1,digest,kind:'powerpoint',captureHz,owner:{hwnd:state.rootWindowHandle,pid:state.processId,createdAt:state.createdAt,crop:state.crop}};
  const configPath=path.join(folder,'benchmark-config.json');await fs.writeFile(configPath,JSON.stringify(config));
  const env={...process.env};delete env.ELECTRON_RUN_AS_NODE;
  const child=spawn(electronPath,[path.join(__dirname,'benchmark.cjs'),'--config='+configPath],{cwd:root,env,windowsHide:true,stdio:['ignore','pipe','pipe','ipc']});let log='',lastCommand=0;const commandLog=[];
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{log=(log+chunk).slice(-262144)});
  let busy=false;
  child.on('message',async value=>{let ownedBusy=false;try{validateOfficeCommand(value);if(value.id<=lastCommand||busy)throw Error('OFFICE_GPU_COMMAND_SEQUENCE');lastCommand=value.id;busy=true;ownedBusy=true;const response=await command(value.command,value.command==='goto'?{index:value.index}:{});commandLog.push({command:value.command,index:value.index,status:response.status});if(child.connected)child.send({type:'office-reply',id:value.id,response});}catch{if(child.connected)child.send({type:'office-reply',id:value?.id,error:'OFFICE_PROBE_FAILED'});}finally{if(ownedBusy)busy=false}});
  const timer=setTimeout(()=>child.kill(),120000);let code;try{code=await new Promise((resolve,reject)=>{child.once('close',resolve);child.once('error',reject)})}finally{clearTimeout(timer)}await fs.writeFile(path.join(folder,'benchmark-process.log'),log);await fs.writeFile(path.join(folder,'office-command-log.json'),JSON.stringify(commandLog,null,2));
  if(code!==0)throw Error('GPU_OFFICE_PHASE_FAILED '+folder);
  const result=JSON.parse(await fs.readFile(path.join(folder,'benchmark-report.json'),'utf8'));
  return{captureReady:result.office?.captureReady===true,metrics:result.office?.metrics,controls:result.controlProof};
 }});
 if(!folder)return{visual:false,reason:office.results.reason};
 const file=path.join(folder,'benchmark-report.json');if(!await fs.stat(file).catch(()=>null))return{visual:false,reason:office.results.reason,folder};
 const report=JSON.parse(await fs.readFile(file,'utf8'));report.raw.originalUnchanged=office.results.originalUnchanged===true;report.raw.foreignDocumentUnchanged=office.results.foreignDocumentUnchanged===true;
 const measured=evaluateRun(report.raw),result={...measured,visual:measured.visual&&office.visual,controls:report.controlProof,folder,originalUnchanged:report.raw.originalUnchanged,foreignDocumentUnchanged:report.raw.foreignDocumentUnchanged};
 await fs.writeFile(path.join(folder,'office-gpu-report.json'),JSON.stringify(result,null,2));return result;
}
module.exports={validateOfficeCommand,runOfficeGpuPhase};
