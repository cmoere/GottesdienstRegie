import {useLayoutEffect,useRef,type CSSProperties} from 'react';
import type {ExternalSnapshot} from '../../shared/externalLoop';
import {transitPageSize,transitPages,visibleTransit,transitMessageDuration,type TransitPayload,type TransitSettings,type TransitMessage} from '../../shared/transit';
import './transit.css';

const time=(value:number)=>new Date(value).toLocaleTimeString('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'});
/** An independent text viewport: neighbours, times and platform never move. */
function MovingText({text,elapsed,reduced,vertical=false}:{text:string;elapsed:number;reduced:boolean;vertical?:boolean}){
 const root=useRef<HTMLDivElement>(null),inner=useRef<HTMLDivElement>(null),clock=useRef(elapsed),motion=useRef<Animation|null>(null);clock.current=elapsed;
 useLayoutEffect(()=>{
  let active=true;const measure=()=>{
   if(!active||!root.current||!inner.current)return;motion.current?.cancel();motion.current=null;
   const distance=Math.max(0,vertical?inner.current.scrollHeight-root.current.clientHeight:inner.current.scrollWidth-root.current.clientWidth);
   if(distance<2||reduced||!inner.current.animate)return;
   const scale=root.current.closest('.transit-frame')?.getBoundingClientRect().width||1920,travel=distance/(vertical?24:35)/(scale/1920)*1000,duration=travel*2+10000,end=vertical?`translateY(-${distance}px)`:`translateX(-${distance}px)`;
   motion.current=inner.current.animate([{transform:'translate(0)',offset:0},{transform:'translate(0)',offset:5000/duration},{transform:end,offset:(5000+travel)/duration},{transform:end,offset:(10000+travel)/duration},{transform:'translate(0)',offset:1}],{duration,iterations:Infinity,easing:'linear'});motion.current.currentTime=clock.current;
  };
  measure();const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(measure):null;if(root.current)observer?.observe(root.current);void document.fonts?.ready.then(measure);
  return()=>{active=false;observer?.disconnect();motion.current?.cancel();motion.current=null};
 },[text,reduced,vertical]);
 useLayoutEffect(()=>{if(motion.current)motion.current.currentTime=elapsed},[elapsed]);
 return <div ref={root} className={vertical?'transit-message-scroll':'transit-text-viewport'}><div ref={inner} className={vertical?'transit-message-copy':'transit-text-copy'}>{text}</div></div>;
}
function currentMessage(messages:TransitMessage[],settings:TransitSettings,elapsed:number){
 const total=messages.reduce((sum,message)=>sum+transitMessageDuration(message,settings),0);let position=Math.max(0,elapsed)%Math.max(1,total);
 for(let index=0;index<messages.length;index++){const duration=transitMessageDuration(messages[index],settings);if(position<duration)return{message:messages[index],index,elapsed:position};position-=duration}
 return null;
}
export function TransitView({snapshot,payload,settings,elapsed,reduced}:{snapshot:ExternalSnapshot;payload:TransitPayload;settings:TransitSettings;elapsed:number;reduced:boolean}){
 const visible=visibleTransit(payload,settings),size=transitPageSize(settings),pages=Math.max(1,Math.ceil(visible.departures.length/size)),pagePlan=transitPages(visible,settings),total=pagePlan.reduce((sum,entry)=>sum+entry.duration,0),message=currentMessage(visible.messages,settings,elapsed),fullDate=new Date(snapshot.fetchedAt).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
 let page=0,pageElapsed=Math.max(0,elapsed)%total;while(page<pagePlan.length-1&&pageElapsed>=pagePlan[page].duration){pageElapsed-=pagePlan[page].duration;page++}const rows=pagePlan[page].rows;
 return <section className="transit-frame" data-transit-design={settings.design} data-has-messages={!!message} data-show-platform={settings.showPlatform} data-reduced={reduced} style={{'--transit-rows':size,'--transit-tile-rows':Math.ceil(size/2)} as CSSProperties} aria-label="ÖPNV · Abfahrten Beckhausstraße">
  <header className="transit-header"><div><p>Bus &amp; StadtBahn · Abfahrten</p><h2>{payload.stopName}</h2></div><div className="transit-header-meta"><span>{fullDate}</span><span>Gehzeit ca. {payload.walkMinutes} Minuten</span></div></header>
  <div className="transit-main">
   <div className="transit-departures">
    <div className="transit-columns" aria-hidden="true"><span>Linie</span><span>Richtung</span><span>{settings.showPlatform?'Gleis / Steig':''}</span><span>{settings.showRealtime?'Plan · Prognose':'Abfahrt'}</span></div>
    <div className="transit-rows">
     {!rows.length&&<p className="transit-empty">Zurzeit keine passenden Abfahrten.</p>}
     {rows.map((row,index)=><article className="transit-row" data-cancelled={row.cancelled} key={row.line+':'+row.plannedAt+':'+index}>
      <span className="transit-line" data-night={row.line.startsWith('N')} data-replacement={row.line==='SEV'}>{row.line}</span>
      <div className="transit-destination"><MovingText text={row.destination} elapsed={pageElapsed} reduced={reduced}/>{settings.showVia&&row.via.length>0&&<div className="transit-via"><MovingText text={'über '+row.via.join(' · ')} elapsed={pageElapsed} reduced={reduced}/></div>}</div>
      <span className="transit-platform">{settings.showPlatform?row.platform:''}</span>
      <div className="transit-time"><time>{time(row.plannedAt)}</time>{row.cancelled?<strong className="transit-cancel">Fällt aus</strong>:settings.showRealtime&&<><span className="transit-forecast">{row.delayMinutes!==0?'→ '+time(row.effectiveAt):''}</span>{row.delayMinutes!==0&&<span className="transit-delay">{row.delayMinutes>0?'+':''}{row.delayMinutes} Min.</span>}</>}{!row.cancelled&&row.status&&<div className="transit-status"><MovingText text={row.status} elapsed={pageElapsed} reduced={reduced}/></div>}</div>
     </article>)}
    </div>
   </div>
   {message&&<aside className="transit-message" aria-label="Verkehrsmeldungen"><div className="transit-message-label"><span>Verkehrsmeldung{message.message.lines.length?' · Linie '+message.message.lines.join(', '):''}</span><span>{message.index+1} / {visible.messages.length}</span></div><MovingText key={message.message.id} text={[message.message.title,message.message.text].filter(Boolean).join('\n')} elapsed={message.elapsed} reduced={reduced} vertical/></aside>}
  </div>
  <footer className="transit-footer"><span>Quelle: ÖPNV-Worker · Stand {time(snapshot.fetchedAt)} Uhr{snapshot.stale?' · Letzter gültiger Stand':''}</span><span>Abfahrten {page+1} / {pages}</span></footer>
 </section>;
}
