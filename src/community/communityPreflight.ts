import {formatRegionalTemplate as sourceCopy} from '../../shared/regional/validation';
import {RoomService} from './RoomService';

export type CommunityPreflightEvent={id?:string;eventKey?:string;veranstaltungsort?:unknown;locationType?:unknown;hybrid_vorort_typ?:unknown;raum?:unknown;ort?:unknown;ersatzortType?:unknown;ersatzort?:unknown};
export type CommunityPreflightSnapshot={mode:'online'|'offline-cache'|'empty'|'error';updatedAt?:number;events:CommunityPreflightEvent[];rooms:unknown;announcements:Array<{id?:string;messageId?:string}>;loaded?:{events:boolean;rooms:boolean;announcements:boolean};postProgramPrepared?:boolean};
export type CommunityLoopItem={id:string;type:string;target?:string};
export interface CommunityPreflightResult{ready:boolean;warnings:string[];eventCount:number;roomCount:number;announcementCount:number;linkedEventResolved:boolean;currentRoomResolved:boolean;postProgramPrepared:boolean}

const text=(value:unknown)=>typeof value==='string'?value.trim():'';
export function communityPreflight(snapshot:CommunityPreflightSnapshot,linkedEventKey:string|undefined,loopItems:CommunityLoopItem[],copy=sourceCopy):CommunityPreflightResult{
  const warnings:string[]=[];
  if(snapshot.mode==='offline-cache')warnings.push(copy("Offline · letzter Stand {value1} Uhr",{value1:String((snapshot.updatedAt?new Date(snapshot.updatedAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}):"—"))}));
  else if(snapshot.mode==='empty'||snapshot.mode==='error')warnings.push(copy("Gemeindedaten sind derzeit nicht verfügbar."));
  if(snapshot.loaded&&!snapshot.loaded.events)warnings.push(copy("Veranstaltungen wurden noch nicht geladen."));
  if(snapshot.loaded&&!snapshot.loaded.rooms)warnings.push(copy("Räume wurden noch nicht geladen."));
  if(snapshot.loaded&&!snapshot.loaded.announcements)warnings.push(copy("Meldungen wurden noch nicht geladen."));
  const linkedEvent=snapshot.events.find(event=>(event.eventKey??event.id)===linkedEventKey),linkedEventResolved=!linkedEventKey||Boolean(linkedEvent),rooms=new RoomService(snapshot.rooms),roomCount=rooms.roomsById.size;
  if(linkedEventKey&&!linkedEventResolved)warnings.push(copy("Die verknüpfte Veranstaltung wurde nicht gefunden."));
  let currentRoomResolved=true;
  if(linkedEvent){
    const type=text(linkedEvent.veranstaltungsort??linkedEvent.locationType),roomType=type==='raum'||(type==='hybrid'&&text(linkedEvent.hybrid_vorort_typ)==='raum'),roomRef=roomType?text(linkedEvent.raum)||text(linkedEvent.ort):'';
    if(roomRef&&!rooms.resolve(roomRef)){currentRoomResolved=false;warnings.push(copy("Raum {value1} konnte unter /rooms nicht aufgelöst werden.",{value1:String(roomRef)}))}
    const replacement=text(linkedEvent.ersatzort);if(text(linkedEvent.ersatzortType)==='raum'&&replacement&&!rooms.resolve(replacement)){currentRoomResolved=false;warnings.push(copy("Ersatzraum {value1} konnte unter /rooms nicht aufgelöst werden.",{value1:String(replacement)}))}
  }
  const postProgramPrepared=snapshot.postProgramPrepared===true;
  if(!postProgramPrepared)warnings.push(copy("Die Nachprogramm-Raumanzeige ist noch nicht vorbereitet."));
  for(const item of loopItems){
    const empty=item.type==='announcement'?snapshot.announcements.length===0:item.type==='event'?snapshot.events.length===0:false;
    if(empty)warnings.push(copy("Das optionale Loop-Element {value1} hat keine gültigen Inhalte und wird übersprungen.",{value1:String(item.id)}));
  }
  return{ready:true,warnings,eventCount:snapshot.events.length,roomCount,announcementCount:snapshot.announcements.length,linkedEventResolved,currentRoomResolved,postProgramPrepared};
}
