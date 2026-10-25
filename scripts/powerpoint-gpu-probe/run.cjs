const fs = require('node:fs/promises'), path = require('node:path'), {createHash} = require('node:crypto'), {spawn} = require('node:child_process');
const archiveDigest = 'ae53887a23bb640369c93dbd38c408a2af5c0deb86f2fa76c6c244cb444b7f47';
function validateGpuRuntime({version, digest, marked, monitor}) {
  if (version !== '45.0.0' || digest !== archiveDigest || marked !== true || monitor !== 1) throw Error('GPU_RUNTIME_NOT_APPROVED'); return true;
}
function assessGpuResult({transport, office}) {return {technicalPass: transport?.transportPass === true && office?.visual === true, productionReady: false, audio: 'unsupported'};}
async function runGpuProbe({root, electronPath, monitor, captureHz=30}) {
  root = path.resolve(root); electronPath = path.resolve(root, electronPath);
  if (monitor !== 1 || electronPath !== path.join(root, 'work/gpu-runtime-v45.0.0/runtime/electron.exe')) throw Error('GPU_RUNTIME_NOT_APPROVED');
  const digest = createHash('sha256').update(await fs.readFile(path.resolve(electronPath, '../../electron-v45.0.0-win32-x64.zip'))).digest('hex');
  validateGpuRuntime({version:'45.0.0',digest,marked:true,monitor});
  const {buildGpuProbe} = require('./build.cjs'), {buildProbe} = require('../powerpoint-native-probe/build.cjs');
  const built = await buildGpuProbe({root,target:'producer',captureHz}), source = await buildProbe({root,target:'owned-window'});
  const assertOwned = await fs.stat(path.join(built.folder, '.probe-owned')); // Own builder marker, not user data.
  if (!assertOwned.isFile()) throw Error('GPU_RUN_MARKER');
  const config = {folder:built.folder, producer:built.executable, source:source.executable, sourceFolder:source.folder, monitor, digest,captureHz};
  const configPath = path.join(built.folder,'benchmark-config.json'); await fs.writeFile(configPath,JSON.stringify(config));
  const child = spawn(electronPath,[path.join(__dirname,'benchmark.cjs'),'--config='+configPath],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe']});
  let log=''; const append = chunk => {log=(log+chunk).slice(-131072);}; child.stdout.on('data',append); child.stderr.on('data',append);
  const timer=setTimeout(()=>child.kill(),240000); let code;
  try {code=await new Promise((resolve,reject)=>{child.once('close',resolve);child.once('error',reject);});} finally {clearTimeout(timer);}
  await fs.writeFile(path.join(built.folder,'benchmark-process.log'),log);
  const report = JSON.parse(await fs.readFile(path.join(built.folder,'benchmark-report.json'),'utf8'));
  validateGpuRuntime({version:report.electron,digest,marked:true,monitor});
  if (code!==0) throw Error('GPU_BENCHMARK_PROCESS_FAILED '+built.folder);
  return {...report,...assessGpuResult(report),artifacts:built.folder};
}
module.exports={validateGpuRuntime,assessGpuResult,runGpuProbe};
