import {useI18n} from "../i18n";
import {useEffect,useRef,useState} from 'react';
import type {ExternalSettings,WeatherLocation} from '../../shared/externalLoop';
import{useWeatherWarnings}from'../weatherWarnings/controller';
export function WeatherDesigner({settings,canEdit,onChange}:{settings:Extract<ExternalSettings,{kind:'weather'}>;canEdit:boolean;onChange:(patch:Record<string,string|number|boolean>)=>void}){
 const {t,tx}=useI18n();
 const rawWarningStatus=useWeatherWarnings(state=>state.status),warningCount=rawWarningStatus.match(/^DWD: (\d+) gültige Warnung\(en\)$/);
 const warningStatus=warningCount?tx("DWD: {value1} gültige Warnung(en)",{value1:warningCount[1]}):tx(rawWarningStatus);
 const [query,setQuery]=useState(''),[results,setResults]=useState<WeatherLocation[]>([]),[status,setStatus]=useState(''),sequence=useRef(0);
 useEffect(()=>()=>{sequence.current++},[]);
 const search=async()=>{
  if(!canEdit||query.trim().length<2)return;const id=++sequence.current;setStatus('Orte werden gesucht …');setResults([]);
  try{const found=await window.desktop?.externalLoop?.searchLocations?.(query.trim())??[];if(sequence.current===id){setResults(found);setStatus(found.length?'Ort auswählen:':'Keine passenden Orte gefunden.')}}catch{if(sequence.current===id)setStatus('Ortssuche derzeit nicht verfügbar.')}
 };
 const locate=()=>{
  if(!canEdit)return;
  const id=++sequence.current;
  const unavailable=()=>{if(sequence.current===id)setStatus(t('weatherLocationUnavailable'))};
  if(!navigator.geolocation){unavailable();return}
  setResults([]);setStatus(t('weatherLocating'));
  navigator.geolocation.getCurrentPosition(({coords})=>{
   if(sequence.current!==id)return;
   onChange({weatherName:t('weatherCurrentLocation'),weatherLatitude:coords.latitude,weatherLongitude:coords.longitude});
   setStatus('');
  },unavailable,{timeout:10000,maximumAge:60000});
 };
 return <fieldset disabled={!canEdit}><legend>{tx("Eigene Wetterfolie")}</legend><p>{tx("Aktueller Ort:")}{" "}<strong>{settings.name}</strong></p>
  <label>{tx("Ort suchen")}<input value={query} maxLength={100} onChange={event=>{sequence.current++;setQuery(event.target.value);setResults([]);setStatus('')}} onKeyDown={event=>{if(event.key==='Enter'){event.preventDefault();void search()}}}/></label>
  <button type="button" onClick={()=>void search()} disabled={query.trim().length<2||!canEdit}>{tx("Ort suchen")}</button>
  <button type="button" onClick={locate}>{t('weatherUseCurrentLocation')}</button>
  <button type="button" onClick={()=>{sequence.current++;setStatus('');setResults([]);onChange({weatherName:'Bielefeld',weatherLatitude:52.0302,weatherLongitude:8.5325})}}>{tx("Bielefeld verwenden")}</button>
  <p role="status">{tx(status)}</p><div className="weather-location-results">{results.map((place,index)=><button type="button" key={index} onClick={()=>{onChange({weatherName:place.name,weatherLatitude:place.latitude,weatherLongitude:place.longitude});setResults([]);setStatus('Ort übernommen.')}}>{place.name}</button>)}</div>
  <p>{tx("Aktuelles Wetter, Zweistunden-Vorschau und morgen · °C · km/h · Datenquelle Open-Meteo. Keine externe Wetter-Webseite.")}</p>
  <p>{warningStatus}{tx(". DWD-Warnungen erscheinen nur im Vor-/Nachprogramm und Countdown. Der Warnort folgt dem ersten aktiven Wetterelement im Vor-/Nachprogramm; ohne Wetterelement wird Bielefeld verwendet.")}</p>
 </fieldset>;
}
