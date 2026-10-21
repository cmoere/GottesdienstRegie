import {useEffect,useMemo,useRef,useState} from 'react';
import {usePresentation} from './store';
import {useI18n} from './i18n';
import {AppClock} from './community/AppClock';
import {EventService,type ChurchEvent} from './community/EventService';
import {getCommunityRuntimeSnapshot,startCommunityRuntime,subscribeCommunityRuntime} from './community/communityRuntime';
import './service-on-air-reminder.css';

/** Operator-only reminder. Never starts output or bypasses the ON-AIR preflight. */
export function ServiceOnAirReminder(){
 const {t}=useI18n(),onAir=usePresentation(state=>state.onAir),eventKey=usePresentation(state=>state.eventLink?.eventKey);
 const [events,setEvents]=useState(()=>getCommunityRuntimeSnapshot().events);
 const [now,setNow]=useState(()=>AppClock.now().getTime()),[visibleKey,setVisibleKey]=useState('');
 const delivered=useRef(new Set<string>());
 useEffect(()=>{startCommunityRuntime();const refresh=()=>setEvents(getCommunityRuntimeSnapshot().events);refresh();return subscribeCommunityRuntime(refresh)},[]);
 useEffect(()=>{if(onAir||!eventKey)return;const tick=()=>setNow(AppClock.now().getTime());tick();const timer=setInterval(tick,1000);return()=>clearInterval(timer)},[eventKey,onAir]);
 const service=useMemo(()=>new EventService(events as ChurchEvent[]),[events]);
 const event=eventKey?service.getByKey(eventKey):null;
 const startsAt=event&&!service.isCancelled(event)&&!service.isTrashed(event)?service.getEffectiveStart(event)?.getTime():undefined;
 const remaining=typeof startsAt==='number'?startsAt-now:NaN;
 const due=!onAir&&remaining>0&&remaining<=20*60*1000;
 const key=due?JSON.stringify([eventKey,startsAt]):'';
 useEffect(()=>{
  if(!key){setVisibleKey('');return;}
  if(!delivered.current.has(key)){delivered.current.add(key);setVisibleKey(key);}
 },[key]);
 if(!due||visibleKey!==key)return null;
 return <aside className="service-on-air-reminder" role="status"><strong>{t('onAirReminderTitle')}</strong><p>{t('onAirReminderBody',{minutes:Math.ceil(remaining/60000)})}</p><button type="button" onClick={()=>setVisibleKey('')}>{t('confirm')}</button></aside>;
}
