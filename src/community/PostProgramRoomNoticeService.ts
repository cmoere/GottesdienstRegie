import {EventService} from './EventService';

export const LEAVE_ROOM_TEXT='Wir bitten alle Besucher, den Raum zu verlassen.';
export type PostProgramEventRow={id:string;title:string;start:string;end?:string;room:string};
export type PostProgramRoomNotice=
  |{type:'next-events';events:PostProgramEventRow[]}
  |{type:'leave-room';text:typeof LEAVE_ROOM_TEXT};
export type PostProgramRoomNoticeSnapshot={sessionId:number;headerColor:'#608F9A'|'#699F3E';notice:PostProgramRoomNotice;page:number;pageCount:number};
export type PresentationEventLink={linkedEventKey?:string;eventLink?:{eventKey?:string}};

const roomLabel=(location:{name:string;floor?:string})=>[location.name,location.floor].filter(Boolean).join(' · ');
const clock=(date:Date)=>new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit'}).format(date)+' Uhr';

export class PostProgramRoomNoticeService{
  constructor(private readonly events:EventService){}
  compute(presentation:PresentationEventLink,now:Date):PostProgramRoomNotice|null{
    const linkedEventKey=presentation.linkedEventKey??presentation.eventLink?.eventKey,current=this.events.getByKey(linkedEventKey??''),currentLocation=current&&this.events.getEffectiveLocation(current);
    if(!current||currentLocation?.type!=='room'||!currentLocation.roomId)return null;
    const nowMs=now.getTime(),endMs=nowMs+61*60_000;
    const candidates=this.events.getAllEvents().flatMap(event=>{
      if(event.eventKey===current.eventKey||this.events.isCancelled(event)||this.events.isTrashed(event))return[];
      const start=this.events.getEffectiveStart(event),location=this.events.getEffectiveLocation(event);
      if(!start||location?.type!=='room'||location.roomId!==currentLocation.roomId||start.getTime()<=nowMs||start.getTime()>endMs)return[];
      return[{event,start,location}];
    }).sort((a,b)=>a.start.getTime()-b.start.getTime());
    if(!candidates.length)return{type:'leave-room',text:LEAVE_ROOM_TEXT};
    return{type:'next-events',events:candidates.map(({event,start,location})=>({id:event.eventKey,title:String(event.titel??'').trim(),start:start.toISOString(),end:this.events.getEffectiveEnd(event)?.toISOString(),room:roomLabel(location)}))};
  }
}

export function postProgramNoticeText(notice:PostProgramRoomNotice){return notice.type==='next-events'?['Ihre nächsten Veranstaltungen',...notice.events.map(event=>[event.title,clock(new Date(event.start)),event.room].join(' · '))].join('\n'):notice.text}

export class PostProgramRoomNoticeController{
  private active:PostProgramRoomNoticeSnapshot|null=null;
  private pending:PostProgramRoomNotice|null=null;
  private session:{id:number;headerColor:'#608F9A'|'#699F3E'}|null=null;
  private serial=0;private page=-1;
  constructor(private readonly service:PostProgramRoomNoticeService,private readonly random:()=>number=Math.random){}
  enterPostProgram(){if(!this.session){this.session={id:++this.serial,headerColor:this.random()<.5?'#608F9A':'#699F3E'};this.page=-1}}
  prepare(presentation:PresentationEventLink,now:Date){this.pending=this.service.compute(presentation,now);return this.pending}
  current(){return this.active}
  beginTransition(){this.enterPostProgram();if(!this.pending){this.active=null;return null}const pageCount=this.pending.type==='next-events'?Math.ceil(this.pending.events.length/6):1;this.page=(this.page+1)%pageCount;this.active={sessionId:this.session!.id,headerColor:this.session!.headerColor,notice:structuredClone(this.pending),page:this.page,pageCount};return this.active}
  leavePostProgram(){this.session=null;this.active=null;this.pending=null;this.page=-1}
}

export function withPostProgramRoomNotice<T extends object>(output:T,notice:PostProgramRoomNoticeSnapshot):T&{postProgramRoomNotice:PostProgramRoomNoticeSnapshot}{return{...output,postProgramRoomNotice:notice}}
