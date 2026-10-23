import type {ExternalReply,ExternalRequest,ExternalSnapshot} from '../../shared/externalLoop';
import type {ServiceItem,Slide} from '../store';
import {externalRequestKey} from '../../shared/externalLoopRequest';
import {readExternalSnapshot} from '../../shared/externalLoopValidation';
import {externalHasContent,externalLoopMinimumDuration,externalSettingsForItem,hydrateExternalLoopData,requestForExternalItem} from './model';
const unavailable=():ExternalReply=>({snapshot:null,status:'unavailable'});
export class ExternalLoopController{
 private readonly prepared=new Map<string,ExternalReply>();
 private readonly generations=new Map<string,number>();
 private readonly listeners=new Set<()=>void>();
 private disposed=false;
 private version=0;
 private takeKey='';
 private output:Slide|null=null;
 constructor(private readonly read:(request:ExternalRequest)=>Promise<ExternalReply>,private readonly now:()=>number=Date.now){}
 async prepare(request:ExternalRequest):Promise<ExternalReply>{
  if(this.disposed)return unavailable();const key=externalRequestKey(request),generation=(this.generations.get(key)??0)+1;this.generations.set(key,generation);
  let reply:ExternalReply;try{reply=await this.read(structuredClone(request))}catch{reply=unavailable()}
  if(this.disposed||this.generations.get(key)!==generation)return this.peek(request);
  if(!reply||!['ready','stale','empty','unavailable'].includes(reply.status))reply=unavailable();
  if(reply.snapshot!==null){const snapshot=readExternalSnapshot(reply.snapshot,key,this.now());if(!snapshot||snapshot.payload.kind!==request.kind||(snapshot.payload.kind==='football'&&request.kind==='football'&&(snapshot.payload.league!==request.league||snapshot.payload.mode!==request.mode)))reply=unavailable()}
  this.prepared.set(key,structuredClone(reply));this.version++;for(const listener of this.listeners)listener();return structuredClone(reply);
 }
 peek(request:ExternalRequest):ExternalReply{
  const value=this.prepared.get(externalRequestKey(request));if(!value)return unavailable();
  if(value.snapshot&&(this.now()-value.snapshot.fetchedAt>(request.kind==='news'?86400000:21600000)||value.snapshot.fetchedAt>this.now()+60000))return unavailable();
  return structuredClone(value);
 }
 freeze(request:ExternalRequest,_startedAt:number):ExternalSnapshot|null{return this.peek(request).snapshot}
 outputForTake(item:ServiceItem,slide:Slide,revision:number,now:number):Slide|null{
  const key=`${item.id}:${slide.id}:${revision}`;if(key===this.takeKey)return this.output?structuredClone(this.output):null;
  this.takeKey=key;this.output=null;
  const request=requestForExternalItem(item),settings=externalSettingsForItem(item),snapshot=request?this.freeze(request,now):null;
  if(!snapshot||!externalHasContent(snapshot,settings))return null;
  const output=hydrateExternalLoopData(slide,snapshot,now,settings);
  output.timing={...output.timing,durationSeconds:Math.ceil(externalLoopMinimumDuration(snapshot,settings)/1000)};
  this.output=structuredClone(output);return output;
 }
 hasEligible(item:ServiceItem):boolean{const request=requestForExternalItem(item),snapshot=request?this.peek(request).snapshot:null;return Boolean(snapshot&&externalHasContent(snapshot,externalSettingsForItem(item)))}
 preflightWarnings(items:ServiceItem[]):string[]{
  return items.flatMap(item=>{if(item.enabled===false||item.disabled===true)return[];const request=requestForExternalItem(item);if(!request)return[];const reply=this.peek(request),label=item.title|| (request.kind==='news'?'Nachrichten':'Fußball');if(!reply.snapshot||!this.hasEligible(item))return[`${label}: derzeit keine gültigen Inhalte vorbereitet; dieses optionale Loop-Element wird übersprungen.`];if(reply.status==='stale')return[`${label}: Offline-Ausfallreserve · letzter Stand ${new Date(reply.snapshot.fetchedAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})} Uhr.`];return[]});
 }
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>this.listeners.delete(listener)};
 getVersion=()=>this.version;
 dispose(){this.disposed=true;this.prepared.clear();this.generations.clear();this.listeners.clear();this.output=null;this.takeKey=''}
}
export function startExternalLoopDemand(controller:ExternalLoopController,items:ServiceItem[]):()=>void{
 const requests=new Map<string,ExternalRequest>();for(const item of items){if(item.enabled===false||item.disabled===true)continue;const request=requestForExternalItem(item);if(request)requests.set(externalRequestKey(request),request)}
 if(!requests.size)return()=>{};
 const prepare=()=>{for(const request of requests.values())void controller.prepare(request)};prepare();const timer=setInterval(prepare,60000);return()=>clearInterval(timer);
}
