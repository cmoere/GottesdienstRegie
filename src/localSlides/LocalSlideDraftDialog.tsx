import {useEffect,useMemo,useRef,useState} from 'react';
import {useI18n} from '../i18n';
import {usePresentation} from '../store';
import {SlideRenderer} from '../SlideRenderer';
import {buildDraftItem,insertDraftItem,type DraftLayout} from './draftInsertion';
import type {SlideDraft} from '../../shared/localSlideDraft';
import type {SlidePackStatus} from '../../electron/localSlides/SlideModelPack';
import './localSlides.css';
export function LocalSlideDraftDialog({sectionId,close}:{sectionId:string;close:()=>void}){
 const {tx}=useI18n(),api=window.desktop?.localSlides,onAir=usePresentation(state=>state.onAir);
 const presentationId=useRef(usePresentation.getState().presentationId),anchorId=useRef(usePresentation.getState().selectedItemId),generation=useRef(0),dialog=useRef<HTMLDivElement>(null);
 const [topic,setTopic]=useState(''),[notes,setNotes]=useState(''),[count,setCount]=useState(3),[layout,setLayout]=useState<DraftLayout>('light');
 const [pack,setPack]=useState<SlidePackStatus|null>(null),[busy,setBusy]=useState(false),[drafts,setDrafts]=useState<SlideDraft[]>([]),[error,setError]=useState('');
 const [elapsed,setElapsed]=useState(0);
 useEffect(()=>{if(!busy){setElapsed(0);return}const started=Date.now(),timer=setInterval(()=>setElapsed(Math.floor((Date.now()-started)/1000)),1000);return()=>clearInterval(timer)},[busy]);
 useEffect(()=>{
  let active=true,polling=false;const previous=document.activeElement as HTMLElement|null;
  const refresh=async()=>{if(!api||polling)return;polling=true;try{const status=await api.status();if(active)setPack(status)}catch{if(active)setError('Das lokale Modell ist derzeit nicht verfügbar.')}finally{polling=false}};
  void refresh();const timer=setInterval(()=>void refresh(),1000);dialog.current?.querySelector<HTMLInputElement>('input')?.focus();
  return()=>{active=false;clearInterval(timer);generation.current++;void api?.cancel().catch(()=>{});previous?.focus()};
 },[api]);
 useEffect(()=>{if(onAir){generation.current++;setBusy(false);void api?.cancel().catch(()=>{})}},[onAir,api]);
 const item=useMemo(()=>drafts.length?buildDraftItem(topic,drafts,sectionId,layout):null,[topic,drafts,sectionId,layout]);
 const generate=async()=>{
  if(!api||onAir||busy||pack?.state!=='ready'||!topic.trim())return;
  const revision=++generation.current;setBusy(true);setError('');
  try{const result=await api.generate({topic,notes,count});if(generation.current===revision&&!usePresentation.getState().onAir)setDrafts(result)}
  catch{if(generation.current===revision)setError('Es konnte kein gültiger Folienentwurf erstellt werden. Bitte kürzere Stichpunkte verwenden und erneut versuchen.')}
  finally{if(generation.current===revision)setBusy(false)}
 };
 const download=async()=>{if(!api||onAir)return;setError('');try{await api.download();setPack(await api.status())}catch{setPack(await api.status().catch(()=>null));setError('Der Modell-Download wurde nicht abgeschlossen. Du kannst ihn erneut starten.')}};
 const accept=()=>{if(!item||!insertDraftItem(item,presentationId.current,sectionId,anchorId.current)){setError('Die Präsentation oder der Betriebszustand wurde geändert. Bitte den Entwurf erneut öffnen.');return}close()};
 const update=(index:number,key:'title'|'body',value:string)=>setDrafts(current=>current.map((draft,i)=>i===index?{...draft,[key]:value}:draft));
 return <div className="local-slide-backdrop" onPointerDown={event=>{if(event.target===event.currentTarget)close()}}>
  <div ref={dialog} className="local-slide-dialog" role="dialog" aria-modal="true" aria-labelledby="local-slide-title" onKeyDown={event=>{
   if(event.key==='Escape'){event.stopPropagation();close()}
   if(event.key==='Tab'){
    const controls=[...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled)')],first=controls[0],last=controls.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
   }
  }}>
   <header><h2 id="local-slide-title">{tx('Folien mit KI erstellen')}</h2><button type="button" onClick={close}>{tx('Schließen')}</button></header>
   <p>{tx('Thema und Stichpunkte bleiben auf diesem Rechner. Das Modell wird einmalig heruntergeladen und arbeitet danach offline.')}</p>
   {onAir&&<p role="status">{tx('Die Folien-KI steht nur OFF AIR zur Verfügung.')}</p>}
   {!api&&<p role="alert">{tx('Die lokale Folien-KI ist nur in der Desktop-Anwendung verfügbar.')}</p>}
   {pack&&pack.state!=='ready'&&<section className="local-slide-model">
    <p>{tx('Für die lokale Texterstellung wird ein zusätzliches Modell benötigt.')}</p>
    {pack.state==='downloading'?<><progress max={pack.totalBytes} value={pack.downloadedBytes}/><span>{Math.floor(pack.downloadedBytes/1048576)} / {Math.ceil(pack.totalBytes/1048576)} MB</span><button onClick={()=>void api?.cancelDownload()}>{tx('Download abbrechen')}</button></>:<button disabled={onAir} onClick={()=>void download()}>{tx('Modell herunterladen ({value1} MB)',{value1:String(Math.ceil(pack.totalBytes/1048576))})}</button>}
   </section>}
   <div className="local-slide-inputs">
    <label>{tx('Thema')}<input maxLength={400} value={topic} onChange={event=>setTopic(event.target.value)} disabled={busy}/></label>
    <label>{tx('Stichpunkte und vorhandener Text')}<textarea maxLength={8000} value={notes} onChange={event=>setNotes(event.target.value)} disabled={busy} rows={4}/></label>
    <label>{tx('Anzahl Folien')}<input type="number" min={1} max={8} value={count} onChange={event=>setCount(Number(event.target.value))} disabled={busy}/></label>
    <label>{tx('Layout')}<select value={layout} onChange={event=>setLayout(event.target.value as DraftLayout)}><option value="light">{tx('Hell')}</option><option value="dark">{tx('Dunkel')}</option><option value="accent">{tx('Mit Kopfbereich')}</option></select></label>
   </div>
   <div className="local-slide-actions"><button disabled={onAir||busy||!api||pack?.state!=='ready'||!topic.trim()||!Number.isInteger(count)||count<1||count>8} onClick={()=>void generate()}>{busy?tx('Folien werden lokal erstellt …'):tx('Folien erstellen')}</button>
    {busy&&<><progress aria-label={tx('Folien werden lokal erstellt …')}/><output>{elapsed} s</output><button onClick={()=>{generation.current++;setBusy(false);void api?.cancel()}}>{tx('Erstellung abbrechen')}</button><p>{tx('Die lokale Erstellung kann mehrere Minuten dauern. Du kannst sie jederzeit abbrechen.')}</p></>}
    {pack?.state==='ready'&&!busy&&<button disabled={onAir} onClick={()=>void api?.remove().then(()=>api.status()).then(setPack).catch(()=>setError('Das lokale Modell ist derzeit nicht verfügbar.'))}>{tx('Modell entfernen')}</button>}
   </div>
   {error&&<p role="alert">{tx(error)}</p>}
   {item&&<><p>{tx('KI-Entwurf: Bitte Inhalt, Bibelstellen und Formulierungen vor der Übernahme prüfen. Alle Folien bleiben bearbeitbar.')}</p>
    <div className="local-slide-drafts">{item.slides.map((slide,index)=><article key={index}>
     <div className="local-slide-preview"><SlideRenderer slide={slide} mode="thumbnail"/></div>
     <label>{tx('Titel')}<input value={drafts[index].title} maxLength={180} onChange={event=>update(index,'title',event.target.value)}/></label>
     <label>{tx('Text')}<textarea value={drafts[index].body} maxLength={1400} rows={4} onChange={event=>update(index,'body',event.target.value)}/></label>
    </article>)}</div>
    <footer><button disabled={onAir||busy||!topic.trim()||drafts.some(draft=>!draft.title.trim()||!draft.body.trim())} onClick={accept}>{tx('In den Ablauf übernehmen')}</button></footer>
   </>}
  </div>
 </div>;
}
