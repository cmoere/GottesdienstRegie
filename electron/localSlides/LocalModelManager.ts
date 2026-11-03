import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import type {SlidePackStatus} from './SlideModelPack';

export type LocalModelId='text'|'image';
type Pack={status:()=>Promise<SlidePackStatus>;download:()=>Promise<void>;cancel:()=>void;remove:()=>Promise<void>};
type Entry={id:LocalModelId;pack:Pack};
type Preferences={autoDownload:boolean;disabled:LocalModelId[]};
export type LocalModelsStatus={autoDownload:boolean;activeModel?:LocalModelId;models:Array<SlidePackStatus&{id:LocalModelId;enabled:boolean}>};

// Application-owned: a renderer or Settings dialog never owns the lifetime of
// a download. A deliberate removal is persisted before cancelling/deleting.
export class LocalModelManager{
 private preferences:Preferences={autoDownload:true,disabled:[]};
 private ready=false;private paused=false;
 private timer?:ReturnType<typeof setTimeout>;
 private automatic?:Promise<void>;
 private active?:{id:LocalModelId;pending:Promise<void>};
 private writes:Promise<unknown>=Promise.resolve();
 private commands:Promise<unknown>=Promise.resolve();private manualPending=0;
 private retryAfter=new Map<LocalModelId,number>();
 constructor(private readonly file:string,private readonly entries:Entry[],private readonly isBlocked:()=>boolean){}
 async initialize(){
  try{const value=JSON.parse(await fs.readFile(this.file,'utf8'));this.preferences={autoDownload:value.autoDownload===true,disabled:Array.isArray(value.disabled)?value.disabled.filter((id:unknown):id is LocalModelId=>this.entries.some(entry=>entry.id===id)):[]}}
  catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')this.preferences={autoDownload:false,disabled:[]}}
 }
 private persist(){
  const value=JSON.stringify(this.preferences),write=this.writes.then(async()=>{await fs.mkdir(path.dirname(this.file),{recursive:true});const temporary=this.file+'.'+randomUUID()+'.tmp';try{await fs.writeFile(temporary,value);await fs.rename(temporary,this.file)}finally{await fs.rm(temporary,{force:true}).catch(()=>{})}});
  this.writes=write.catch(()=>{});return write;
 }
 private entry(id:LocalModelId){const entry=this.entries.find(entry=>entry.id===id);if(!entry)throw Error('LOCAL_MODEL_UNKNOWN');return entry}
 private schedule(delay=30000){clearTimeout(this.timer);if(this.ready&&!this.paused){this.timer=setTimeout(()=>void this.runAutomatic().catch(()=>{}),delay);this.timer.unref?.()}}
 start(){if(this.ready)return;this.ready=true;this.paused=false;this.schedule(5000)}
 resume(){this.paused=false;this.schedule(1000)}
 pause(){this.paused=true;clearTimeout(this.timer);this.active&&this.entry(this.active.id).pack.cancel()}
 dispose(){this.ready=false;this.pause()}
 async status():Promise<LocalModelsStatus>{return{autoDownload:this.preferences.autoDownload,activeModel:this.active?.id,models:await Promise.all(this.entries.map(async entry=>({...await entry.pack.status(),id:entry.id,enabled:!this.preferences.disabled.includes(entry.id)})))}}
 async configure(autoDownload:boolean){if(typeof autoDownload!=='boolean')throw Error('LOCAL_MODEL_PREFERENCES_INVALID');this.preferences={...this.preferences,autoDownload};await this.persist();if(!autoDownload)this.pause();else this.resume()}
 private begin(entry:Entry){
  if(this.active)throw Error('LOCAL_MODEL_BUSY');
  const pending=Promise.resolve().then(()=>entry.pack.download()).finally(()=>{if(this.active?.pending===pending)this.active=undefined});
  this.active={id:entry.id,pending};return pending;
 }
 runAutomatic():Promise<void>{
  if(this.automatic)return this.automatic;
  clearTimeout(this.timer);
  const pending=(async()=>{
   if(!this.ready||this.paused||!this.preferences.autoDownload||this.isBlocked()||this.manualPending)return;
   for(const entry of this.entries){
    if(this.paused||this.isBlocked()||this.manualPending)break;
    if(this.preferences.disabled.includes(entry.id)||(this.retryAfter.get(entry.id)??0)>Date.now())continue;
    if((await entry.pack.status()).state==='ready')continue;
    if(this.paused||this.isBlocked()||this.preferences.disabled.includes(entry.id)||this.manualPending)break;
    try{await this.begin(entry);this.retryAfter.delete(entry.id)}catch{this.retryAfter.set(entry.id,Date.now()+300000)}
   }
  })().finally(()=>{if(this.automatic===pending)this.automatic=undefined;this.schedule()});
  this.automatic=pending;return pending;
 }
 private command<T>(operation:()=>Promise<T>){this.manualPending++;const result=this.commands.then(operation).finally(()=>{this.manualPending--;this.schedule()});this.commands=result.catch(()=>{});return result}
 download(id:LocalModelId){return this.command(async()=>{
  if(this.isBlocked())throw Error('LOCAL_MODEL_BUSY');const entry=this.entry(id);
  this.preferences.disabled=this.preferences.disabled.filter(value=>value!==id);await this.persist();
  if(this.active){this.entry(this.active.id).pack.cancel();await this.active?.pending.catch(()=>{})}
  if(this.isBlocked())throw Error('LOCAL_MODEL_BUSY');this.retryAfter.delete(id);await this.begin(entry);
 })}
 cancelDownload(id:LocalModelId){return this.command(async()=>{this.entry(id);this.preferences.disabled=Array.from(new Set([...this.preferences.disabled,id]));await this.persist();if(this.active?.id===id){this.entry(id).pack.cancel();await this.active?.pending.catch(()=>{})}})}
 remove(id:LocalModelId){return this.command(async()=>{
  if(this.isBlocked())throw Error('LOCAL_MODEL_BUSY');const entry=this.entry(id);
  this.preferences.disabled=Array.from(new Set([...this.preferences.disabled,id]));await this.persist();
  if(this.active?.id===id){entry.pack.cancel();await this.active?.pending.catch(()=>{})}
  if(this.isBlocked())throw Error('LOCAL_MODEL_BUSY');await entry.pack.remove();
 })}
}
