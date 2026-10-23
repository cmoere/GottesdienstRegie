import {useEffect,useState,type CSSProperties} from 'react';
import {AppClock} from '../community/AppClock';
import {clockDateText,clockTimeText,type ClockSettings} from './model';
import './styles.css';
export function ClockLoopView({settings,now}:{settings:ClockSettings;now:Date}){
 const analog=settings.design.startsWith('analog'),digital=!analog||settings.design==='analog-digital',seconds=now.getSeconds(),minutes=now.getMinutes()+seconds/60,hours=now.getHours()%12+minutes/60;
 return <section className={'clock-loop-view '+settings.design} data-clock-design={settings.design} style={{background:settings.background,color:settings.color,alignItems:settings.align==='left'?'flex-start':settings.align==='right'?'flex-end':'center',textAlign:settings.align,'--clock-accent':settings.accent} as CSSProperties}>
  {analog&&<svg className={'clock-analog '+(settings.design==='analog-dark'?'dark':'')} viewBox="0 0 400 400" role="img" aria-label={'Uhrzeit '+clockTimeText(settings,now)}>
   <circle className="clock-face" cx="200" cy="200" r="192"/>
   {Array.from({length:60},(_,i)=><line key={i} x1="200" y1={i%5?20:16} x2="200" y2={i%5?25:34} transform={'rotate('+i*6+' 200 200)'} className={i%5?'clock-tick':'clock-hour-mark'}/>)}
   {Array.from({length:12},(_,i)=>{const angle=(i+1)*Math.PI/6;return <text x={200+145*Math.sin(angle)} y={200-145*Math.cos(angle)+9} textAnchor="middle" key={i}>{i+1}</text>})}
   <line data-clock-hand="hour" x1="200" y1="215" x2="200" y2="105" transform={'rotate('+hours*30+' 200 200)'} className="clock-hour-hand"/>
   <line data-clock-hand="minute" x1="200" y1="220" x2="200" y2="65" transform={'rotate('+minutes*6+' 200 200)'} className="clock-minute-hand"/>
   {settings.showSeconds&&<line data-clock-hand="second" x1="200" y1="230" x2="200" y2="49" transform={'rotate('+seconds*6+' 200 200)'} className="clock-second-hand"/>}
   <circle cx="200" cy="200" r="7" className="clock-center"/>
  </svg>}
  {digital&&<time className="clock-digits">{clockTimeText(settings,now)}</time>}
  {settings.showDate&&<p className="clock-date">{clockDateText(settings,now)}</p>}
 </section>;
}
export function ActiveClockLoopView({settings,staticPreview=false}:{settings:ClockSettings;staticPreview?:boolean}){
 const [now,setNow]=useState(()=>AppClock.now());
 useEffect(()=>{if(staticPreview)return;const timer=setInterval(()=>setNow(AppClock.now()),1000);return()=>clearInterval(timer)},[staticPreview]);
 return <ClockLoopView settings={settings} now={now}/>;
}
