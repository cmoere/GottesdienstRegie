import type {NativeRegionalTextKey} from '../shared/regional/nativeBase';
import type http from 'node:http';
import https from 'node:https';
import {ScreenShareBroker} from './ScreenShareBroker';
import type {LocalTlsIdentity} from './LocalTlsIdentity';
import fs from 'node:fs/promises';
import path from 'node:path';
import {networkInterfaces} from 'node:os';
import {randomBytes,randomUUID} from 'node:crypto';
import {readAnnotationStroke} from '../shared/liveAnnotations';
import {remotePage} from './RemotePage';
import {streamLiveImages} from './LiveImageStream';
import {normalizeMonitorLayout, type MonitorLayout, type MonitorProfile} from '../shared/remoteMonitor';
import type {NextPreviewPacket} from '../shared/nextPreview';

export interface PersonalMonitor{id:string;slug:string;name:string;profile?:MonitorProfile;sourceType:'main'|'stage'|'livestream';layout:MonitorLayout;defaultLanguage:'de'|'en';showCurrent:boolean;showNext:boolean;showClock:boolean;showCountdown:boolean;showNotes:boolean;showOrderOfService:boolean;enabled:boolean}
type StoredMonitor=PersonalMonitor&{token:string};
export interface RemoteDevice{id:string;name:string;permissionRole:'view'|'preacher'|'control'|'advanced';preferredLanguage:'de'|'en';permissions:string[];token:string;revoked:boolean;createdAt:string;lastSeenAt?:string}
interface Stored{monitors:StoredMonitor[];remotes:RemoteDevice[]}
interface LiveState{upcoming?:NextPreviewPacket[];nextPreviewRevision?:number;quickActive?:boolean;title?:string;current?:unknown;next?:unknown;onAir?:boolean;serviceTime?:string;clock?:string;notes?:string;order?:string[];annotationTakeId?:string;serviceCountdownAtMs?:number}
const permissions=new Set(['remote.view','remote.viewNotes','remote.next','remote.previous','remote.selectSlide','remote.selectItem','remote.quickScreen','remote.stageMessage','remote.viewRecording','remote.annotate','remote.share']);
function address(){for(const group of Object.values(networkInterfaces()))for(const item of group??[])if(item.family==='IPv4'&&!item.internal)return item.address;return '127.0.0.1'}
function publicSlide(value:unknown){if(!value||typeof value!=='object')return typeof value==='string'?value.slice(0,50000):null;const slide=value as Record<string,unknown>;return{id:typeof slide.id==='string'?slide.id:'',title:typeof slide.title==='string'?slide.title.slice(0,1000):'',body:typeof slide.body==='string'?slide.body.slice(0,50000):''}}

export class RemoteServer{
 readonly sharing=new ScreenShareBroker(event=>this.command({action:'screen-share',event}));
 private secureServer?:https.Server;private fingerprint?:string;private certificate?:string;private shareTimer?:ReturnType<typeof setInterval>;
 private streamTimes=new Map<string,number>();
 private value:Stored={monitors:[],remotes:[]};private live:LiveState={};private seen=new Map<string,number>();private annotationRate=new Map<string,number>();
 constructor(private file:string,private command:(payload:unknown)=>void,private port=43171,private frame?:(role:'main'|'stage'|'livestream')=>Promise<Buffer|null>,private copy?:(key:NativeRegionalTextKey)=>string,private nextFrame?:(index?:number)=>Promise<Buffer|null>){}
 async start(){
  let value:Stored;
  try{value=JSON.parse(await fs.readFile(this.file,'utf8'))}catch{return}
  if(!Array.isArray(value.monitors)||!Array.isArray(value.remotes))return;
  this.value=value;
  const monitorsNeedingToken=value.monitors.filter(monitor=>!/^[A-Za-z0-9_-]{32}$/.test(monitor.token));
  for(const monitor of monitorsNeedingToken)monitor.token=randomBytes(24).toString('base64url');
  if(monitorsNeedingToken.length)await this.save();
 }
 async enableSecure(identity:LocalTlsIdentity,port=this.port){if(this.secureServer)return;const server=https.createServer({cert:identity.cert,key:identity.key,minVersion:'TLSv1.2'},(req,res)=>{void this.handle(req,res).catch(()=>{if(!res.headersSent)this.json(res,400,{error:'invalid'});else res.end()})});await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(port,'0.0.0.0',resolve)});this.secureServer=server;this.fingerprint=identity.fingerprint;this.certificate=identity.cert;this.shareTimer=setInterval(()=>this.sharing.expire(),5000);this.shareTimer.unref()}
 stop(){this.streamTimes.clear();this.sharing.stop();if(this.shareTimer)clearInterval(this.shareTimer);this.secureServer?.close();this.secureServer?.closeAllConnections()}
 get(){const secure=this.secureServer?.address();return{securePort:secure&&typeof secure==='object'?secure.port:undefined,fingerprint:this.fingerprint,active:!!this.secureServer?.listening,address:address(),monitors:this.value.monitors.map(item=>({...item,connected:0})),remotes:this.value.remotes}}
 getPublicCertificate(){return this.secureServer?.listening?this.certificate:undefined}
 updateLive(live:LiveState){this.live={...this.live,...live};if(typeof live.onAir==='boolean')this.sharing.setOnAir(live.onAir)}
 async saveMonitor(monitor:PersonalMonitor){
  if(!monitor||typeof monitor.name!=='string'||!monitor.name.trim()||monitor.name.length>200||typeof monitor.slug!=='string'||!['main','stage','livestream'].includes(monitor.sourceType))throw Error('Ungültiger Monitor.');
  const slug=monitor.slug.toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^-+|-+$/g,'');if(!slug||slug.length>80)throw Error('Ungültige Monitor-Kennung.');
  const profile=monitor.profile==='lighting'?'lighting':'personal';
  const existing=this.value.monitors.find(item=>item.id===monitor.id)
   ?? (profile==='lighting'?this.value.monitors.find(item=>item.profile==='lighting'&&item.slug===slug):undefined);
  const token=existing?.token??randomBytes(24).toString('base64url');
  const normalized:StoredMonitor={...monitor,id:existing?.id??monitor.id,token,slug,profile,layout:normalizeMonitorLayout(monitor.layout,profile),defaultLanguage:monitor.defaultLanguage==='en'?'en':'de'};
  this.value.monitors=[...this.value.monitors.filter(item=>item.id!==monitor.id&&item.slug!==slug),normalized];await this.save();return normalized;
 }
 async removeMonitor(id:string){this.value.monitors=this.value.monitors.filter(item=>item.id!==id);await this.save();return true}
 async createSession(input:Omit<RemoteDevice,'id'|'token'|'revoked'|'createdAt'>){
  if(!input||typeof input.name!=='string'||!input.name.trim()||input.name.length>200||!Array.isArray(input.permissions)||input.permissions.some(item=>!permissions.has(item)))throw Error('Ungültige Gerätefreigabe.');
  const remote:RemoteDevice={...input,id:randomUUID(),token:randomBytes(24).toString('base64url'),revoked:false,createdAt:new Date().toISOString()};this.value.remotes.push(remote);await this.save();return remote;
 }
 async revokeSession(id:string){this.value.remotes=this.value.remotes.map(item=>item.id===id?{...item,revoked:true}:item);this.sharing.revoke(id);this.command({action:'annotation-clear',deviceId:id});await this.save();return true}
 private async save(){await fs.mkdir(path.dirname(this.file),{recursive:true});await fs.writeFile(this.file,JSON.stringify(this.value,null,2),'utf8')}
 private json(res:http.ServerResponse,status:number,data:unknown){res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(data))}
 private async body(req:http.IncomingMessage){let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>65000)throw Error('too large')}return JSON.parse(raw||'{}')}
 private access(token:string){
  const monitor=this.value.monitors.find(item=>item.enabled&&token===`monitor:${item.token}`);
  const remote=this.value.remotes.find(item=>!item.revoked&&item.token===token&&item.permissions.includes('remote.view'));
  return monitor?{monitor,remote:undefined}:remote?{monitor:undefined,remote}:null;
 }
 private async handle(req:http.IncomingMessage,res:http.ServerResponse){
  const url=new URL(req.url??'/','http://localhost');
  if(url.pathname==='/api/share'){
   if(!(req.socket as import('node:tls').TLSSocket).encrypted){this.json(res,403,{error:'https-required'});return}
   const body=req.method==='POST'?await this.body(req):null;
   const token=body?.token??url.searchParams.get('token');const remote=this.value.remotes.find(item=>!item.revoked&&item.token===token&&item.permissions.includes('remote.view')&&item.permissions.includes('remote.share'));
   if(!remote){this.json(res,403,{error:'forbidden'});return}
   if(req.method==='GET'){const state=this.sharing.poll(remote.id,url.searchParams.get('id')??'');this.json(res,state?200:404,state??{error:'ended'});return}
   if(req.method==='POST'&&body.action==='offer'){try{this.json(res,201,this.sharing.begin(remote,body.description))}catch{this.json(res,409,{error:'invalid-or-busy'})}return}
   if(req.method==='POST'&&body.action==='stop'){this.json(res,200,{stopped:this.sharing.stop(body.id,remote.id)});return}
   this.json(res,400,{error:'invalid'});return;
  }
  if(req.method==='GET'&&(url.pathname.startsWith('/monitor/')||url.pathname.startsWith('/remote/'))){
   const monitorRoute=url.pathname.startsWith('/monitor/'),id=decodeURIComponent(url.pathname.slice(monitorRoute?9:8)),access=this.access(monitorRoute?`monitor:${id}`:id);
   if(!access){this.json(res,403,{error:'forbidden'});return}
   const entry=access.monitor??access.remote!,language=(access.monitor?access.monitor.defaultLanguage:access.remote?.preferredLanguage)==='en'?'en':'de';
   res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','x-frame-options':'DENY','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",'x-content-type-options':'nosniff'});res.end(remotePage(monitorRoute?'monitor':'remote',entry.name,language,monitorRoute?`monitor:${id}`:id,this.copy));return;
  }
  if(req.method==='GET'&&url.pathname==='/api/live'){
   const token=url.searchParams.get('token')??'',access=this.access(token);
   if(!access){this.json(res,403,{error:'forbidden'});return}
   if(!this.live.onAir){this.json(res,409,{error:'off-air'});return}
   const view=url.searchParams.get('view')??'';if(!/^[A-Za-z0-9-]{1,64}$/.test(view)){this.json(res,400,{error:'invalid-view'});return}
   const streamKey=token+'\0'+view;this.streamTimes.set(streamKey,Date.now());const clean=()=>this.streamTimes.delete(streamKey);res.once('close',clean);
   try{await streamLiveImages(res,async()=>{
    const fresh=this.access(token);if(!fresh||!this.live.onAir)return null;
    const role=fresh.monitor?.sourceType??'main',bytes=await this.frame?.(role);
    const after=this.access(token);
    if(res.destroyed||!after||!this.live.onAir||(after.monitor?.sourceType??'main')!==role)return null;
    if(bytes)this.streamTimes.set(streamKey,Date.now());return bytes??null;
   })}finally{clean();res.removeListener('close',clean)}return;
  }
  if(req.method==='GET'&&(url.pathname==='/api/state'||url.pathname==='/api/frame'||url.pathname==='/api/next-frame')){
   const access=this.access(url.searchParams.get('token')??'');if(!access){this.json(res,403,{error:'forbidden'});return}
   const lightingOffAir=access.monitor?.profile==='lighting'&&this.live.onAir!==true;
   if(url.pathname==='/api/frame'||url.pathname==='/api/next-frame'){
    if(lightingOffAir){this.json(res,409,{error:'off-air'});return}
    const index=Number(url.searchParams.get('index')??0),revision=this.live.nextPreviewRevision;
    if(!Number.isInteger(index)||index<0||index>3){this.json(res,400,{error:'invalid-index'});return}
    if(index>0&&access.monitor?.profile!=='lighting'){this.json(res,403,{error:'forbidden'});return}
    const requestedRevision=url.searchParams.get('revision');
    if(url.pathname==='/api/next-frame'&&requestedRevision!==null&&Number(requestedRevision)!==revision){this.json(res,409,{error:'preview-changed'});return}
    const bytes=url.pathname==='/api/next-frame'?await this.nextFrame?.(index):this.live.onAir?await this.frame?.(access.monitor?.sourceType??'main'):null;
    if(access.monitor?.profile==='lighting'&&this.live.onAir!==true){this.json(res,409,{error:'off-air'});return}
    if(url.pathname==='/api/next-frame'&&revision!==this.live.nextPreviewRevision){this.json(res,409,{error:'preview-changed'});return}
    if(!bytes){this.json(res,503,{error:'output-unavailable'});return}
    res.writeHead(200,{'content-type':'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(bytes);return;
   }
   const monitor=access.monitor,remote=access.remote,canNotes=monitor?monitor.showNotes:remote!.permissions.includes('remote.viewNotes');
   const upcoming=monitor?.profile==='lighting'?(lightingOffAir?[]:(this.live.upcoming??[]).slice(0,4).map(packet=>({slide:publicSlide(packet.slide),itemTitle:typeof packet.itemTitle==='string'?packet.itemTitle.slice(0,1000):''}))):undefined;
   const streamAt=this.streamTimes.get((url.searchParams.get('token')??'')+'\0'+(url.searchParams.get('view')??''));
   this.json(res,200,{liveFrameAgeMs:streamAt===undefined?null:Date.now()-streamAt,title:lightingOffAir?monitor?.name:this.live.title,current:lightingOffAir?null:publicSlide(this.live.current),next:lightingOffAir?null:publicSlide(this.live.next),upcoming,onAir:this.live.onAir===true,serviceTime:this.live.serviceTime,serviceCountdownAtMs:this.live.serviceCountdownAtMs,annotationTakeId:this.live.annotationTakeId,nextPreviewRevision:this.live.nextPreviewRevision,canAnnotate:Boolean(remote?.permissions.includes('remote.annotate')&&!this.live.quickActive),permissions:remote?.permissions??[],monitor:monitor?{profile:monitor.profile??'personal',layout:monitor.layout,showCurrent:monitor.showCurrent,showNext:monitor.showNext,showClock:monitor.showClock,showCountdown:monitor.showCountdown}:undefined,notes:canNotes&&!lightingOffAir?this.live.notes:undefined,order:monitor?.showOrderOfService&&!lightingOffAir?this.live.order:undefined});return;
  }
  if(req.method==='POST'&&url.pathname==='/api/command'){
   try{
    const body=await this.body(req),remote=this.value.remotes.find(item=>item.token===body.token&&!item.revoked&&item.permissions.includes('remote.view'));
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
