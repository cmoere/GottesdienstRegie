import {weatherAppearance} from './weatherCondition';
export function WeatherIcon({code,wind=0}:{code:number;wind?:number}){
 const {kind,description,windy}=weatherAppearance(code,wind),sun=kind==='sun'||kind==='partly-cloudy',cloud=!['sun','unknown','fog'].includes(kind);
 return <svg className="weather-icon" data-weather-kind={kind} data-windy={windy} viewBox="0 0 128 112" role="img" aria-label={description+(windy?' · Wind':'')} fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
  {sun&&<g className="weather-sun"><circle cx="40" cy="36" r="19" fill="#699f3e" stroke="none"/><g className="weather-sun-rays">{[0,45,90,135,180,225,270,315].map(angle=><path key={angle} transform={`rotate(${angle} 40 36)`} d="M40 5v6"/>)}</g></g>}
  {cloud&&<g className="weather-cloud"><path d="M26 73C5 73 8 43 29 44C33 15 77 17 83 47C111 39 120 74 95 74Z" fill="#b6bec3"/></g>}
  {kind==='fog'&&<g className="weather-fog">{[35,52,69,86].map((y,i)=><path key={y} d={`M${i%2?25:12} ${y}h85`}/>)}</g>}
  {['rain','drizzle','freezing-rain'].includes(kind)&&<g className="weather-rain">{[38,62,86].map(x=><path key={x} d={`M${x} 85l-5 ${kind==='drizzle'?7:14}`}/>)}{kind==='freezing-rain'&&<path d="M53 100h29m-15-6v12"/>}</g>}
  {kind==='snow'&&<g className="weather-snow">{[35,62,89].map(x=><g key={x}><path d={`M${x} 84v20m-8-15 16 10m-16 0 16-10`}/></g>)}</g>}
  {(kind==='thunder'||kind==='hail')&&<g className="weather-lightning"><path d="m63 75-13 20h12l-4 15 24-27H68l7-8" fill="#699f3e"/>{kind==='hail'&&[32,94].map(x=><circle key={x} cx={x} cy="96" r="4" fill="currentColor"/>)}</g>}
  {windy&&<g className="weather-wind-lines" strokeWidth="3"><path d="M72 18h28c14 0 14-16 2-16M80 30h32c14 0 14 15 2 15"/></g>}
  {kind==='unknown'&&<g><circle cx="64" cy="54" r="31"/><path d="M50 54h28"/></g>}
 </svg>;
}
