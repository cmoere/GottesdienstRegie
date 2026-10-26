const fs=require('node:fs/promises'),path=require('node:path'),{createHash}=require('node:crypto');
let preparation;
async function preparePowerPoint(platform,arch){
 if(platform!=='win32'||arch!=='x64')return null;
 return preparation??=(async()=>{const root=path.resolve(__dirname,'..'),folder=path.join(root,'work/native-powerpoint');await fs.mkdir(folder,{recursive:true});await fs.writeFile(path.join(folder,'.probe-owned'),'GottesdienstRegie owned native playback build');
 const host=await require('./build-powerpoint-host.cjs').buildPowerPointHost({root,folder,downloadedReference:true}),producer=await require('./powerpoint-gpu-probe/build.cjs').buildGpuProbe({root,target:'producer'});
 await fs.copyFile(producer.executable,path.join(folder,'PowerPointCapture.exe'));const files={};for(const name of['PowerPointHost.exe','PowerPointCapture.exe']){const bytes=await fs.readFile(path.join(folder,name));files[name]={bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')}}
 await fs.writeFile(path.join(folder,'manifest.json'),JSON.stringify({version:1,platform:'win32',arch:'x64',electron:'45.0.0',files},null,2));return folder;
 })();
}
module.exports={preparePowerPoint};
