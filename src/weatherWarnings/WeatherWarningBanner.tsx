import{useEffect,useRef,useState}from'react';import{warningDurationMs,type WeatherWarningState}from'../../shared/weatherWarnings';import{AppClock}from'../community/AppClock';
import {WeatherWarningIcon} from './WeatherWarningIcon';
export function useCurrentWeatherWarning(state:WeatherWarningState|null|undefined){
 const[now,setNow]=useState(()=>AppClock.now().getTime());useEffect(()=>{if(!state)return;const id=setInterval(()=>setNow(AppClock.now().getTime()),250);return()=>clearInterval(id)},[Boolean(state)]);
 if(!state||now-state.fetchedAt>120000||state.fetchedAt>now+60000)return null;
 const items=state.items.filter(item=>Date.parse(item.validFrom)<=now&&Date.parse(item.validUntil)>now);
 const durations=items.map(warningDurationMs),cycleDuration=durations.reduce((a,b)=>a+b,0);if(!cycleDuration)return null;
 let phase=Math.max(0,now-state.cycleStartedAtMs)%cycleDuration,index=0;for(;index<durations.length-1&&phase>=durations[index];index++)phase-=durations[index];
 return {item:items[index],elapsed:phase,duration:durations[index],index,total:items.length};
}
export function WeatherWarningBanner({current}:{current:NonNullable<ReturnType<typeof useCurrentWeatherWarning>>}){
 const body=useRef<HTMLDivElement>(null),viewport=useRef<HTMLDivElement>(null),[distance,setDistance]=useState(0);const{item,elapsed,duration}=current;
 useEffect(()=>{const measure=()=>setDistance(Math.max(0,(body.current?.scrollHeight??0)-(viewport.current?.clientHeight??0)));measure();if(typeof ResizeObserver==='undefined')return;const observer=new ResizeObserver(measure);if(body.current)observer.observe(body.current);if(viewport.current)observer.observe(viewport.current);return()=>observer.disconnect()},[item.id,item.description,item.instruction]);
 const progress=elapsed/duration,offset=progress<.1?0:progress<.5?(progress-.1)/.4:progress<.6?1:Math.max(0,1-(progress-.6)/.4);
 return <aside className="weather-warning-banner" aria-label="Amtliche Wetterwarnung"><header><span className="weather-warning-heading"><WeatherWarningIcon warning={item}/><strong>{item.headline}</strong></span>{current.total>1&&<span className="weather-warning-counter" aria-label={`Warnung ${current.index+1} von ${current.total}`}>{current.index+1}/{current.total}</span>}<span className="weather-warning-meta">{item.areaName} · gültig bis {new Date(item.validUntil).toLocaleString('de-DE',{timeZone:'Europe/Berlin',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</span></header><div className="weather-warning-viewport" ref={viewport}><div ref={body} style={{transform:`translateY(${-distance*offset}px)`}}>{item.description}{item.instruction&&<p>{item.instruction}</p>}</div></div><footer>Quelle: Deutscher Wetterdienst</footer></aside>;
}
