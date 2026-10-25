// Isolated measurement entrypoint. Never loads the application's Main.
const {app} = require('electron');
const fs = require('node:fs/promises'), path = require('node:path'), {randomBytes} = require('node:crypto');
const {startOwnedWindow} = require('../powerpoint-native-probe/capture-client.cjs');
const {startGpuProducer} = require('./producer-client.cjs');
const {createGpuOutputs} = require('./output-harness.cjs');
const {assessClockSamples} = require('./clock-domain.cjs');
const {validateGpuRuntime, assessGpuResult} = require('./run.cjs');
const {evaluateRun} = require('../powerpoint-native-probe/metrics.cjs');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let officeSerial=0;const officePending=new Map();
process.on('message',value=>{if(value?.type!=='office-reply')return;const pending=officePending.get(value.id);if(!pending)return;officePending.delete(value.id);clearTimeout(pending.timer);value.error?pending.reject(Error('OFFICE_COMMAND_FAILED')):pending.resolve(value.response)});
function office(command,index){if(!process.connected)return Promise.reject(Error('OFFICE_CONTROL_NOT_CONNECTED'));return new Promise((resolve,reject)=>{const id=++officeSerial,timer=setTimeout(()=>{officePending.delete(id);reject(Error('OFFICE_COMMAND_TIMEOUT'))},10000);officePending.set(id,{resolve,reject,timer});process.send({type:'office-command',id,command,...(command==='goto'?{index}:{})});})}
async function measure(config) {
  const frames = [], frameTimes = [], errors = [], startSamples = [], endSamples = [], sends = [], acknowledgements = [];
  let source, producer, outputs,currentCommand;const commands=[],kind=config.kind??'transport';if(!['transport','powerpoint'].includes(kind))throw Error('GPU_BENCHMARK_KIND');
  const report = {captureHz:config.captureHz??30,electron:process.versions.electron, transport:null, office:null, technicalPass:false, productionReady:false, audio:'unsupported'};
  function fault(code) {if (!errors.includes(code)) errors.push(code);}
  async function clocks(destination) {for (let i=0;i<3;++i) {const beforeMs=performance.now(); const native=await producer.clock(); const afterMs=performance.now(); destination.push({beforeMs,afterMs,...native});}}
  try {
    if(kind==='transport')source=await startOwnedWindow({executable:config.source,cwd:config.sourceFolder,monitor:1,aspect:'wide'});
    const sessionId=randomBytes(16).toString('hex'),generation=randomBytes(16).toString('hex');
    producer=await startGpuProducer({executable:config.producer,cwd:config.folder,owner:kind==='powerpoint'?config.owner:source.owner,sessionId,generation});
    const observedProducer={...producer,async claimLatest() {const claim=await producer.claimLatest(); if (claim) {
      if(frameTimes.length>=8192)throw Error('GPU_BENCHMARK_RECORD_BOUND'); frameTimes.push({sequence:claim.record.key.sequence,...claim.record.times});
    } return claim;}};
    await clocks(startSamples);
    const recordDelivery = target => value => {if(target.length>=16384)fault('GPU_BENCHMARK_DELIVERY_BOUND');else target.push(value);};
    outputs=createGpuOutputs({producer:observedProducer,sessionId,generation,onFault:fault,onSend:recordDelivery(sends),onAck:recordDelivery(acknowledgements),onObservation:frame=>{if(frames.length>=16384)fault('GPU_BENCHMARK_FRAME_BOUND');else {frames.push(frame);if(currentCommand&&frame.background===currentCommand.target&&frame.presentedMs>=currentCommand.startedMs&&currentCommand.observed[frame.role]===undefined)currentCommand.observed[frame.role]=frame.presentedMs;}}});
    const main=await outputs.add('main'),mirror=await outputs.add('mirror');
    report.separateRenderers=main.win.webContents.getOSProcessId()!==mirror.win.webContents.getOSProcessId();
    if(!report.separateRenderers)throw Error('GPU_OUTPUT_PROCESS_ISOLATION');
    if(kind==='powerpoint')await office('play');
    const warmupStart=performance.now();
    while(!['main','mirror'].every(role=>frames.filter(f=>f.role===role).length>=4)) {
      if(errors.length||performance.now()-warmupStart>=10000)throw Error('GPU_WARMUP_FAILED'); await wait(10);
    }
    report.warmupMs=performance.now()-warmupStart;
    if(kind==='powerpoint'){
      const {classifyOfficeBackground}=require('./office-proof.cjs'),{decode}=require('./frame-stamp.js');
      const controlProof={captures:0,captureMs:0};
      async function visible(background,boxes){const last=[];const until=performance.now()+2000;while(performance.now()<until){let valid=true;for(const output of [main,mirror]){const before=performance.now(),image=await output.win.webContents.capturePage(),size=image.getSize(),pixels=image.toBitmap();controlProof.captures++;controlProof.captureMs+=performance.now()-before;if(size.width!==1920||size.height!==1080)throw Error('OFFICE_OUTPUT_GEOMETRY');const strip=pixels.subarray(953*1920*4,962*1920*4);last[output.role==='main'?0:1]={role:output.role,stamp:decode(strip,1920),background:classifyOfficeBackground(strip,1920,9),boxes:[],image};if(!decode(strip,1920)||classifyOfficeBackground(strip,1920,9)!==background)valid=false;if(boxes){for(let i=0;i<2;i++){const at=(700*1920+(i?1000:400))*4,white=[pixels[at],pixels[at+1],pixels[at+2]].every(n=>n>220);last[output.role==='main'?0:1].boxes.push(white);if(white!==boxes[i])valid=false}}}if(valid)return;await wait(15)}for(const value of last)if(value)await fs.writeFile(require('node:path').join(config.folder,'control-failed-'+value.role+'.png'),value.image.toPNG());throw Error('OFFICE_COMPOSED_CONTROL_MISSING '+JSON.stringify({expected:{background,boxes},observed:last.map(({image,...value})=>value)}))}
      await office('goto',1);await visible(1,[false,false]);await office('next');await visible(1,[true,false]);await wait(300);await office('next');await visible(1,[true,true]);await wait(300);controlProof.clickBuilds=true;controlProof.fixtureFadeSettleMs=300;
      await office('next');await office('pause');await visible(2);await wait(2300);await visible(2);controlProof.pause=true;
      await office('play');await wait(2300);await visible(3);controlProof.automaticAdvance=true;report.controlProof=controlProof;
    }
    const startMs=performance.now(); console.log('GPU_BENCHMARK_MEASURING_60S '+kind);
    if(kind==='transport')await wait(60000);else{let next=0;while(performance.now()-startMs<60000){if(errors.length)throw Error('GPU_OFFICE_RUNTIME_FAILED');if(next<60&&performance.now()-startMs>=next*1000){currentCommand={id:String(next),startedMs:performance.now(),target:next%2===0?3:1,observed:{}};commands.push(currentCommand);await office('goto',currentCommand.target);const deadline=performance.now()+2000;while(!['main','mirror'].every(role=>Number.isFinite(currentCommand.observed[role]))){if(performance.now()>=deadline)throw Error('GPU_OFFICE_COMMAND_NOT_VISIBLE');await wait(5)}currentCommand=null;next++}await wait(5)}}const endMs=performance.now();
    await clocks(endSamples);
    const raw={kind,startMs,endMs,frames,commands,errors,originalUnchanged:false,foreignDocumentUnchanged:false};
    if(kind==='transport')report.transport=evaluateRun(raw);else report.office=evaluateRun(raw);
    report.clocks=assessClockSamples({startSamples,endSamples,frameTimes});
    report.observers={main:main.observer.status(),mirror:mirror.observer.status()};
    report.raw={...raw,startSamples,endSamples,frameTimes,sends,acknowledgements};
    // The Office phase is gated, never substituted with this synthetic source.
    report.officeReason=kind==='powerpoint'?'OWNED_OFFICE_PHASE_EXECUTED':report.transport.transportPass?'OFFICE_PHASE_NOT_YET_EXECUTED':'TRANSPORT_FAILED_OFFICE_NOT_STARTED';
    console.log('GPU_BENCHMARK_RESULT '+JSON.stringify(report.transport??report.office));
  } finally {
    if(outputs)await outputs.close();
    if(producer) {report.stop=await producer.stop(); if(!report.stop.drained)throw Error('GPU_BENCHMARK_NOT_DRAINED');}
    if(source)await source.close();
    if(kind==='powerpoint'&&!report.office&&config.diagnosticHoldMs===30000)await wait(30000);
  }
  return {...report,...assessGpuResult(report)};
}
app.commandLine.appendSwitch('force-device-scale-factor','1'); app.on('window-all-closed',()=>{});
const arg=process.argv.find(v=>v.startsWith('--config=')); let config;
const timer=setTimeout(()=>app.exit(2),120000);
(async()=>{
  if(!arg||!path.isAbsolute(arg.slice(9)))throw Error('GPU_BENCHMARK_CONFIG');
  config=JSON.parse(await fs.readFile(arg.slice(9),'utf8'));
  const marker=await fs.stat(path.join(config.folder,'.probe-owned'));
  validateGpuRuntime({version:process.versions.electron,digest:config.digest,marked:marker.isFile(),monitor:config.monitor});
  app.setPath('userData',path.join(config.folder,'benchmark-profile')); await app.whenReady();
  const report=await measure(config); await fs.writeFile(path.join(config.folder,'benchmark-report.json'),JSON.stringify(report,null,2));
  clearTimeout(timer);app.exit(0);
})().catch(async error=>{console.error(error);if(config)await fs.writeFile(path.join(config.folder,'benchmark-failure.txt'),error.stack);clearTimeout(timer);app.exit(1);});
