import fs from 'node:fs/promises';import path from 'node:path';
export type TranslationPackStatus='not-downloaded'|'queued'|'downloading'|'ready'|'error'|'update-available';
export interface TranslationPackDescriptor{key:string;source:string;target:string;model:string;revision:string;status:TranslationPackStatus;size?:number;downloadedBytes?:number;error?:string}
export interface TranslationPackProgress{key:string;status:TranslationPackStatus;downloadedBytes:number;totalBytes?:number;percent:number;error?:string}
export type PackDownloader=(descriptor:TranslationPackDescriptor,target:string,signal:AbortSignal,progress:(value:TranslationPackProgress)=>void)=>Promise<void>;
export class TranslationPackService{
  private listeners=new Set<(value:TranslationPackProgress)=>void>();private controllers=new Map<string,AbortController>();
  constructor(private root:string,private downloader:PackDownloader,private catalog:TranslationPackDescriptor[]=[]){ }
  onProgress(listener:(value:TranslationPackProgress)=>void){this.listeners.add(listener);return()=>this.listeners.delete(listener)}
  activeDownloadCount(){return this.controllers.size}
  private emit(value:TranslationPackProgress){for(const listener of this.listeners)listener(value)}
  private async ready(item:TranslationPackDescriptor){try{const manifest=JSON.parse(await fs.readFile(path.join(this.root,item.key,item.revision,'manifest.json'),'utf8'));return manifest.key===item.key&&Array.isArray(manifest.files)&&manifest.files.length>0}catch{return false}}
  async list(){return Promise.all(this.catalog.map(async item=>({...item,status:await this.ready(item)?'ready':'not-downloaded'} as TranslationPackDescriptor)))}
  async download(key:string,outer?:AbortSignal){const item=this.catalog.find(value=>value.key===key);if(!item)throw Error('UNKNOWN_TRANSLATION_PACK');const controller=new AbortController();this.controllers.set(key,controller);const abort=()=>controller.abort();outer?.addEventListener('abort',abort,{once:true});const temp=path.join(this.root,`${key}.tmp`),final=path.join(this.root,key,item.revision);try{await fs.rm(temp,{recursive:true,force:true});await fs.mkdir(temp,{recursive:true});this.emit({key,status:'downloading',downloadedBytes:0,percent:0});await this.downloader(item,temp,controller.signal,value=>this.emit(value));if(controller.signal.aborted)throw Error('ABORT');const files=(await fs.readdir(temp)).filter(file=>file!=='manifest.json');if(!files.length)throw Error('PACK_EMPTY');await fs.writeFile(path.join(temp,'manifest.json'),JSON.stringify({key,revision:item.revision,files}));await fs.mkdir(path.dirname(final),{recursive:true});await fs.rm(final,{recursive:true,force:true});await fs.rename(temp,final);this.emit({key,status:'ready',downloadedBytes:1,totalBytes:1,percent:100});return true}catch(error){await fs.rm(temp,{recursive:true,force:true});this.emit({key,status:'error',downloadedBytes:0,percent:0,error:String(error)});throw error}finally{outer?.removeEventListener('abort',abort);this.controllers.delete(key)}}
  cancel(key:string){this.controllers.get(key)?.abort();return true}
  async remove(key:string){if(!this.catalog.some(item=>item.key===key))throw Error('UNKNOWN_TRANSLATION_PACK');await fs.rm(path.join(this.root,key),{recursive:true,force:true});return true}
}
