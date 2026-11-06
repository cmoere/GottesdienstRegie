import {useId,type CSSProperties} from 'react';
import {weatherAppearance} from './weatherCondition';

/** Decorative output layer; all windows use their common slide epoch as phase. */
export function WeatherEffects({code,wind,elapsed=0,reduced=false,isDay=true}:{code:number;wind:number;elapsed?:number;reduced?:boolean;isDay?:boolean}){
 const id=useId();
 const {kind,windy}=weatherAppearance(code,wind);
 const wet=['rain','drizzle','freezing-rain','thunder','hail'].includes(kind);
 const cloudy=['fog','cloud','partly-cloudy','thunder'].includes(kind);
 return <svg className="weather-effect-layer" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true" data-weather-effect={kind} data-reduced-motion={reduced} style={{'--weather-phase':Math.max(0,elapsed)+'ms'} as CSSProperties}>
  <defs>
   <radialGradient id={id+'-light'}><stop stopColor="#ffd183"/><stop offset="1" stopColor="#ffd183" stopOpacity="0"/></radialGradient>
   <radialGradient id={id+'-mist'}><stop stopColor="#b6bec3"/><stop offset="1" stopColor="#b6bec3" stopOpacity="0"/></radialGradient>
  </defs>
  {isDay&&(kind==='sun'||kind==='partly-cloudy')&&<g className="weather-effect-sun"><ellipse cx="1560" cy="105" rx="630" ry="475" fill={'url(#'+id+'-light)'}/></g>}
  {(cloudy||windy)&&<g className="weather-effect-clouds">
   <ellipse cx="260" cy="150" rx="660" ry={kind==='fog'?320:180} fill={'url(#'+id+'-mist)'}/>
   <ellipse cx="1530" cy="820" rx="735" ry={kind==='fog'?365:205} fill={'url(#'+id+'-mist)'}/>
  </g>}
  {(wet||kind==='snow')&&Array.from({length:24},(_,index)=>{
   const snow=kind==='snow';
   return <g key={index} className={snow?'weather-effect-snow':'weather-effect-rain'} style={{'--particle-offset':index*397+'ms'} as CSSProperties}>
    <ellipse cx={30+(index*173)%1860} cy={30+(index*113)%1020} rx={snow?4+index%5:2.5} ry={snow?4+index%5:6+index%4} fill="#608f9a"/>
   </g>;
  })}
 </svg>;
}
