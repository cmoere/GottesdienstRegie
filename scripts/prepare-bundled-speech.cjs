const fs=require('node:fs/promises');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const JSZip=require('jszip');
function verifyBytes(bytes,asset){
  if(bytes.length!==asset.size||crypto.createHash('sha256').update(bytes).digest('hex')!==asset.sha256)throw Error('Speech resource integrity check failed');
}
function safeEntry(name){
  if(!name||name.includes('\\')||name.startsWith('/')||name.includes(':')||name.split('/').some(part=>part==='..'))throw Error('Unsafe speech archive entry');
  return name;
}
async function extractZip(bytes,root){
  const zip=await JSZip.loadAsync(bytes);
  for(const item of Object.values(zip.files)){
    safeEntry(item.unsafeOriginalName||item.name);
    if((Number(item.unixPermissions)&0xf000)===0xa000)throw Error('Speech ZIP symlink rejected');
    const destination=path.join(root,safeEntry(item.name));
    if(item.dir){await fs.mkdir(destination,{recursive:true});continue}
    await fs.mkdir(path.dirname(destination),{recursive:true});
    await fs.writeFile(destination,await item.async('nodebuffer'));
  }
}
async function download(asset,cache){
  const target=path.join(cache,asset.sha256);
  try{const bytes=await fs.readFile(target);verifyBytes(bytes,asset);return bytes}catch{}
  if(!asset.url.startsWith('https://'))throw Error('Speech assets require HTTPS');
  const response=await fetch(asset.url,{signal:AbortSignal.timeout(240_000)});
  if(!response.ok||!response.body)throw Error('Speech resource download failed: '+response.status);
  const chunks=[];let size=0;
  for await(const chunk of response.body){size+=chunk.length;if(size>asset.size)throw Error('Speech resource exceeded its pinned size');chunks.push(chunk)}
  const bytes=Buffer.concat(chunks);verifyBytes(bytes,asset);
  await fs.mkdir(cache,{recursive:true});await fs.writeFile(target,bytes);return bytes;
}
async function findJava(root){
  for(const entry of await fs.readdir(root,{withFileTypes:true})){
    if(!entry.isDirectory())continue;
    const folder=path.join(root,entry.name);
    for(const suffix of ['bin/java','bin/java.exe'])try{if((await fs.stat(path.join(folder,suffix))).isFile())return folder}catch{}
    const nested=await findJava(folder);if(nested)return nested;
  }
}
async function prepare(platform=process.platform,arch=process.arch){
  const repo=path.resolve(__dirname,'..'),manifest=require('../build/speech/manifest.json');
  const runtime=manifest.runtimes[platform+'-'+arch];if(!runtime)throw Error('Unsupported speech platform');
  const root=path.join(repo,'work/bundled-speech',platform+'-'+arch),cache=path.join(repo,'work/bundled-speech-cache');
  const allowed=path.join(repo,'work/bundled-speech')+path.sep;
  if(!root.startsWith(allowed)||!['win32-x64','darwin-x64','darwin-arm64','linux-x64'].includes(platform+'-'+arch))throw Error('Invalid speech build directory');
  await fs.rm(root,{recursive:true,force:true});
  await fs.mkdir(root,{recursive:true});
  for(const artifact of manifest.jars){const bytes=await download(artifact,cache);await fs.mkdir(path.join(root,'lib'),{recursive:true});await fs.writeFile(path.join(root,'lib',path.basename(artifact.url)),bytes)}
  await extractZip(await download(manifest.voice,cache),root);
  await extractZip(await download(manifest.femaleVoice,cache),root);
  const runtimeArchive=await download(runtime,cache),runtimeExtract=path.join(root,'runtime-extract');await fs.mkdir(runtimeExtract,{recursive:true});
  if(runtime.url.endsWith('.zip'))await extractZip(runtimeArchive,runtimeExtract);
  else{
    const file=path.join(cache,runtime.sha256+'.tar.gz');await fs.writeFile(file,runtimeArchive);
    const names=execFileSync('tar',['-tzf',file],{encoding:'utf8',maxBuffer:8*1024*1024});names.trim().split(/\r?\n/).forEach(safeEntry);
    execFileSync('tar',['-xzf',file,'-C',runtimeExtract],{stdio:'pipe'});
  }
  const java=await findJava(runtimeExtract);if(!java)throw Error('Bundled Java missing');
  await fs.cp(java,path.join(root,'runtime'),{recursive:true,dereference:true});
  // Compile only at build time; installed applications use the private JRE.
  const javac=path.join(process.env.JAVA_HOME||'', 'bin',process.platform==='win32'?'javac.exe':'javac');
  const worker=path.join(repo,'build/speech/worker/AnnouncementSpeech.java');
  await fs.mkdir(path.join(root,'worker'),{recursive:true});
  const compatibility=path.join(repo,'build/speech/compat/OpenNLPPosTagger.java');
  execFileSync(javac,['-encoding','UTF-8','-source','17','-target','17','-cp',path.join(root,'lib','*'),'-d',path.join(root,'worker'),worker,compatibility],{stdio:'pipe'});
  await fs.copyFile(worker,path.join(root,'worker/AnnouncementSpeech.java'));
  await fs.copyFile(compatibility,path.join(root,'worker/OpenNLPPosTagger.java'));
  await fs.cp(path.join(repo,'build/speech/licenses'),path.join(root,'licenses'),{recursive:true});
  await fs.copyFile(path.join(repo,'build/speech/NOTICE.md'),path.join(root,'NOTICE.md'));
  await fs.copyFile(path.join(repo,'build/speech/SECURITY.md'),path.join(root,'SECURITY.md'));
  await fs.copyFile(path.join(repo,'build/speech/manifest.json'),path.join(root,'manifest.json'));
  await fs.writeFile(path.join(root,'ready.json'),JSON.stringify({platform,arch,voice:'marytts:dfki-pavoque-neutral',voices:['marytts:dfki-pavoque-neutral','marytts:bits1-hsmm']}));
  console.log('Bundled German speech prepared: '+platform+'-'+arch);return root;
}
module.exports={verifyBytes,extractZip,safeEntry,prepare};
if(require.main===module)prepare(process.argv[2],process.argv[3]).catch(error=>{console.error(error.message);process.exitCode=1});
