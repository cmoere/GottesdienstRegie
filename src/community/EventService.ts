export type ChurchEvent=Record<string,any>&{eventKey:string;titel:string;start_datum:string;start_uhrzeit:string;ende_datum:string;ende_uhrzeit:string};
export interface PublicEvent{id:string;title:string;plannedStart:string;plannedEnd:string;effectiveStart:string;effectiveEnd:string;plannedLocation:string;effectiveLocation:string;delayed:boolean;cancelled:boolean;locationChanged:boolean;infoText:string;coverUrl:string;registrationRequired:boolean;preacher:string;sermonTitle:string}

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
  constructor(private events:ChurchEvent[]=[]){ }
  setEvents(events:ChurchEvent[]){this.events=events.slice()}
  getByKey(eventKey:string){return this.events.find(event=>event.eventKey===eventKey)??null}
  getPlannedStart(event:ChurchEvent){return dateTime(event.start_datum,event.start_uhrzeit)}
  getPlannedEnd(event:ChurchEvent){return dateTime(event.ende_datum??event.start_datum,event.ende_uhrzeit)}
  getEffectiveStart(event:ChurchEvent){const delay=event.delay as any;return dateTime(event.Verspaetungsanfangsdatum,event.Verspaetungsanfangsuhrzeit)??(delay?.start?new Date(delay.start):null)??this.getPlannedStart(event)}
  getEffectiveEnd(event:ChurchEvent){const delay=event.delay as any;return dateTime(event.Verspaetungsenddatum,event.Verspaetungsenduhrzeit)??(delay?.end?new Date(delay.end):null)??this.getPlannedEnd(event)}
  isCancelled(event:ChurchEvent){return bool(event.cancelled)||bool((event.cancel as any)?.enabled)}
  getEffectiveLocation(event:ChurchEvent){return text(event.ersatzort)||text((event.locationChange as any)?.location)||text(event.ort)||text(event.externenOrt)}
  isPublic(event:ChurchEvent){return !bool(event.trash)&&!event.trashAt&&event.sichtbar!==false&&!this.isCancelled(event)&&Boolean(this.getEffectiveStart(event))}
  getUpcomingEvents(events=this.events,now=new Date()){return events.filter(event=>this.isPublic(event)&&this.getEffectiveEnd(event)!.valueOf()>=now.valueOf()).sort((a,b)=>this.getEffectiveStart(a)!.valueOf()-this.getEffectiveStart(b)!.valueOf())}
  toPublicEvent(event:ChurchEvent):PublicEvent{
    const plannedStart=this.getPlannedStart(event),plannedEnd=this.getPlannedEnd(event),effectiveStart=this.getEffectiveStart(event),effectiveEnd=this.getEffectiveEnd(event),plannedLocation=text(event.ort)||text(event.externenOrt),effectiveLocation=this.getEffectiveLocation(event);
    return{id:event.eventKey,title:text(event.titel),plannedStart:iso(plannedStart),plannedEnd:iso(plannedEnd),effectiveStart:iso(effectiveStart),effectiveEnd:iso(effectiveEnd),plannedLocation,effectiveLocation,delayed:iso(plannedStart)!==iso(effectiveStart),cancelled:this.isCancelled(event),locationChanged:plannedLocation!==effectiveLocation,infoText:text(event.infotext),coverUrl:text(event.coverUrl),registrationRequired:bool(event.anmeldung_erforderlich)||bool((event.registration as any)?.required),preacher:text(event.prediger),sermonTitle:text(event.predigtTitel)};
  }
}
