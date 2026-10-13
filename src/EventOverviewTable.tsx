import {useLayoutEffect,useRef} from 'react';
import type {eventSlideItems} from './dynamicEventSlide';
import type {EventScrollPlan} from './eventScroll';
import {EventScrollViewport} from './EventScrollViewport';

type EventRow=ReturnType<typeof eventSlideItems>[number];

function TableEventTitle({title,elapsed,reduced,startsAfterMs}:{title:string;elapsed:number;reduced:boolean;startsAfterMs:number}){
 const viewport=useRef<HTMLDivElement>(null),text=useRef<HTMLSpanElement>(null),clock=useRef(elapsed),activeMotion=useRef<Animation|undefined>(undefined);
 clock.current=elapsed;
 useLayoutEffect(()=>{
  const container=viewport.current,node=text.current;
  if(!container||!node)return;
  let animation:Animation|undefined,disposed=false;
  const measure=()=>{
   if(disposed)return;
   animation?.cancel();animation=undefined;activeMotion.current=undefined;
   const distance=Math.max(0,node.scrollWidth-container.clientWidth);
   if(reduced||distance<=1||!node.animate)return;
   const scale=container.clientWidth/694;
   const travelMs=distance/scale/35*1000,duration=travelMs+10000;
   animation=node.animate([{transform:'translateX(0)',offset:0},{transform:'translateX(0)',offset:5000/duration},{transform:`translateX(-${distance}px)`,offset:(5000+travelMs)/duration},{transform:`translateX(-${distance}px)`,offset:1}],{duration,delay:startsAfterMs,easing:'linear',fill:'forwards'});
   animation.currentTime=clock.current;
   activeMotion.current=animation;
  };
  measure();
  const observer=typeof ResizeObserver==='undefined'?undefined:new ResizeObserver(measure);
  observer?.observe(container);
  void document.fonts?.ready.then(measure);document.fonts?.addEventListener('loadingdone',measure);window.addEventListener('resize',measure);
  return()=>{disposed=true;animation?.cancel();activeMotion.current=undefined;observer?.disconnect();document.fonts?.removeEventListener('loadingdone',measure);window.removeEventListener('resize',measure)};
 },[title,reduced,startsAfterMs]);
 useLayoutEffect(()=>{if(activeMotion.current)activeMotion.current.currentTime=elapsed},[elapsed]);
 return <div ref={viewport} className="event-table-title-viewport" style={{overflowX:reduced?'auto':'hidden'}}><span ref={text} className="event-table-title" style={{whiteSpace:'nowrap'}}>{title}</span></div>;
}

export function EventOverviewTable({items,plan,elapsed,reduced=false}:{items:EventRow[];plan:EventScrollPlan;elapsed:number;reduced?:boolean}){
 return <div role="table" aria-label="Nächste Veranstaltungen" className="event-overview-table">
  <div role="rowgroup" className="event-table-heading"><div role="row" className="event-table-row">{['Datum','Uhrzeit','Veranstaltung','Ort/Raum'].map(label=><div key={label} role="columnheader">{label}</div>)}</div></div>
  <EventScrollViewport plan={plan} elapsed={elapsed} reduced={reduced} className="event-table-viewport">
   <div role="rowgroup">{items.map((event,index)=><div role="row" className="event-table-row" key={`${event.title}:${event.details}:${index}`}>
    <div role="cell" className="event-table-date">{event.date}</div>
    <div role="cell" className="event-table-time">{event.time}</div>
    <div role="cell"><TableEventTitle title={event.title} elapsed={elapsed} reduced={reduced} startsAfterMs={index<5?0:plan.startPauseMs+(plan.distance>0?Math.max(0,(index+1)*136-700)/plan.distance*plan.travelMs:0)}/></div>
    <div role="cell" className="event-table-room">{event.location}</div>
   </div>)}</div>
  </EventScrollViewport>
 </div>;
}
