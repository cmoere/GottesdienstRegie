const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {verifyBytes,extractZip,safeEntry}=require('./prepare-bundled-speech.cjs');
async function download(asset,cache){
 const file=path.join(cache,asset.sha256);try{const bytes=await fs.readFile(file);verifyBytes(bytes,asset);return bytes}catch{}
 const response=await fetch(asset.url,{signal:AbortSignal.timeout(240000)});if(!response.ok||!response.body)throw Error('Neural speech resource HTTP '+response.status);
 const chunks=[];let size=0;for await(const chunk of response.body){size+=chunk.length;if(size>asset.size)throw Error('Neural speech resource too large');chunks.push(chunk)}const bytes=Buffer.concat(chunks);verifyBytes(bytes,asset);await fs.mkdir(cache,{recursive:true});await fs.writeFile(file,bytes);return bytes;
}
async function prepare(platform=process.platform,arch=process.arch){
 const repo=path.resolve(__dirname,'..'),manifest=require('../build/neural-speech/manifest.json'),key=platform+'-'+arch,assets=manifest.platforms[key];if(!assets)throw Error('Unsupported neural speech platform');
 const root=path.join(repo,'work/neural-speech',key),cache=path.join(repo,'work/neural-speech-cache');await fs.mkdir(root,{recursive:true});await fs.mkdir(cache,{recursive:true});
 const archive=path.join(cache,assets.runtime.sha256+'.tar.gz');await fs.writeFile(archive,await download(assets.runtime,cache));
 const names=execFileSync('tar',['-tzf',archive],{encoding:'utf8',maxBuffer:8*1024*1024});names.trim().split(/\r?\n/).forEach(safeEntry);execFileSync('tar',['-xzf',archive,'-C',root],{stdio:'pipe'});
 await fs.mkdir(path.join(root,'site'),{recursive:true});
 for(const wheel of assets.wheels)await extractZip(await download(wheel,cache),path.join(root,'site'));
 for(const [gender,voice]of Object.entries(manifest.voices)){const folder=path.join(root,'voices',gender);await fs.mkdir(folder,{recursive:true});for(const asset of voice.files)await fs.writeFile(path.join(folder,asset.file),await download(asset,cache))}
 await fs.mkdir(path.join(root,'source'),{recursive:true});for(const source of manifest.sources??[])await fs.writeFile(path.join(root,'source',source.file),await download(source,cache));
 for(const name of ['worker.py','NOTICE.md'])await fs.copyFile(path.join(repo,'build/neural-speech',name),path.join(root,name));
 await fs.copyFile(path.join(repo,'build/neural-speech/manifest.json'),path.join(root,'manifest.json'));
 await fs.writeFile(path.join(root,'ready.json'),JSON.stringify({platform,arch,engine:manifest.engine,voices:Object.keys(manifest.voices)}));
 return root;
}
module.exports={prepare,download};if(require.main===module)prepare(process.argv[2],process.argv[3]).then(root=>console.log(root)).catch(error=>{console.error(error);process.exitCode=1});
