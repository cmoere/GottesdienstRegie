import {utilityProcess} from 'electron';
import path from 'node:path';
import type {SlideDraftRequest} from '../../shared/localSlideDraft';
export function runSlideWorker(directory:string,request:SlideDraftRequest,signal:AbortSignal):Promise<string>{
 return new Promise((resolve,reject)=>{
  if(signal.aborted){reject(Error('SLIDE_DRAFT_CANCELLED'));return}
  const child=utilityProcess.fork(path.join(__dirname,'..','localSlideWorker.js'),[],{stdio:'pipe',serviceName:'GottesdienstRegie'});
  let settled=false;
  const finish=(error:Error|null,text?:string)=>{
   if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',cancel);child.kill();
   if(error)reject(error);else resolve(text!);
  };
  const cancel=()=>finish(Error('SLIDE_DRAFT_CANCELLED'));
  const timer=setTimeout(()=>finish(Error('SLIDE_DRAFT_TIMEOUT')),600000);
  signal.addEventListener('abort',cancel,{once:true});
  child.once('spawn',()=>{if(signal.aborted){cancel();return}child.postMessage({directory,request})});
  child.on('message',(message:unknown)=>{
   if(!message||typeof message!=='object')return;
   const value=message as {type?:unknown;text?:unknown};
   if(value.type==='result'&&typeof value.text==='string'&&value.text.length<=24000)finish(null,value.text);
   else if(value.type==='error')finish(Error('SLIDE_DRAFT_GENERATION_FAILED'));
  });
  child.once('exit',()=>finish(Error('SLIDE_DRAFT_GENERATION_FAILED')));
 });
}
