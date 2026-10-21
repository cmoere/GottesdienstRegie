import {useEffect,useState} from 'react';
import {EventService,type ChurchEvent} from './community/EventService';
import {AppClock} from './community/AppClock';

export function prepareServiceCountdown(input:{enabled:boolean;sectionId:string;eventKey?:string;date:string;serviceTime:string},events:Array<Record<string,unknown>>):number|undefined{
 if(!input.enabled||!['pre','warmup'].includes(input.sectionId))return;
 const service=new EventService(events as ChurchEvent[]);
 const event=input.eventKey?service.getByKey(input.eventKey):{eventKey:'local',titel:'',start_datum:input.date,start_uhrzeit:input.serviceTime,ende_datum:'',ende_uhrzeit:''};
 if(!event||service.isCancelled(event))return;
 return service.getEffectiveStart(event)?.getTime();
}
export function ServiceCountdownBadge({startsAtMs}:{startsAtMs?:number}){
 const [now,setNow]=useState(()=>AppClock.now().getTime());
 useEffect(()=>{setNow(AppClock.now().getTime());if(!Number.isFinite(startsAtMs))return;const timer=setInterval(()=>setNow(AppClock.now().getTime()),1000);return()=>clearInterval(timer)},[startsAtMs]);
 if(typeof startsAtMs!=='number'||!Number.isFinite(startsAtMs)||startsAtMs<=now)return null;
 const seconds=Math.ceil((startsAtMs-now)/1000),value=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
 return <div className="service-countdown-badge">Beginn in {value}</div>;
}
