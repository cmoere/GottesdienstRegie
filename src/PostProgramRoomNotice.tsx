import {paginatePostEvents} from './eventPagination';
import type {PostProgramRoomNoticeSnapshot} from './community/PostProgramRoomNoticeService';
const date=(value:string)=>new Date(value).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
const time=(value:string)=>new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
export function PostProgramRoomNoticeView({snapshot}:{snapshot:PostProgramRoomNoticeSnapshot}){
 const notice=snapshot.notice;
 return <section className="post-program-room-notice" aria-label="Nachprogramm-Raumhinweis">
  <header style={{background:snapshot.headerColor}}>{notice.type==='next-events'?'Ihre nächsten Veranstaltungen':''}</header>
  <div className="post-program-body">{notice.type==='leave-room'?<p>{notice.text}</p>:(snapshot.pages??paginatePostEvents(notice.events))[snapshot.page]?.map((event,index)=><div className="post-program-row" key={`${event.id}:${index}`}><span>{date(event.start)}</span><span>{time(event.start)}{event.end?`–${time(event.end)}`:''}</span><strong>{event.title}</strong><span>{event.room}</span></div>)}</div>
 </section>;
}
