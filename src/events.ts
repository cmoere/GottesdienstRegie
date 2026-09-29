import {EventCommandService} from './community/EventCommandService';
import {EventService,type ChurchEvent} from './community/EventService';
export type {ChurchEvent} from './community/EventService';

const service=new EventService();
let events:ChurchEvent[]=[],started:Promise<void>|null=null;
const bridge=()=>((window.desktop as any)?.community as undefined|{start:()=>Promise<unknown>;onEvents:(callback:(value:unknown)=>void)=>()=>void;updateEvent:(eventKey:string,patch:Record<string,unknown>)=>Promise<unknown>});

function ensureStarted(){
  if(started)return started;
  started=new Promise(resolve=>{const api=bridge();if(!api){resolve();return}let resolved=false;api.onEvents(value=>{events=Array.isArray(value)?value as ChurchEvent[]:[];service.setEvents(events);if(!resolved){resolved=true;resolve()}});void api.start().catch(()=>resolve());setTimeout(()=>{if(!resolved){resolved=true;resolve()}},2500)});
  return started;
}

export function isCancelled(event:ChurchEvent|null|undefined){return event?service.isCancelled(event):false}
export async function listChurchEvents(){await ensureStarted();return service.getUpcomingEvents(events,new Date(0))}
export async function getChurchEvent(eventKey:string){await ensureStarted();return service.getByKey(eventKey)}

const localDateTime=(date:string,time:string)=>new Date(`${date}T${time||'00:00'}:00`);
export async function updateEventDelay(eventKey:string,newServiceTime:string){
  const event=await getChurchEvent(eventKey);if(!event)throw new Error('Die verknüpfte Veranstaltung wurde nicht gefunden.');
  const plannedStart=localDateTime(String(event.start_datum??''),String(event.start_uhrzeit??'')),plannedEnd=localDateTime(String(event.ende_datum??event.start_datum??''),String(event.ende_uhrzeit??event.start_uhrzeit??''));
  const actualStart=localDateTime(String(event.start_datum??''),newServiceTime);let delta=actualStart.getTime()-plannedStart.getTime();if(delta>43200000){actualStart.setDate(actualStart.getDate()-1);delta=actualStart.getTime()-plannedStart.getTime()}else if(delta< -43200000){actualStart.setDate(actualStart.getDate()+1);delta=actualStart.getTime()-plannedStart.getTime()}
  const actualEnd=new Date(plannedEnd.getTime()+delta),api=bridge();if(!api)throw new Error('Veranstaltungsdienst ist nicht verfügbar.');
  if(newServiceTime===event.start_uhrzeit){await api.updateEvent(eventKey,{Verspaetungsanfangsdatum:null,Verspaetungsanfangsuhrzeit:null,Verspaetungsenddatum:null,Verspaetungsenduhrzeit:null});return{event,delayMinutes:0,actualEnd:plannedEnd}}
  await new EventCommandService((key,patch)=>api.updateEvent(key,patch)).updateEffectiveServiceTime(eventKey,{start:actualStart,end:actualEnd});
  return{event,delayMinutes:Math.round(delta/60000),actualEnd};
}
