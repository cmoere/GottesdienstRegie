import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
export type SlideModelDescriptor={model:string;revision:string;previousRevisions?:string[];licenseText?:string;files:Array<{name:string;size:number;sha256:string}>};
export type SlidePackStatus={state:'missing'|'downloading'|'ready'|'error';downloadedBytes:number;totalBytes:number};
type Request=(url:string,init?:RequestInit)=>Promise<Response>;
export class SlideModelPack{
 private controller?:AbortController;
 private progress=0;
 private failed=false;
 private readonly root:string;
 private readonly directory:string;
 constructor(root:string,private readonly descriptor:SlideModelDescriptor,private readonly request:Request=fetch){
  this.root=path.resolve(root);
  if(descriptor.previousRevisions?.some(revision=>!/^[a-f0-9]{40}$/.test(revision)||revision===descriptor.revision))throw Error('SLIDE_MODEL_DESCRIPTOR_INVALID');
  if(!/^[a-f0-9]{40}$/.test(descriptor.revision)||!descriptor.files.length||descriptor.files.some(file=>!/^([a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_.-]+$/.test(file.name)||file.name.split('/').some(part=>part==='.'||part==='..')||!Number.isSafeInteger(file.size)||file.size<1||!/^[a-f0-9]{64}$/.test(file.sha256)))throw Error('SLIDE_MODEL_DESCRIPTOR_INVALID');
  this.directory=path.join(this.root,descriptor.revision);
 }
 private get total(){return this.descriptor.files.reduce((sum,file)=>sum+file.size,0)}
 async status():Promise<SlidePackStatus>{
  if(this.controller)return{state:'downloading',downloadedBytes:this.progress,totalBytes:this.total};
  try{
   const manifest=JSON.parse(await fs.readFile(path.join(this.directory,'ready.json'),'utf8'));
   if(manifest.revision!==this.descriptor.revision||manifest.model!==this.descriptor.model)throw Error('invalid manifest');
   if(this.descriptor.licenseText&&await fs.readFile(path.join(this.directory,'LICENSE.txt'),'utf8')!==this.descriptor.licenseText)throw Error('invalid license');
   for(const file of this.descriptor.files){const entry=await fs.lstat(path.join(this.directory,file.name));if(!entry.isFile()||entry.isSymbolicLink()||entry.size!==file.size)throw Error('missing file')}
   return{state:'ready',downloadedBytes:this.total,totalBytes:this.total};
  }catch{return{state:this.failed?'error':'missing',downloadedBytes:0,totalBytes:this.total}}
 }
 async verifiedDirectory(signal?:AbortSignal){
  const check=()=>{if(signal?.aborted)throw Error('SLIDE_MODEL_CANCELLED')};check();
  if((await this.status()).state!=='ready')throw Error('SLIDE_MODEL_MISSING');
  for(const file of this.descriptor.files){check();const hash=createHash('sha256');for await(const chunk of createReadStream(path.join(this.directory,file.name))){check();hash.update(chunk)}if(hash.digest('hex')!==file.sha256)throw Error('SLIDE_MODEL_CORRUPT')}
  check();
  return this.directory;
 }
 private async removeOwned(directory:string){
  const resolved=path.resolve(directory);
  if(path.dirname(resolved)!==this.root||(resolved!==this.directory&&!this.descriptor.previousRevisions?.includes(path.basename(resolved))&&!path.basename(resolved).startsWith('download-')))throw Error('SLIDE_MODEL_PATH_INVALID');
  await fs.rm(resolved,{recursive:true,force:true,maxRetries:5,retryDelay:100});
 }
 private async commitTemporary(temporary:string,signal:AbortSignal){
  for(let attempt=0;;attempt++){
   if(signal.aborted)throw Error('SLIDE_MODEL_CANCELLED');
   try{await fs.rename(temporary,this.directory);return}catch(error){
    if(attempt>=5||!['EPERM','EACCES','EBUSY'].includes(String((error as NodeJS.ErrnoException).code)))throw error;
    await new Promise(resolve=>setTimeout(resolve,75*(attempt+1)));
   }
  }
 }
 cancel(){this.controller?.abort()}
 private async cleanInterruptedDownloads(signal?:AbortSignal){
  const entries=await fs.readdir(this.root,{withFileTypes:true}).catch(error=>{if((error as NodeJS.ErrnoException).code==='ENOENT')return[];throw error});
  for(const entry of entries){if(signal?.aborted)throw Error('SLIDE_MODEL_CANCELLED');if(entry.isDirectory()&&/^download-[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(entry.name))await this.removeOwned(path.join(this.root,entry.name))}
 }
 async remove(){if(this.controller)throw Error('SLIDE_MODEL_BUSY');await this.removeOwned(this.directory);for(const revision of this.descriptor.previousRevisions??[])await this.removeOwned(path.join(this.root,revision));await this.cleanInterruptedDownloads();this.failed=false}
 async download(){
  if(this.controller)throw Error('SLIDE_MODEL_BUSY');
  if((await this.status()).state==='ready')return;
  const controller=new AbortController();this.controller=controller;this.progress=0;this.failed=false;
  const temporary=path.join(this.root,'download-'+randomUUID());
  try{
   await this.cleanInterruptedDownloads(controller.signal);
   await fs.mkdir(temporary,{recursive:true});
   for(const file of this.descriptor.files){
    const target=path.join(temporary,file.name);await fs.mkdir(path.dirname(target),{recursive:true});
    const response=await this.request('https://huggingface.co/'+this.descriptor.model+'/resolve/'+this.descriptor.revision+'/'+file.name,{signal:controller.signal});
    if(!response.ok||!response.body)throw Error('SLIDE_MODEL_DOWNLOAD_FAILED');
    const handle=await fs.open(target,'wx'),hash=createHash('sha256'),reader=response.body.getReader();let size=0;
    try{for(;;){const part=await reader.read();if(part.done)break;const chunk=part.value;if(controller.signal.aborted)throw Error('SLIDE_MODEL_CANCELLED');size+=chunk.byteLength;if(size>file.size)throw Error('SLIDE_MODEL_CORRUPT');await handle.write(chunk);hash.update(chunk);this.progress+=chunk.byteLength}}finally{await reader.cancel().catch(()=>{});reader.releaseLock();await handle.close()}
    if(size!==file.size||hash.digest('hex')!==file.sha256)throw Error('SLIDE_MODEL_CORRUPT');
   }
   if(controller.signal.aborted)throw Error('SLIDE_MODEL_CANCELLED');
   if(this.descriptor.licenseText)await fs.writeFile(path.join(temporary,'LICENSE.txt'),this.descriptor.licenseText);
   await fs.writeFile(path.join(temporary,'ready.json'),JSON.stringify({revision:this.descriptor.revision,model:this.descriptor.model}));
   await this.removeOwned(this.directory);await this.commitTemporary(temporary,controller.signal);
  }catch(error){this.failed=!controller.signal.aborted;await this.removeOwned(temporary);throw error}
  finally{this.controller=undefined}
 }
}
