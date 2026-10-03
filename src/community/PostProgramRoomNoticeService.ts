import {EventService} from './EventService';

export const LEAVE_ROOM_TEXT='Wir bitten alle Besucher, den Raum zu verlassen.';
export type PostProgramRoomNotice=
  |{type:'next-event';eventId:string;heading:'IHRE NÄCHSTE VERANSTALTUNG';title:string;time:string;room:string;minutesUntil:number}
  |{type:'leave-room';text:typeof LEAVE_ROOM_TEXT};
export type PresentationEventLink={linkedEventKey?:string;eventLink?:{eventKey?:string}};

const roomLabel=(location:{name:string;floor?:string})=>[location.name,location.floor].filter(Boolean).join(' · ');
const clock=(date:Date)=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(date)+' Uhr';

export class PostProgramRoomNoticeService{
  constructor(private readonly events:EventService){}
  compute(presentation:PresentationEventLink,now:Date):PostProgramRoomNotice{
    const linkedEventKey=presentation.linkedEventKey??presentation.eventLink?.eventKey,current=this.events.getByKey(linkedEventKey??''),currentLocation=current&&this.events.getEffectiveLocation(current);
    if(!current||currentLocation?.type!=='room')return{type:'leave-room',text:LEAVE_ROOM_TEXT};
    const nowMs=now.getTime(),endMs=nowMs+61*60_000;
    const candidates=this.events.getAllEvents().flatMap(event=>{
      if(event.eventKey===current.eventKey||this.events.isCancelled(event)||this.events.isTrashed(event))return[];
      const start=this.events.getEffectiveStart(event),location=this.events.getEffectiveLocation(event);
      if(!start||location?.type!=='room'||location.roomId!==currentLocation.roomId||start.getTime()<=nowMs||start.getTime()>endMs)return[];
      return[{event,start,location}];
    }).sort((a,b)=>a.start.getTime()-b.start.getTime());
    const selected=candidates[0];
    if(!selected)return{type:'leave-room',text:LEAVE_ROOM_TEXT};
    return{type:'next-event',eventId:selected.event.eventKey,heading:'IHRE NÄCHSTE VERANSTALTUNG',title:String(selected.event.titel??'').trim(),time:clock(selected.start),room:roomLabel(selected.location),minutesUntil:Math.max(1,Math.ceil((selected.start.getTime()-nowMs)/60_000))};
  }
}

export function postProgramNoticeText(notice:PostProgramRoomNotice){return notice.type==='next-event'?[notice.heading,notice.title,notice.time,notice.room,`Beginn in ${notice.minutesUntil} Minuten`].filter(Boolean).join('\n'):notice.text}

export class PostProgramRoomNoticeController{
  private active:PostProgramRoomNotice|null=null;
  private pending:PostProgramRoomNotice|null=null;
  private displaying=false;
  constructor(private readonly service:PostProgramRoomNoticeService){}
  prepare(presentation:PresentationEventLink,now:Date){const next=this.service.compute(presentation,now);if(this.displaying)this.pending=next;else this.active=next;return next}
  current(){return this.active}
  beginTransition(){if(this.pending){this.active=this.pending;this.pending=null}this.displaying=true;return this.active}
  leavePostProgram(){this.displaying=false;this.pending=null}
}

export function withPostProgramRoomNotice<T extends object>(output:T,notice:PostProgramRoomNotice):T&{postProgramRoomNotice:PostProgramRoomNotice}{return{...output,postProgramRoomNotice:notice}}
