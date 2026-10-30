import {useI18n} from "./i18n";
import {useEffect,useState} from 'react';
import {countdownPresets,countdownDesigns,getCountdownPreset} from './countdownPresets';
import {CountdownView} from './CountdownView';
import {AppClock} from './community/AppClock';
export function CountdownPresetBrowser({purpose,onSelect}:{purpose:'item'|'background'|'foreground'|'audio';onSelect:(presetId:string)=>void}){
 const {tx}=useI18n();
  const [duration,setDuration]=useState('all'),[design,setDesign]=useState('all'),[selected,setSelected]=useState(''),[start,setStart]=useState(0),[now,setNow]=useState(0);
  useEffect(()=>{if(!selected)return;const timer=window.setInterval(()=>setNow(AppClock.now().getTime()),250);return()=>clearInterval(timer)},[selected]);
  if(purpose==='audio')return null;
  const preset=getCountdownPreset(selected),format=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  return <section className="countdown-library" aria-label={tx("Countdown-Vorlagen")}>
    <header><h2>{tx("Countdowns")}</h2><p>{tx("Offline verfügbar · ohne Ton · als eigenes Ablauf-Element")}</p>
      <label>{tx("Dauer")}<select value={duration} onChange={event=>setDuration(event.target.value)}><option value="all">{tx("Alle Dauern")}</option>{[1200,900,600,300,180,120,60,30,20,10].map(seconds=><option key={seconds} value={seconds}>{format(seconds)}</option>)}</select></label>
      <label>{tx("DESIGN")}<select value={design} onChange={event=>setDesign(event.target.value)}><option value="all">{tx("Alle Designs")}</option>{countdownDesigns.map(item=><option key={item.id} value={item.id}>{tx(item.label)}</option>)}</select></label>
    </header>
    <div className="countdown-preset-grid">{countdownPresets.filter(item=>(duration==='all'||item.durationSeconds===Number(duration))&&(design==='all'||item.designId===design)).map(item=>{const label=`${format(item.durationSeconds)} · ${tx(countdownDesigns.find(d=>d.id===item.designId)!.label)}`;return <button key={item.id} aria-label={tx("Vorschau: {value1}",{value1:String(label)})} aria-pressed={selected===item.id} onClick={()=>{const at=AppClock.now().getTime();setSelected(item.id);setStart(at);setNow(at)}}><div className="countdown-card"><CountdownView presetId={item.id} durationMs={item.durationSeconds*1000} startedAtMs={0} nowMs={0}/></div><span>{label}</span></button>})}</div>
    {preset&&<section className="countdown-preset-preview" aria-label={tx("Ausgewählte Vorschau")}><div className="countdown-card"><CountdownView presetId={preset.id} durationMs={preset.durationSeconds*1000} startedAtMs={start} nowMs={now}/></div><button className="primary" onClick={()=>onSelect(preset.id)}>{tx("Als Countdown zum Ablauf hinzufügen")}</button></section>}
  </section>;
}
