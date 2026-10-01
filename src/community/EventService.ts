import {RoomService,type NormalizedRoom} from './RoomService';
export type ChurchEvent=Record<string,any>&{eventKey:string;titel:string;start_datum:string;start_uhrzeit:string;ende_datum:string;ende_uhrzeit:string};
export interface PublicEvent{id:string;title:string;plannedStart:string;plannedEnd:string;effectiveStart:string;effectiveEnd:string;plannedLocation:string;effectiveLocation:string;plannedLocationDetails:NormalizedRoom|null;effectiveLocationDetails:NormalizedRoom|null;additionalLocations:NormalizedRoom[];delayed:boolean;cancelled:boolean;locationChanged:boolean;infoText:string;coverUrl:string;registrationRequired:boolean;preacher:string;sermonTitle:string}

const text=(value:unknown)=>typeof value==='string'?value.trim():'';
const bool=(value:unknown)=>value===true||value===1||value==='true';
function dateTime(date:unknown,time:unknown):Date|null{
  const day=text(date),clock=text(time)||'00:00';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^\d{1,2}:\d{2}$/.test(clock))return null;
  const value=new Date(`${day}T${clock.padStart(5,'0')}:00Z`);
  return Number.isNaN(value.valueOf())?null:value;
}
const iso=(value:Date|null)=>value?.toISOString()??'';

export class EventService{
  constructor(private events:ChurchEvent[]=[],private rooms=new RoomService()){ }
  setEvents(events:ChurchEvent[]){this.events=events.slice()}
  setRooms(rooms:RoomService){this.rooms=rooms}
  getByKey(eventKey:string){return this.events.find(event=>event.eventKey===eventKey)??null}
  getPlannedStart(event:ChurchEvent){return dateTime(event.start_datum,event.start_uhrzeit)}
  getPlannedEnd(event:ChurchEvent){return dateTime(event.ende_datum??event.start_datum,event.ende_uhrzeit)}
  getEffectiveStart(event:ChurchEvent){const delay=event.delay as any;return dateTime(event.Verspaetungsanfangsdatum,event.Verspaetungsanfangsuhrzeit)??(delay?.start?new Date(delay.start):null)??this.getPlannedStart(event)}
  getEffectiveEnd(event:ChurchEvent){const delay=event.delay as any;return dateTime(event.Verspaetungsenddatum,event.Verspaetungsenduhrzeit)??(delay?.end?new Date(delay.end):null)??this.getPlannedEnd(event)}
  isCancelled(event:ChurchEvent){return bool(event.cancelled)||bool((event.cancel as any)?.enabled)}
  private location(event:ChurchEvent,replacement=false):{label:string;room:NormalizedRoom|null}{
    const type=replacement?text(event.ersatzortType):text(event.veranstaltungsort),hybridRoom=type==='hybrid'&&text(event.hybrid_vorort_typ)==='raum',roomType=type==='raum'||hybridRoom,reference=replacement?event.ersatzort:event.raum??event.ort;
    if(roomType){const room=this.rooms.resolve(reference);return{label:room?this.rooms.display(room.roomId):'Raum',room}}
    if(type==='online')return{label:'Online',room:null};
    const label=text(replacement?event.ersatzort:event.externenOrt)||text(replacement?event.ersatzort:event.ort)||(type==='hybrid'?'Online':'');return{label,room:null};
  }
  getEffectiveLocation(event:ChurchEvent){const changed=text(event.ersatzort)||text((event.locationChange as any)?.location);if(changed){if(text(event.ersatzortType)==='raum')return this.location(event,true).label;return changed}return this.location(event).label}
  isPublic(event:ChurchEvent){return !bool(event.trash)&&!event.trashAt&&event.sichtbar!==false&&!this.isCancelled(event)&&Boolean(this.getEffectiveStart(event))}
  getUpcomingEvents(events=this.events,now=new Date()){return events.filter(event=>this.isPublic(event)&&this.getEffectiveEnd(event)!.valueOf()>=now.valueOf()).sort((a,b)=>this.getEffectiveStart(a)!.valueOf()-this.getEffectiveStart(b)!.valueOf())}
  toPublicEvent(event:ChurchEvent):PublicEvent{
    const plannedStart=this.getPlannedStart(event),plannedEnd=this.getPlannedEnd(event),effectiveStart=this.getEffectiveStart(event),effectiveEnd=this.getEffectiveEnd(event),planned=this.location(event),replacement=text(event.ersatzort)?(text(event.ersatzortType)==='raum'?this.location(event,true):{label:text(event.ersatzort),room:null}):planned,plannedLocation=planned.label,effectiveLocation=replacement.label,additionalIds=Array.isArray(event.zusatzraeume)?event.zusatzraeume:Array.isArray(event.zusatz_rooms)?event.zusatz_rooms:[],additionalLocations=additionalIds.flatMap((id:unknown)=>{const room=this.rooms.resolve(id);return room?[room]:[]});
    return{id:event.eventKey,title:text(event.titel),plannedStart:iso(plannedStart),plannedEnd:iso(plannedEnd),effectiveStart:iso(effectiveStart),effectiveEnd:iso(effectiveEnd),plannedLocation,effectiveLocation,plannedLocationDetails:planned.room,effectiveLocationDetails:replacement.room,additionalLocations,delayed:iso(plannedStart)!==iso(effectiveStart),cancelled:this.isCancelled(event),locationChanged:plannedLocation!==effectiveLocation,infoText:text(event.infotext),coverUrl:text(event.coverUrl),registrationRequired:bool(event.anmeldung_erforderlich)||bool((event.registration as any)?.required),preacher:text(event.prediger),sermonTitle:text(event.predigtTitel)};
  }
}
