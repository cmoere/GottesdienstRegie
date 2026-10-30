import type {NativeRegionalTextKey} from '../shared/regional/nativeBase';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {networkInterfaces} from 'node:os';
import {randomBytes,randomUUID} from 'node:crypto';
import {readAnnotationStroke} from '../shared/liveAnnotations';
import {remotePage} from './RemotePage';

export interface PersonalMonitor{id:string;slug:string;name:string;sourceType:'main'|'stage'|'livestream';layout:'mirror'|'current-next';defaultLanguage:'de'|'en';showCurrent:boolean;showNext:boolean;showClock:boolean;showCountdown:boolean;showNotes:boolean;showOrderOfService:boolean;enabled:boolean}
export interface RemoteDevice{id:string;name:string;permissionRole:'view'|'preacher'|'control'|'advanced';preferredLanguage:'de'|'en';permissions:string[];token:string;revoked:boolean;createdAt:string;lastSeenAt?:string}
interface Stored{monitors:PersonalMonitor[];remotes:RemoteDevice[]}
interface LiveState{quickActive?:boolean;title?:string;current?:unknown;next?:unknown;onAir?:boolean;serviceTime?:string;clock?:string;notes?:string;order?:string[];annotationTakeId?:string;serviceCountdownAtMs?:number}
const permissions=new Set(['remote.view','remote.viewNotes','remote.next','remote.previous','remote.selectSlide','remote.selectItem','remote.quickScreen','remote.stageMessage','remote.viewRecording','remote.annotate']);
function address(){for(const group of Object.values(networkInterfaces()))for(const item of group??[])if(item.family==='IPv4'&&!item.internal)return item.address;return '127.0.0.1'}
function publicSlide(value:unknown){if(!value||typeof value!=='object')return typeof value==='string'?value.slice(0,50000):null;const slide=value as Record<string,unknown>;return{id:typeof slide.id==='string'?slide.id:'',title:typeof slide.title==='string'?slide.title.slice(0,1000):'',body:typeof slide.body==='string'?slide.body.slice(0,50000):''}}

export class RemoteServer{
 private value:Stored={monitors:[],remotes:[]};private live:LiveState={};private server?:http.Server;private seen=new Map<string,number>();private annotationRate=new Map<string,number>();
 constructor(private file:string,private command:(payload:unknown)=>void,private port=43170,private frame?:(role:'main'|'stage'|'livestream')=>Promise<Buffer|null>,private copy?:(key:NativeRegionalTextKey)=>string){}
 async start(){
  try{const value=JSON.parse(await fs.readFile(this.file,'utf8'));if(Array.isArray(value.monitors)&&Array.isArray(value.remotes))this.value=value}catch{}
  this.server=http.createServer((req,res)=>{void this.handle(req,res).catch(()=>{if(!res.headersSent)this.json(res,400,{error:'invalid'});else res.end()})});
  await new Promise<void>((resolve,reject)=>{this.server!.once('error',reject);this.server!.listen(this.port,'0.0.0.0',()=>resolve())});return this.get();
 }
 stop(){this.server?.close();this.server?.closeAllConnections()}
 get(){const endpoint=this.server?.address();return{active:!!this.server?.listening,address:address(),port:endpoint&&typeof endpoint==='object'?endpoint.port:this.port,monitors:this.value.monitors.map(item=>({...item,connected:0})),remotes:this.value.remotes}}
 updateLive(live:LiveState){this.live={...this.live,...live}}
 async saveMonitor(monitor:PersonalMonitor){
  if(!monitor||typeof monitor.name!=='string'||!monitor.name.trim()||monitor.name.length>200||typeof monitor.slug!=='string'||!['main','stage','livestream'].includes(monitor.sourceType))throw Error('Ungültiger Monitor.');
  const slug=monitor.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-+|-+$/g,'');if(!slug||slug.length>80)throw Error('Ungültige Monitor-Kennung.');
  const normalized:PersonalMonitor={...monitor,slug,layout:monitor.layout==='mirror'?'mirror':'current-next',defaultLanguage:monitor.defaultLanguage==='en'?'en':'de'};
  this.value.monitors=[...this.value.monitors.filter(item=>item.id!==monitor.id&&item.slug!==slug),normalized];await this.save();return normalized;
 }
 async removeMonitor(id:string){this.value.monitors=this.value.monitors.filter(item=>item.id!==id);await this.save();return true}
 async createSession(input:Omit<RemoteDevice,'id'|'token'|'revoked'|'createdAt'>){
  if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>200||!Array.isArray(input.permissions)||input.permissions.some(item=>!permissions.has(item)))throw Error('Ungültige Gerätefreigabe.');
  const remote:RemoteDevice={...input,id:randomUUID(),token:randomBytes(24).toString('base64url'),revoked:false,createdAt:new Date().toISOString()};this.value.remotes.push(remote);await this.save();return remote;
 }
 async revokeSession(id:string){this.value.remotes=this.value.remotes.map(item=>item.id===id?{...item,revoked:true}:item);this.command({action:'annotation-clear',deviceId:id});await this.save();return true}
 private async save(){await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file,JSON.stringify(this.value,null,2),'utf8')}
 private json(res:http.ServerResponse,status:number,data:unknown){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data))}
 private async body(req:http.IncomingMessage){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>20000)throw Error('too large')}return JSON.parse(raw||'{}')}
 private access(token:string){
  const monitor=this.value.monitors.find(item=>item.enabled&&token===`monitor:${item.slug}`);
  const remote=this.value.remotes.find(item=>!item.revoked&&item.token===token&&item.permissions.includes('remote.view'));
  return monitor?{monitor,remote:undefined}:remote?{monitor:undefined,remote}:null;
 }
 private async handle(req:http.IncomingMessage,res:http.ServerResponse){
  const url=new URL(req.url??'/','http://localhost');
  if(req.method==='GET'&&(url.pathname.startsWith('/monitor/')||url.pathname.startsWith('/remote/'))){
   const monitorRoute=url.pathname.startsWith('/monitor/'),id=decodeURIComponent(url.pathname.slice(monitorRoute?9:8)),access=this.access(monitorRoute?`monitor:${id}`:id);
   if(!access){this.json(res,403,{error:'forbidden'});return}
   const entry=access.monitor??access.remote!,language=access.monitor?.defaultLanguage??access.remote!.preferredLanguage;
   res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'});res.end(remotePage(monitorRoute?'monitor':'remote',entry.name,language,monitorRoute?`monitor:${id}`:id,this.copy));return;
  }
  if(req.method==='GET'&&(url.pathname==='/api/state'||url.pathname==='/api/frame')){
   const access=this.access(url.searchParams.get('token')??'');if(!access){this.json(res,403,{error:'forbidden'});return}
   if(url.pathname==='/api/frame'){
    const bytes=this.live.onAir?await this.frame?.(access.monitor?.sourceType??'main'):null;
    if(!bytes){this.json(res,503,{error:'output-unavailable'});return}
    res.writeHead(200,{'content-type':'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(bytes);return;
   }
   const monitor=access.monitor,remote=access.remote,canNotes=monitor?monitor.showNotes:remote!.permissions.includes('remote.viewNotes');
   this.json(res,200,{title:this.live.title,current:publicSlide(this.live.current),next:publicSlide(this.live.next),onAir:this.live.onAir===true,serviceTime:this.live.serviceTime,serviceCountdownAtMs:this.live.serviceCountdownAtMs,annotationTakeId:this.live.annotationTakeId,canAnnotate:Boolean(remote?.permissions.includes('remote.annotate')&&!this.live.quickActive),permissions:remote?.permissions??[],monitor:monitor?{layout:monitor.layout,showCurrent:monitor.showCurrent,showNext:monitor.showNext,showClock:monitor.showClock,showCountdown:monitor.showCountdown}:undefined,notes:canNotes?this.live.notes:undefined,order:monitor?.showOrderOfService?this.live.order:undefined});return;
  }
  if(req.method==='POST'&&url.pathname==='/api/command'){
   try{
    const body=await this.body(req),remote=this.value.remotes.find(item=>item.token===body.token&&!item.revoked);
    const annotation=body.action==='annotate'||body.action==='annotation-clear',permission=annotation?'remote.annotate':body.action==='next'?'remote.next':body.action==='previous'?'remote.previous':'';
    if(!remote||!permission||!remote.permissions.includes(permission)){this.json(res,403,{error:'forbidden'});return}
    const now=Date.now();for(const [id,time]of this.seen)if(now-time>30000)this.seen.delete(id);
    if(typeof body.commandId!=='string'||body.commandId.length>100||!body.commandId||this.seen.has(body.commandId)||typeof body.timestamp!=='number'||!Number.isFinite(body.timestamp)||Math.abs(now-body.timestamp)>15000){this.json(res,409,{error:'stale-or-duplicate'});return}
    let stroke;
    if(body.action==='annotate'){
     if(!this.live.onAir||this.live.quickActive||!this.live.annotationTakeId||body.takeId!==this.live.annotationTakeId){this.json(res,409,{error:'take-changed'});return}
     stroke=readAnnotationStroke(body.stroke);if(!stroke){this.json(res,400,{error:'invalid-stroke'});return}
     if(now-(this.annotationRate.get(remote.id)??-Infinity)<50){this.json(res,429,{error:'too-many-commands'});return}this.annotationRate.set(remote.id,now);
    }
    if(this.seen.size>=2000){this.json(res,429,{error:'too-many-commands'});return}this.seen.set(body.commandId,now);
    this.command({action:body.action,commandId:body.commandId,timestamp:body.timestamp,...(stroke?{stroke,takeId:body.takeId}:{}),deviceId:remote.id,sessionId:remote.id});this.json(res,202,{accepted:true});
   }catch{this.json(res,400,{error:'invalid'})}return;
  }
  this.json(res,404,{error:'not-found'});
 }
}
