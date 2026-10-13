import {paginatePostEvents,eventTextWidth,wrapEventText,type PreparedPostRow} from '../eventPagination';
import {prepareEventScrollPlan,type EventScrollPlan} from '../eventScroll';
import {EventService} from './EventService';
import {createTestEvents,type TestEventScenario} from './postProgramTestData';

export const LEAVE_ROOM_TEXT='Wir bitten alle Besucher, den Raum zu verlassen.';
export type PostProgramEventRow={id:string;title:string;start:string;end?:string;room:string;status?:'normal'|'delayed'|'cancelled'|'room-changed';plannedStart?:string};
export type PostProgramRoomNotice=
  |{type:'next-events';events:PostProgramEventRow[]}
  |{type:'leave-room';text:typeof LEAVE_ROOM_TEXT};
export type PostProgramRoomNoticeSnapshot={sessionId:number;headerColor:'#608F9A'|'#699F3E';notice:PostProgramRoomNotice;page:number;pageCount:number;pages?:PreparedPostRow[][];scrollPlan?:EventScrollPlan;minDurationMs?:number;startedAtMs?:number;reducedMotionPages?:PreparedPostRow[][]};
export function postEventTitle(event:PostProgramEventRow){return `${event.title}${event.status==='cancelled'?' · Fällt aus':event.status==='delayed'?' · Verspätung (+5 Min.)':event.status==='room-changed'?' · Raum geändert':''}`}
export function preparePostEventPresentation(events:PostProgramEventRow[]){
 const widths=[411.36,355.2,710.88,336.96];
 const horizontalOverflow=Math.max(0,...events.flatMap(event=>[new Date(event.start).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}),`${new Date(event.start).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}${event.end?`–${new Date(event.end).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}`:''}`,postEventTitle(event),event.room].map((text,index)=>eventTextWidth(text,46.08)-widths[index])));
 const scrollPlan=prepareEventScrollPlan({contentHeight:events.length*103.68,viewportHeight:808.176,horizontalOverflow});
 const reducedMotionPages:PreparedPostRow[][]=[];let page:PreparedPostRow[]=[],usedHeight=0;
 for(const event of events){const titleLines=wrapEventText(postEventTitle(event),widths[2],46.08),roomLines=wrapEventText(event.room,widths[3],46.08);for(let offset=0;offset<Math.max(titleLines.length,roomLines.length);offset+=6){const title=titleLines.slice(offset,offset+6),room=roomLines.slice(offset,offset+6),lines=Math.max(1,title.length,room.length),height=Math.max(103.68,lines*64.512+39.4);if(usedHeight+height>808.176&&page.length){reducedMotionPages.push(page);page=[];usedHeight=0}page.push({...event,status:'normal',title:title.join('\n'),room:room.join('\n'),lines});usedHeight+=height}}
 if(page.length)reducedMotionPages.push(page);
 return {scrollPlan,reducedMotionPages,minDurationMs:Math.max(scrollPlan.minDurationMs,reducedMotionPages.length*12000)};
}
export type PresentationEventLink={linkedEventKey?:string;eventLink?:{eventKey?:string}};
export type PostProgramTestScenario=TestEventScenario;
export type PostProgramTestOptions={mode:'normal'|'test';scenario:PostProgramTestScenario};

const roomLabel=(location:{name:string;floor?:string})=>location.name;
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
  private serial=0;private page=-1;private lastTake:number|undefined;
  constructor(private readonly service:PostProgramRoomNoticeService,private readonly random:()=>number=Math.random){}
  enterPostProgram(){if(!this.session){this.session={id:++this.serial,headerColor:this.random()<.5?'#608F9A':'#699F3E'};this.page=-1}}
  prepare(presentation:PresentationEventLink,now:Date,test?:PostProgramTestOptions){
    if(test?.mode==='test'&&test.scenario==='leave-room')this.pending={type:'leave-room',text:LEAVE_ROOM_TEXT};
    else if(test?.mode==='test'&&test.scenario.startsWith('next-events'))this.pending={type:'next-events',events:createTestEvents(test.scenario,now)};
    else this.pending=this.service.compute(presentation,now);
    return this.pending;
  }
  current(){return this.active}
  beginTransition(){this.enterPostProgram();if(!this.pending){this.active=null;return null}const pages=this.pending.type==='next-events'?paginatePostEvents(this.pending.events):undefined;const prepared=this.pending.type==='next-events'?preparePostEventPresentation(this.pending.events):undefined;const pageCount=pages?.length||1;this.page=(this.page+1)%pageCount;this.active={sessionId:this.session!.id,headerColor:this.session!.headerColor,notice:structuredClone(this.pending),page:this.page,pageCount,pages,...prepared,startedAtMs:Date.now()};return this.active}
  outputForTake<T extends object>(output:T,take:number):T&{postProgramRoomNotice?:PostProgramRoomNoticeSnapshot}{if(this.lastTake!==take){this.lastTake=take;this.beginTransition()}return this.active?withPostProgramRoomNotice(output,this.active):output}
  leavePostProgram(){this.lastTake=undefined;this.session=null;this.active=null;this.pending=null;this.page=-1}
}

export function withPostProgramRoomNotice<T extends object>(output:T,notice:PostProgramRoomNoticeSnapshot):T&{postProgramRoomNotice:PostProgramRoomNoticeSnapshot}{return{...output,postProgramRoomNotice:notice}}
