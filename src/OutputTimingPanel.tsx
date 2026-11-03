import {useCallback,useEffect,useMemo,useState} from 'react';
import {usePresentation} from './store';
import {useI18n} from './i18n';
import type {OutputTimingSummary} from '../shared/outputTiming';
import {readOutputTimingSummaries} from '../shared/outputTiming';
import './diagnostics.css';
import {useLiveOutputPreview} from './liveOutputPreview';
import {useOutputPaintReport} from './outputPaintReport';
import type {OutputPaintReceipt} from '../shared/outputTiming';
export function OutputTimingPanel(){
 const onAir=usePresentation(state=>state.onAir),{tx}=useI18n(),[values,setValues]=useState<OutputTimingSummary[]>([]);
 const slide=useLiveOutputPreview(state=>state.slide) as (import('./store').Slide&{_outputRevision?:number})|null;
 const pending=useMemo(()=>slide&&Number.isSafeInteger(slide._outputRevision)?{slide,delivery:{revision:slide._outputRevision!,sentAtMs:Date.now()},receivedAtMs:Date.now()}:null,[slide]);
 const report=useCallback((receipt:OutputPaintReceipt)=>{void window.desktop?.outputTiming?.reportPreview?.(receipt).catch(()=>{})},[]);
 useOutputPaintReport(slide,pending,report);
 useEffect(()=>{
  const api=window.desktop?.outputTiming;if(!onAir||!api){setValues([]);return}
  let active=true,busy=false;
  const refresh=async()=>{if(busy)return;busy=true;try{const next=readOutputTimingSummaries(await api.get());if(active)setValues(next)}catch{if(active)setValues([])}finally{busy=false}};
  void refresh();const timer=setInterval(()=>void refresh(),1000);
  return()=>{active=false;clearInterval(timer)};
 },[onAir]);
 if(!values.length)return null;
 return <details className="output-timing-diagnostics"><summary>{tx('Ausgabe-Diagnose')}</summary>
  {values.map(value=><div key={value.role}><p>{value.role.toUpperCase()}: {value.status==='pending'?tx('Renderbestätigung ausstehend'):`${value.lastMs} ms`} · {tx('Renderzeit')}: {value.renderMs??'–'} ms · P95: {value.p95Ms??'–'} ms</p>{value.previewDeltaMs!==undefined&&<p>{tx('Vorschau')} ↔ MAIN: {value.previewDeltaMs>0?'+':''}{value.previewDeltaMs} ms</p>}</div>)}
  <small>{tx('Gemessen bis zur Renderbestätigung der Anwendung. Die Verzögerung des physischen Bildschirms ist darin nicht messbar.')}</small>
 </details>;
}
