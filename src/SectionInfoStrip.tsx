import {useEffect,useState} from 'react';
import {AppClock} from './community/AppClock';
import type {SectionInfoSnapshot} from '../shared/sectionInfoStrip';

export function SectionInfoStrip({info}:{info:SectionInfoSnapshot}){
 const [now,setNow]=useState(()=>AppClock.now());
 const unit=info.showTime&&info.showSeconds?1000:60000;
 useEffect(()=>{
  if(!info.showTime&&!info.showDate)return;
  let timer:ReturnType<typeof setTimeout>;
  const tick=()=>{
   const current=AppClock.now();
   setNow(current);
   timer=setTimeout(tick,unit-current.getTime()%unit);
  };
  tick();
  return()=>clearTimeout(timer);
 },[unit,info.showTime,info.showDate]);
 const time=info.showTime?now.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit',...(info.showSeconds?{second:'2-digit'}:{})}):'';
 const date=info.showDate?now.toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'}):'';
 return <div className="section-info-layer"><div className="section-info-strip">
  {info.showTitle&&<span className="section-info-title">{info.title}</span>}
  <div className="section-info-clock">{date&&<span>{date}</span>}{time&&<span>{time}</span>}</div>
 </div></div>;
}
