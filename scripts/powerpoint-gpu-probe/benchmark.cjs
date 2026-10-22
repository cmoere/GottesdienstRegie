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
async function measure(config) {
  const frames = [], frameTimes = [], errors = [], startSamples = [], endSamples = [], sends = [], acknowledgements = [];
  let source, producer, outputs;
  const report = {electron:process.versions.electron, transport:null, office:null, technicalPass:false, productionReady:false, audio:'unsupported'};
  function fault(code) {if (!errors.includes(code)) errors.push(code);}
  async function clocks(destination) {for (let i=0;i<3;++i) {const beforeMs=performance.now(); const native=await producer.clock(); const afterMs=performance.now(); destination.push({beforeMs,afterMs,...native});}}
  try {
    source=await startOwnedWindow({executable:config.source,cwd:config.sourceFolder,monitor:1,aspect:'wide'});
    const sessionId=randomBytes(16).toString('hex'),generation=randomBytes(16).toString('hex');
    producer=await startGpuProducer({executable:config.producer,cwd:config.folder,owner:source.owner,sessionId,generation});
    const observedProducer={...producer,async claimLatest() {const claim=await producer.claimLatest(); if (claim) {
      if(frameTimes.length>=8192)throw Error('GPU_BENCHMARK_RECORD_BOUND'); frameTimes.push({sequence:claim.record.key.sequence,...claim.record.times});
    } return claim;}};
    await clocks(startSamples);
    const recordDelivery = target => value => {if(target.length>=16384)fault('GPU_BENCHMARK_DELIVERY_BOUND');else target.push(value);};
    outputs=createGpuOutputs({producer:observedProducer,sessionId,generation,onFault:fault,onSend:recordDelivery(sends),onAck:recordDelivery(acknowledgements),onObservation:frame=>{if(frames.length>=16384)fault('GPU_BENCHMARK_FRAME_BOUND');else frames.push(frame);}});
    const main=await outputs.add('main'),mirror=await outputs.add('mirror');
    report.separateRenderers=main.win.webContents.getOSProcessId()!==mirror.win.webContents.getOSProcessId();
    if(!report.separateRenderers)throw Error('GPU_OUTPUT_PROCESS_ISOLATION');
    const warmupStart=performance.now();
    while(!['main','mirror'].every(role=>frames.filter(f=>f.role===role).length>=4)) {
      if(errors.length||performance.now()-warmupStart>=10000)throw Error('GPU_WARMUP_FAILED'); await wait(10);
    }
    report.warmupMs=performance.now()-warmupStart;
    const startMs=performance.now(); console.log('GPU_BENCHMARK_MEASURING_60S');
    await wait(60000); const endMs=performance.now();
    await clocks(endSamples);
    const raw={kind:'transport',startMs,endMs,frames,commands:[],errors};
    report.transport=evaluateRun(raw);
    report.clocks=assessClockSamples({startSamples,endSamples,frameTimes});
    report.observers={main:main.observer.status(),mirror:mirror.observer.status()};
    report.raw={...raw,startSamples,endSamples,frameTimes,sends,acknowledgements};
    // The Office phase is gated, never substituted with this synthetic source.
    report.officeReason=report.transport.transportPass?'OFFICE_PHASE_NOT_YET_EXECUTED':'TRANSPORT_FAILED_OFFICE_NOT_STARTED';
    console.log('GPU_BENCHMARK_TRANSPORT '+JSON.stringify(report.transport));
  } finally {
    if(outputs)await outputs.close();
    if(producer) {report.stop=await producer.stop(); if(!report.stop.drained)throw Error('GPU_BENCHMARK_NOT_DRAINED');}
    if(source)await source.close();
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
