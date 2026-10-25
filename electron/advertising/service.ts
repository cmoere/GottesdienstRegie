import path from 'node:path';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {readAdSource,type AdSource,type AdCampaign} from '../../shared/advertising';
import {parseVast,type VastCreative} from './vast';
import {fetchAdBytes} from './http';
const hash=(bytes:Buffer|string)=>createHash('sha256').update(bytes).digest('hex');
function mediaType(bytes:Buffer){
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return{extension:'png',kind:'image' as const};
 if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return{extension:'jpg',kind:'image' as const};
 if(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP')return{extension:'webp',kind:'image' as const};
 if(bytes.toString('ascii',4,8)==='ftyp')return{extension:'mp4',kind:'video' as const};
 if(bytes.subarray(0,4).equals(Buffer.from([26,69,223,163])))return{extension:'webm',kind:'video' as const};
 throw Error('Nur PNG, JPEG, WebP, MP4 und WebM werden als Werbemedien unterstützt.');
}
export class AdvertisingService{
 private pending=new Map<string,Promise<AdCampaign>>();private cache=new Map<string,AdCampaign>();
 private writes:Promise<unknown>=Promise.resolve();
 constructor(private mediaDirectory:string,private fetchBytes=fetchAdBytes,private now=Date.now){}
 async read(value:unknown){const source=readAdSource(value),key=JSON.stringify(source),cached=this.cache.get(key);if(cached&&this.now()-cached.fetchedAt<300000)return structuredClone(cached);let request=this.pending.get(key);if(!request){if(this.pending.size>=3)throw Error('Werbequellen werden bereits vorbereitet. Bitte kurz warten.');request=this.load(source).then(result=>{this.cache.set(key,result);if(this.cache.size>20)this.cache.delete(this.cache.keys().next().value!);return result}).finally(()=>this.pending.delete(key));this.pending.set(key,request)}return structuredClone(await request)}
 private store(file:string,bytes:Buffer){
  const write=this.writes.then(async()=>{const indexFile=path.join(path.dirname(this.mediaDirectory),'advertising-assets.json');let entries:Record<string,number>={};try{const raw=JSON.parse(await fs.readFile(indexFile,'utf8'));for(const [key,size]of Object.entries(raw))if(/^[a-f0-9]{64}\.(png|jpg|webp|mp4|webm)$/.test(key)&&typeof size==='number'&&Number.isFinite(size)&&size>=0)entries[key]=size}catch{}
   if(!entries[file]&&Object.values(entries).reduce((sum,size)=>sum+size,0)+bytes.length>2*1024*1024*1024)throw Error('Der Werbemedien-Cache ist voll. Weitere Kampagnen können derzeit nicht vorbereitet werden. Bereits vorbereitete Inhalte bleiben verfügbar.');
   try{await fs.writeFile(path.join(this.mediaDirectory,file),bytes,{flag:'wx'})}catch(error:any){if(error?.code!=='EEXIST')throw error;const existing=await fs.readFile(path.join(this.mediaDirectory,file));if(hash(existing)!==hash(bytes))throw Error('Ein gespeichertes Werbemedium ist beschädigt.')}
   entries[file]=bytes.length;await fs.writeFile(indexFile,JSON.stringify(entries));
  });this.writes=write.catch(()=>{});return write;
 }
 private async load(source:AdSource):Promise<AdCampaign>{
  const creatives:VastCreative[]=[];
  if(source.kind==='direct')creatives.push({title:'Externe Werbung',url:source.url,kind:'image',durationSeconds:15});
  else{const visited=new Set<string>();const read=async(url:string,depth:number)=>{if(depth>3||visited.has(url))return;visited.add(url);const reply=await this.fetchBytes(url,1024*1024),result=parseVast(reply.bytes.toString('utf8'));creatives.push(...result.creatives);for(const wrapper of result.wrappers)if(creatives.length<20)await read(wrapper,depth+1)};await read(source.url,0)}
  if(!creatives.length)throw Error('Die VAST-Kampagne enthält derzeit keine unterstützten Bild- oder Videowerbemittel.');
  let total=0;const result:AdCampaign={source,fetchedAt:this.now(),creatives:[]};await fs.mkdir(this.mediaDirectory,{recursive:true});
  for(const creative of creatives.slice(0,20)){
   const reply=await this.fetchBytes(creative.url,80*1024*1024);total+=reply.bytes.length;if(total>256*1024*1024)throw Error('Die Werbekampagne ist zu groß.');
   const media=mediaType(reply.bytes),checksum=hash(reply.bytes),file=checksum+'.'+media.extension;await this.store(file,reply.bytes);
   result.creatives.push({id:checksum,title:creative.title,url:`gottesdienst-media://media/${file}`,kind:media.kind,durationSeconds:creative.durationSeconds});
  }return result;
 }
}
