import {paginatePostEvents} from './eventPagination';
import {useLayoutEffect,useMemo,useRef,useState,type CSSProperties} from 'react';
import type {PostProgramRoomNoticeSnapshot} from './community/PostProgramRoomNoticeService';
import {preparePostEventPresentation,postEventTitle} from './community/PostProgramRoomNoticeService';
import {EventScrollViewport,useEventPresentationClock} from './EventScrollViewport';
import {formatEventDate} from './dynamicEventSlide';
const date=(value:string)=>formatEventDate(value);
const time=(value:string)=>new Date(value).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'});
function ScrollCell({children,className=''}:{children:string;className?:string}){
 const outer=useRef<HTMLSpanElement>(null),inner=useRef<HTMLSpanElement>(null),[overflow,setOverflow]=useState(0);
 useLayoutEffect(()=>{const measure=()=>setOverflow(Math.max(0,(inner.current?.scrollWidth??0)-(outer.current?.clientWidth??0)));measure();const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);if(outer.current)observer?.observe(outer.current);let active=true;void document.fonts?.ready.then(()=>{if(active)measure()});return()=>{active=false;observer?.disconnect()}},[children]);
 const scale=(outer.current?.closest('.post-program-room-notice')?.getBoundingClientRect().width??1920)/1920||1;
 return <span ref={outer} data-overflow={overflow>1} className={`post-program-cell ${className}`}><span ref={inner} className={overflow>1?'post-program-scroll':''} style={{'--scroll-distance':`-${overflow}px`,'--scroll-duration':`${Math.max(10,overflow/scale/35+10)}s`} as CSSProperties}>{children}</span></span>;
}
export function PostProgramRoomNoticeView({snapshot}:{snapshot:PostProgramRoomNoticeSnapshot}){
 const notice=snapshot.notice;
 const [fallbackStart]=useState(Date.now);
 const animationDelay=useMemo(()=>`-${Math.max(0,Date.now()-(snapshot.startedAtMs??fallbackStart))}ms`,[snapshot.startedAtMs,fallbackStart]);
 const {elapsed,reduced}=useEventPresentationClock(snapshot.startedAtMs??fallbackStart);
 const prepared=useMemo(()=>notice.type==='next-events'&&(!snapshot.scrollPlan||!snapshot.reducedMotionPages)?preparePostEventPresentation(notice.events):undefined,[notice,snapshot.scrollPlan,snapshot.reducedMotionPages]);
 const plan=snapshot.scrollPlan??prepared?.scrollPlan;
 const reducedPages=snapshot.reducedMotionPages??prepared?.reducedMotionPages??[];
 const rows=reduced?reducedPages[Math.min(Math.floor(elapsed/12000),Math.max(0,reducedPages.length-1))]:((snapshot.pages??(notice.type==='next-events'?paginatePostEvents(notice.events):[]))[snapshot.page]);
 return <section className="post-program-room-notice" aria-label="Nachprogramm-Raumhinweis" style={{'--event-animation-delay':animationDelay} as CSSProperties}>
  <header style={{background:snapshot.headerColor}}>{notice.type==='next-events'?'Ihre nächsten Veranstaltungen':''}</header>
  <div className="post-program-body" data-reduced-motion={reduced}>{notice.type==='leave-room'?<p>{notice.text}</p>:<><div className="post-program-columns">{['Datum','Uhrzeit','Veranstaltung','Raum'].map(label=><span key={label}>{label}</span>)}</div>{plan&&<EventScrollViewport plan={plan} elapsed={elapsed} reduced={reduced}>{rows?.map((event,index)=><div className="post-program-row" key={`${event.id}:${index}`}><ScrollCell>{date(event.start)}</ScrollCell><ScrollCell>{`${time(event.start)}${event.end?`–${time(event.end)}`:''}`}</ScrollCell><ScrollCell className="post-program-title">{postEventTitle(event)}</ScrollCell><ScrollCell>{event.room}</ScrollCell></div>)}</EventScrollViewport>}</>}</div>
 </section>;
}
