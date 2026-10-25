import type {ExternalSnapshot,WeatherPayload} from '../../shared/externalLoop';
import {selectWeatherForecast} from './weatherForecast';
import {weatherAppearance,weatherCondition} from './weatherCondition';
import {WeatherIcon} from './WeatherIcon';
import {usePreferences} from '../preferences';
export const weatherDescription=(code:number)=>weatherCondition(code).description;
const date=(value:string)=>new Date(value).toLocaleDateString('de-DE',{timeZone:'Europe/Berlin',weekday:'short',day:'2-digit',month:'2-digit',year:'numeric'});
export function WeatherView({snapshot,payload}:{snapshot:ExternalSnapshot;payload:WeatherPayload}){
 const forecast=selectWeatherForecast(payload),tomorrow=forecast.tomorrow,appearance=weatherAppearance(payload.code,payload.wind),reduceMotion=usePreferences(state=>state.reduceMotion);
 return <div className="external-loop-frame native-weather" data-revision={snapshot.revision} data-weather-condition={appearance.kind} data-windy={appearance.windy} data-reduced-motion={reduceMotion}>
  <header><div><p>Wetter</p><h2>{payload.location.name}</h2></div><span>{date(payload.observedAt)}</span></header>
  <section className="weather-current"><WeatherIcon code={payload.code} wind={payload.wind}/><div><strong>{Math.round(payload.temperature)} °C</strong><p>{weatherDescription(payload.code)}</p></div><div className="weather-wind">Wind<strong>{Math.round(payload.wind)} km/h</strong></div></section>
  <section className="weather-forecast"><div><h3>Die nächsten zwölf Stunden</h3><div className="weather-hours">{forecast.hours.map(hour=><article key={hour.time}><h4>{new Date(hour.time).toLocaleTimeString('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit'})}</h4><WeatherIcon code={hour.code}/><strong>{Math.round(hour.temperature)} °C</strong><small>Niederschlag {Math.round(hour.rainProbability)} %</small></article>)}{!forecast.hours.length&&<p>Stundenvorschau derzeit nicht verfügbar.</p>}</div></div><div className="weather-tomorrow"><h3>Morgen</h3>{tomorrow?<article><h4>{date(tomorrow.date)}</h4><WeatherIcon code={tomorrow.code}/><p>{weatherDescription(tomorrow.code)}</p><strong>{Math.round(tomorrow.maximum)}° / {Math.round(tomorrow.minimum)}°</strong><small>Niederschlagswahrscheinlichkeit {Math.round(tomorrow.rainProbability)} %</small></article>:<p>Vorhersage derzeit nicht verfügbar.</p>}</div></section>
  <footer>Wetterdaten: Open-Meteo · Datenstand: {new Date(snapshot.fetchedAt).toLocaleString('de-DE',{timeZone:'Europe/Berlin'})}{snapshot.stale?' · Letzter gültiger Stand':''}</footer>
 </div>;
}
