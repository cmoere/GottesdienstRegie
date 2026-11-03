import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
export function imageArguments(directory:string,output:string,prompt:string,gpu:boolean){
 return['-m',path.join(directory,'sdxl_lightning_4step.q8_0.gguf'),'--backend',gpu?'te=cpu,vae=vulkan0,diffusion=vulkan0':'cpu',...(gpu?['--max-vram','1.2']:[]),'--mmap','--flash-attn','on','--vae-tiling','--vae-tile-size','256','-t',String(Math.max(1,Math.min(4,os.availableParallelism()-2))),'--steps','4','--cfg-scale','1','--sampling-method','euler','--scheduler','sgm_uniform','-W','1024','-H','576','-s','-1','-p',prompt,'-n','words, letters, text, watermark, logo, distorted, blurry','-o',output];
}
export function createImageRunner(runtime:string,temporaryRoot:string,progress:(value:number)=>void=()=>{}){
 return async(directory:string,prompt:string,signal:AbortSignal)=>{
  if(signal.aborted)throw Error('LOCAL_IMAGE_CANCELLED');
  let executable=path.join(runtime,process.platform==='win32'?'sd-cli.exe':'sd-cli');
  const inspect=()=>promisify(execFile)(executable,['--list-devices'],{windowsHide:true,timeout:20000,maxBuffer:1024*1024,signal});
  let devices;try{devices=await inspect()}catch(error){if(signal.aborted||process.platform!=='win32')throw error;executable=path.join(runtime,'cpu/sd-cli.exe');devices=await inspect()}
  const gpu=/vulkan0/i.test(devices.stdout+'\n'+devices.stderr);
  await fs.mkdir(temporaryRoot,{recursive:true});const folder=await fs.mkdtemp(path.join(temporaryRoot,'image-')),output=path.join(folder,'image.png');
  try{
   await new Promise<void>((resolve,reject)=>{
    if(signal.aborted){reject(Error('LOCAL_IMAGE_CANCELLED'));return}
    const child=spawn(executable,imageArguments(directory,output,prompt,gpu),{cwd:folder,windowsHide:true,shell:false,stdio:['ignore','pipe','pipe']});
    let failure:Error|undefined;
    const cancel=()=>{failure=Error('LOCAL_IMAGE_CANCELLED');child.kill()};
    const timer=setTimeout(()=>{failure=Error('LOCAL_IMAGE_TIMEOUT');child.kill()},20*60*1000);
    signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
    const read=(chunk:Buffer)=>{const matches=[...chunk.toString().matchAll(/\b([0-4])\s*\/\s*4\b/g)];if(matches.length)progress(Number(matches.at(-1)![1])/4)};
    child.stdout.on('data',read);child.stderr.on('data',read);
    const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancel)};
    child.once('error',()=>{cleanup();reject(Error('LOCAL_IMAGE_RUNTIME'))});
    child.once('close',code=>{cleanup();if(failure||code!==0)reject(failure??Error('LOCAL_IMAGE_FAILED'));else resolve()});
   });
   if(signal.aborted)throw Error('LOCAL_IMAGE_CANCELLED');const stat=await fs.lstat(output);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>16*1024*1024)throw Error('LOCAL_IMAGE_INVALID');return await fs.readFile(output);
  }finally{const resolved=path.resolve(folder);if(path.dirname(resolved)===path.resolve(temporaryRoot)&&path.basename(resolved).startsWith('image-'))await fs.rm(resolved,{recursive:true,force:true}).catch(()=>{})}
 };
}
