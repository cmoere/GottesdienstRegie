import {RoomService,type NormalizedRoom} from './RoomService';
export type ChurchEvent=Record<string,any>&{eventKey:string;titel:string;start_datum:string;start_uhrzeit:string;ende_datum:string;ende_uhrzeit:string};
export type EventLocation=NormalizedRoom|{type:'external';name:string}|{type:'online';name:'Online'}|null;
export interface PublicEvent{id:string;title:string;plannedStart:string;plannedEnd:string;effectiveStart:string;effectiveEnd:string;plannedLocation:string;effectiveLocation:string;plannedLocationDetails:NormalizedRoom|null;effectiveLocationDetails:NormalizedRoom|null;additionalLocations:NormalizedRoom[];delayed:boolean;cancelled:boolean;locationChanged:boolean;infoText:string;coverUrl:string;registrationRequired:boolean;preacher:string;sermonTitle:string}

const text=(value:unknown)=>typeof value==='string'?value.trim():'';
const bool=(value:unknown)=>value===true||value===1||value==='true';
function dateTime(date:unknown,time:unknown):Date|null{
  const day=text(date),clock=text(time)||'00:00';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!/^([01]?\d|2[0-3]):[0-5]\d$/.test(clock))return null;
  const [year,month,dateOfMonth]=day.split('-').map(Number),[hour,minute]=clock.split(':').map(Number),result=new Date(year,month-1,dateOfMonth,hour,minute,0,0);
  return result.getFullYear()===year&&result.getMonth()===month-1&&result.getDate()===dateOfMonth&&result.getHours()===hour&&result.getMinutes()===minute?result:null;
}
function delayedDate(value:unknown,baseDate?:unknown,baseTime?:unknown):Date|null{
  if(typeof value==='string'){const result=new Date(value);return Number.isNaN(result.valueOf())?null:result}
  if(value&&typeof value==='object'){const entry=value as Record<string,unknown>;return dateTime(text(entry.date)||baseDate,text(entry.time)||baseTime)}
  return null;
}
const iso=(value:Date|null)=>value?.toISOString()??'';
const effectiveDate=(date:unknown,time:unknown,baseDate:unknown,baseTime:unknown)=>text(date)||text(time)?dateTime(text(date)||baseDate,text(time)||baseTime):null;
const roomDetails=(location:EventLocation)=>location?.type==='room'?location:null;
const locationLabel=(location:EventLocation)=>location?.type==='room'?[location.name,location.floor,location.building].filter(Boolean).join(' · '):location?.name??'';

export class EventService{
  private eventsByKey=new Map<string,ChurchEvent>();
  constructor(events:ChurchEvent[]=[],private rooms=new RoomService()){this.setEvents(events)}
  setEvents(events:ChurchEvent[]){this.eventsByKey=new Map(events.filter(event=>event?.eventKey).map(event=>[event.eventKey,event]))}
  setRooms(rooms:RoomService){this.rooms=rooms}
  getAllEvents(){return [...this.eventsByKey.values()]}
  upsert(event:ChurchEvent){if(event?.eventKey)this.eventsByKey.set(event.eventKey,event)}
  remove(eventKey:string){this.eventsByKey.delete(eventKey)}
  getByKey(eventKey:string){return this.eventsByKey.get(eventKey)??null}
  getPlannedStart(event:ChurchEvent){return dateTime(event.start_datum,event.start_uhrzeit)}
  getPlannedEnd(event:ChurchEvent){return text(event.ende_uhrzeit)?dateTime(event.ende_datum||event.start_datum,event.ende_uhrzeit):null}
  getEffectiveStart(event:ChurchEvent){return effectiveDate(event.Verspaetungsanfangsdatum,event.Verspaetungsanfangsuhrzeit,event.start_datum,event.start_uhrzeit)??delayedDate(event.delay?.start,event.start_datum,event.start_uhrzeit)??this.getPlannedStart(event)}
  getEffectiveEnd(event:ChurchEvent){return effectiveDate(event.Verspaetungsenddatum,event.Verspaetungsenduhrzeit,event.ende_datum||event.start_datum,event.ende_uhrzeit)??delayedDate(event.delay?.end,event.ende_datum||event.start_datum,event.ende_uhrzeit)??this.getPlannedEnd(event)}
  isCancelled(event:ChurchEvent){return bool(event.cancelled)||bool(event.cancel?.enabled)}
  isTrashed(event:ChurchEvent){return bool(event.trash)||Boolean(event.trashAt)||bool(event.deleted)}
  private resolveLocation(typeValue:unknown,roomReference:unknown,externalReference:unknown):EventLocation{
    const type=text(typeValue);
    if(type==='raum'){const room=this.rooms.resolve(roomReference);return room??{type:'external',name:'Raum'}}
    if(type==='online')return{type:'online',name:'Online'};
    const name=text(externalReference);return name?{type:'external',name}:null;
  }
  getPlannedLocation(event:ChurchEvent):EventLocation{
    const type=text(event.veranstaltungsort??event.locationType),hybridType=text(event.hybrid_vorort_typ);
    if(type==='hybrid')return hybridType==='raum'?this.resolveLocation('raum',event.raum||event.ort,''):this.resolveLocation('ort','',event.externenOrt||event.ort);
    if(type==='raum')return this.resolveLocation('raum',event.raum||event.ort,'');
    if(type==='online')return this.resolveLocation('online','','');
    if(!type){const ref=text(event.raum)||text(event.ort),room=this.rooms.resolve(ref);if(room)return room;if(text(event.raum)||/^-[A-Za-z0-9_-]+$/.test(ref))return null}
    return this.resolveLocation('ort','',event.externenOrt||event.ort);
  }
  getEffectiveLocation(event:ChurchEvent):EventLocation{
    const replacement=text(event.ersatzort)||text(event.locationChange?.location);
    if(!replacement)return this.getPlannedLocation(event);
    return text(event.ersatzortType)==='raum'?this.resolveLocation('raum',replacement,''):this.resolveLocation('ort','',replacement);
  }
  isPublic(event:ChurchEvent){return !this.isTrashed(event)&&event.sichtbar!==false&&!this.isCancelled(event)&&Boolean(this.getEffectiveStart(event))}
  getUpcomingEvents(events=this.getAllEvents(),now=new Date()){return events.filter(event=>{const end=this.getEffectiveEnd(event)??this.getEffectiveStart(event);return this.isPublic(event)&&Boolean(end&&end.valueOf()>=now.valueOf())}).sort((a,b)=>(this.getEffectiveStart(a)?.valueOf()??Infinity)-(this.getEffectiveStart(b)?.valueOf()??Infinity))}
  toPublicEvent(event:ChurchEvent):PublicEvent{
    const plannedStart=this.getPlannedStart(event),plannedEnd=this.getPlannedEnd(event),effectiveStart=this.getEffectiveStart(event),effectiveEnd=this.getEffectiveEnd(event),planned=this.getPlannedLocation(event),effective=this.getEffectiveLocation(event),plannedLocation=locationLabel(planned),effectiveLocation=locationLabel(effective),additionalIds=Array.isArray(event.zusatzraeume)?event.zusatzraeume:Array.isArray(event.zusatz_rooms)?event.zusatz_rooms:[],additionalLocations=additionalIds.flatMap((id:unknown)=>{const room=this.rooms.resolve(id);return room?[room]:[]});
    return{id:event.eventKey,title:text(event.titel),plannedStart:iso(plannedStart),plannedEnd:iso(plannedEnd),effectiveStart:iso(effectiveStart),effectiveEnd:iso(effectiveEnd),plannedLocation,effectiveLocation,plannedLocationDetails:roomDetails(planned),effectiveLocationDetails:roomDetails(effective),additionalLocations,delayed:iso(plannedStart)!==iso(effectiveStart),cancelled:this.isCancelled(event),locationChanged:plannedLocation!==effectiveLocation,infoText:text(event.infotext),coverUrl:text(event.coverUrl),registrationRequired:bool(event.anmeldung_erforderlich)||bool(event.registration?.required),preacher:text(event.prediger),sermonTitle:text(event.predigtTitel)};
  }
}
