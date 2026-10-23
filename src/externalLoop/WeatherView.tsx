import type {ExternalSnapshot,WeatherPayload} from '../../shared/externalLoop';
import {selectWeatherForecast} from './weatherForecast';
export function weatherDescription(code:number){return code===0?'Sonnig':code<=2?'Heiter bis wolkig':code===3?'Bewölkt':code<=48?'Neblig':code<=57?'Nieselregen':code<=67?'Regen':code<=77?'Schnee':code<=82?'Regenschauer':code<=86?'Schneeschauer':'Gewitter'}
function WeatherIcon({code}:{code:number}){
 return <svg viewBox="0 0 120 100" role="img" aria-label={weatherDescription(code)} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round">
  {code<=2&&<><circle cx="40" cy="35" r="19" fill="#699f3e" stroke="none"/>{[[40,4,40,10],[10,35,16,35],[63,12,59,17],[18,12,22,17],[40,60,40,66]].map((p,i)=><path key={i} d={`M${p[0]} ${p[1]}L${p[2]} ${p[3]}`}/>)}</>}
  {code>0&&<path d="M27 75C4 75 7 43 29 44C32 14 77 15 83 47C112 39 121 76 94 76Z" fill="#b6bec3"/>}
  {code>=51&&[38,62,86].map(x=><path key={x} d={`M${x} 86l-4 9`}/>)}
 </svg>;
}
const date=(value:string)=>new Date(value).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
export function WeatherView({snapshot,payload}:{snapshot:ExternalSnapshot;payload:WeatherPayload}){
 const forecast=selectWeatherForecast(payload),tomorrow=forecast.tomorrow;
 return <div className="external-loop-frame native-weather" data-revision={snapshot.revision}>
  <header><div><p>WETTER</p><h2>{payload.location.name}</h2></div><span>{date(payload.observedAt)}</span></header>
  <section className="weather-current"><WeatherIcon code={payload.code}/><div><strong>{Math.round(payload.temperature)} °C</strong><p>{weatherDescription(payload.code)}</p></div><div className="weather-wind">Wind<strong>{Math.round(payload.wind)} km/h</strong></div></section>
  <section className="weather-forecast"><div><h3>Die nächsten zwölf Stunden</h3><div className="weather-hours">{forecast.hours.map(hour=><article key={hour.time}><h4>{new Date(hour.time).toLocaleTimeString('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'})}</h4><WeatherIcon code={hour.code}/><strong>{Math.round(hour.temperature)} °C</strong><small>Regen {Math.round(hour.rainProbability)} %</small></article>)}{!forecast.hours.length&&<p>Stundenvorschau derzeit nicht verfügbar.</p>}</div></div><div className="weather-tomorrow"><h3>Morgen</h3>{tomorrow?<article><h4>{date(tomorrow.date)}</h4><WeatherIcon code={tomorrow.code}/><p>{weatherDescription(tomorrow.code)}</p><strong>{Math.round(tomorrow.maximum)}° / {Math.round(tomorrow.minimum)}°</strong><small>Regenwahrscheinlichkeit {Math.round(tomorrow.rainProbability)} %</small></article>:<p>Vorhersage derzeit nicht verfügbar.</p>}</div></section>
  <footer>Wetterdaten: Open-Meteo · Datenstand: {new Date(snapshot.fetchedAt).toLocaleString('de-DE',{timeZone:'Europe/Berlin'})}{snapshot.stale?' · Letzter gültiger Stand':''}</footer>
 </div>;
}
