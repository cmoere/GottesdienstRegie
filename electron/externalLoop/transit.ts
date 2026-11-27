import {createHash} from 'node:crypto';
import type {ExternalReply,ExternalSnapshot} from '../../shared/externalLoop';
import {TRANSIT_KEY,TRANSIT_LINES,TRANSIT_MAX_AGE_MS,TRANSIT_STOP_ID,TRANSIT_STOP_NAME,type TransitPayload,type TransitMessage} from '../../shared/transit';
import {readExternalSnapshot} from '../../shared/externalLoopValidation';
import type {NewsDependencies} from './news';

const record=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
function plain(value:unknown,max:number):string{
 if(typeof value!=='string'||value.length>max*3)return '';
 const text=value.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'').replace(/<\/?(?:br|p|div|li)\b[^>]*>/gi,'\n').replace(/<[^>]*>/g,'').replace(/&(?:amp|lt|gt|quot|apos|nbsp|#\d+|#x[\da-f]+);/gi,entity=>{
  const fixed:Record<string,string>={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '};if(fixed[entity.toLowerCase()])return fixed[entity.toLowerCase()];
  const n=entity.toLowerCase().startsWith('&#x')?parseInt(entity.slice(3,-1),16):parseInt(entity.slice(2,-1),10);return n>0&&n<=0x10ffff?String.fromCodePoint(n):'';
 }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/[ \t]+/g,' ').replace(/\n\s*\n/g,'\n').trim();
 return text.length<=max?text:'';
}
function epoch(value:unknown){return typeof value==='number'&&Number.isFinite(value)&&value>1000000000&&value<10000000000?Math.round(value*1000):null}
function forecast(plannedAt:number,planned:unknown,real:unknown){
 const minutes=(value:unknown)=>typeof value==='string'&&/^\d{2}:\d{2}$/.test(value)&&Number(value.slice(0,2))<24&&Number(value.slice(3))<60?Number(value.slice(0,2))*60+Number(value.slice(3)):null;
 const p=minutes(planned),r=minutes(real);if(p===null||r===null)return plannedAt;let difference=r-p;if(difference>720)difference-=1440;if(difference< -720)difference+=1440;return plannedAt+difference*60000;
}
export function parseTransitPayload(raw:unknown,now:number,previous:TransitPayload|null=null):{payload:TransitPayload;fetchedAt:number;stale:boolean}{
 if(!record(raw)||raw.ok!==true||raw.stopId!==TRANSIT_STOP_ID||!Array.isArray(raw.departures)||raw.departures.length>200)throw Error('invalid-transit');
 const updated=typeof raw.updatedAt==='number'&&Number.isFinite(raw.updatedAt)?raw.updatedAt:NaN;
 const staleAge=raw.stale===true&&typeof raw.staleAgeMs==='number'&&Number.isFinite(raw.staleAgeMs)?Math.max(0,raw.staleAgeMs):0;
 const fetchedAt=Math.min(updated,now-staleAge);if(!Number.isFinite(fetchedAt)||fetchedAt<now-TRANSIT_MAX_AGE_MS||fetchedAt>now+60000)throw Error('expired-transit');
 const departures:TransitPayload['departures']=[];
 for(const row of raw.departures){
  if(!record(row)||row.adminHidden===true)continue;
  const line=plain(row.line,20),destination=plain(row.destination||row.direction,2000),plannedAt=epoch(row.plannedEpoch);
  if(!TRANSIT_LINES.includes(line as typeof TRANSIT_LINES[number])||!destination||plannedAt===null)continue;
  const effectiveAt=epoch(row.effectiveDepartureEpoch)??forecast(plannedAt,row.planned??row.departure,row.real),cancelled=row.isCancelled===true;
  if((cancelled?plannedAt:effectiveAt)<=now||effectiveAt>now+2*86400000||Math.abs(effectiveAt-plannedAt)>86400000)continue;
  departures.push({line,destination,platform:plain(row.platform,300),plannedAt,effectiveAt,delayMinutes:Math.round((effectiveAt-plannedAt)/60000),cancelled,status:plain(row.status,3000),via:Array.isArray(row.viaStops)?row.viaStops.slice(0,40).map(stop=>plain(stop,1000)).filter(Boolean):[]});
 }
 departures.sort((a,b)=>(a.cancelled?a.plannedAt:a.effectiveAt)-(b.cancelled?b.plannedAt:b.effectiveAt));
 let messages:TransitMessage[]=[];
 const messagesUpdatedAt=raw.messageSourceAvailable===false?(previous?.messagesUpdatedAt??0):fetchedAt;
 if(raw.messageSourceAvailable===false)messages=previous&&now-previous.messagesUpdatedAt<=TRANSIT_MAX_AGE_MS?previous.messages:[];
 else if(Array.isArray(raw.messages)){
  const seen=new Set<string>();
  for(const row of raw.messages.slice(0,100)){
   if(!record(row)||row.adminHidden===true)continue;
   const sourceLines=Array.isArray(row.lines)?row.lines:row.line?[row.line]:[],lines=TRANSIT_LINES.filter(line=>sourceLines.some(rawLine=>String(rawLine).trim()===line));
   if(sourceLines.length&&!lines.length)continue;
   const title=plain(row.title||row.heading,3000),text=plain(row.description||row.displayText||row.descriptionHtml||row.text,12000);
   if(!title&&!text)continue;
   // EFA also supplies unassigned notices from distant cities. Only locally
   // identifiable or deliberately operator-curated general notices belong here.
   if(!lines.length&&row.custom!==true&&row.source!=='manual'&&!/Bielefeld|Beckhausstra(?:ß|ss)e|moBiel/i.test(title+' '+text))continue;
   const id=createHash('sha256').update(JSON.stringify([title,text,lines])).digest('hex').slice(0,24);if(seen.has(id))continue;seen.add(id);messages.push({id,title,text:text===title?'':text,lines});if(messages.length===25)break;
  }
 }
 return{payload:{kind:'transit',stopId:TRANSIT_STOP_ID,stopName:TRANSIT_STOP_NAME,walkMinutes:6,messagesUpdatedAt,departures:departures.slice(0,24),messages},fetchedAt,stale:raw.stale===true||raw.messageSourceAvailable===false};
}
export class TransitAdapter{
 private pending:Promise<ExternalReply>|null=null;
 private controller:AbortController|null=null;
 private attempted=-Infinity;
 private lastFailed=false;
 private disposed=false;
 constructor(private readonly dependencies:NewsDependencies){}
 private now(){return this.dependencies.now?.()??Date.now()}
 load():Promise<ExternalReply>{if(this.pending)return this.pending;const work=this.prepare().finally(()=>{this.pending=null});this.pending=work;return work}
 private async prepare():Promise<ExternalReply>{
  const empty:ExternalReply={snapshot:null,status:'unavailable'};if(this.disposed)return empty;
  const cached=await this.dependencies.cache.read(TRANSIT_KEY,TRANSIT_MAX_AGE_MS).catch(()=>null);if(this.disposed)return empty;
  const fallback=():ExternalReply=>cached&&this.now()-cached.fetchedAt<=TRANSIT_MAX_AGE_MS?{snapshot:{...cached,stale:true},status:'stale'}:empty;
  if(this.now()-this.attempted<20000)return this.lastFailed?fallback():cached?{snapshot:cached,status:cached.stale?'stale':'ready'}:empty;
  this.attempted=this.now();this.controller=new AbortController();
  try{
   const query=new URLSearchParams({stopId:TRANSIT_STOP_ID,limit:'24',min:'6',lines:TRANSIT_LINES.join(','),onlyRealtime:'0',toleranceSec:'15',includeNextDay:'1',forceNextDay:'0',realtimeTime:'0',status:'1',includeMessages:'1',currentMessagesOnly:'1',messageLimit:'25',liveVia:'1',client:'gottesdienstregie'});
   const raw=JSON.parse(await this.dependencies.fetchText('https://vrr-proxy.crbnm06.workers.dev/api/bottom-departures?'+query,this.controller.signal));
   const parsed=parseTransitPayload(raw,this.now(),cached?.payload.kind==='transit'?cached.payload:null);
   const snapshot:ExternalSnapshot={version:1,key:TRANSIT_KEY,revision:createHash('sha256').update(JSON.stringify(parsed.payload)).digest('hex'),fetchedAt:parsed.fetchedAt,stale:parsed.stale,payload:parsed.payload};
   if(!readExternalSnapshot(snapshot,TRANSIT_KEY,this.now()))throw Error('invalid-transit');
   if(this.disposed||this.controller.signal.aborted)return empty;
   await this.dependencies.cache.write(snapshot).catch(()=>{});this.lastFailed=false;return{snapshot,status:parsed.stale?'stale':'ready'};
  }catch{this.lastFailed=true;return this.disposed?empty:fallback()}finally{this.controller=null}
 }
 dispose(){this.disposed=true;this.controller?.abort()}
}
