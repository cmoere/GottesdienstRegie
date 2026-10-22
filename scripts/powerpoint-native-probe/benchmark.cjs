const {app, BrowserWindow} = require('electron');
const {createComposedFrameSink} = require('./composed-frame-sink.cjs');
const fs = require('node:fs/promises'), path = require('node:path'), {createHash, randomBytes} = require('node:crypto');
const {startOwnedWindow, startNativeCapture} = require('./capture-client.cjs');
const {createNativeReader} = require('./reader-client.cjs');
const {createFrameBroker} = require('./frame-broker.cjs');
const {evaluateRun} = require('./metrics.cjs'), stamp = require('./frame-stamp.js');
const root = path.resolve(__dirname, '../..'), folder = path.resolve(process.argv[2]);
if (!folder.startsWith(path.join(root, 'work') + path.sep)) throw Error('NATIVE_PROBE_FOLDER_INVALID');
app.setPath('userData', path.join(folder, 'native-output-profile'));
app.commandLine.appendSwitch('force-device-scale-factor', '1');
app.on('window-all-closed',()=>{}); // Persist awaited reports before explicitly exiting.
const windows = new Map(), summaries = new Map(), commandsPending = new Map();
const observations = {kind: '', frames: [], commands: [], errors: [], startMs: null, endMs: null};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let ownSource, capture, reader, broker, pumpTimer, serial = 0, currentCommand, config, clockCalibration;
const invalidPaints = [], calibrationSamples = [], deliveryTimes = [], acknowledgements = [], readTimes = [];
function qpcMs(value, frequency) {const n = BigInt(value), f = BigInt(frequency); return Number(n/f)*1000 + Number(n%f)*1000/Number(f);}
async function calibrateClock() {
  const samples = [];
  for (let i = 0; i < 3; ++i) {
    const before = performance.now(), clock = await capture.clock(), after = performance.now();
    samples.push({roundTripMs: after-before, offsetMs: (before+after)/2 - qpcMs(clock.qpcNow, clock.qpcFrequency), ...clock});
  }
  samples.sort((a,b) => a.roundTripMs-b.roundTripMs); calibrationSamples.push(...samples); return samples[0];
}
function healthy() {
  if (capture && ['error','source-lost','closed'].includes(capture.getStatus())) throw Error('SOURCE_LOST_DURING_MEASUREMENT');
  if (broker && (broker.status().state !== 'ready' || broker.status().clients !== 2)) throw Error('OUTPUT_LOST_DURING_MEASUREMENT');
}
async function until(predicate, label, timeout = 10000) {
  const deadline = performance.now()+timeout;
  while (performance.now()<deadline) {healthy(); if (predicate()) return; await wait(5);}
  throw Error('NATIVE_PHASE_TIMEOUT '+label);
}
process.on('message', value => {
  if (value?.type !== 'office-reply') return;
  const pending = commandsPending.get(value.id); if (!pending) return;
  commandsPending.delete(value.id); clearTimeout(pending.timer);
  if (value.error) pending.reject(Error('OFFICE_COMMAND_FAILED')); else pending.resolve(value.response);
});
function office(command, index) {
  if (!process.connected) return Promise.reject(Error('OFFICE_CONTROL_NOT_CONNECTED'));
  return new Promise((resolve,reject) => {const id=++serial, timer=setTimeout(()=>{commandsPending.delete(id);reject(Error('OFFICE_COMMAND_TIMEOUT'));},10000); commandsPending.set(id,{resolve,reject,timer}); process.send({type:'office-command',id,command,index});});
}
async function createOutput(role) {
  const win = new BrowserWindow({show:false,width:1920,height:1080,useContentSize:true,webPreferences:{preload:path.join(__dirname,'output-preload.cjs'),offscreen:{useSharedTexture:true},backgroundThrottling:false,sandbox:true,contextIsolation:true,nodeIntegration:false}});
  win.webContents.setFrameRate(60);win.webContents.on('paint',event=>event.texture?.release());
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate', event=>event.preventDefault());
  win.webContents.on('console-message', event=>console.log('NATIVE_OUTPUT_CONSOLE '+event.message));
  const entry={win,role,active:true,lastSequence:0}; windows.set(win.webContents.id,entry);
  function recordComposed(sequence,presentedMs){
    if (!entry.active) return;
    if (!sequence || sequence<=entry.lastSequence) return;
    const summary=summaries.get(sequence); if (!summary) return;
    entry.lastSequence=sequence;
    const observed={role,sequence,presentedMs,sourceFingerprint:summary.sourceFingerprint,background:summary.background,sourceCapturedMs:summary.sourceCapturedMs,capturedQpc:summary.capturedQpc};
    observations.frames.push(observed);
    if (currentCommand && currentCommand.target===summary.background && presentedMs>=currentCommand.startedMs && currentCommand.observed[role]===undefined) currentCommand.observed[role]=presentedMs;
  }
  await win.loadFile(path.join(__dirname,'output.html'),{query:{diagnostic:'1'}});
  entry.connection=createComposedFrameSink({win,diagnostic:true,onAck(value,proof){recordComposed(value.sequence,proof.presentedMs);if(entry.active && broker.ack(String(win.webContents.id),value.generation,value.sequence))acknowledgements.push({role,sequence:value.sequence,at:performance.now()});},onDisconnect(){entry.active=false;entry.unregister?.();}});
  await entry.connection.ready;
  entry.unregister=broker.register({id:String(win.webContents.id),send:packet=>{const before=performance.now();entry.connection.send(packet);deliveryTimes.push({role,sequence:packet.descriptor.sequence,before,after:performance.now()});},close:()=>{entry.active=false;entry.connection.close();}});
}
app.whenReady().then(async()=>{
  try {
    await fs.access(path.join(folder,'.probe-owned'));
    config=JSON.parse(await fs.readFile(path.join(folder,'native-phase-config.json'),'utf8'));
    if(!['transport','powerpoint'].includes(config.kind)||config.monitor!==1)throw Error('NATIVE_PHASE_CONFIG');
    observations.kind=config.kind;
    let owner=config.owner;
    if(config.kind==='transport') {ownSource=await startOwnedWindow({executable:config.sourceExe,cwd:folder,monitor:1,aspect:'wide'});owner=ownSource.owner;}
    const identity={mapping:'Local\\GottesdienstRegie.Probe.'+randomBytes(16).toString('hex'),sessionId:randomBytes(16).toString('hex'),generation:randomBytes(16).toString('hex')};
    capture=await startNativeCapture({executable:config.captureExe,cwd:folder,owner,...identity});
    clockCalibration=await calibrateClock();
    const warming=performance.now();
    reader=await createNativeReader({executable:config.readerExe,cwd:folder,...identity});
    const observedReader={close:()=>reader.close(),async readLatest(after){
      const readStarted=performance.now(),packet=await reader.readLatest(after); if(!packet)return null;
      readTimes.push({sequence:packet.descriptor.sequence,started:readStarted,finished:performance.now()});
      const d=packet.descriptor;
      if(d.qpcFrequency!==clockCalibration.qpcFrequency)throw Error('NATIVE_CLOCK_FREQUENCY_CHANGED');
      const row=Buffer.from(packet.pixels.subarray(961*7680,962*7680));
      const bg=(100*1920+960)*4, color=[packet.pixels[bg+2],packet.pixels[bg+1],packet.pixels[bg]], max=Math.max(...color);
      const background=max<30?0:color[0]===max?1:color[1]===max?2:3;
      const sourceCapturedMs=qpcMs(d.capturedQpc,d.qpcFrequency)+clockCalibration.offsetMs;
      if(sourceCapturedMs>performance.now()+clockCalibration.roundTripMs/2+1)throw Error('NATIVE_SOURCE_CLOCK_FUTURE');
      summaries.set(d.sequence,{row,background,sourceCapturedMs,capturedQpc:d.capturedQpc,sourceFingerprint:createHash('sha256').update(row).digest('hex')});
      while(summaries.size>16)summaries.delete(summaries.keys().next().value);
      return packet;
    }};
    broker=createFrameBroker({...identity,reader:observedReader});
    await createOutput('main');await createOutput('mirror');
    if(config.kind==='powerpoint')await office('play');
    pumpTimer=setInterval(()=>{void broker.pump();},1000/30);
    await until(()=>['main','mirror'].every(role=>observations.frames.some(frame=>frame.role===role)),'initial composed source');
    await wait(1000);healthy();
    observations.warmupMs=performance.now()-warming;
    if(observations.warmupMs>10000)throw Error('WARMUP_EXCEEDED');
    observations.startMs=performance.now();
    let nextCommand=0;
    while(performance.now()-observations.startMs<60000){
      healthy();
      if(config.kind==='powerpoint' && performance.now()-observations.startMs>=nextCommand*1000 && nextCommand<60){
        currentCommand={id:String(nextCommand),startedMs:performance.now(),target:nextCommand%2===0?3:1,observed:{}};
        observations.commands.push(currentCommand);await office('goto',currentCommand.target);
        await until(()=>Number.isFinite(currentCommand.observed.main)&&Number.isFinite(currentCommand.observed.mirror),'command visible in both outputs',2000);
        currentCommand=null;++nextCommand;
      }
      await wait(5);
    }
    observations.endMs=performance.now();clearInterval(pumpTimer);
    const endingClock=await calibrateClock();
    observations.clockDriftMs=endingClock.offsetMs-clockCalibration.offsetMs;
    if(Math.abs(observations.clockDriftMs)>Math.max(1,endingClock.roundTripMs+clockCalibration.roundTripMs))observations.errors.push('CLOCK_DOMAIN_DRIFT');
  } catch(error){observations.errors.push(error.message);observations.endMs=performance.now();}
  finally {
    clearInterval(pumpTimer);
    for(const pending of commandsPending.values()){clearTimeout(pending.timer);pending.reject(Error('PROBE_STOPPED'));}commandsPending.clear();
    try{if(broker)await broker.revoke();else if(reader)await reader.close();}catch{observations.errors.push('READER_CLEANUP_FAILED');}
    try{if(capture)await capture.close();}catch{observations.errors.push('CAPTURE_CLEANUP_FAILED');}
    try{if(ownSource)await ownSource.close();}catch{observations.errors.push('SOURCE_CLEANUP_FAILED');}
    for(const {win,role} of windows.values())if(!win.isDestroyed()){try{await fs.writeFile(path.join(folder,'native-'+role+'.png'),(await win.webContents.capturePage()).toPNG());}catch{}win.destroy();}
  }
  const result=evaluateRun(observations);
  await fs.writeFile(path.join(folder,'native-phase-observations.json'),JSON.stringify({...observations,calibrationSamples,invalidPaints,deliveryTimes,acknowledgements,readTimes},null,2));
  await fs.writeFile(path.join(folder,'native-phase-result.json'),JSON.stringify(result,null,2));
  console.log('NATIVE_PHASE_METRICS '+JSON.stringify(result));app.exit(0);
}).catch(error=>{console.error(error);for(const {win}of windows.values())if(!win.isDestroyed())win.destroy();app.exit(1);});
