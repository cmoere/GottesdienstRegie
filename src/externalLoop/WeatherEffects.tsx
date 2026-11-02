import type {CSSProperties} from 'react';import {weatherAppearance} from './weatherCondition';
/** Decorative output layer; all windows use their common slide epoch as phase. */
export function WeatherEffects({code,wind,elapsed=0,reduced=false}:{code:number;wind:number;elapsed?:number;reduced?:boolean}){
 const {kind,windy}=weatherAppearance(code,wind),rain=['rain','drizzle','freezing-rain','thunder','hail'].includes(kind);
 return <svg className="weather-effect-layer" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true" data-weather-effect={kind} data-reduced-motion={reduced} style={{'--weather-phase':Math.max(0,elapsed)+'ms'} as CSSProperties}>
  {(kind==='sun'||kind==='partly-cloudy')&&<g className="weather-effect-sun">{[0,30,60,90,120,150].map(angle=><path key={angle} transform={`rotate(${angle} 80 0)`} d="M80 0L1920 70L1920 160Z" fill="#699f3e"/>)}</g>}
  {rain&&<g className="weather-effect-rain">{Array.from({length:16},(_,i)=><path key={i} d={`M${i*137} -60l-80 420`} stroke="#608f9a" strokeWidth="3"/>)}</g>}
  {kind==='snow'&&<g className="weather-effect-snow">{Array.from({length:20},(_,i)=><circle key={i} cx={(i*173)%1920} cy={(i*97)%1080} r={3+i%4} fill="#608f9a"/>)}</g>}
  {(kind==='fog'||kind==='cloud'||kind==='partly-cloudy')&&<g className="weather-effect-clouds">{[0,1,2].map(i=><ellipse key={i} cx={i*710+100} cy={160+i*90} rx="480" ry="90" fill="#b6bec3"/>)}</g>}
  {windy&&<g className="weather-effect-wind">{[0,1,2,3].map(i=><path key={i} d={`M${i*410-200} ${i*230+190}h650`} stroke="#608f9a" strokeWidth="4"/>)}</g>}
 </svg>;
}
