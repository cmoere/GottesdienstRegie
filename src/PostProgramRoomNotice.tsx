import {paginatePostEvents} from './eventPagination';
import {useLayoutEffect,useRef,useState,type CSSProperties} from 'react';
import type {PostProgramRoomNoticeSnapshot} from './community/PostProgramRoomNoticeService';
const date=(value:string)=>new Date(value).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
const time=(value:string)=>new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
function ScrollCell({children,className=''}:{children:string;className?:string}){
 const outer=useRef<HTMLSpanElement>(null),inner=useRef<HTMLSpanElement>(null),[overflow,setOverflow]=useState(0);
 useLayoutEffect(()=>{const measure=()=>setOverflow(Math.max(0,(inner.current?.scrollWidth??0)-(outer.current?.clientWidth??0)));measure();const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);if(outer.current)observer?.observe(outer.current);let active=true;void document.fonts?.ready.then(()=>{if(active)measure()});return()=>{active=false;observer?.disconnect()}},[children]);
 return <span ref={outer} data-overflow={overflow>1} className={`post-program-cell ${className}`}><span ref={inner} className={overflow>1?'post-program-scroll':''} style={{'--scroll-distance':`-${overflow}px`,'--scroll-duration':`${Math.max(12,overflow/35+6)}s`} as CSSProperties}>{children}</span></span>;
}
export function PostProgramRoomNoticeView({snapshot}:{snapshot:PostProgramRoomNoticeSnapshot}){
 const notice=snapshot.notice;
 return <section className="post-program-room-notice" aria-label="Nachprogramm-Raumhinweis">
  <header style={{background:snapshot.headerColor}}>{notice.type==='next-events'?'Ihre nächsten Veranstaltungen':''}</header>
  <div className="post-program-body">{notice.type==='leave-room'?<p>{notice.text}</p>:<><div className="post-program-columns">{['Datum','Uhrzeit','Veranstaltung','Raum'].map(label=><span key={label}>{label}</span>)}</div>{(snapshot.pages??paginatePostEvents(notice.events))[snapshot.page]?.map((event,index)=><div className="post-program-row" key={`${event.id}:${index}`}><ScrollCell>{date(event.start)}</ScrollCell><ScrollCell>{`${time(event.start)}${event.end?`–${time(event.end)}`:''}`}</ScrollCell><ScrollCell className="post-program-title">{`${event.title}${event.status==='cancelled'?' · Fällt aus':event.status==='delayed'?' · Verspätung (+5 Min.)':event.status==='room-changed'?' · Raum geändert':''}`}</ScrollCell><ScrollCell>{event.room}</ScrollCell></div>)}</>}</div>
 </section>;
}
