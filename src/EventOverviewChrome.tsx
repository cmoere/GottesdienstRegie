import {useEffect,useState} from 'react';
import {AppClock} from './community/AppClock';
import {formatEventDate} from './dynamicEventSlide';
import communityLogo from './assets/logo-community.png';

const timeFormat=new Intl.DateTimeFormat('de-DE',{
 timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'
});

export function EventOverviewHeader(){
 const [now,setNow]=useState(()=>AppClock.now());
 useEffect(()=>{
  const timer=setInterval(()=>setNow(AppClock.now()),1000);
  return()=>clearInterval(timer);
 },[]);
 const date=formatEventDate(now).replace(',', '');
 const [hours,minutes]=timeFormat.format(now).split(':');
 return <header className="event-screen-header">
  <img src={communityLogo} alt="Philippus Gemeinde"/>
  <div className="event-screen-datetime">
   {date} <span aria-hidden="true">|</span> {hours}<span className="event-screen-clock-colon">:</span>{minutes}
  </div>
 </header>;
}

export function EventOverviewFooter({page,total,seconds}:{page:number;total:number;seconds:number}){
 return <footer className="event-screen-footer">
  {total>1&&<><span>{'Seite '+page+'/'+total}</span><span>{'Nächste Seite in: '+String(seconds).padStart(2,'0')+' Sek.'}</span></>}
 </footer>;
}
