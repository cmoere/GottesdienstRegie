import { signInAnonymously } from 'firebase/auth';
import { get, ref, update } from 'firebase/database';
import { communityAuth, communityDatabase } from './firebase';

export interface ChurchEvent{
  eventKey:string;titel:string;start_datum:string;start_uhrzeit:string;ende_datum:string;ende_uhrzeit:string;ganztag?:boolean;trash?:boolean;trashAt?:unknown;
  cancel?:{enabled?:boolean}|boolean;cancelled?:boolean|string;
  Verspaetungsanfangsdatum?:string;Verspaetungsanfangsuhrzeit?:string;Verspaetungsenddatum?:string;Verspaetungsenduhrzeit?:string;
}

export function isCancelled(event:ChurchEvent|null|undefined){if(!event)return false;const compatible=event.cancelled===true||String(event.cancelled).toLowerCase()==='true';return event.cancel===true||typeof event.cancel==='object'&&event.cancel?.enabled===true||compatible}

async function authenticated(){if(!communityAuth.currentUser)await signInAnonymously(communityAuth)}
const eventRef=(eventKey='')=>ref(communityDatabase,`veranstaltungen${eventKey?`/${eventKey}`:''}`);
export async function listChurchEvents(){await authenticated();const snapshot=await get(eventRef());const raw=snapshot.val() as Record<string,Record<string,unknown>>|null;return Object.entries(raw??{}).map(([eventKey,value])=>({eventKey,...value} as ChurchEvent)).filter(item=>item.titel&&!item.trash&&!item.trashAt).sort((a,b)=>`${a.start_datum}T${a.start_uhrzeit||'00:00'}`.localeCompare(`${b.start_datum}T${b.start_uhrzeit||'00:00'}`))}
export async function getChurchEvent(eventKey:string){await authenticated();const snapshot=await get(eventRef(eventKey));return snapshot.exists()?({eventKey,...snapshot.val()} as ChurchEvent):null}
const localDateTime=(date:string,time:string)=>new Date(`${date}T${time||'00:00'}:00`);
const datePart=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const timePart=(date:Date)=>`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
export async function updateEventDelay(eventKey:string,newServiceTime:string){
  const event=await getChurchEvent(eventKey);if(!event)throw new Error('Die verknüpfte Veranstaltung wurde nicht gefunden.');
  const plannedStart=localDateTime(event.start_datum,event.start_uhrzeit),plannedEnd=localDateTime(event.ende_datum||event.start_datum,event.ende_uhrzeit||event.start_uhrzeit);
  const actualStart=localDateTime(event.start_datum,newServiceTime);let delta=actualStart.getTime()-plannedStart.getTime();if(delta>43200000){actualStart.setDate(actualStart.getDate()-1);delta=actualStart.getTime()-plannedStart.getTime()}else if(delta< -43200000){actualStart.setDate(actualStart.getDate()+1);delta=actualStart.getTime()-plannedStart.getTime()}
  if(newServiceTime===event.start_uhrzeit){await update(eventRef(eventKey),{Verspaetungsanfangsdatum:null,Verspaetungsanfangsuhrzeit:null,Verspaetungsenddatum:null,Verspaetungsenduhrzeit:null});return{event,delayMinutes:0,actualEnd:plannedEnd}}
  const actualEnd=new Date(plannedEnd.getTime()+delta);
  await update(eventRef(eventKey),{Verspaetungsanfangsdatum:datePart(actualStart),Verspaetungsanfangsuhrzeit:timePart(actualStart),Verspaetungsenddatum:datePart(actualEnd),Verspaetungsenduhrzeit:timePart(actualEnd)});
  return{event,delayMinutes:Math.round(delta/60000),actualEnd};
}
